import { after } from "next/server";
import { runSearch } from "@/lib/search";
import { classifyMiss, logSearch } from "@/lib/search/log";
import { searchCacheHeaders } from "@/lib/cache";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  const trimmed = q.trim();
  const result = runSearch(q);
  if (trimmed.length >= 2) {
    after(() => {
      logSearch({
        kind: "query",
        q: trimmed,
        resultCount: result.total,
        shaped: result.shaped.length,
        miss: classifyMiss(result.total, result.shaped.length),
      });
    });
  }
  return Response.json(result, { headers: searchCacheHeaders });
}
