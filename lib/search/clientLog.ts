/**
 * Fire-and-forget click-through beacon. Tells the server which result a query led
 * to, feeding the same log as the query itself (lib/search/log.ts) so prominence
 * and popular-questions can later learn from real behaviour. Best-effort: uses
 * sendBeacon when available, never blocks navigation, swallows every error.
 */
export function logSearchClick(q: string, href: string, resultCount: number): void {
  if (typeof window === "undefined") return;
  const query = q.trim();
  if (query.length < 2) return;
  const body = JSON.stringify({ q: query, href, resultCount });
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/search/click", new Blob([body], { type: "application/json" }));
    } else {
      void fetch("/api/search/click", { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } });
    }
  } catch {
    // ignore — telemetry must never break a click
  }
}
