"use client";

import { openDB } from "idb";
import { Pot, PotPhoto } from "./types";

export type { Pot, PotPhoto };

type LegacyPotPhoto = {
  stepId: number;
  photo?: Blob | string;
  photoDataUrl?: string;
  createdAt: number;
  contentType?: string;
};

type LegacyPot = Omit<Pot, "photos" | "updatedAt"> & {
  photos?: LegacyPotPhoto[];
  updatedAt?: number;
};

const DB_NAME = "potteryDB";
const DB_VERSION = 1;
const STORE_NAME = "pots";
const MAX_IMAGE_SIDE = 1600;
const MAX_PHOTO_DATA_URL_LENGTH = 1_800_000;
const MAX_THUMBNAIL_DATA_URL_LENGTH = 200_000;
const THUMBNAIL_IMAGE_SIDE = 220;
const TARGET_THUMBNAIL_DATA_URL_LENGTH = 50_000;
const TARGET_DATA_URL_LENGTH = 1_600_000;
const SUPPORTED_PHOTO_DATA_URL_PATTERN = /^data:image\/(jpeg|jpg|png|webp);base64,[a-z0-9+/=]+$/i;
const categoryCache = new Map<number, Pot[]>();
const categoryRequests = new Map<number, Promise<Pot[]>>();
const potPreviewCache = new Map<number, Pot>();
const potRequests = new Map<string, Promise<Pot | undefined>>();
const potCaches = {
  all: new Map<number, Pot>(),
  latest: new Map<number, Pot>(),
  none: new Map<number, Pot>(),
};

type PhotoMode = "none" | "latest" | "all";

async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) return undefined as T;

  return response.json() as Promise<T>;
}

export async function getAllPots(): Promise<Pot[]> {
  return apiRequest<Pot[]>("/api/pots?photos=none");
}

export type PotSummary = Pick<Pot, "id" | "categoryId">;

export async function getPotSummary(): Promise<PotSummary[]> {
  return apiRequest<PotSummary[]>("/api/pots/summary");
}

export async function getPotsByCategory(categoryId: number): Promise<Pot[]> {
  const existingRequest = categoryRequests.get(categoryId);
  if (existingRequest) return existingRequest;

  const request = apiRequest<Pot[]>(`/api/pots?categoryId=${categoryId}&photos=latest`)
    .then((pots) => {
      categoryCache.set(categoryId, pots);
      for (const pot of pots) {
        potPreviewCache.set(pot.id, pot);
      }
      return pots;
    })
    .finally(() => {
      categoryRequests.delete(categoryId);
    });

  categoryRequests.set(categoryId, request);
  return request;
}

export function getCachedPotsByCategory(categoryId: number): Pot[] {
  return categoryCache.get(categoryId) || [];
}

export function prefetchPotsByCategory(categoryId: number): void {
  if (categoryCache.has(categoryId) || categoryRequests.has(categoryId)) return;

  void getPotsByCategory(categoryId).catch((error) => {
    console.warn(`Could not prefetch category ${categoryId}.`, error);
  });
}

export async function getPotById(id: number): Promise<Pot | undefined> {
  return getPotByIdWithPhotos(id, "all");
}

export async function getPotByIdWithPhotos(id: number, photoMode: PhotoMode): Promise<Pot | undefined> {
  const existingPot = potCaches[photoMode].get(id);
  if (existingPot) return existingPot;

  const requestKey = `${id}:${photoMode}`;
  const existingRequest = potRequests.get(requestKey);
  if (existingRequest) return existingRequest;

  const request = fetch(`/api/pots/${id}?photos=${photoMode}`, { cache: "no-store" })
    .then(async (response) => {
      if (response.status === 404) return undefined;
      if (!response.ok) throw new Error(await readErrorMessage(response));

      const pot = (await response.json()) as Pot;
      potCaches[photoMode].set(id, pot);
      potPreviewCache.set(id, pot);
      return pot;
    })
    .finally(() => {
      potRequests.delete(requestKey);
    });

  potRequests.set(requestKey, request);
  return request;
}

export function getCachedPotById(id: number): Pot | undefined {
  return potCaches.all.get(id) || potCaches.latest.get(id) || potPreviewCache.get(id) || potCaches.none.get(id);
}

