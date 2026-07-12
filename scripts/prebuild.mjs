/**
 * Conditional prebuild: builds reconcile the tracked local media paths;
 * remote Wikimedia downloads are an explicit ingest operation because rate
 * limits and unavailable historical images must not block deploys or previews.
 * Full deploys rebuild the dataset export; preview deploys skip it because PR
 * builds are for UI iteration, not downloadable releases.
 */
import { spawnSync } from "node:child_process";

function profile() {
  const explicit = process.env.UNITEDSTATS_BUILD_PROFILE;
  if (explicit === "full" || explicit === "preview") return explicit;
  if (process.env.VERCEL_ENV === "preview") return "preview";
  return "full";
}

function run(label, args) {
  console.log(`prebuild: ${label}`);
  const result = spawnSync("npm", ["run", ...args], { stdio: "inherit", shell: true });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const mode = profile();
console.log(`prebuild: profile=${mode}`);

run("build:db", ["build:db"]);
if (process.env.UNITEDSTATS_CACHE_MEDIA === "1") {
  run("cache:media (remote)", ["cache:media"]);
} else {
  run("cache:media (reconcile-only)", ["cache:media", "--", "--reconcile-only"]);
}

if (mode === "full") {
  run("export:dataset", ["export:dataset"]);
} else {
  console.log("prebuild: skipping export:dataset (preview profile)");
}
