/**
 * The site build: regenerate the Astro route wrappers from app/, then
 * `astro build` into out/. UNITEDSTATS_BUILD_PROFILE=preview samples the heavy
 * route families (see lib/build-profile.ts) for fast PR deploys; anything else is a
 * full build.
 */
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const explicit = process.env.UNITEDSTATS_BUILD_PROFILE;
const profile = explicit === "preview" ? "preview" : "full";
const args = process.argv.slice(2);

console.log(`build: profile=${profile}; framework=astro`);
for (const [label, cmd] of [
  ["routes", [process.execPath, ["scripts/astro/generate-routes.mjs"]]],
  ["astro build", [process.execPath, [path.join(path.dirname(require.resolve("astro/package.json")), "bin", "astro.mjs"), "build", ...args]]],
]) {
  console.log(`build: ${label}`);
  const result = spawnSync(cmd[0], cmd[1], { stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