export function prefetchPotById(id: number): void {
  if (potCaches.latest.has(id) || potCaches.all.has(id) || potRequests.has(`${id}:latest`)) return;

  void getPotByIdWithPhotos(id, "latest").catch((error) => {
    console.warn(`Could not prefetch pot ${id}.`, error);
  });
}

export async function addPot(pot: Pot): Promise<Pot> {
  const createdPot = await apiRequest<Pot>("/api/pots", {
    method: "POST",
    body: JSON.stringify({ ...pot, updatedAt: pot.updatedAt || Date.now() }),
  });
  clearCategoryCache();
  return createdPot;
}

export async function deletePot(id: number): Promise<void> {
  await apiRequest<void>(`/api/pots/${id}`, { method: "DELETE" });
  clearCategoryCache();
}

export async function updatePotCategory(potId: number, newCategoryId: number): Promise<Pot | undefined> {
  const updatedPot = await apiRequest<Pot>(`/api/pots/${potId}`, {
    method: "PATCH",
    body: JSON.stringify({ categoryId: newCategoryId }),
  });
  clearCategoryCache();
  return updatedPot;
}

export async function updatePotTitle(potId: number, newTitle: string): Promise<Pot | undefined> {
  const updatedPot = await apiRequest<Pot>(`/api/pots/${potId}`, {
    method: "PATCH",
    body: JSON.stringify({ title: newTitle }),
  });
  clearCategoryCache();
  return updatedPot;
}

export async function addPhotoToPot(
  potId: number,
  photoDataUrl: string,
  thumbnailDataUrl?: string,
): Promise<Pot | undefined> {
  const updatedPot = await apiRequest<Pot>(`/api/pots/${potId}/photos`, {
    method: "POST",
    body: JSON.stringify({ photoDataUrl, thumbnailDataUrl }),
  });
  clearCategoryCache();
  return updatedPot;
}

export interface PhotoDataUrls {
  photoDataUrl: string;
  thumbnailDataUrl?: string;
}

export async function fileToPhotoDataUrl(file: File): Promise<string> {
  return (await fileToPhotoDataUrls(file)).photoDataUrl;
}

export async function fileToPhotoDataUrls(file: File): Promise<PhotoDataUrls> {
  const sourceDataUrl = await blobToDataUrl(file);
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }

  try {
    const image = await loadImage(sourceDataUrl);

    return {
      photoDataUrl: validateUploadablePhotoDataUrl(
        await resizeImageDataUrl(
          image,
          [
            {
              maxSide: Math.min(Math.max(image.naturalWidth, image.naturalHeight), MAX_IMAGE_SIDE),
              quality: 0.82,
            },
            { maxSide: Math.min(Math.max(image.naturalWidth, image.naturalHeight), 1200), quality: 0.76 },
            { maxSide: Math.min(Math.max(image.naturalWidth, image.naturalHeight), 900), quality: 0.72 },
          ],
          TARGET_DATA_URL_LENGTH,
        ),
      ),
      thumbnailDataUrl: await createThumbnailDataUrl(image),
    };
  } catch (error) {
    console.warn("Could not resize image before upload; using the original file.", error);
    return {
      photoDataUrl: validateUploadablePhotoDataUrl(sourceDataUrl),
    };
  }
}

export interface LegacyImportStatus {
  localCount: number;
  missingCount: number;
}

export async function getLegacyImportStatus(existingPots: Array<Pick<Pot, "id">>): Promise<LegacyImportStatus> {
  if (typeof window === "undefined") return { localCount: 0, missingCount: 0 };

  try {
    const legacyPots = await getLegacyPots();
    const existingIds = new Set(existingPots.map((pot) => pot.id));

    return {
      localCount: legacyPots.length,
      missingCount: legacyPots.filter((pot) => !existingIds.has(pot.id)).length,
    };
  } catch (error) {
    console.warn("Could not inspect local pottery records.", error);
    return { localCount: 0, missingCount: 0 };
  }
}

export async function importMissingLegacyPots(existingPots: Array<Pick<Pot, "id">>): Promise<number> {
  if (typeof window === "undefined") return 0;

  try {
    const legacyPots = await getLegacyPots();
    const existingIds = new Set(existingPots.map((pot) => pot.id));
    let importedCount = 0;

    for (const legacyPot of legacyPots) {
      if (existingIds.has(legacyPot.id)) continue;

      const { photos, ...pot } = await normalizeLegacyPot(legacyPot);
      await addPot({ ...pot, photos: [] });

      for (const photo of photos) {
        await addPhotoToPot(pot.id, photo.photoDataUrl, await createThumbnailFromDataUrl(photo.photoDataUrl));
      }

      importedCount += 1;
    }

    return importedCount;
  } catch (error) {
    console.warn("Could not import local pottery records to the current store.", error);
    return 0;
  }
}

