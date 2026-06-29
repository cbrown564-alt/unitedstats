/**
 * Post-build performance budgets. This intentionally inspects the built
 * artifacts rather than source estimates so hidden HTML/RSC growth and chunky
 * client bundles fail loudly after `next build`.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";

const root = process.cwd();
const nextDir = path.join(root, ".next");
const appDir = path.join(nextDir, "server", "app");
const chunksDir = path.join(nextDir, "static", "chunks");
const ignoredRootEntries = new Set(["dev"]);

const KB = 1024;
const MB = 1024 * KB;

const budgets = {
  htmlGzip: bytesFromEnv("PERF_MAX_HTML_GZIP", 180 * KB),
  rscGzip: bytesFromEnv("PERF_MAX_RSC_GZIP", 120 * KB),
  jsChunkGzip: bytesFromEnv("PERF_MAX_JS_CHUNK_GZIP", 120 * KB),
  nextOutput: bytesFromEnv("PERF_MAX_NEXT_OUTPUT", 2000 * MB),
};

if (!existsSync(nextDir)) {
  console.error("check:perf — .next is missing. Run `npm run build` first.");
  process.exit(1);
}

const failures = [];
const html = checkGzipBudget(walk(appDir, (file) => file.endsWith(".html")), budgets.htmlGzip, "HTML");
const rsc = checkGzipBudget(walk(appDir, (file) => file.endsWith(".rsc")), budgets.rscGzip, "RSC");
const js = checkGzipBudget(walk(chunksDir, (file) => file.endsWith(".js")), budgets.jsChunkGzip, "JS chunk");
const nextOutput = sumBytes(nextDir);

if (nextOutput > budgets.nextOutput) {
  failures.push(`.next output ${fmt(nextOutput)} exceeds budget ${fmt(budgets.nextOutput)}`);
}

printTop("HTML gzip", html);
printTop("RSC gzip", rsc);
printTop("JS chunk gzip", js);
console.log(`.next output: ${fmt(nextOutput)} (budget ${fmt(budgets.nextOutput)})`);

if (failures.length > 0) {
  console.error("\n✗ perf budget failed:");
  for (const f of failures) console.error("  - " + f);
  process.exit(1);
}

console.log(
  `✓ perf budgets: HTML ≤ ${fmt(budgets.htmlGzip)}, RSC ≤ ${fmt(budgets.rscGzip)}, ` +
    `JS chunks ≤ ${fmt(budgets.jsChunkGzip)}, .next ≤ ${fmt(budgets.nextOutput)}.`,
);

function bytesFromEnv(name, fallback) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const m = raw.trim().match(/^(\d+(?:\.\d+)?)(b|kb|mb)?$/i);
  if (!m) return fallback;
  const n = Number(m[1]);
  const unit = (m[2] ?? "b").toLowerCase();
  if (unit === "mb") return Math.round(n * MB);
  if (unit === "kb") return Math.round(n * KB);
  return Math.round(n);
}

function walk(dir, include, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file, include, out);
    else if (include(file)) out.push(file);
  }
  return out;
}

function checkGzipBudget(files, limit, label) {
  const rows = [];
  for (const file of files) {
    const raw = statSync(file).size;
    const gz = raw > limit ? gzipSize(file) : raw;
    const rel = path.relative(root, file);
    rows.push({ file: rel, raw, gz });
    if (gz > limit) failures.push(`${label} ${rel} is ${fmt(gz)} gzip; budget ${fmt(limit)}`);
  }
  return rows
    .sort((a, b) => b.raw - a.raw)
    .slice(0, 20)
    .map((row) => ({ ...row, gz: gzipSize(path.join(root, row.file)) }))
    .sort((a, b) => b.gz - a.gz)
    .slice(0, 5);
}

function gzipSize(file) {
  return gzipSync(readFileSync(file)).length;
}

function sumBytes(dir) {
  let total = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (dir === nextDir && ignoredRootEntries.has(entry.name)) continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) total += sumBytes(file);
    else total += statSync(file).size;
  }
  return total;
}

function printTop(label, rows) {
  if (rows.length === 0) return;
  console.log(`${label} top ${rows.length}:`);
  for (const row of rows) console.log(`  ${fmt(row.gz).padStart(9)}  ${row.file}`);
}

function fmt(bytes) {
  if (bytes >= MB) return `${(bytes / MB).toFixed(1)} MB`;
  return `${(bytes / KB).toFixed(1)} KB`;
}
