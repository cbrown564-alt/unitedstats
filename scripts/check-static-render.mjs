/**
 * Guards the static-rendering campaign (see docs/ARCHITECTURE.md): fails the
 * build if a page that should be prerendered is missing from out/, or a
 * generateStaticParams family collapsed. Run after the build:
 *
 *   npm run build && npm run check:static
 */
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

// Pages that must be statically prerendered (one out/<path>.html each).
const EXPECTED_STATIC = [
  "/",
  "/analytics",
  "/compare",
  "/cut",
  "/data",
  "/explore",
  "/managers",
  "/matches",
  "/players",
  "/search",
  "/seasons",
  "/surprise",
  "/transfers",
];

// Route patterns that must be statically generated via generateStaticParams (a directory of pages).
const EXPECTED_SSG = [
  "/cut/[slug]",
  "/manager/[id]",
  "/match/[id]",
  "/on-this-day/[monthDay]",
  "/opponent/[id]",
  "/player/[id]",
  "/questions/[slug]",
  "/seasons/[season]",
  "/stories/[slug]",
];

// A floor on total prerendered paths so a wholesale collapse to dynamic is
// caught even if the named routes happen to survive. The campaign produces
// ~7,400; 5,000 leaves room for data growth/shrinkage without false alarms.
// Preview builds sample ~24 paths per heavy route (~200 total) for fast deploys.
function buildProfile() {
  const explicit = process.env.UNITEDSTATS_BUILD_PROFILE;
  if (explicit === "full" || explicit === "preview") return explicit;
  return "full";
}

const MIN_PRERENDERED = buildProfile() === "preview" ? 50 : 5000;

const out = path.join(process.cwd(), "out");
if (!existsSync(out)) {
  console.error("check:static — out/ is missing. Run `npm run build` first.");
  process.exit(1);
}

const pages = [];
(function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (entry.name.endsWith(".html")) pages.push("/" + path.relative(out, file).split(path.sep).join("/").replace(/\.html$/, ""));
  }
})(out);
const paths = new Set(pages.map((p) => (p === "/index" ? "/" : p)));
const failures = [];

for (const r of EXPECTED_STATIC) {
  if (!paths.has(r)) failures.push(`static page not prerendered: ${r}`);
}
for (const r of EXPECTED_SSG) {
  const prefix = r.slice(0, r.indexOf("/["));
  if (![...paths].some((p) => p.startsWith(prefix + "/"))) failures.push(`SSG route has no pages (dropped generateStaticParams?): ${r}`);
}

const count = paths.size;
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
  `✓ static-render guard (${buildProfile()}): ${EXPECTED_STATIC.length} static pages, ` +
    `${EXPECTED_SSG.length} SSG routes, ${count} prerendered paths.`,
);
