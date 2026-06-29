import { apiError, apiJson } from "@/lib/api";
import { buildMatchesPageView } from "@/lib/buildMatchesPageView";
import { validateMatchFilterDates } from "@/lib/matchFilterFromUrl";

export const revalidate = 86400;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sp = Object.fromEntries(url.searchParams.entries());
  const dateError = validateMatchFilterDates(sp);
  if (dateError) return apiError(400, dateError);
  return apiJson(buildMatchesPageView(sp));
}
