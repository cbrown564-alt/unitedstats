/**
 * Best-effort current-season match-sheet enrichment.
 *
 * After openfootball has a result, this lane fills scorers, lineups, shirts,
 * benches, cards, substitutions, assists, opposition scorers, stadiums, and
 * league positions from Wikipedia, Transfermarkt, and MUFCInfo. Individual
 * sources may still be empty on the first morning after
 * a match; rerunning is idempotent.
 *
 * Usage:
 *   npm run enrich -- --write
 *   npm run enrich -- --write --refresh --strict
 *   npm run enrich -- --report-only
 */
import { spawnSync } from "node:child_process";
import { enrichLanes } from "./enrichLanes";
import { assessMatchSheet, formatSheetReport, latestMatches } from "./matchSheet";
import { loadSeasonFile, parseSeasonArgs } from "../scripts/lib";

const WRITE = process.argv.includes("--write");
const REFRESH = process.argv.includes("--refresh");
const STRICT = process.argv.includes("--strict");
const REPORT_ONLY = process.argv.includes("--report-only");
const LATEST = numberArg("--latest", 3);

function numberArg(flag: string, fallback: number): number {
  const index = process.argv.indexOf(flag);
  if (index < 0) return fallback;
  const value = Number(process.argv[index + 1]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function currentSeason(): string {
  return parseSeasonArgs(["current"])?.[0] ?? "2026-27";
}

function runLane(id: string, command: string, args: string[]): boolean {
  console.log(`\n== ${id} ==`);
  const result = spawnSync(command, args, { stdio: "inherit", env: process.env });
  if (result.status === 0) return true;
  console.error(`${id} failed (exit ${result.status ?? "spawn"}); continuing`);
  return false;
}

function report(): { season: string; complete: boolean; count: number } {
  const season = currentSeason();
  const file = loadSeasonFile(season);
  const sheets = latestMatches(file, LATEST).map(assessMatchSheet);
  const text = formatSheetReport(sheets);
  console.log(`\n== match sheet (${season}) ==\n${text}`);
  console.log(`SHEET_COMPLETE=${sheets.length > 0 && sheets.every((s) => s.complete) ? 1 : 0}`);
  console.log(`SHEET_MATCHES=${sheets.length}`);
  return {
    season,
    complete: sheets.length > 0 && sheets.every((s) => s.complete),
    count: sheets.length,
  };
}

function main() {
  if (!REPORT_ONLY) {
    const lanes = enrichLanes({
      write: WRITE,
      refresh: REFRESH,
    });
    for (const lane of lanes) {
      runLane(lane.id, lane.command, lane.args);
    }
  }

  const { complete, count } = report();
  if (STRICT && (count === 0 || !complete)) {
    process.exit(2);
  }
}

if (process.argv[1] && /enrichCurrent\.(ts|js)$/.test(process.argv[1].replace(/\\/g, "/"))) {
  main();
}
