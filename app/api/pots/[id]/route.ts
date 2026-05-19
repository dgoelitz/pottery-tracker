import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, assertSameOrigin, noStoreJson, readJsonBody } from "../../../lib/server/api";
import { getPotStore } from "../../../lib/server/potStore";
import { parsePotId, validatePotPatch } from "../../../lib/server/potValidation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const photoMode = parsePhotoMode(request.nextUrl.searchParams.get("photos"));
    const pot = await getPotByRouteParam(params, photoMode);
    if (!pot) return noStoreJson({ message: "Pot not found" }, { status: 404 });

    return noStoreJson(pot);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const changes = validatePotPatch(await readJsonBody(request));
    const store = await getPotStore();
    const pot = await store.patchPot(parsePotId(id), changes);

    if (!pot) return noStoreJson({ message: "Pot not found" }, { status: 404 });

    return noStoreJson(pot);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const { id } = await params;
    const store = await getPotStore();
    await store.deletePot(parsePotId(id));

    return new NextResponse(null, {
      status: 204,
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

async function getPotByRouteParam(params: Promise<{ id: string }>, photoMode: "none" | "latest" | "all") {
  const { id } = await params;
  const store = await getPotStore();
  return store.getPot(parsePotId(id), photoMode);
}

function parsePhotoMode(photoMode: string | null): "none" | "latest" | "all" {
  if (photoMode === "none" || photoMode === "latest") return photoMode;
  return "all";
}
