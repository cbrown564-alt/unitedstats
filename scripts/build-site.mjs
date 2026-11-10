import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { rmSync } from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const explicit = process.env.UNITEDSTATS_BUILD_PROFILE;
const profile = explicit === "full" || explicit === "preview"
  ? explicit
  : process.env.VERCEL_ENV === "preview" ? "preview" : "full";
const args = process.argv.slice(2);
const selectedBundler = args.some((arg) => ["--webpack", "--turbopack", "--turbo"].includes(arg));
// Full releases use the smaller measured browser bundles. Keep the existing
// Turbopack preview path and its tighter build-artifact budget unchanged.
if (profile === "full" && !selectedBundler) args.unshift("--webpack");
if (!args.includes("--webpack") && !args.includes("--help") && !args.includes("-h")) {
  // Next retains this disk cache across builds, but Turbopack cannot reuse it.
  // Do not count a previous full build's cache against the preview budget.
  const dist = path.resolve(process.env.NEXT_VERIFY_DIST ?? ".next");
  const relative = path.relative(process.cwd(), dist);
  if (!relative || relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error("Build output must stay inside the project");
  }
  rmSync(path.join(dist, "cache", "webpack"), { recursive: true, force: true });
}
console.log(`build: profile=${profile}; bundler=${args.includes("--webpack") ? "webpack" : "turbopack"}`);
const result = spawnSync(process.execPath, [require.resolve("next/dist/bin/next"), "build", ...args], { stdio: "inherit" });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
