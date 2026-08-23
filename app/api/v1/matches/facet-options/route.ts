import { apiJson } from "@/lib/api";
import { buildMatchFacetOptions } from "@/lib/matchFacetOptions";

export const dynamic = "force-static";


export async function GET() {
  return apiJson(buildMatchFacetOptions());
}
