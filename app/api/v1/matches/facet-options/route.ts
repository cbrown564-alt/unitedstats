import { apiJson } from "@/lib/api";
import { buildMatchFacetOptions } from "@/lib/matchFacetOptions";
import { PAGE_REVALIDATE_SECONDS } from "@/lib/pageRevalidate";

export const revalidate = PAGE_REVALIDATE_SECONDS;

export async function GET() {
  return apiJson(buildMatchFacetOptions());
}
