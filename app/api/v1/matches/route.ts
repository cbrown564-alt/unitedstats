import { apiError, apiJson, pagination } from "@/lib/api";
import { isRoundFilterKey } from "@/lib/matchRounds";
import { findMatches } from "@/lib/queries";

export const dynamic = "force-dynamic";

const ISO_DATE = /^\d{4}(-\d{2}(-\d{2})?)?$/;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const p = (k: string) => url.searchParams.get(k) ?? undefined;
  const rawSort = p("sort");
  const sort = (
    rawSort === "date-desc" ||
    rawSort === "date-asc" ||
    rawSort === "gd-desc" ||
    rawSort === "gd-asc"
      ? rawSort
      : undefined
  ) as "date-desc" | "date-asc" | "gd-desc" | "gd-asc" | undefined;
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
  const { limit, offset } = pagination(url);
  const { rows, total } = findMatches({
    competition: p("competition"),
    opponent: p("opponent"),
    manager: p("manager"),
    season: p("season"),
    venue: p("venue"),
    result: p("result"),
    type: p("type"),
    round: isRoundFilterKey(p("round") ?? undefined) ? p("round") : undefined,
    stadium: p("stadium"),
    city: p("city"),
    scorer: p("scorer"),
    assister: p("assister"),
    player: p("player"),
    aet: p("aet") === "1",
    goalWindow: (["firstHalf", "secondHalf", "late", "stoppage", "extraTime"].includes(p("goalWindow") ?? "")
      ? p("goalWindow")
      : undefined) as "firstHalf" | "secondHalf" | "late" | "stoppage" | "extraTime" | undefined,
    goalFrom: minute("goalFrom"),
    goalTo: minute("goalTo"),
    from,
    to,
    q: p("q"),
    sort,
    limit,
    offset,
  });
  return apiJson(rows, { total, limit, offset });
}
