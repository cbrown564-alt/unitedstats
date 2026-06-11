/** Quick data sanity report (run: npx tsx scripts/stats-check.ts) */
import Database from "better-sqlite3";
import { DB_PATH } from "./lib";

const db = new Database(DB_PATH, { readonly: true });

console.log("By competition type:");
for (const r of db.prepare(
  `SELECT c.type, COUNT(*) n, MIN(m.date) f, MAX(m.date) l
   FROM matches m JOIN competitions c ON c.id=m.competition_id
   GROUP BY c.type ORDER BY n DESC`,
).all() as { type: string; n: number; f: string; l: string }[]) {
  console.log(`  ${r.type}: ${r.n} (${r.f} → ${r.l})`);
}

const att = db.prepare("SELECT COUNT(attendance) a, COUNT(*) n FROM matches").get() as { a: number; n: number };
console.log(`attendance: ${att.a}/${att.n} matches`);

const ev = db.prepare(
  "SELECT COUNT(DISTINCT match_id) n FROM match_events WHERE type IN ('goal','pen-goal','own-goal-for')",
).get() as { n: number };
console.log(`matches with scorer data: ${ev.n}`);

console.log("top scorers:");
for (const r of db.prepare(
  `SELECT p.name, t.goals FROM player_totals t JOIN players p ON p.id=t.player_id
   WHERE t.scope='all' ORDER BY t.goals DESC LIMIT 12`,
).all() as { name: string; goals: number }[]) {
  console.log(`  ${r.name}: ${r.goals}`);
}

console.log("possible duplicate european opponents:");
for (const r of db.prepare(
  `SELECT id, name FROM opponents WHERE id LIKE 'fc-%' OR id LIKE '%-fc' OR name LIKE '%.%'`,
).all() as { id: string; name: string }[]) {
  console.log(`  ${r.id} (${r.name})`);
}
