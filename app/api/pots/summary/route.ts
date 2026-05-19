import { apiErrorResponse, noStoreJson } from "../../../lib/server/api";
import { getPotStore } from "../../../lib/server/potStore";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const store = await getPotStore();
    const summary = await store.listPotSummaries();

    return noStoreJson(summary);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
