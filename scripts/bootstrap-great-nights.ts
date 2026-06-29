/**
 * One-off bootstrap for the first-contact spark (the served match-night).
 *
 * Surfaces candidate "great nights" three ways, because no single signal catches
 * them all:
 *   1. significance() — the onThisDay editorial weight (finals, prestige, margin).
 *   2. stoppage-time wins — late drama that margin-based scoring misses.
 *   3. half-time comebacks — won after trailing by 2+ at the break.
 *
 * Output is a shortlist to hand-trim into lib/greatNights.ts CURATED_NIGHTS.
 * Not wired into the app; safe to delete after the seed is chosen.
 */
import Database from "better-sqlite3";
import path from "node:path";

const db = new Database(path.join(process.cwd(), "data", "united.db"), { readonly: true });

interface Row {
  id: string;
  date: string;
  season: string;
  opponent_name: string;
  venue: "H" | "A" | "N";
  gf: number;
  ga: number;
  ht_gf: number | null;
  ht_ga: number | null;
  result: "W" | "D" | "L";
  competition_name: string;
  competition_type: string;
  round: string | null;
}

const rows = db
  .prepare(
    `SELECT m.id, m.date, m.season, m.opponent_name, m.venue, m.gf, m.ga,
            m.ht_gf, m.ht_ga, m.result, c.name AS competition_name,
            c.type AS competition_type, m.round
     FROM matches m JOIN competitions c ON c.id = m.competition_id`,
  )
  .all() as Row[];

const isFinal = (r: string | null) => !!r && /final/i.test(r) && !/semi|quarter/i.test(r);

function significance(m: Row): number {
  let score = 0;
  const round = (m.round ?? "").toLowerCase();
  if (isFinal(m.round)) score += 1000;
  else if (/semi/.test(round)) score += 500;
  else if (/quarter/.test(round)) score += 250;
  if (m.competition_type === "european" || m.competition_type === "world") score += 220;
  else if (m.competition_type === "super-cup") score += 120;
  score += Math.abs(m.gf - m.ga) * 8;
  if (m.result === "W") score += 20;
  score += Number(m.date.slice(0, 4)) / 10000;
  return score;
}

/** United goal minutes (with added time) for a match. */
const goalMinutes = db.prepare(
  `SELECT minute, added_time FROM match_events
   WHERE match_id = ? AND type = 'goal' AND player_side = 'united'
   ORDER BY COALESCE(minute, 999), seq`,
);

function unitedStoppageGoals(id: string): number {
  const gs = goalMinutes.all(id) as { minute: number | null; added_time: number | null }[];
  return gs.filter((g) => (g.minute ?? 0) >= 90 || ((g.minute ?? 0) >= 90 && (g.added_time ?? 0) > 0)).length;
}

const line = (m: Row) => {
  const v = m.venue === "H" ? "v" : m.venue === "A" ? "at" : "vs";
  const rnd = m.round ? ` · ${m.round}` : "";
  return `${m.id.padEnd(28)} ${m.date}  United ${m.gf}-${m.ga} ${v} ${m.opponent_name}  [${m.competition_name}${rnd}]`;
};

console.log("\n========== TOP 40 BY SIGNIFICANCE (finals / prestige / margin) ==========\n");
[...rows]
  .sort((a, b) => significance(b) - significance(a))
  .slice(0, 40)
  .forEach((m) => console.log(line(m)));

console.log("\n========== STOPPAGE-TIME WINS (2+ United goals from the 90th on) ==========\n");
rows
  .filter((m) => m.result === "W" && unitedStoppageGoals(m.id) >= 1)
  .filter((m) => {
    const gs = goalMinutes.all(m.id) as { minute: number | null }[];
    // last United goal in stoppage time and a tight margin → a real late winner
    const last = gs[gs.length - 1]?.minute ?? 0;
    return last >= 88 && Math.abs(m.gf - m.ga) <= 2;
  })
  .sort((a, b) => b.date.localeCompare(a.date))
  .slice(0, 30)
  .forEach((m) => console.log(line(m)));

console.log("\n========== HALF-TIME COMEBACKS (2+ down at the break, won) ==========\n");
rows
  .filter((m) => m.result === "W" && m.ht_gf != null && m.ht_ga != null && m.ht_ga - m.ht_gf >= 2)
  .sort((a, b) => b.date.localeCompare(a.date))
  .forEach((m) => console.log(`${line(m)}  (HT ${m.ht_gf}-${m.ht_ga})`));

console.log("");
