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
  "transfers.csv": exportCsv(
    "transfers.csv",
    `SELECT t.id, t.player_id, COALESCE(p.name, t.player_name) player, t.direction,
            t.date, t.date_precision, t.season, t.club, t.club_id,
            t.fee_gbp, t.fee_raw, t.fee_kind, t.market_value_eur, t.type
     FROM transfers t
     LEFT JOIN players p ON p.id = t.player_id
     ORDER BY t.date IS NULL, t.date, t.id`,
  ),
  "season_summaries.csv": exportCsv(
    "season_summaries.csv",
    `SELECT ss.season, ss.competition_id, c.name competition, c.type competition_type,
            ss.p, ss.w, ss.d, ss.l, ss.gf, ss.ga, ss.furthest_round, ss.position, ss.league_size
     FROM season_summaries ss JOIN competitions c ON c.id = ss.competition_id
     ORDER BY ss.season, ss.competition_id`,
  ),
  "league_standings.csv": exportCsv(
    "league_standings.csv",
    `SELECT ls.season, ls.competition_id, c.name competition, ls.position, ls.team,
            ls.p, ls.w, ls.d, ls.l, ls.gf, ls.ga, ls.pts, ls.is_united, ls.opponent_id
     FROM league_standings ls JOIN competitions c ON c.id = ls.competition_id
     ORDER BY ls.season, ls.position`,
  ),
  "players.csv": exportCsv(
    "players.csv",
    `WITH local_shirt_decade_counts AS (
       SELECT l.player_id, l.shirt, substr(m.date,1,3) || '0s' AS decade,
              COUNT(*) apps, SUM(l.started = 1) starts,
              MIN(m.date) first_date, MAX(m.date) last_date
       FROM match_lineups l
       JOIN matches m ON m.id = l.match_id
       WHERE l.player_side = 'united'
         AND l.bench = 0
         AND l.shirt IS NOT NULL
       GROUP BY l.player_id, l.shirt, decade
     ),
     shirt_decade_counts AS (
       SELECT player_id, shirt, decade, apps, 0 starts, first_date, last_date
       FROM player_shirts
       UNION ALL
       SELECT local.player_id, local.shirt, local.decade, local.apps, local.starts, local.first_date, local.last_date
       FROM local_shirt_decade_counts local
       WHERE NOT EXISTS (
         SELECT 1 FROM player_shirts ps WHERE ps.player_id = local.player_id
       )
     ),
     shirt_totals AS (
       SELECT player_id, shirt, SUM(apps) apps, MAX(last_date) last_date
       FROM shirt_decade_counts
       GROUP BY player_id, shirt
     ),
     shirt_decade_ranked AS (
       SELECT shirt_decade_counts.*,
              ROW_NUMBER() OVER (
                PARTITION BY player_id, shirt
                ORDER BY apps DESC, last_date DESC, decade DESC
              ) decade_rank
       FROM shirt_decade_counts
     ),
     primary_shirts AS (
       SELECT player_id, shirt, decade, apps
       FROM (
         SELECT sdr.player_id, sdr.shirt, sdr.decade, st.apps,
                ROW_NUMBER() OVER (
                  PARTITION BY sdr.player_id
                  ORDER BY st.apps DESC, st.last_date DESC, sdr.shirt
                ) rn
         FROM shirt_decade_ranked sdr
         JOIN shirt_totals st ON st.player_id = sdr.player_id AND st.shirt = sdr.shirt
         WHERE sdr.decade_rank = 1
       )
       WHERE rn = 1
     )
     SELECT p.id player_id, p.name,
            COALESCE(pr.apps, pt.apps, 0) apps,
            COALESCE(pr.starts, pt.starts, 0) starts,
            COALESCE(pr.subs, 0) subs,
            COALESCE(pr.goals, pt.goals, 0) goals,
            ps.shirt primary_shirt,
            ps.decade primary_shirt_decade,
            ps.apps primary_shirt_apps,
            COALESCE(pt.assists, 0) recorded_assists,
            COALESCE(pt.apps, 0) lineup_apps,
            COALESCE(pt.starts, 0) lineup_starts,
            COALESCE(pt.goals, 0) recorded_goals,
            pr.source_id record_source_id,
            pr.source_url record_source_url,
            pr.stats_as_of record_stats_as_of,
            pm.thumb_url player_thumb_url,
            pm.page_url player_image_page_url,
            pm.license player_image_license,
            pp.bucket position_bucket,
            pp.position_label position_label,
            COALESCE(pt.first_date, CASE WHEN pr.first_year IS NOT NULL THEN printf('%04d-01-01', pr.first_year) END) first_date,
            COALESCE(pt.last_date, CASE WHEN pr.last_year IS NOT NULL THEN printf('%04d-12-31', pr.last_year) END) last_date
     FROM players p
     LEFT JOIN player_totals pt ON pt.player_id = p.id AND pt.scope = 'all'
     LEFT JOIN player_records pr ON pr.player_id = p.id
     LEFT JOIN player_media pm ON pm.player_id = p.id
     LEFT JOIN player_positions pp ON pp.player_id = p.id
     LEFT JOIN primary_shirts ps ON ps.player_id = p.id
     WHERE pr.player_id IS NOT NULL
     ORDER BY goals DESC, apps DESC`,
  ),
  "player_media.csv": exportCsv(
    "player_media.csv",
    `SELECT pm.player_id, p.name, pm.wikidata_id, pm.commons_file, pm.image_url, pm.thumb_url,
            pm.page_url, pm.license, pm.artist, pm.credit, pm.source_id, pm.retrieved_at
     FROM player_media pm
     JOIN players p ON p.id = pm.player_id
     ORDER BY p.name`,
  ),
  "manager_media.csv": exportCsv(
    "manager_media.csv",
    `SELECT mm.manager_id, mg.name, mm.wikidata_id, mm.commons_file, mm.image_url, mm.thumb_url,
            mm.page_url, mm.license, mm.artist, mm.credit, mm.source_id, mm.retrieved_at
     FROM manager_media mm
     JOIN managers mg ON mg.id = mm.manager_id
     ORDER BY mg.name`,
  ),
  "og_scorer_media.csv": exportCsv(
    "og_scorer_media.csv",
    `SELECT name, wikidata_id, commons_file, image_url, thumb_url,
            page_url, license, artist, credit, source_id, retrieved_at
     FROM og_scorer_media
     ORDER BY name`,
  ),
  "player_positions.csv": exportCsv(
    "player_positions.csv",
    `SELECT pp.player_id, p.name, pp.bucket, pp.position_label, pp.position_qid,
            pp.wikidata_id, pp.source_id, pp.retrieved_at
     FROM player_positions pp
     JOIN players p ON p.id = pp.player_id
     ORDER BY p.name`,
  ),
};

const meta = Object.fromEntries(
  (db.prepare("SELECT key, value FROM meta").all() as { key: string; value: string }[]).map((r) => [r.key, r.value]),
);

fs.writeFileSync(
  path.join(OUT_DIR, "manifest.json"),
  JSON.stringify(
    {
      name: "Red Thread dataset",
      description:
        "Every Manchester United match since 1886 with goal events, lineups, Elo history, and season summaries. Coverage varies by facet; see the events_complete and has_lineup flags and the site's /data page.",
      built_at: meta.built_at,
      first_match: meta.first_match,
      last_match: meta.last_match,
      files: counts,
      attribution: "Red Thread. Result data: engsoccerdata, openfootball, Wikipedia. Player record totals: Wikipedia Manchester United player lists. Player images: Wikidata and Wikimedia Commons. Player positions: Wikidata P413 (with hand-checked corrections). Transfers: MUFCInfo transfer archive.",
      docs: "/data#downloads",
    },
    null,
    2,
  ) + "\n",
  "utf8",
);

console.log(`exported ${Object.entries(counts).map(([f, n]) => `${f} (${n})`).join(", ")} -> ${OUT_DIR}`);
