/**
 * Fails when a scheduled fixture is past its date and still has no result.
 *
 * The record promises every match. Result ingest reports success even when
 * its upstream has simply stopped publishing, so this is the check that turns
 * a silent gap into a failed run.
 *
 * Usage: tsx scripts/check-overdue-fixtures.ts [--grace-days 2]
 */
import fs from "node:fs";
import path from "node:path";
import { CANONICAL, readJson } from "./lib";
import { overdueFixtures, type UpcomingOverlay } from "../pipeline/upcoming";

const file = path.join(CANONICAL, "upcoming.json");
const graceIdx = process.argv.indexOf("--grace-days");
const graceDays = graceIdx > -1 ? Number(process.argv[graceIdx + 1]) : 2;
const today = new Date().toISOString().slice(0, 10);

const overdue = fs.existsSync(file)
  ? overdueFixtures(readJson<UpcomingOverlay>(file), today, graceDays)
  : [];

if (overdue.length === 0) {
  console.log("overdue fixtures: none");
} else {
  console.error(`overdue fixtures: ${overdue.length} scheduled match(es) have no result`);
  for (const f of overdue) {
    console.error(`  ${f.date} ${f.venue} ${f.opponent} (${f.competitionName})`);
  }
  console.error("Either the result source has stalled or the match was postponed; the record is incomplete until this is resolved.");
  process.exit(1);
}
