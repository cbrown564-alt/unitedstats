/**
 * Compute revalidation paths for newly appended matches by reading the live db.
 *
 * Usage:
 *   tsx scripts/compute-revalidate-paths.ts --ids 2026-04-12-liverpool-h
 */
import Database from "better-sqlite3";
import { revalidationPathsForMatches } from "../lib/revalidation";
import { DB_PATH } from "./lib";

function parseIds(argv: string[]): string[] {
  const idx = argv.indexOf("--ids");
  if (idx === -1 || !argv[idx + 1]) {
    throw new Error("Usage: tsx scripts/compute-revalidate-paths.ts --ids id1,id2");
  }
  return argv[idx + 1].split(",").map((s) => s.trim()).filter(Boolean);
}

function main() {
  const ids = parseIds(process.argv.slice(2));
  const db = new Database(DB_PATH, { readonly: true, fileMustExist: true });

  const placeholders = ids.map(() => "?").join(",");
  const matches = db
    .prepare(
      `SELECT m.id, m.date, m.opponent_id opponentId, m.manager_id managerId
       FROM matches m WHERE m.id IN (${placeholders})`,
    )
    .all(...ids) as { id: string; date: string; opponentId: string; managerId: string | null }[];

  if (matches.length !== ids.length) {
    const found = new Set(matches.map((m) => m.id));
    const missing = ids.filter((id) => !found.has(id));
    throw new Error(`Match ids not found in db: ${missing.join(", ")}`);
  }

  const playerIds = db
    .prepare(
      `SELECT DISTINCT player_id id FROM match_events
       WHERE match_id IN (${placeholders}) AND player_id IS NOT NULL
       UNION
       SELECT DISTINCT player_id id FROM match_lineups
       WHERE match_id IN (${placeholders}) AND player_id IS NOT NULL`,
    )
    .all(...ids, ...ids)
    .map((row) => (row as { id: string }).id);

  const managerId = matches.map((m) => m.managerId).find(Boolean) ?? null;
  const paths = revalidationPathsForMatches(matches, { playerIds, managerId });

  process.stdout.write(JSON.stringify({ matches, playerIds, managerId, paths }) + "\n");
}

main();
