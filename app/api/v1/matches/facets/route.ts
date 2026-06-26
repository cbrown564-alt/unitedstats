import { apiError, apiJson } from "@/lib/api";
import { matchFilterFromSearchParams, validateMatchFilterDates } from "@/lib/matchFilterFromUrl";
import { matchFacetCounts } from "@/lib/queries";

export const revalidate = 86400;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sp = Object.fromEntries(url.searchParams.entries());
  const dateError = validateMatchFilterDates(sp);
  if (dateError) return apiError(400, dateError);

  const counts = matchFacetCounts(matchFilterFromSearchParams(sp));
  return apiJson(counts);
}