async function getLegacyPots(): Promise<LegacyPot[]> {
  if (!("indexedDB" in window)) return [];

  const db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(database) {
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    },
  });

  return db.getAll(STORE_NAME) as Promise<LegacyPot[]>;
}

async function normalizeLegacyPot(legacyPot: LegacyPot): Promise<Pot> {
  const photos = await Promise.all((legacyPot.photos || []).map(normalizeLegacyPhoto));
  const now = Date.now();

  return {
    id: legacyPot.id,
    title: legacyPot.title,
    categoryId: legacyPot.categoryId,
    photos: photos.filter((photo): photo is PotPhoto => Boolean(photo)),
    createdAt: legacyPot.createdAt || now,
    updatedAt: legacyPot.updatedAt || now,
  };
}

async function normalizeLegacyPhoto(photo: LegacyPotPhoto): Promise<PotPhoto | null> {
  const photoDataUrl =
    photo.photoDataUrl ||
    (typeof photo.photo === "string" ? photo.photo : photo.photo ? await blobToDataUrl(photo.photo) : "");

  if (!photoDataUrl) return null;

  return {
    stepId: photo.stepId,
    photoDataUrl,
    createdAt: photo.createdAt,
    contentType: photo.contentType || contentTypeFromDataUrl(photoDataUrl),
  };
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image could not be loaded"));
    image.src = src;
  });
}

async function createThumbnailFromDataUrl(photoDataUrl: string): Promise<string | undefined> {
  try {
    return createThumbnailDataUrl(await loadImage(photoDataUrl));
  } catch (error) {
    console.warn("Could not create a thumbnail.", error);
    return undefined;
  }
}

async function createThumbnailDataUrl(image: HTMLImageElement): Promise<string> {
  const thumbnailDataUrl = await resizeImageDataUrl(
    image,
    [
      { maxSide: THUMBNAIL_IMAGE_SIDE, quality: 0.58 },
      { maxSide: 180, quality: 0.52 },
    ],
    TARGET_THUMBNAIL_DATA_URL_LENGTH,
  );

  if (thumbnailDataUrl.length > MAX_THUMBNAIL_DATA_URL_LENGTH) {
    throw new Error("Thumbnail is too large.");
  }

  return validateUploadablePhotoDataUrl(thumbnailDataUrl);
}

async function resizeImageDataUrl(
  image: HTMLImageElement,
  attempts: Array<{ maxSide: number; quality: number }>,
  targetLength: number,
): Promise<string> {
  const longestSide = Math.max(image.naturalWidth, image.naturalHeight);

  for (const attempt of attempts) {
    const scale = Math.min(1, attempt.maxSide / longestSide);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));

    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is not available");

    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", attempt.quality);

    if (dataUrl.length <= targetLength || attempt === attempts[attempts.length - 1]) {
      return dataUrl;
    }
  }

  throw new Error("Image could not be resized.");
}

async function readErrorMessage(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    try {
      const body = (await response.json()) as { message?: unknown };
      if (typeof body.message === "string") return body.message;
    } catch {
      return "";
    }
  }

  return response.text();
}

function validateUploadablePhotoDataUrl(photoDataUrl: string): string {
  if (photoDataUrl.length > MAX_PHOTO_DATA_URL_LENGTH) {
    throw new Error("That photo is too large to upload. Try taking a lower-resolution photo.");
  }

  if (!SUPPORTED_PHOTO_DATA_URL_PATTERN.test(photoDataUrl)) {
    throw new Error("Please choose a JPEG, PNG, or WebP image.");
  }

  return photoDataUrl;
}

function clearCategoryCache(): void {
  categoryCache.clear();
  categoryRequests.clear();
  potPreviewCache.clear();
  potRequests.clear();
  potCaches.all.clear();
  potCaches.latest.clear();
  potCaches.none.clear();
}

function contentTypeFromDataUrl(photoDataUrl: string): string | undefined {
  const match = photoDataUrl.match(/^data:([^;]+);/);
  return match?.[1];
}
