/**
 * Static-asset rules for the Worker deploy, written into out/ after the build:
 * - `_redirects`: the permanent legacy redirects kept in vercel.json.
 * - `_headers`: API CORS, data and asset caching. Every target except
 *   production also gets noindex. The prerendered twins of the live routes
 *   (/live-snapshot/) always get noindex; they are fallbacks, not pages.
 * It also fails on any asset over the Workers 25 MiB limit.
 *
 * The target is CLOUDFLARE_ENV, which also picks the Wrangler environment at
 * build time: "production" is utdred.com, anything else (unset) is the preview.
 *
 *   node scripts/package-assets.mjs
 */
import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

const OUT = "out";
const production = process.env.CLOUDFLARE_ENV === "production";
const BEGIN = "# --- redthread rules (scripts/package-assets.mjs) ---";
const END = "# --- end redthread rules ---";

const legacy = JSON.parse(readFileSync("vercel.json", "utf8"));
const redirects = legacy.redirects.map(({ source, destination, permanent }) => `${source} ${destination} ${permanent ? 308 : 307}`);
writeFileSync(path.join(OUT, "_redirects"), redirects.join("\n") + "\n");

const rules = [
  // Off production, every path; on it, only the twins.
  ...(production ? ["/live-snapshot/*"] : ["/*"]),
  "  X-Robots-Tag: noindex, nofollow",
  "",
  "/data/*",
  "  Cache-Control: public, max-age=86400, stale-while-revalidate=604800",
  "/api/*",
  "  Access-Control-Allow-Origin: *",
  "  Access-Control-Allow-Methods: GET, OPTIONS",
  "  Content-Type: application/json; charset=utf-8",
  "/api/health",
  "  Cache-Control: no-store",
];

// The adapter writes its own rules (hashed /_astro assets) into _headers; keep them.
const headersFile = path.join(OUT, "_headers");
const existing = existsSync(headersFile) ? readFileSync(headersFile, "utf8") : "";
const start = existing.indexOf(BEGIN);
const stop = existing.indexOf(END);
const adapterRules = (start === -1 ? existing : existing.slice(0, start) + existing.slice(stop + END.length)).trim();
writeFileSync(headersFile, [...(adapterRules ? [adapterRules] : []), BEGIN, ...rules, END].join("\n") + "\n");

let files = 0;
const walk = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else {
      const bytes = statSync(file).size;
      if (bytes > 25 * 1024 * 1024) throw new Error(`package-assets: ${file} is ${bytes} bytes, over the 25 MiB asset limit`);
      files++;
    }
  }
};
walk(OUT);
console.log(`package-assets: ${production ? "production (indexable)" : "preview (noindex)"}; ${redirects.length} redirects; ${files} assets within 25 MiB`);
