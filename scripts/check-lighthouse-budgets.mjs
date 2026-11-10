/** Compare complete Lighthouse corpora; exit nonzero while any target is unmet.
 * Usage: node scripts/check-lighthouse-budgets.mjs BASELINE_DIR CURRENT_DIR
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const [baselineDir, currentDir] = process.argv.slice(2);
if (!baselineDir || !currentDir) throw new Error("Provide baseline and current Lighthouse report directories");
const read = (dir, name) => JSON.parse(readFileSync(path.join(dir, name), "utf8"));
const baseline = read(baselineDir, "summary.json");
const current = read(currentDir, "summary.json");
const runs = read(currentDir, "runs.json");
const key = (row) => `${row.device} ${row.route}`;
const previous = new Map(baseline.map((row) => [key(row), row]));
const failures = [];
const fail = (condition, message) => { if (condition) failures.push(message); };
fail(current.length !== 12 || previous.size !== 12, "The six-route, two-device comparison corpus is incomplete");
let beforeBytes = 0;
let afterBytes = 0;
const rows = current.map((row) => {
  const old = previous.get(key(row));
  if (!old) throw new Error(`Missing baseline: ${key(row)}`);
  beforeBytes += old.transferredBytes;
  afterBytes += row.transferredBytes;
  const general = row.route === "/" || row.route === "/seasons";
  const jsBudget = (general ? 150 : 200) * 1024;
  fail(row.runs < 3, `${key(row)} needs at least three runs`);
  fail(row.transferredBytes > old.transferredBytes * 1.1, `${key(row)} transfer grew by more than 10%`);
  fail(row.scriptBytes > jsBudget, `${key(row)} JavaScript ${(row.scriptBytes / 1024).toFixed(1)} KiB exceeds ${jsBudget / 1024} KiB`);
  fail(general && row.requests > 60, `${key(row)} exceeds 60 requests`);
  fail(row.score < (row.device === "mobile" ? 98 : 99), `${key(row)} performance score is below target`);
  fail(row["largest-contentful-paint"] > (row.device === "mobile" ? 1500 : 750), `${key(row)} LCP exceeds target`);
  fail(row["total-blocking-time"] > (row.device === "mobile" ? 100 : 50), `${key(row)} TBT exceeds target`);
  if (row.device === "mobile" && row.route === "/player/wayne-rooney") {
    fail(row["total-blocking-time"] > old["total-blocking-time"] * 0.4, "Rooney mobile TBT reduction is below 60%");
  }
  return { ...row, scriptBudget: jsBudget, transferReduction: 1 - row.transferredBytes / old.transferredBytes };
});
for (const run of runs) {
  fail(run.failedRequests.length > 0, `${key(run)} run ${run.run} has failed requests`);
  fail(run["cumulative-layout-shift"] > 0.05, `${key(run)} run ${run.run} exceeds CLS 0.05`);
  fail(run.score < 95, `${key(run)} run ${run.run} scored below 95; investigate its trace`);
}
const transferReduction = 1 - afterBytes / beforeBytes;
fail(transferReduction < 0.5, `Corpus transfer reduction ${(transferReduction * 100).toFixed(2)}% is below 50%`);
const result = { baselineDir, currentDir, beforeBytes, afterBytes, transferReduction, rows, failures };
writeFileSync(path.join(currentDir, "budget-comparison.json"), JSON.stringify(result, null, 2) + "\n");
console.table(rows.map((row) => ({ route: row.route, device: row.device, score: row.score, transferKiB: Math.round(row.transferredBytes / 1024), scriptKiB: Math.round(row.scriptBytes / 1024), budgetKiB: row.scriptBudget / 1024 })));
console.log(`Corpus: ${(beforeBytes / 1048576).toFixed(3)} → ${(afterBytes / 1048576).toFixed(3)} MiB (${(transferReduction * 100).toFixed(2)}% less)`);
for (const message of failures) console.error(`- ${message}`);
process.exitCode = failures.length ? 1 : 0;
