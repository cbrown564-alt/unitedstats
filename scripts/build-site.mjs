/**
 * The site build: regenerate the Astro route wrappers from app/, then
 * `astro build` into out/. UNITEDSTATS_BUILD_PROFILE=preview samples the heavy
 * route families (see lib/build-profile.ts) for fast PR deploys; anything else is a
 * full build.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const explicit = process.env.UNITEDSTATS_BUILD_PROFILE;
const profile = explicit === "preview" ? "preview" : "full";
const args = process.argv.slice(2);

console.log(`build: profile=${profile}; framework=astro`);
const recordDir = path.join(".astro", "live-record");
rmSync(recordDir, { recursive: true, force: true });
for (const [label, cmd] of [
  ["routes", [process.execPath, ["scripts/astro/generate-routes.mjs"]]],
  ["astro build", [process.execPath, [path.join(path.dirname(require.resolve("astro/package.json")), "bin", "astro.mjs"), "build", ...args]]],
]) {
  console.log(`build: ${label}`);
  const result = spawnSync(cmd[0], cmd[1], { stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

// The live routes' recorded queries, merged into one asset the Worker replays
// (src/rt/snapshot.ts records them; lib/dbReplay.ts reads them).
const record = {};
for (const file of readdirSync(recordDir)) Object.assign(record, JSON.parse(readFileSync(path.join(recordDir, file), "utf8")));
const target = path.join("out", "live-snapshot", "record.json");
mkdirSync(path.dirname(target), { recursive: true });
writeFileSync(target, JSON.stringify(record));
console.log(`build: live record ${Object.keys(record).length} queries, ${(statSync(target).size / 1024).toFixed(0)} KB`);

// Headers, legacy redirects and the asset-size limit for the deploy target.
const packaged = spawnSync(process.execPath, ["scripts/package-assets.mjs"], { stdio: "inherit" });
if (packaged.status !== 0) process.exit(packaged.status ?? 1);
