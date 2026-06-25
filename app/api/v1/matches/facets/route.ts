import { apiError, apiJson } from "@/lib/api";
import { matchFacetCounts } from "@/lib/queries";

export const dynamic = "force-dynamic";

const ISO_DATE = /^\d{4}(-\d{2}(-\d{2})?)?$/;
const GOAL_WINDOWS = ["firstHalf", "secondHalf", "late", "stoppage", "extraTime"] as const;

const year = (v: string | undefined, edge: "from" | "to") =>
  v ? (/^\d{4}$/.test(v) ? `${v}-${edge === "from" ? "01-01" : "12-31"}` : v) : undefined;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const p = (k: string) => url.searchParams.get(k) ?? undefined;
  const minute = (k: string) => {
    const raw = p(k);
    if (!raw || !/^\d{1,3}$/.test(raw)) return undefined;
    return Number(raw);
  };
  const from = p("from");
  const to = p("to");
  if ((from && !ISO_DATE.test(from)) || (to && !ISO_DATE.test(to))) {
    return apiError(400, "from/to must be ISO dates (YYYY, YYYY-MM, or YYYY-MM-DD)");
  }
  const goalWindowRaw = p("goalWindow");
  const goalWindow = GOAL_WINDOWS.includes(goalWindowRaw as (typeof GOAL_WINDOWS)[number])
    ? (goalWindowRaw as (typeof GOAL_WINDOWS)[number])
    : undefined;

  const counts = matchFacetCounts({
    competition: p("competition"),
    opponent: p("opponent"),
    manager: p("manager"),
    season: p("season"),
    venue: p("venue"),
    result: p("result"),
    type: p("type"),
    stadium: p("stadium"),
    city: p("city"),
    scorer: p("scorer"),
    assister: p("assister"),
    player: p("player"),
    aet: p("aet") === "1",
    goalWindow,
    goalFrom: minute("goalFrom"),
    goalTo: minute("goalTo"),
    from: year(from, "from"),
    to: year(to, "to"),
    q: p("q"),
  });

  return apiJson(counts);
}
