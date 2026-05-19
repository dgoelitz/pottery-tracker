import { CosmosClient } from "@azure/cosmos";
import { execFile } from "child_process";
import { mkdir, readFile, rm, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);
const THUMBNAIL_SIDE = 220;
const JPEG_QUALITY = "55";
const MAX_THUMBNAIL_LENGTH = 200_000;
const shouldWrite = process.argv.includes("--write");
const shouldForce = process.argv.includes("--force");

const endpoint = process.env.AZURE_COSMOS_ENDPOINT;
const key = process.env.AZURE_COSMOS_KEY;
const databaseId = process.env.AZURE_COSMOS_DATABASE_ID || "pottery-tracker";
const containerId = process.env.AZURE_COSMOS_CONTAINER_ID || "pots";

if (!endpoint || !key) {
  throw new Error("AZURE_COSMOS_ENDPOINT and AZURE_COSMOS_KEY are required.");
}

const client = new CosmosClient({ endpoint, key });
const container = client.database(databaseId).container(containerId);

const { resources: pots } = await container.items
  .query(
    {
      query: "SELECT * FROM c WHERE c.type = @type",
      parameters: [{ name: "@type", value: "pot" }],
    },
    { partitionKey: "pot" },
  )
  .fetchAll();

const { resources: photos } = await container.items
  .query(
    {
      query: "SELECT * FROM c WHERE c.type = @type",
      parameters: [{ name: "@type", value: "photo" }],
    },
    { partitionKey: "photo" },
  )
  .fetchAll();

const latestPhotoByPotId = new Map();
for (const photo of photos) {
  const current = latestPhotoByPotId.get(photo.potId);
  if (!current || photo.stepId > current.stepId) {
    latestPhotoByPotId.set(photo.potId, photo);
  }
}

let generated = 0;
let skipped = 0;
let written = 0;
let totalThumbnailBytes = 0;

for (const pot of pots) {
  const latestPhoto = latestPhotoByPotId.get(pot.potId);

  if (!latestPhoto?.photoDataUrl || (pot.thumbnailDataUrl && !shouldForce)) {
    skipped += 1;
    continue;
  }

  const thumbnailDataUrl = await createThumbnail(latestPhoto.photoDataUrl, pot.potId);
  generated += 1;
  totalThumbnailBytes += thumbnailDataUrl.length;

  if (shouldWrite) {
    await container.items.upsert({
      ...pot,
      thumbnailDataUrl,
    });
    written += 1;
  }
}

console.log(
  JSON.stringify(
    {
      mode: shouldWrite ? "write" : "dry-run",
      databaseId,
      containerId,
      pots: pots.length,
      photos: photos.length,
      generated,
      skipped,
      written,
      averageThumbnailBytes: generated ? Math.round(totalThumbnailBytes / generated) : 0,
      note: shouldWrite ? "Pot documents were updated with thumbnailDataUrl." : "Run with --write to update pot documents.",
    },
    null,
    2,
  ),
);

async function createThumbnail(photoDataUrl, potId) {
  const parsed = parseDataUrl(photoDataUrl);
  const tempDir = await mkdir(path.join(os.tmpdir(), `pottery-thumbnail-${process.pid}-${potId}`), {
    recursive: true,
  });
  const inputPath = path.join(tempDir, `source.${extensionForMimeType(parsed.mimeType)}`);
  const outputPath = path.join(tempDir, "thumbnail.jpg");

  try {
    await writeFile(inputPath, parsed.bytes);
    await execFileAsync("sips", [
      "-Z",
      String(THUMBNAIL_SIDE),
      "--setProperty",
      "format",
      "jpeg",
      "--setProperty",
      "formatOptions",
      JPEG_QUALITY,
      inputPath,
      "--out",
      outputPath,
    ]);

    const output = await readFile(outputPath);
    const thumbnailDataUrl = `data:image/jpeg;base64,${output.toString("base64")}`;

    if (thumbnailDataUrl.length > MAX_THUMBNAIL_LENGTH) {
      throw new Error(`Generated thumbnail for pot ${potId} is too large.`);
    }

    return thumbnailDataUrl;
  } finally {
    await rm(tempDir, { force: true, recursive: true });
  }
}

function parseDataUrl(dataUrl) {
  const match = dataUrl.match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,([a-z0-9+/=]+)$/i);
  if (!match) {
    throw new Error("Photo is not a supported image data URL.");
  }

  return {
    mimeType: match[1].toLowerCase(),
    bytes: Buffer.from(match[2], "base64"),
  };
}

function extensionForMimeType(mimeType) {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
}
