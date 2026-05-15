import { NextRequest } from "next/server";
import { apiErrorResponse, noStoreJson, readJsonBody } from "../../lib/server/api";
import { getPotStore } from "../../lib/server/potStore";
import { parseOptionalCategoryId, validatePotInput } from "../../lib/server/potValidation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const categoryId = parseOptionalCategoryId(request.nextUrl.searchParams.get("categoryId"));
    const photosParam = request.nextUrl.searchParams.get("photos");
    const photoMode = photosParam === "none" || photosParam === "all" ? photosParam : "latest";
    const store = await getPotStore();
    const pots = await store.listPots(categoryId, photoMode);

    return noStoreJson(pots);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const pot = validatePotInput(await readJsonBody(request));
    const store = await getPotStore();
    const saved = await store.upsertPot(pot);

    return noStoreJson(saved, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
