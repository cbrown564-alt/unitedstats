import { apiError, apiJson } from "@/lib/api";
import { matchChipCounts } from "@/lib/matchChipCounts";
import { matchFilterFromSearchParams, validateMatchFilterDates } from "@/lib/matchFilterFromUrl";
import { PAGE_REVALIDATE_SECONDS } from "@/lib/pageRevalidate";

export const revalidate = PAGE_REVALIDATE_SECONDS;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sp = Object.fromEntries(url.searchParams.entries());
  const dateError = validateMatchFilterDates(sp);
  if (dateError) return apiError(400, dateError);

  const keys = (url.searchParams.get("keys") ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  if (keys.length === 0) return apiJson({});

  const filter = matchFilterFromSearchParams(sp);
  return apiJson(matchChipCounts(filter, keys));
}
