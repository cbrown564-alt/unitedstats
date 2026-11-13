/**
 * Guards the static-rendering campaign (see docs/ARCHITECTURE.md): fails the
 * build if a page that should be prerendered is missing from out/, or a
 * generateStaticParams family collapsed. Run after the build:
 *
 *   npm run build && npm run check:static
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
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

// A floor on total prerendered outputs (pages, API JSON, OG images and other
// endpoints; files copied from public/ and the _astro bundle excluded) so a
// wholesale collapse to dynamic is caught even if the named routes survive.
// The full build produces ~10,400; 5,000 leaves room for data growth.
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

function files(root) {
  const found = [];
  (function walk(dir) {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(file);
      else found.push(path.relative(root, file).split(path.sep).join("/"));
    }
  })(root);
  return found;
}

const copied = new Set(files(path.join(process.cwd(), "public")));
const outputs = files(out).filter((f) => !f.startsWith("_astro/") && !copied.has(f));
const pages = outputs.filter((f) => f.endsWith(".html")).map((f) => "/" + f.replace(/\.html$/, ""));
const paths = new Set(pages.map((p) => (p === "/index" ? "/" : p)));
const failures = [];

// Live routes render on the Worker (src/rt/live-routes.json). A prerendered
// file at their path would be served first and freeze the live page, so each
// must have only its twin at /live-snapshot/<name>.
const live = JSON.parse(readFileSync(path.join(process.cwd(), "src", "rt", "live-routes.json"), "utf8"));
for (const [route, name] of Object.entries(live)) {
  if (paths.has(route) || paths.has(`${route === "/" ? "" : route}/index`)) failures.push(`live route shadowed by a prerendered file: ${route}`);
  if (!paths.has(`/live-snapshot/${name}`)) failures.push(`live route has no prerendered twin: ${route} (/live-snapshot/${name})`);
}
for (const r of EXPECTED_STATIC) {
  if (r in live) continue;
  if (!paths.has(r)) failures.push(`static page not prerendered: ${r}`);
}
for (const r of EXPECTED_SSG) {
  const prefix = r.slice(0, r.indexOf("/["));
  if (![...paths].some((p) => p.startsWith(prefix + "/"))) failures.push(`SSG route has no pages (dropped generateStaticParams?): ${r}`);
}

const count = outputs.length;
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
  `✓ static-render guard (${buildProfile()}): ${Object.keys(live).length} live routes with twins, ` +
    `${EXPECTED_STATIC.filter((r) => !(r in live)).length} static pages, ` +
    `${EXPECTED_SSG.length} SSG routes, ${paths.size} pages, ${count} prerendered outputs.`,
);
