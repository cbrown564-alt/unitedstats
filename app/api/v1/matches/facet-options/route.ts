import { apiJson } from "@/lib/api";
import { buildMatchFacetOptions } from "@/lib/matchFacetOptions";

export const revalidate = 86400;

export async function GET() {
  return apiJson(buildMatchFacetOptions());
}
