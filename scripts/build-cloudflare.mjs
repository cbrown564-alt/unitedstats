import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const mode = process.argv[2] ?? "migration-preview";
const prebuilt = process.argv.includes("--prebuilt");
if (!["production", "migration-preview"].includes(mode)) throw new Error(`Unknown mode: ${mode}`);
const env = { ...process.env, UNITEDSTATS_BUILD_PROFILE: "full", NEXT_PUBLIC_SITE_URL: "https://utdred.com" };
for (const args of [["exec", "--", "cf", "workers", "types"], ["exec", "--", "tsc", "-p", "tsconfig.cloudflare.json"], ...prebuilt ? [] : [["run", "build"]], ["exec", "--", "cf-wrangler", "build", "--mode", mode]]) {
  if (args.includes("build") && args.includes("cf-wrangler")) {
    const legacy = JSON.parse(readFileSync("vercel.json", "utf8"));
    writeFileSync("out/_redirects", legacy.redirects.map(({source, destination, permanent}) => `${source} ${destination} ${permanent ? 308 : 307}`).join("\n") + "\n");
    writeFileSync("out/_headers", `${mode === "migration-preview" ? "/*\n  X-Robots-Tag: noindex, nofollow\n\n" : ""}/data/*
  Cache-Control: public, max-age=86400, stale-while-revalidate=604800
/api/*
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Methods: GET, OPTIONS
  Content-Type: application/json; charset=utf-8
/api/health
  Cache-Control: no-store
/_next/static/*
  Cache-Control: public, max-age=31536000, immutable
`);
    let files = 0;
    const walk = (directory) => {
      for (const entry of readdirSync(directory, {withFileTypes:true})) {
        const file = path.join(directory, entry.name);
        if (entry.isDirectory()) walk(file);
        else {
          const bytes = statSync(file).size;
          if (bytes > 25 * 1024 * 1024) throw new Error(`Asset exceeds 25 MiB: ${file} (${bytes})`);
          files++;
        }
      }
    };
    walk("out");
    console.log(`Cloudflare assets: ${files} files, each within 25 MiB`);
  }
  const result = spawnSync("npm", args, {stdio:"inherit", env});
  if (result.status !== 0) process.exit(result.status ?? 1);
}
