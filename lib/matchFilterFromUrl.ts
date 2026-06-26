import { isRoundFilterKey } from "@/lib/matchRounds";
import type { MatchFilter } from "@/lib/queries";

const GOAL_WINDOWS = ["firstHalf", "secondHalf", "late", "stoppage", "extraTime"] as const;
const ISO_DATE = /^\d{4}(-\d{2}(-\d{2})?)?$/;

export type MatchSort = "date-desc" | "date-asc" | "gd-desc" | "gd-asc";

const year = (v: string | undefined, edge: "from" | "to") =>
  v ? (/^\d{4}$/.test(v) ? `${v}-${edge === "from" ? "01-01" : "12-31"}` : v) : undefined;

const minute = (v: string | undefined) => (v && /^\d{1,3}$/.test(v) ? Number(v) : undefined);

export function parseMatchSort(sp: Record<string, string | undefined>): MatchSort {
  const raw = sp.sort;
  if (raw === "date-desc" || raw === "date-asc" || raw === "gd-desc" || raw === "gd-asc") return raw;
  if (raw === "oldest") return "date-asc";
  if (raw === "margin") return "gd-desc";
  if (raw === "defeat") return "gd-asc";
  return "date-desc";
}

/** Build a MatchFilter from URL search params (shared by pages and API routes). */
export function matchFilterFromSearchParams(
  sp: Record<string, string | undefined>,
  paging?: { limit: number; offset: number },
): MatchFilter {
  const sort = parseMatchSort(sp);
  const goalWindowRaw = sp.goalWindow;
  const goalWindow = GOAL_WINDOWS.includes(goalWindowRaw as (typeof GOAL_WINDOWS)[number])
    ? (goalWindowRaw as (typeof GOAL_WINDOWS)[number])
    : undefined;
  const round = isRoundFilterKey(sp.round) ? sp.round : undefined;

  return {
    competition: sp.competition || undefined,
    opponent: sp.opponent || undefined,
    manager: sp.manager || undefined,
    season: sp.season || undefined,
    venue: sp.venue || undefined,
    result: sp.result || undefined,
    type: sp.type || undefined,
    round,
    stadium: sp.stadium || undefined,
    city: sp.city || undefined,
    scorer: sp.scorer || undefined,
    assister: sp.assister || undefined,
    player: sp.player || undefined,
    aet: sp.aet === "1",
    goalWindow,
    goalFrom: minute(sp.goalFrom),
    goalTo: minute(sp.goalTo),
    from: year(sp.from, "from"),
    to: year(sp.to, "to"),
    q: sp.q || undefined,
    sort,
    ...(paging ? { limit: paging.limit, offset: paging.offset } : {}),
  };
}

export function validateMatchFilterDates(sp: Record<string, string | undefined>): string | null {
  const from = sp.from;
  const to = sp.to;
  if ((from && !ISO_DATE.test(from)) || (to && !ISO_DATE.test(to))) {
    return "from/to must be ISO dates (YYYY, YYYY-MM, or YYYY-MM-DD)";
  }
  return null;
}
