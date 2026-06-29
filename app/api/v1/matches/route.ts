import { apiError, apiJson, pagination } from "@/lib/api";
import { matchFilterFromSearchParams, validateMatchFilterDates } from "@/lib/matchFilterFromUrl";
import { findMatches } from "@/lib/queries";

export const revalidate = 86400;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sp = Object.fromEntries(url.searchParams.entries());
  const dateError = validateMatchFilterDates(sp);
  if (dateError) return apiError(400, dateError);

  const { limit, offset } = pagination(url);
  const filter = matchFilterFromSearchParams(sp, { limit, offset });
  const { rows, total } = findMatches(filter);
  return apiJson(rows, { total, limit, offset });
}
