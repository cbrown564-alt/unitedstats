import { apiJson } from "@/lib/api";
import { matchFacetCounts } from "@/lib/queries";

export const dynamic = "force-static";

export async function GET() {
  return apiJson(matchFacetCounts({}));
}
