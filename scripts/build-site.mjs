import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { rmSync } from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const explicit = process.env.UNITEDSTATS_BUILD_PROFILE;
const profile = explicit === "preview" ? "preview" : "full";
const args = process.argv.slice(2);
const selectedBundler = args.some((arg) => ["--webpack", "--turbopack", "--turbo"].includes(arg));
// Full releases use the smaller measured browser bundles. Keep the existing
// Turbopack preview path and its tighter build-artifact budget unchanged.
if (profile === "full" && !selectedBundler) args.unshift("--webpack");
function clearWebpackCache() {
  // Compiler cache is disposable and is not part of the deployable artifact.
  const dist = path.resolve(process.env.NEXT_VERIFY_DIST ?? ".next");
  const relative = path.relative(process.cwd(), dist);
  if (!relative || relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error("Build output must stay inside the project");
  }
  rmSync(path.join(dist, "cache", "webpack"), { recursive: true, force: true });
}
const help = args.includes("--help") || args.includes("-h");
if (!args.includes("--webpack") && !help) clearWebpackCache();
console.log(`build: profile=${profile}; bundler=${args.includes("--webpack") ? "webpack" : "turbopack"}`);
const result = spawnSync(process.execPath, [require.resolve("next/dist/bin/next"), "build", ...args], { stdio: "inherit" });
if (result.error) throw result.error;
if (result.status === 0 && !help) clearWebpackCache();
process.exit(result.status ?? 1);
