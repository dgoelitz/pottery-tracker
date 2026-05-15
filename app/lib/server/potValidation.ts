import { categories } from "../../data/categories";
import { Pot, PotPhoto } from "../types";
import { HttpError } from "./api";

export const MAX_PHOTO_DATA_URL_LENGTH = 1_800_000;

const MAX_TITLE_LENGTH = 120;
const MAX_PHOTOS_PER_POT = 100;
const VALID_CATEGORY_IDS = new Set(categories.map((category) => category.id));
const IMAGE_DATA_URL_PATTERN = /^data:image\/(jpeg|jpg|png|webp);base64,[a-z0-9+/=]+$/i;

export function parsePotId(value: string): number {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new HttpError(400, "Pot id is invalid.");
  }

  return id;
}

export function parseOptionalCategoryId(value: string | null): number | undefined {
  if (!value) return undefined;
  return validateCategoryId(value);
}

export function validatePotInput(input: unknown): Pot {
  const value = objectInput(input);
  const now = Date.now();
  const photos = Array.isArray(value.photos) ? value.photos : [];

  if (photos.length > MAX_PHOTOS_PER_POT) {
    throw new HttpError(400, `A pot can have at most ${MAX_PHOTOS_PER_POT} photos.`);
  }

  return {
    id: parsePotId(String(value.id)),
    title: normalizeTitle(value.title),
    categoryId: validateCategoryId(value.categoryId),
    photos: photos.map(validatePhotoInput),
    createdAt: numberOrNow(value.createdAt, now),
    updatedAt: numberOrNow(value.updatedAt, now),
  };
}

export function validatePotPatch(input: unknown): Partial<Pick<Pot, "title" | "categoryId">> {
  const value = objectInput(input);
  const patch: Partial<Pick<Pot, "title" | "categoryId">> = {};

  if ("title" in value) {
    patch.title = normalizeTitle(value.title);
  }

  if ("categoryId" in value) {
    patch.categoryId = validateCategoryId(value.categoryId);
  }

  if (!("title" in patch) && !("categoryId" in patch)) {
    throw new HttpError(400, "No valid pot changes were provided.");
  }

  return patch;
}

export function validatePhotoDataUrl(input: unknown): string {
  if (typeof input !== "string") {
    throw new HttpError(400, "Photo data must be a string.");
  }

  if (input.length > MAX_PHOTO_DATA_URL_LENGTH) {
    throw new HttpError(413, "Photo is too large.");
  }

  if (!IMAGE_DATA_URL_PATTERN.test(input)) {
    throw new HttpError(400, "Photo must be a JPEG, PNG, or WebP data URL.");
  }

  return input;
}

function validatePhotoInput(input: unknown): PotPhoto {
  const value = objectInput(input);

  return {
    stepId: parsePositiveInteger(value.stepId, "Photo step id is invalid."),
    photoDataUrl: validatePhotoDataUrl(value.photoDataUrl),
    createdAt: numberOrNow(value.createdAt, Date.now()),
    contentType: typeof value.contentType === "string" ? value.contentType : undefined,
  };
}

function validateCategoryId(input: unknown): number {
  const categoryId = parsePositiveInteger(input, "Category is invalid.");
  if (!VALID_CATEGORY_IDS.has(categoryId)) {
    throw new HttpError(400, "Category is invalid.");
  }

  return categoryId;
}

function normalizeTitle(input: unknown): string {
  if (typeof input !== "string") {
    throw new HttpError(400, "Title is required.");
  }

  const title = input.trim();
  if (!title) {
    throw new HttpError(400, "Title is required.");
  }

  if (title.length > MAX_TITLE_LENGTH) {
    throw new HttpError(400, `Title must be ${MAX_TITLE_LENGTH} characters or fewer.`);
  }

  return title;
}

function parsePositiveInteger(input: unknown, message: string): number {
  const value = Number(input);
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new HttpError(400, message);
  }

  return value;
}

function numberOrNow(input: unknown, now: number): number {
  const value = Number(input);
  return Number.isFinite(value) && value > 0 ? value : now;
}

function objectInput(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new HttpError(400, "Request body is invalid.");
  }

  return input as Record<string, unknown>;
}
