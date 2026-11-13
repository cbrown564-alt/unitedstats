/**
 * Build-time half of the live routes (src/rt/live-routes.json). Each live route
 * has a prerendered twin at /live-snapshot/<name>. Rendering the twin records
 * every query the page makes (lib/db.ts `recordQueries`) for the Worker's
 * replay, and the twin's HTML is what the Worker serves when a live render
 * needs record data this deploy lacks (src/middleware.ts).
 *
 * Node only: imported by the generated twin pages, which are always prerendered.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { recordQueries } from "@/lib/db";
import { greatNights } from "@/lib/greatNights";
import { pathFor, renderPage, type PageModule, type RenderedPage } from "./render";

const RECORD_DIR = path.join(process.cwd(), ".astro", "live-record");

/**
 * Queries a live render may make that depend on the date rather than on
 * content: the home hero picks its night by day of year. Run each day of a
 * leap year so every date's lookups are recorded.
 */
function warmDateDependentQueries(route: string): void {
  if (route !== "/") return;
  for (let t = Date.UTC(2024, 0, 1); t < Date.UTC(2025, 0, 1); t += 86_400_000) greatNights(new Date(t));
}

export async function renderSnapshot(mod: PageModule, route: string, name: string): Promise<RenderedPage> {
  const { value, queries } = await recordQueries(async () => {
    warmDateDependentQueries(route);
    return renderPage(mod, route, {}, pathFor(route, {}));
  });
  mkdirSync(RECORD_DIR, { recursive: true });
  writeFileSync(path.join(RECORD_DIR, `${name}.json`), JSON.stringify(queries));
  return value;
}
