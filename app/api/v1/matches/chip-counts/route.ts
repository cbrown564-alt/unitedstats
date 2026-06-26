import { apiError, apiJson } from "@/lib/api";
import { matchChipCounts } from "@/lib/matchChipCounts";
import { matchFilterFromSearchParams, validateMatchFilterDates } from "@/lib/matchFilterFromUrl";

export const revalidate = 86400;

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
