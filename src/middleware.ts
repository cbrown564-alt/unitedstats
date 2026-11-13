/**
 * Live editorial routes (src/rt/live-routes.json) on the Worker.
 *
 * Each request renders with that request's EmDash content and the record
 * replayed from the deploy's snapshot (lib/dbReplay.ts). If the render needs
 * record data the snapshot lacks (a night added since the last deploy), or
 * EmDash cannot be read, the response is the page as prerendered at deploy
 * time, never a guessed record. Prerendered routes pass straight through.
 */
import { env } from "cloudflare:workers";
import { defineMiddleware } from "astro:middleware";
import { installReplay, replayInstalled, trackMisses, type ReplayTable } from "@/lib/dbReplay";
import LIVE_ROUTES from "@/src/rt/live-routes.json";
import { loadEditorial, withEditorial } from "@/src/rt/editorial-scope";

const live = LIVE_ROUTES as Record<string, string>;
const assets = () => (env as { ASSETS: { fetch(req: Request | URL): Promise<Response> } }).ASSETS;

async function ensureReplay(origin: URL): Promise<void> {
  if (replayInstalled()) return;
  const res = await assets().fetch(new URL("/live-snapshot/record.json", origin));
  if (!res.ok) throw new Error(`record snapshot unavailable (${res.status})`);
  installReplay((await res.json()) as ReplayTable);
}

async function snapshot(name: string, origin: URL, reason: string): Promise<Response> {
  const res = await assets().fetch(new URL(`/live-snapshot/${name}`, origin));
  const headers = new Headers(res.headers);
  headers.set("x-redthread-live", `snapshot; ${reason}`);
  headers.set("cache-control", "no-store");
  return new Response(res.body, { status: res.ok ? 200 : 500, headers });
}

export const onRequest = defineMiddleware(async (context, next) => {
  if (context.isPrerendered) return next();
  const name = live[context.url.pathname.replace(/\/$/, "") || "/"];
  if (!name) return next();

  let editorial;
  try {
    await ensureReplay(context.url);
    editorial = await loadEditorial();
  } catch (error) {
    console.error("live route: falling back to snapshot", error);
    return snapshot(name, context.url, "unavailable");
  }

  const { value, missed, error } = await trackMisses(() => withEditorial(editorial, () => next()));
  if (missed.length > 0 || error || !value) {
    if (error && missed.length === 0) console.error("live route: render failed", error);
    else console.warn(`live route ${context.url.pathname}: ${missed.length} record lookups not in this deploy`, missed.slice(0, 3));
    return snapshot(name, context.url, missed.length > 0 ? "record-miss" : "error");
  }
  value.headers.set("x-redthread-live", "live");
  value.headers.set("cache-control", "no-store");
  return value;
});
