import { CosmosClient, type Container } from "@azure/cosmos";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { Pot, PotPhoto } from "../types";

type PotDoc = Omit<Pot, "id" | "photos"> & {
  id: string;
  type: "pot";
  potId: number;
};

type PhotoDoc = PotPhoto & {
  id: string;
  type: "photo";
  potId: number;
};

interface StoreData {
  pots: Pot[];
}

type PhotoMode = "none" | "latest" | "all";
type PotSummary = Pick<Pot, "id" | "categoryId">;

interface PotStore {
  listPots(categoryId?: number, photoMode?: PhotoMode): Promise<Pot[]>;
  listPotSummaries(): Promise<PotSummary[]>;
  getPot(id: number, photoMode?: PhotoMode): Promise<Pot | undefined>;
  upsertPot(pot: Pot): Promise<Pot>;
  patchPot(id: number, changes: Partial<Pick<Pot, "title" | "categoryId">>): Promise<Pot | undefined>;
  addPhotoToPot(id: number, photoDataUrl: string, thumbnailDataUrl?: string): Promise<Pot | undefined>;
  deletePot(id: number): Promise<void>;
}

const databaseId = process.env.AZURE_COSMOS_DATABASE_ID || "pottery-tracker";
const containerId = process.env.AZURE_COSMOS_CONTAINER_ID || "pots";
const localStorePath = path.join(process.cwd(), ".data", "pottery-store.json");

let storePromise: Promise<PotStore> | undefined;

export async function getPotStore(): Promise<PotStore> {
  if (!storePromise) {
    storePromise = createStore();
  }

  return storePromise;
}

async function createStore(): Promise<PotStore> {
  const endpoint = process.env.AZURE_COSMOS_ENDPOINT;
  const key = process.env.AZURE_COSMOS_KEY;

  if (Boolean(endpoint) !== Boolean(key)) {
    throw new Error("Both AZURE_COSMOS_ENDPOINT and AZURE_COSMOS_KEY are required.");
  }

  if (endpoint && key) {
    const client = new CosmosClient({ endpoint, key });
    const { database } = await client.databases.createIfNotExists({ id: databaseId });
    const { container } = await database.containers.createIfNotExists({
      id: containerId,
      partitionKey: "/type",
      throughput: 400,
    });

    return new CosmosPotStore(container);
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Azure Cosmos DB environment variables are required in production.");
  }

  return new LocalFilePotStore();
}

function normalizePot(pot: Pot): Pot {
  const now = Date.now();

  return {
    ...pot,
    id: Number(pot.id),
    title: pot.title.trim() || "Untitled pot",
    categoryId: Number(pot.categoryId),
    thumbnailDataUrl: pot.thumbnailDataUrl,
    createdAt: Number(pot.createdAt) || now,
    updatedAt: Number(pot.updatedAt) || now,
    photos: [...(pot.photos || [])]
      .filter((photo) => photo.photoDataUrl)
      .map((photo) => ({
        ...photo,
        stepId: Number(photo.stepId),
        createdAt: Number(photo.createdAt) || now,
        contentType: photo.contentType || contentTypeFromDataUrl(photo.photoDataUrl),
      }))
      .sort((a, b) => a.stepId - b.stepId),
  };
}

function contentTypeFromDataUrl(photoDataUrl: string): string | undefined {
  const match = photoDataUrl.match(/^data:([^;]+);/);
  return match?.[1];
}

function potDocId(id: number): string {
  return `pot-${id}`;
}

function photoDocId(potId: number, stepId: number): string {
  return `photo-${potId}-${stepId}`;
}

function potToDoc(pot: Pot): PotDoc {
  return {
    id: potDocId(pot.id),
    type: "pot",
    potId: pot.id,
    title: pot.title,
    categoryId: pot.categoryId,
    thumbnailDataUrl: pot.thumbnailDataUrl,
    createdAt: pot.createdAt,
    updatedAt: pot.updatedAt,
  };
}

