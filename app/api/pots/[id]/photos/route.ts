import { NextRequest } from "next/server";
import { apiErrorResponse, noStoreJson, readJsonBody } from "../../../../lib/server/api";
import { getPotStore } from "../../../../lib/server/potStore";
import {
  MAX_PHOTO_DATA_URL_LENGTH,
  MAX_THUMBNAIL_DATA_URL_LENGTH,
  parsePotId,
  validateOptionalThumbnailDataUrl,
  validatePhotoDataUrl,
} from "../../../../lib/server/potValidation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { photoDataUrl, thumbnailDataUrl } = await readJsonBody<{
      photoDataUrl?: unknown;
      thumbnailDataUrl?: unknown;
    }>(
      request,
      MAX_PHOTO_DATA_URL_LENGTH + MAX_THUMBNAIL_DATA_URL_LENGTH + 2000,
    );
    const validPhotoDataUrl = validatePhotoDataUrl(photoDataUrl);
    const validThumbnailDataUrl = validateOptionalThumbnailDataUrl(thumbnailDataUrl);
    const store = await getPotStore();
    const pot = await store.addPhotoToPot(parsePotId(id), validPhotoDataUrl, validThumbnailDataUrl);

    if (!pot) return noStoreJson({ message: "Pot not found" }, { status: 404 });

    return noStoreJson(pot, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
