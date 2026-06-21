import { runSearch } from "@/lib/search";
import { logSearch } from "@/lib/search/log";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  const result = runSearch(q);
  if (q.trim().length >= 2) {
    logSearch({ kind: "query", q: q.trim(), resultCount: result.total, shaped: result.shaped.length });
  }
  return Response.json(result);
}