function docToPot(doc: PotDoc, photos: PotPhoto[]): Pot {
  return {
    id: doc.potId,
    title: doc.title,
    categoryId: doc.categoryId,
    photos: photos.sort((a, b) => a.stepId - b.stepId),
    thumbnailDataUrl: doc.thumbnailDataUrl,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function isNotFoundError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === 404;
}

class CosmosPotStore implements PotStore {
  constructor(private readonly container: Container) {}

  async listPots(categoryId?: number, photoMode: PhotoMode = "latest"): Promise<Pot[]> {
    const filters = ["c.type = @type"];
    const parameters: { name: string; value: string | number }[] = [{ name: "@type", value: "pot" }];

    if (categoryId) {
      filters.push("c.categoryId = @categoryId");
      parameters.push({ name: "@categoryId", value: categoryId });
    }

    const { resources: potDocs } = await this.container.items
      .query<PotDoc>(
        {
          query: `SELECT * FROM c WHERE ${filters.join(" AND ")} ORDER BY c.createdAt DESC`,
          parameters,
        },
        { partitionKey: "pot" },
      )
      .fetchAll();

    const photosByPot =
      photoMode === "all"
        ? await this.getPhotosByPotIds(potDocs.map((doc) => doc.potId))
        : new Map<number, PotPhoto[]>();

    return potDocs.map((doc) => docToPot(doc, photosByPot.get(doc.potId) || []));
  }

  async listPotSummaries(): Promise<PotSummary[]> {
    const { resources } = await this.container.items
      .query<{ potId: number; categoryId: number }>(
        {
          query: "SELECT c.potId, c.categoryId FROM c WHERE c.type = @type",
          parameters: [{ name: "@type", value: "pot" }],
        },
        { partitionKey: "pot" },
      )
      .fetchAll();

    return resources.map((doc) => ({
      id: doc.potId,
      categoryId: doc.categoryId,
    }));
  }

  async getPot(id: number, photoMode: PhotoMode = "all"): Promise<Pot | undefined> {
    const doc = await this.getPotDoc(id);
    if (!doc) return undefined;

    return docToPot(doc, await this.getPhotosForPot(id, photoMode));
  }

  async upsertPot(pot: Pot): Promise<Pot> {
    const normalized = normalizePot({ ...pot, updatedAt: Date.now() });
    await this.container.items.upsert(potToDoc(normalized));
    await this.replacePhotos(normalized.id, normalized.photos);

    return normalized;
  }

  async patchPot(
    id: number,
    changes: Partial<Pick<Pot, "title" | "categoryId">>,
  ): Promise<Pot | undefined> {
    const existing = await this.getPot(id);
    if (!existing) return undefined;

    return this.upsertPot({
      ...existing,
      ...changes,
      updatedAt: Date.now(),
    });
  }

  async addPhotoToPot(id: number, photoDataUrl: string, thumbnailDataUrl?: string): Promise<Pot | undefined> {
    const existing = await this.getPot(id);
    if (!existing) return undefined;

    const nextStepId =
      existing.photos.length > 0 ? Math.max(...existing.photos.map((photo) => photo.stepId)) + 1 : 1;

    const updated = await this.upsertPot({
      ...existing,
      thumbnailDataUrl: thumbnailDataUrl || existing.thumbnailDataUrl,
      photos: [
        ...existing.photos,
        {
          stepId: nextStepId,
          photoDataUrl,
          createdAt: Date.now(),
          contentType: contentTypeFromDataUrl(photoDataUrl),
        },
      ],
      updatedAt: Date.now(),
    });

    return updated;
  }

  async deletePot(id: number): Promise<void> {
    await this.deleteItem(potDocId(id), "pot");
    const photos = await this.getPhotosForPot(id);

    await Promise.all(
      photos.map((photo) => this.deleteItem(photoDocId(id, photo.stepId), "photo")),
    );
  }

  private async getPotDoc(id: number): Promise<PotDoc | undefined> {
    try {
      const { resource } = await this.container.item(potDocId(id), "pot").read<PotDoc>();
      return resource;
    } catch (error) {
      if (isNotFoundError(error)) return undefined;
      throw error;
    }
  }

  private async getPhotosForPot(id: number, photoMode: PhotoMode = "all"): Promise<PotPhoto[]> {
    if (photoMode === "none") return [];

    const { resources } = await this.container.items
      .query<PhotoDoc>(
        {
          query:
            photoMode === "latest"
              ? "SELECT * FROM c WHERE c.type = @type AND c.potId = @potId ORDER BY c.stepId DESC OFFSET 0 LIMIT 1"
              : "SELECT * FROM c WHERE c.type = @type AND c.potId = @potId ORDER BY c.stepId ASC",
          parameters: [
            { name: "@type", value: "photo" },
            { name: "@potId", value: id },
          ],
        },
        { partitionKey: "photo" },
      )
      .fetchAll();

    return resources.map(({ stepId, photoDataUrl, createdAt, contentType }) => ({
      stepId,
      photoDataUrl,
      createdAt,
      contentType,
    }));
  }

  private async getPhotosByPotIds(ids: number[]): Promise<Map<number, PotPhoto[]>> {
    const grouped = new Map<number, PotPhoto[]>();
    if (ids.length === 0) return grouped;

    const { resources } = await this.container.items
      .query<PhotoDoc>(
        {
          query: "SELECT * FROM c WHERE c.type = @type",
          parameters: [{ name: "@type", value: "photo" }],
        },
        { partitionKey: "photo" },
      )
      .fetchAll();

    const idSet = new Set(ids);
    for (const photo of resources) {
      if (!idSet.has(photo.potId)) continue;
      const nextPhoto = {
        stepId: photo.stepId,
        photoDataUrl: photo.photoDataUrl,
        createdAt: photo.createdAt,
        contentType: photo.contentType,
      };
      const current = grouped.get(photo.potId) || [];

      current.push(nextPhoto);
      grouped.set(photo.potId, current);
    }

    return grouped;
  }

  private async replacePhotos(potId: number, photos: PotPhoto[]): Promise<void> {
    const existing = await this.getPhotosForPot(potId);
    const nextStepIds = new Set(photos.map((photo) => photo.stepId));

    await Promise.all([
      ...photos.map((photo) =>
        this.container.items.upsert({
          ...photo,
          id: photoDocId(potId, photo.stepId),
          type: "photo",
          potId,
        } satisfies PhotoDoc),
      ),
      ...existing
        .filter((photo) => !nextStepIds.has(photo.stepId))
        .map((photo) => this.deleteItem(photoDocId(potId, photo.stepId), "photo")),
    ]);
  }

  private async deleteItem(id: string, partitionKey: "pot" | "photo"): Promise<void> {
    try {
      await this.container.item(id, partitionKey).delete();
    } catch (error) {
      if (!isNotFoundError(error)) throw error;
    }
  }
}

class LocalFilePotStore implements PotStore {
  async listPots(categoryId?: number, photoMode: PhotoMode = "latest"): Promise<Pot[]> {
    const data = await this.read();
    const pots = categoryId ? data.pots.filter((pot) => pot.categoryId === categoryId) : data.pots;

    return [...pots].sort((a, b) => b.createdAt - a.createdAt).map((pot) => applyPhotoMode(pot, photoMode));
  }

  async listPotSummaries(): Promise<PotSummary[]> {
    const data = await this.read();

    return data.pots.map((pot) => ({
      id: pot.id,
      categoryId: pot.categoryId,
    }));
  }

  async getPot(id: number, photoMode: PhotoMode = "all"): Promise<Pot | undefined> {
    const data = await this.read();
    const pot = data.pots.find((candidate) => candidate.id === id);
    return pot ? applyPhotoMode(pot, photoMode) : undefined;
  }

  async upsertPot(pot: Pot): Promise<Pot> {
    const data = await this.read();
    const normalized = normalizePot({ ...pot, updatedAt: Date.now() });
    const existingIndex = data.pots.findIndex((candidate) => candidate.id === normalized.id);

    if (existingIndex >= 0) {
      data.pots[existingIndex] = normalized;
    } else {
      data.pots.push(normalized);
    }

    await this.write(data);
    return normalized;
  }

  async patchPot(
    id: number,
    changes: Partial<Pick<Pot, "title" | "categoryId">>,
  ): Promise<Pot | undefined> {
    const existing = await this.getPot(id);
    if (!existing) return undefined;

    return this.upsertPot({
      ...existing,
      ...changes,
      updatedAt: Date.now(),
    });
  }

  async addPhotoToPot(id: number, photoDataUrl: string, thumbnailDataUrl?: string): Promise<Pot | undefined> {
    const existing = await this.getPot(id);
    if (!existing) return undefined;

    const nextStepId =
      existing.photos.length > 0 ? Math.max(...existing.photos.map((photo) => photo.stepId)) + 1 : 1;

    return this.upsertPot({
      ...existing,
      thumbnailDataUrl: thumbnailDataUrl || existing.thumbnailDataUrl,
      photos: [
        ...existing.photos,
        {
          stepId: nextStepId,
          photoDataUrl,
          createdAt: Date.now(),
          contentType: contentTypeFromDataUrl(photoDataUrl),
        },
      ],
      updatedAt: Date.now(),
    });
  }

  async deletePot(id: number): Promise<void> {
    const data = await this.read();
    await this.write({ pots: data.pots.filter((pot) => pot.id !== id) });
  }

  private async read(): Promise<StoreData> {
    try {
      const raw = await readFile(localStorePath, "utf-8");
      const data = JSON.parse(raw) as StoreData;
      return { pots: data.pots.map(normalizePot) };
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") {
        return { pots: [] };
      }

      throw error;
    }
  }

  private async write(data: StoreData): Promise<void> {
    await mkdir(path.dirname(localStorePath), { recursive: true });
    await writeFile(localStorePath, JSON.stringify(data, null, 2), "utf-8");
  }
}

function applyPhotoMode(pot: Pot, photoMode: PhotoMode): Pot {
  if (photoMode === "all") return pot;
  if (photoMode === "none") return { ...pot, photos: [] };

  const latestPhoto = pot.photos.at(-1);
  return { ...pot, photos: latestPhoto ? [latestPhoto] : [] };
}
