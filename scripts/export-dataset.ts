/**
 * Export the compiled database to flat downloadable files in public/dataset/.
 * Runs as part of prebuild (after build:db), so every deploy ships a dataset
 * release that matches what the site itself is serving.
 */
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { DB_PATH } from "./lib";

const OUT_DIR = path.join(process.cwd(), "public", "dataset");

const db = new Database(DB_PATH, { readonly: true, fileMustExist: true });

function csvCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

function exportCsv(file: string, sql: string): number {
  const rows = db.prepare(sql).all() as Record<string, unknown>[];
  if (rows.length === 0) return 0;
  const cols = Object.keys(rows[0]);
  const lines = [cols.join(",")];
  for (const r of rows) lines.push(cols.map((c) => csvCell(r[c])).join(","));
  fs.writeFileSync(path.join(OUT_DIR, file), lines.join("\n") + "\n", "utf8");
  return rows.length;
}

fs.rmSync(OUT_DIR, { recursive: true, force: true });
fs.mkdirSync(OUT_DIR, { recursive: true });

const counts: Record<string, number> = {
  "matches.csv": exportCsv(
    "matches.csv",
    `SELECT m.id, m.season, m.date, m.competition_id, c.name competition, c.type competition_type,
            m.round, m.opponent_id, m.opponent_name, m.venue, s.name stadium, m.attendance,
            m.gf, m.ga, m.ht_gf, m.ht_ga, m.aet, m.pen_gf, m.pen_ga, m.result, m.outcome,
            mg.name manager, m.events_complete, m.has_lineup, m.notes
     FROM matches m
     JOIN competitions c ON c.id = m.competition_id
     LEFT JOIN stadiums s ON s.id = m.stadium_id
     LEFT JOIN managers mg ON mg.id = m.manager_id
     ORDER BY m.date, m.id`,
  ),
  "events.csv": exportCsv(
    "events.csv",
    `SELECT e.match_id, m.date, e.seq, e.type, e.player_id,
            COALESCE(p.name, e.player_name) player, e.player_side, e.minute,
            e.assist_player_id, COALESCE(ap.name, e.assist_name) assist, e.detail
     FROM match_events e
     JOIN matches m ON m.id = e.match_id
     LEFT JOIN players p ON p.id = e.player_id
     LEFT JOIN players ap ON ap.id = e.assist_player_id
     ORDER BY m.date, e.match_id, e.seq`,
  ),
  "lineups.csv": exportCsv(
    "lineups.csv",
    `SELECT l.match_id, m.date, l.seq, l.player_id, COALESCE(p.name, l.player_name) player,
            l.player_side, l.shirt, l.role, l.started, l.bench, l.sub_on, l.sub_off
     FROM match_lineups l
     JOIN matches m ON m.id = l.match_id
     LEFT JOIN players p ON p.id = l.player_id
     ORDER BY m.date, l.match_id, l.seq`,
  ),
  "elo_history.csv": exportCsv(
    "elo_history.csv",
    `SELECT match_id, date, ROUND(elo_pre, 2) elo_pre, ROUND(elo_post, 2) elo_post,
            ROUND(opp_elo_pre, 2) opp_elo_pre, ROUND(expected, 4) expected
     FROM elo_history ORDER BY date, match_id`,
  ),
  "season_summaries.csv": exportCsv(
    "season_summaries.csv",
    `SELECT ss.season, ss.competition_id, c.name competition, c.type competition_type,
            ss.p, ss.w, ss.d, ss.l, ss.gf, ss.ga, ss.furthest_round, ss.position, ss.league_size
     FROM season_summaries ss JOIN competitions c ON c.id = ss.competition_id
     ORDER BY ss.season, ss.competition_id`,
  ),
  "players.csv": exportCsv(
    "players.csv",
    `SELECT pt.player_id, p.name, pt.apps, pt.starts, pt.goals, pt.assists, pt.first_date, pt.last_date
     FROM player_totals pt JOIN players p ON p.id = pt.player_id
     WHERE pt.scope = 'all' ORDER BY pt.goals DESC, pt.apps DESC`,
  ),
};

const meta = Object.fromEntries(
  (db.prepare("SELECT key, value FROM meta").all() as { key: string; value: string }[]).map((r) => [r.key, r.value]),
);

fs.writeFileSync(
  path.join(OUT_DIR, "manifest.json"),
  JSON.stringify(
    {
      name: "UnitedStats dataset",
      description:
        "Every Manchester United match since 1886 with goal events, lineups, Elo history, and season summaries. Coverage varies by facet; see the events_complete and has_lineup flags and the site's /data page.",
      built_at: meta.built_at,
      first_match: meta.first_match,
      last_match: meta.last_match,
      files: counts,
      attribution: "UnitedStats. Result data: engsoccerdata, openfootball, Wikipedia.",
      docs: "/data#downloads",
    },
    null,
    2,
  ) + "\n",
  "utf8",
);

console.log(`exported ${Object.entries(counts).map(([f, n]) => `${f} (${n})`).join(", ")} -> ${OUT_DIR}`);
