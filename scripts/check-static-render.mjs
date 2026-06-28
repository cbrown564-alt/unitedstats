/**
 * Guards the static-rendering campaign (see docs/ARCHITECTURE.md): fails the build if a
 * route that should be prerendered has regressed to server-rendered-on-demand.
 * A stray `searchParams`/`cookies()`/`headers()` read, or a dropped
 * `generateStaticParams`, silently flips a page back to dynamic — this catches
 * that. Run after `next build`:
 *
 *   npm run build && npm run check:static
 */
import { readFileSync } from "node:fs";
import path from "node:path";

// Pages that must be statically prerendered (○ in the build output).
const EXPECTED_STATIC = [
  "/",
  "/analytics",
  "/data",
  "/explore",
  "/managers",
  "/opponents",
  "/transfers",
];

// Route patterns that must be statically generated via generateStaticParams (●).
const EXPECTED_SSG = [
  "/manager/[id]",
  "/match/[id]",
  "/opponent/[id]",
  "/player/[id]",
  "/seasons/[season]",
];

// A floor on total prerendered paths so a wholesale collapse to dynamic is
// caught even if the named routes happen to survive. The campaign produces
// ~7,400; 5,000 leaves room for data growth/shrinkage without false alarms.
const MIN_PRERENDERED = 5000;

const file = path.join(process.cwd(), ".next", "prerender-manifest.json");

let manifest;
try {
  manifest = JSON.parse(readFileSync(file, "utf8"));
} catch {
  console.error(`check:static — cannot read ${file}. Run \`npm run build\` first.`);
  process.exit(1);
}

const routes = manifest.routes ?? {};
const dynamicRoutes = manifest.dynamicRoutes ?? {};
const failures = [];

for (const r of EXPECTED_STATIC) {
  if (!(r in routes)) failures.push(`static page not prerendered (now dynamic?): ${r}`);
}
for (const r of EXPECTED_SSG) {
  if (!(r in dynamicRoutes)) failures.push(`SSG route missing (dropped generateStaticParams?): ${r}`);
}

const count = Object.keys(routes).length;
if (count < MIN_PRERENDERED) {
  failures.push(`only ${count} prerendered paths (expected >= ${MIN_PRERENDERED})`);
}

if (failures.length > 0) {
  console.error("✗ static-render guard failed:");
  for (const f of failures) console.error("  - " + f);
  console.error("\nSee docs/ARCHITECTURE.md for the expected route disposition.");
  process.exit(1);
}

console.log(
  `✓ static-render guard: ${EXPECTED_STATIC.length} static pages, ` +
    `${EXPECTED_SSG.length} SSG routes, ${count} prerendered paths.`,
);
