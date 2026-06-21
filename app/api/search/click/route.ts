import { logSearch } from "@/lib/search/log";

/** Click-through beacon from the dropdown/palette (lib/search/clientLog.ts). */
export async function POST(request: Request) {
  try {
    const { q, href, resultCount } = (await request.json()) as {
      q?: string;
      href?: string;
      resultCount?: number;
    };
    if (typeof q === "string" && q.trim().length >= 2 && typeof href === "string") {
      logSearch({ kind: "click", q: q.trim(), href, resultCount: Number(resultCount) || 0 });
    }
  } catch {
    // malformed beacon — ignore
  }
  return new Response(null, { status: 204 });
}
