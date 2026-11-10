/** Sequential, cold-cache Lighthouse runs against an already-built static site.
 * Usage: node scripts/benchmark-lighthouse.mjs [baseURL] [outputDir]
 * Optional: RUNS=3 DEVICES=mobile,desktop ROUTES=/,/seasons BUILD_MODE=development
 * Start the server separately; never benchmark while building or running checks.
 */
import { spawn, execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import os from "node:os";

const version = "13.6.0";
const [baseURL = "http://127.0.0.1:4173", outputDir = `output/performance/${new Date().toISOString().replaceAll(":", "-")}`] = process.argv.slice(2);
const runs = Number(process.env.RUNS ?? 3);
const devices = (process.env.DEVICES ?? "mobile,desktop").split(",");
const routes = (process.env.ROUTES ?? "/,/seasons,/player/wayne-rooney,/match/1999-05-26-bayern-munich-n,/seasons/1998-99,/matches").split(",");
if (!Number.isInteger(runs) || runs < 1 || devices.some((d) => !["mobile", "desktop"].includes(d))) {
  throw new Error("RUNS must be a positive integer; DEVICES must contain mobile and/or desktop");
}
if (existsSync(path.join(outputDir, "manifest.json"))) throw new Error("Choose a new output directory to preserve the previous benchmark");
mkdirSync(outputDir, { recursive: true });
const command = (cmd, args) => execFileSync(cmd, args, { encoding: "utf8" }).trim();
const manifest = {
  startedAt: new Date().toISOString(), baseURL, lighthouse: version, runs, devices, routes,
  mode: process.env.BUILD_MODE ?? "production-static",
  commit: command("git", ["rev-parse", "HEAD"]),
  dirty: command("git", ["status", "--short"]),
  buildId: process.env.BENCHMARK_BUILD_ID ?? (process.env.BUILD_MODE === "development" ? null : readFileSync(".next/BUILD_ID", "utf8").trim()),
  note: process.env.BENCHMARK_NOTE ?? null,
  node: process.version, platform: `${os.platform()} ${os.release()} ${os.arch()}`,
  cpu: os.cpus()[0].model, memoryGB: Math.round(os.totalmem() / 1024 ** 3),
};
writeFileSync(path.join(outputDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
const rows = [];
const metrics = ["first-contentful-paint", "largest-contentful-paint", "speed-index", "total-blocking-time", "cumulative-layout-shift", "server-response-time"];
for (const device of devices) {
  for (const route of routes) {
    const slug = route === "/" ? "home" : route.slice(1).replaceAll("/", "--");
    for (let run = 1; run <= runs; run++) {
      const stem = path.resolve(outputDir, `${slug}-${device}-${run}`);
      const args = ["--yes", `lighthouse@${version}`, new URL(route, baseURL).href,
        "--only-categories=performance", "--chrome-flags=--headless --no-sandbox",
        "--output=json", "--output=html", `--output-path=${stem}`, "--quiet"];
      if (device === "desktop") args.push("--preset=desktop");
      if (process.env.SAVE_TRACE === "1") args.push("--save-assets");
      console.log(`Auditing ${route} ${device} ${run}/${runs}`);
      await new Promise((resolve, reject) => {
        const child = spawn("npx", args, { stdio: ["ignore", "ignore", "pipe"] });
        let stderr = "";
        child.stderr.on("data", (chunk) => { stderr += chunk; });
        child.on("error", reject);
        child.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`Lighthouse exited ${code}: ${stderr}`)));
      });
      const report = JSON.parse(readFileSync(`${stem}.report.json`, "utf8"));
      if (report.runtimeError || report.categories.performance.score == null) {
        throw new Error(JSON.stringify(report.runtimeError ?? report.runWarnings));
      }
      const requests = report.audits["network-requests"].details.items;
      const row = {
        route, device, run, report: path.basename(`${stem}.report.html`),
        score: Math.round(report.categories.performance.score * 100),
        ...Object.fromEntries(metrics.map((m) => [m, report.audits[m]?.numericValue ?? null])),
        requests: requests.length,
        transferredBytes: requests.reduce((sum, r) => sum + (r.transferSize ?? 0), 0),
        scriptBytes: requests.filter((r) => r.resourceType === "Script").reduce((sum, r) => sum + (r.transferSize ?? 0), 0),
        failedRequests: requests.filter((r) => r.statusCode >= 400 || r.failed),
        warnings: report.runWarnings,
        environment: report.environment,
        config: report.configSettings,
      };
      rows.push(row);
      writeFileSync(path.join(outputDir, "runs.json"), JSON.stringify(rows, null, 2) + "\n");
      console.log(`  ${row.score}/100; LCP ${Math.round(row["largest-contentful-paint"])}ms; TBT ${Math.round(row["total-blocking-time"])}ms; ${row.requests} requests; ${row.failedRequests.length} failed`);
    }
  }
}
const median = (values) => { const sorted = [...values].sort((a, b) => a - b); const mid = Math.floor(sorted.length / 2); return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2; };
const summary = devices.flatMap((device) => routes.map((route) => {
  const group = rows.filter((r) => r.device === device && r.route === route);
  return { route, device, runs: group.length,
    ...Object.fromEntries(["score", ...metrics, "requests", "transferredBytes", "scriptBytes"].map((k) => [k, median(group.map((r) => r[k]))])),
    scoreRange: [Math.min(...group.map((r) => r.score)), Math.max(...group.map((r) => r.score))],
    failedRequests: group.reduce((sum, r) => sum + r.failedRequests.length, 0),
  };
}));
writeFileSync(path.join(outputDir, "summary.json"), JSON.stringify(summary, null, 2) + "\n");
console.table(summary.map(({ route, device, score, "largest-contentful-paint": lcp, "total-blocking-time": tbt, requests }) => ({ route, device, score, lcp: Math.round(lcp), tbt: Math.round(tbt), requests })));
