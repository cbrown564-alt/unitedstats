import { apiError, apiJson, pagination } from "@/lib/api";
import { findMatches } from "@/lib/queries";

export const dynamic = "force-dynamic";

const ISO_DATE = /^\d{4}(-\d{2}(-\d{2})?)?$/;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const p = (k: string) => url.searchParams.get(k) ?? undefined;
  const from = p("from");
  const to = p("to");
  if ((from && !ISO_DATE.test(from)) || (to && !ISO_DATE.test(to))) {
    return apiError(400, "from/to must be ISO dates (YYYY, YYYY-MM, or YYYY-MM-DD)");
  }
  const { limit, offset } = pagination(url);
  const { rows, total } = findMatches({
    competition: p("competition"),
    opponent: p("opponent"),
    season: p("season"),
    venue: p("venue"),
    result: p("result"),
    type: p("type"),
    from,
    to,
    q: p("q"),
    limit,
    offset,
  });
  return apiJson(rows, { total, limit, offset });
}
