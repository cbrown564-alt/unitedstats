import { getDb } from "./db";

export interface MatchRow {
  id: string;
  season: string;
  date: string;
  competition_id: string;
  competition_name: string;
  competition_type: string;
  round: string | null;
  opponent_id: string;
  opponent_name: string;
  venue: "H" | "A" | "N";
  stadium_id: string | null;
  stadium_name: string | null;
  attendance: number | null;
  gf: number;
  ga: number;
  ht_gf: number | null;
  ht_ga: number | null;
  aet: number;
  pen_gf: number | null;
  pen_ga: number | null;
  result: "W" | "D" | "L";
  outcome: "W" | "D" | "L";
  manager_id: string | null;
  manager_name: string | null;
  events_complete: number;
  has_lineup: number;
  notes: string | null;
}

export const MATCH_SELECT = `
  SELECT m.*, c.name AS competition_name, c.type AS competition_type, s.name AS stadium_name, mg.name AS manager_name
  FROM matches m
  JOIN competitions c ON c.id = m.competition_id
  LEFT JOIN stadiums s ON s.id = m.stadium_id
  LEFT JOIN managers mg ON mg.id = m.manager_id
`;

export function getMeta(): Record<string, string> {
  const rows = getDb().prepare("SELECT key, value FROM meta").all() as { key: string; value: string }[];
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export interface Record_ { p: number; w: number; d: number; l: number; gf: number; ga: number }

/**
 * Coalesced played/W/D/L/goals columns matching the `Record_` shape. `result`,
 * `gf`, and `ga` live only on `matches`, so this stays unambiguous across joins.
 * COALESCE keeps empty groups returning 0 rather than NULL.
 */
const RECORD_COLS = `COUNT(*) p,
  COALESCE(SUM(result='W'),0) w, COALESCE(SUM(result='D'),0) d, COALESCE(SUM(result='L'),0) l,
  COALESCE(SUM(gf),0) gf, COALESCE(SUM(ga),0) ga`;

export function allTimeRecord(): Record_ {
  return getDb()
    .prepare(`SELECT ${RECORD_COLS} FROM matches`)
    .get() as Record_;
}

export function recordByCompetitionType(): (Record_ & { type: string })[] {
  return getDb()
    .prepare(
      `SELECT c.type, ${RECORD_COLS}
       FROM matches m JOIN competitions c ON c.id = m.competition_id
       GROUP BY c.type ORDER BY p DESC`,
    )
    .all() as (Record_ & { type: string })[];
}

export function recentMatches(limit = 10): MatchRow[] {
  return getDb()
    .prepare(`${MATCH_SELECT} ORDER BY m.date DESC LIMIT ?`)
    .all(limit) as MatchRow[];
}

export function matchById(id: string): MatchRow | undefined {
  return getDb().prepare(`${MATCH_SELECT} WHERE m.id = ?`).get(id) as MatchRow | undefined;
}

export interface EventRow {
  seq: number;
  type: string;
  player_id: string | null;
  player_name: string | null;
  player_display_name: string | null;
  player_side: "united" | "opponent";
  player_provider_id: string | null;
  minute: number | null;
  assist_player_id: string | null;
  assist_name: string | null;
  assist_display_name: string | null;
  assist_side: "united" | "opponent" | null;
  assist_provider_id: string | null;
  detail: string | null;
}

export function eventsForMatch(matchId: string): EventRow[] {
  return getDb()
    .prepare(
      `SELECT e.seq, e.type, e.player_id, p.name AS player_name,
              COALESCE(p.name, e.player_name, e.detail) AS player_display_name,
              e.player_side, e.player_provider_id, e.minute,
              e.assist_player_id, ap.name AS assist_name,
              COALESCE(ap.name, e.assist_name) AS assist_display_name,
              e.assist_side, e.assist_provider_id, e.detail
       FROM match_events e
       LEFT JOIN players p ON p.id = e.player_id
       LEFT JOIN players ap ON ap.id = e.assist_player_id
       WHERE e.match_id = ? ORDER BY COALESCE(e.minute, 999), e.seq`,
    )
    .all(matchId) as EventRow[];
}

export interface LineupRow {
  player_id: string | null;
  player_name: string | null;
  player_display_name: string;
  player_side: "united" | "opponent";
  provider_id: string | null;
  shirt: number | null;
  role: string | null;
  started: number;
  bench: number;
  sub_on: number | null;
  sub_off: number | null;
}

export function lineupForMatch(matchId: string): LineupRow[] {
  return getDb()
    .prepare(
      `SELECT l.player_id, p.name AS player_name, COALESCE(p.name, l.player_name, l.provider_id) AS player_display_name,
              l.player_side, l.provider_id, l.shirt, l.role, l.started, l.bench, l.sub_on, l.sub_off
       FROM match_lineups l LEFT JOIN players p ON p.id = l.player_id
       WHERE l.match_id = ? ORDER BY l.player_side DESC, l.bench, l.started DESC, l.shirt, l.seq`,
    )
    .all(matchId) as LineupRow[];
}

export function eloForMatch(matchId: string):
  | { elo_pre: number; elo_post: number; opp_elo_pre: number; expected: number }
  | undefined {
  return getDb()
    .prepare("SELECT elo_pre, elo_post, opp_elo_pre, expected FROM elo_history WHERE match_id = ?")
    .get(matchId) as { elo_pre: number; elo_post: number; opp_elo_pre: number; expected: number } | undefined;
}

/** Head-to-head vs an opponent strictly before a date (for match context). */
export function h2hBefore(opponentId: string, date: string): Record_ {
  return getDb()
    .prepare(
      `SELECT ${RECORD_COLS} FROM matches WHERE opponent_id = ? AND date < ?`,
    )
    .get(opponentId, date) as Record_;
}

export function formBefore(date: string, n = 6): MatchRow[] {
  return getDb()
    .prepare(`${MATCH_SELECT} WHERE m.date < ? ORDER BY m.date DESC LIMIT ?`)
    .all(date, n) as MatchRow[];
}

// ---------------------------------------------------------------- seasons

export interface SeasonSummary {
  season: string;
  competition_id: string;
  competition_name: string;
  type: string;
  p: number; w: number; d: number; l: number; gf: number; ga: number;
  furthest_round: string | null;
  position: number | null;
  league_size: number | null;
}

export function seasonsIndex(): SeasonSummary[] {
  return getDb()
    .prepare(
      `SELECT ss.*, c.name AS competition_name, c.type
       FROM season_summaries ss JOIN competitions c ON c.id = ss.competition_id
       ORDER BY ss.season DESC, ss.p DESC`,
    )
    .all() as SeasonSummary[];
}

export function seasonMatches(season: string): MatchRow[] {
  return getDb()
    .prepare(`${MATCH_SELECT} WHERE m.season = ? ORDER BY m.date`)
    .all(season) as MatchRow[];
}

export function allSeasons(): string[] {
  return (
    getDb().prepare("SELECT DISTINCT season FROM matches ORDER BY season DESC").all() as {
      season: string;
    }[]
  ).map((r) => r.season);
}

// ---------------------------------------------------------------- matches browser

export interface MatchFilter {
  competition?: string;
  opponent?: string;
  season?: string;
  venue?: string;
  result?: string;
  /** Competition type; "cup" matches every official cup competition. */
  type?: string;
  /** Inclusive ISO date bounds, so era/decade aggregates can link to their matches. */
  from?: string;
  to?: string;
  q?: string;
  /** Result ordering. Defaults to most-recent-first. */
  sort?: "recent" | "oldest" | "margin" | "attendance";
  limit?: number;
  offset?: number;
}

const MATCH_ORDER: Record<NonNullable<MatchFilter["sort"]>, string> = {
  recent: "m.date DESC",
  oldest: "m.date ASC",
  margin: "(m.gf - m.ga) DESC, m.gf DESC, m.date DESC",
  // nulls last, then largest crowd first
  attendance: "(m.attendance IS NULL), m.attendance DESC, m.date DESC",
};

/** Shared filter compilation so the list and its summary read the same slice. */
function matchWhere(f: MatchFilter): { cond: string; params: Record<string, string | number> } {
  const where: string[] = [];
  const params: Record<string, string | number> = {};
  if (f.competition) { where.push("m.competition_id = @competition"); params.competition = f.competition; }
  if (f.opponent) { where.push("m.opponent_id = @opponent"); params.opponent = f.opponent; }
  if (f.season) { where.push("m.season = @season"); params.season = f.season; }
  if (f.venue) { where.push("m.venue = @venue"); params.venue = f.venue; }
  if (f.result) { where.push("m.result = @result"); params.result = f.result; }
  if (f.type === "cup") {
    where.push("c.type NOT IN ('league','unofficial')");
  } else if (f.type) {
    where.push("c.type = @type");
    params.type = f.type;
  }
  if (f.from) { where.push("m.date >= @from"); params.from = f.from; }
  if (f.to) { where.push("m.date <= @to"); params.to = f.to; }
  if (f.q) { where.push("m.opponent_name LIKE @q"); params.q = `%${f.q}%`; }
  return { cond: where.length ? `WHERE ${where.join(" AND ")}` : "", params };
}

export function findMatches(f: MatchFilter): { rows: MatchRow[]; total: number } {
  const { cond, params } = matchWhere(f);
  const total = (
    getDb()
      .prepare(`SELECT COUNT(*) n FROM matches m JOIN competitions c ON c.id = m.competition_id ${cond}`)
      .get(params) as { n: number }
  ).n;
  const orderBy = MATCH_ORDER[f.sort ?? "recent"] ?? MATCH_ORDER.recent;
  const rows = getDb()
    .prepare(`${MATCH_SELECT} ${cond} ORDER BY ${orderBy} LIMIT @limit OFFSET @offset`)
    .all({ ...params, limit: f.limit ?? 50, offset: f.offset ?? 0 }) as MatchRow[];
  return { rows, total };
}

/** Decade buckets with fixture counts, for the chronological jump rail. */
export function matchDecades(): { decade: string; from: number; to: number; n: number }[] {
  const rows = getDb()
    .prepare(`SELECT substr(date,1,3) || '0' AS start, COUNT(*) n FROM matches GROUP BY 1 ORDER BY 1`)
    .all() as { start: string; n: number }[];
  return rows.map((r) => {
    const from = parseInt(r.start, 10);
    return { decade: `${from}s`, from, to: from + 9, n: r.n };
  });
}

export interface MatchesSummary extends Record_ {
  first: string | null;
  last: string | null;
  avg_home_att: number | null;
}

/** Aggregate record for the whole filtered set, independent of pagination. */
export function matchesSummary(f: MatchFilter): MatchesSummary {
  const { cond, params } = matchWhere(f);
  return getDb()
    .prepare(
      `SELECT ${RECORD_COLS},
              MIN(date) first, MAX(date) last,
              ROUND(AVG(CASE WHEN venue='H' THEN attendance END)) avg_home_att
       FROM matches m JOIN competitions c ON c.id = m.competition_id ${cond}`,
    )
    .get(params) as MatchesSummary;
}

export function competitionsList(): { id: string; name: string; type: string; n: number }[] {
  return getDb()
    .prepare(
      `SELECT c.id, c.name, c.type, COUNT(m.id) n
       FROM competitions c JOIN matches m ON m.competition_id = c.id
       GROUP BY c.id ORDER BY n DESC`,
    )
    .all() as { id: string; name: string; type: string; n: number }[];
}

// ---------------------------------------------------------------- opponents

export interface OpponentRecord extends Record_ {
  id: string;
  name: string;
  country: string | null;
  first: string;
  last: string;
}

export function opponentsIndex(): OpponentRecord[] {
  return getDb()
    .prepare(
      `SELECT o.id, o.name, o.country, COUNT(*) p,
              SUM(result='W') w, SUM(result='D') d, SUM(result='L') l,
              SUM(gf) gf, SUM(ga) ga, MIN(date) first, MAX(date) last
       FROM matches m JOIN opponents o ON o.id = m.opponent_id
       GROUP BY o.id ORDER BY p DESC`,
    )
    .all() as OpponentRecord[];
}

export function opponentById(id: string): OpponentRecord | undefined {
  return getDb()
    .prepare(
      `SELECT o.id, o.name, o.country, COUNT(*) p,
              SUM(result='W') w, SUM(result='D') d, SUM(result='L') l,
              SUM(gf) gf, SUM(ga) ga, MIN(date) first, MAX(date) last
       FROM matches m JOIN opponents o ON o.id = m.opponent_id
       WHERE o.id = ? GROUP BY o.id`,
    )
    .get(id) as OpponentRecord | undefined;
}

// ---------------------------------------------------------------- managers

export interface ManagerRecord extends Record_ {
  id: string;
  name: string;
  nationality: string | null;
  role: string | null;
  first: string | null;
  last: string | null;
}

export function managersIndex(): ManagerRecord[] {
  return getDb()
    .prepare(
      `SELECT mg.id, mg.name, mg.nationality, mg.role,
              COUNT(m.id) p, COALESCE(SUM(m.result='W'),0) w, COALESCE(SUM(m.result='D'),0) d,
              COALESCE(SUM(m.result='L'),0) l, COALESCE(SUM(m.gf),0) gf, COALESCE(SUM(m.ga),0) ga,
              MIN(m.date) first, MAX(m.date) last
       FROM managers mg LEFT JOIN matches m ON m.manager_id = mg.id
       GROUP BY mg.id ORDER BY first`,
    )
    .all() as ManagerRecord[];
}

export function managerById(id: string): ManagerRecord | undefined {
  return managersIndex().find((m) => m.id === id);
}

export function managerTenures(id: string): { date_from: string; date_to: string | null; note: string | null }[] {
  return getDb()
    .prepare("SELECT date_from, date_to, note FROM manager_tenures WHERE manager_id = ? ORDER BY date_from")
    .all(id) as { date_from: string; date_to: string | null; note: string | null }[];
}

// ---------------------------------------------------------------- players

export interface PlayerTotals {
  player_id: string;
  name: string;
  apps: number;
  starts: number;
  subs: number;
  goals: number;
  assists: number;
  recorded_assists: number;
  curated_assists: number;
  lineup_apps: number;
  lineup_starts: number;
  recorded_goals: number;
  record_apps: number | null;
  record_starts: number | null;
  record_subs: number | null;
  record_goals: number | null;
  record_source_id: string | null;
  record_source_url: string | null;
  record_stats_as_of: string | null;
  career: string | null;
  first_year: number | null;
  last_year: number | null;
  primary_shirt: number | null;
  primary_shirt_decade: string | null;
  primary_shirt_apps: number | null;
  player_image_url: string | null;
  player_thumb_url: string | null;
  player_image_page_url: string | null;
  player_image_license: string | null;
  first_date: string | null;
  last_date: string | null;
}

// ---- canonical "assists" definition -------------------------------------
// Assists come from two non-overlapping lanes: the curated Tableau lane covers
// 1987-88 through CURATED_ASSISTS_LAST_SEASON, and match-event assists take over
// after it. Every assist *total* in the app must combine them through these
// builders so the figure is identical on the players index, the player header,
// the season table, and the API. (Match-coverage stats and scorer↔assister
// partnerships are deliberately match-event only — curated rows are not
// match-attributed and cannot be linked to a specific goal.)
export const CURATED_ASSISTS_LAST_SEASON = "2014-15";

/** Curated assist count for the player named by `ref` (e.g. "p.id" or "?"), optionally one season. */
function curatedAssistsExpr(ref: string, seasonExpr?: string): string {
  return `COALESCE((SELECT SUM(tga.count) FROM tableau_goals_assists tga
            WHERE tga.player_id = ${ref} AND tga.kind = 'assist'${seasonExpr ? ` AND tga.season = ${seasonExpr}` : ""}), 0)`;
}

/** Match-event assist count for the player named by `ref`, restricted by `seasonPred`. */
function matchAssistsExpr(ref: string, seasonPred: string): string {
  return `COALESCE((SELECT COUNT(*) FROM match_events e JOIN matches m ON m.id = e.match_id
            WHERE e.assist_player_id = ${ref} AND e.assist_side = 'united'
              AND e.type IN ('goal','pen-goal') AND ${seasonPred}), 0)`;
}

/** Combined career assists (curated through the boundary + match events after it). */
function combinedAssistsExpr(ref: string): string {
  return `(${curatedAssistsExpr(ref)} + ${matchAssistsExpr(ref, `m.season > '${CURATED_ASSISTS_LAST_SEASON}'`)})`;
}

const PLAYER_TOTALS_WITH = `
  WITH local_shirt_decade_counts AS (
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
`;

const PLAYER_TOTALS_SELECT = `
  SELECT p.id AS player_id, p.name,
         COALESCE(pr.apps, pt.apps, 0) apps,
         COALESCE(pr.starts, pt.starts, 0) starts,
         COALESCE(pr.subs, 0) subs,
         COALESCE(pr.goals, pt.goals, 0) goals,
         ${combinedAssistsExpr("p.id")} assists,
         COALESCE(pt.assists, 0) recorded_assists,
         ${curatedAssistsExpr("p.id")} curated_assists,
         COALESCE(pt.apps, 0) lineup_apps,
         COALESCE(pt.starts, 0) lineup_starts,
         COALESCE(pt.goals, 0) recorded_goals,
         pr.apps record_apps,
         pr.starts record_starts,
         pr.subs record_subs,
         pr.goals record_goals,
         pr.source_id record_source_id,
         pr.source_url record_source_url,
         pr.stats_as_of record_stats_as_of,
         pr.career,
         pr.first_year,
         pr.last_year,
         ps.shirt primary_shirt,
         ps.decade primary_shirt_decade,
         ps.apps primary_shirt_apps,
         pm.image_url player_image_url,
         pm.thumb_url player_thumb_url,
         pm.page_url player_image_page_url,
         pm.license player_image_license,
         COALESCE(
           pt.first_date,
           (SELECT MIN(m.date) FROM match_events e JOIN matches m ON m.id=e.match_id WHERE e.player_id = p.id AND e.player_side = 'united'),
           CASE WHEN pr.first_year IS NOT NULL THEN printf('%04d-01-01', pr.first_year) END
         ) first_date,
         COALESCE(
           pt.last_date,
           (SELECT MAX(m.date) FROM match_events e JOIN matches m ON m.id=e.match_id WHERE e.player_id = p.id AND e.player_side = 'united'),
           CASE WHEN pr.last_year IS NOT NULL THEN printf('%04d-12-31', pr.last_year) END
         ) last_date
  FROM players p
  LEFT JOIN player_totals pt ON pt.player_id = p.id AND pt.scope = 'all'
  LEFT JOIN player_records pr ON pr.player_id = p.id
  LEFT JOIN primary_shirts ps ON ps.player_id = p.id
  LEFT JOIN player_media pm ON pm.player_id = p.id
`;

export function playersIndex(): PlayerTotals[] {
  return getDb()
    .prepare(
      `${PLAYER_TOTALS_WITH}
       ${PLAYER_TOTALS_SELECT}
       WHERE pr.player_id IS NOT NULL
       ORDER BY goals DESC, apps DESC, starts DESC`,
    )
    .all() as PlayerTotals[];
}

export function playerById(id: string): PlayerTotals | undefined {
  return getDb()
    .prepare(
      `${PLAYER_TOTALS_WITH}
       ${PLAYER_TOTALS_SELECT}
       WHERE p.id = ?`,
    )
    .get(id) as PlayerTotals | undefined;
}

export interface PlayerShirtNumber {
  decade: string;
  shirt: number;
  apps: number;
  starts: number;
  first_date: string;
  last_date: string;
}

export function playerShirtNumbersByDecade(id: string): PlayerShirtNumber[] {
  return getDb()
    .prepare(
      `WITH source_rows AS (
         SELECT decade, shirt, apps, 0 starts, first_date, last_date
         FROM player_shirts
         WHERE player_id = ?
       ),
       local_rows AS (
         SELECT substr(m.date,1,3) || '0s' decade, l.shirt,
                COUNT(*) apps, SUM(l.started = 1) starts,
                MIN(m.date) first_date, MAX(m.date) last_date
         FROM match_lineups l
         JOIN matches m ON m.id = l.match_id
         WHERE l.player_id = ?
           AND l.player_side = 'united'
           AND l.bench = 0
           AND l.shirt IS NOT NULL
         GROUP BY decade, l.shirt
       )
       SELECT * FROM source_rows
       UNION ALL
       SELECT * FROM local_rows
       WHERE NOT EXISTS (SELECT 1 FROM source_rows)
       ORDER BY decade, apps DESC, shirt`,
    )
    .all(id, id) as PlayerShirtNumber[];
}

export function playerSplitsBySeason(id: string): {
  season: string;
  apps: number;
  starts: number;
  goals: number;
  assists: number;
}[] {
  return getDb()
    .prepare(
      `WITH seasons AS (
         SELECT season FROM matches m JOIN match_lineups l ON l.match_id = m.id WHERE l.player_id = ? AND l.player_side = 'united' AND l.bench = 0
         UNION
         SELECT season FROM matches m JOIN match_events e ON e.match_id = m.id
         WHERE (e.player_id = ? AND e.player_side = 'united')
            OR (e.assist_player_id = ? AND e.assist_side = 'united')
         UNION
         SELECT season FROM tableau_goals_assists WHERE player_id = ?
       )
       SELECT s.season,
              COALESCE((SELECT COUNT(*) FROM match_lineups l JOIN matches m ON m.id=l.match_id
                        WHERE l.player_id = ? AND l.player_side = 'united' AND l.bench = 0 AND m.season = s.season), 0) apps,
              COALESCE((SELECT COUNT(*) FROM match_lineups l JOIN matches m ON m.id=l.match_id
                        WHERE l.player_id = ? AND l.player_side = 'united' AND l.started = 1 AND l.bench = 0 AND m.season = s.season), 0) starts,
              COALESCE((SELECT COUNT(*) FROM match_events e JOIN matches m ON m.id=e.match_id
                        WHERE e.player_id = ? AND e.player_side = 'united' AND e.type IN ('goal','pen-goal') AND m.season = s.season), 0) goals,
              -- assists: same combined definition as the headline figure
              CASE WHEN s.season <= '${CURATED_ASSISTS_LAST_SEASON}'
                THEN ${curatedAssistsExpr("?", "s.season")}
                ELSE ${matchAssistsExpr("?", "m.season = s.season")}
              END assists
       FROM seasons s ORDER BY s.season`,
    )
    .all(id, id, id, id, id, id, id, id, id) as {
      season: string;
      apps: number;
      starts: number;
      goals: number;
      assists: number;
    }[];
}

export function playerLineupMatches(id: string): (MatchRow & {
  started: number;
  sub_on: number | null;
  sub_off: number | null;
  role: string | null;
})[] {
  return getDb()
    .prepare(
      `SELECT m.*, c.name AS competition_name, c.type AS competition_type, s.name AS stadium_name, mg.name AS manager_name,
              l.started, l.sub_on, l.sub_off, l.role
       FROM match_lineups l
       JOIN matches m ON m.id = l.match_id
       JOIN competitions c ON c.id = m.competition_id
       LEFT JOIN stadiums s ON s.id = m.stadium_id
       LEFT JOIN managers mg ON mg.id = m.manager_id
       WHERE l.player_id = ? AND l.player_side = 'united' AND l.bench = 0 ORDER BY m.date DESC`,
    )
    .all(id) as (MatchRow & {
      started: number;
      sub_on: number | null;
      sub_off: number | null;
      role: string | null;
    })[];
}

export function playerGoalsBySeason(id: string): { season: string; goals: number }[] {
  return getDb()
    .prepare(
      `SELECT m.season, COUNT(*) goals
       FROM match_events e JOIN matches m ON m.id = e.match_id
       WHERE e.player_id = ? AND e.player_side = 'united' AND e.type IN ('goal','pen-goal')
       GROUP BY m.season ORDER BY m.season`,
    )
    .all(id) as { season: string; goals: number }[];
}

export function playerGoalMatches(id: string): (MatchRow & { goals: number; minutes: string | null })[] {
  return getDb()
    .prepare(
      `SELECT m.*, c.name AS competition_name, c.type AS competition_type, NULL AS stadium_name, NULL AS manager_name,
              COUNT(*) goals,
              GROUP_CONCAT(COALESCE(e.minute, ''), ',') minutes
       FROM match_events e
       JOIN matches m ON m.id = e.match_id
       JOIN competitions c ON c.id = m.competition_id
       WHERE e.player_id = ? AND e.player_side = 'united' AND e.type IN ('goal','pen-goal')
       GROUP BY m.id ORDER BY m.date DESC`,
    )
    .all(id) as (MatchRow & { goals: number; minutes: string | null })[];
}

export function playerGoalMinutes(id: string): number[] {
  return (
    getDb()
      .prepare(
        `SELECT e.minute FROM match_events e
         WHERE e.player_id = ? AND e.player_side = 'united' AND e.type IN ('goal','pen-goal') AND e.minute IS NOT NULL`,
      )
      .all(id) as { minute: number }[]
  ).map((r) => r.minute);
}

export interface PlayerOpponentGoals {
  opponent_id: string;
  opponent_name: string;
  goals: number;
  matches: number;
  last_date: string;
}

/** Opponents this player scored most recorded goals against. */
export function playerGoalsByOpponent(id: string, limit = 8): PlayerOpponentGoals[] {
  return getDb()
    .prepare(
      `SELECT m.opponent_id, m.opponent_name, COUNT(*) goals,
              COUNT(DISTINCT m.id) matches, MAX(m.date) last_date
       FROM match_events e JOIN matches m ON m.id = e.match_id
       WHERE e.player_id = ? AND e.player_side = 'united' AND e.type IN ('goal','pen-goal')
       GROUP BY m.opponent_id
       ORDER BY goals DESC, matches ASC, last_date DESC LIMIT ?`,
    )
    .all(id, limit) as PlayerOpponentGoals[];
}

/**
 * Where this player sits among players with a verified record, by headline
 * goals and apps. Null when the player has no verified record to rank.
 */
export function playerClubRanks(id: string): { goalRank: number; appRank: number; total: number } | null {
  const index = playersIndex();
  const goalRank = index.findIndex((p) => p.player_id === id) + 1; // index is goals-sorted
  if (goalRank === 0) return null;
  const appRank =
    [...index].sort((a, b) => b.apps - a.apps).findIndex((p) => p.player_id === id) + 1;
  return { goalRank, appRank, total: index.length };
}

export interface AssistPartnership {
  scorer_id: string;
  scorer_name: string;
  assister_id: string;
  assister_name: string;
  goals: number;
  first_date: string;
  last_date: string;
}

export function topAssistPartnerships(limit = 20): AssistPartnership[] {
  return getDb()
    .prepare(
      `SELECT e.player_id scorer_id, sp.name scorer_name,
              e.assist_player_id assister_id, ap.name assister_name,
              COUNT(*) goals, MIN(m.date) first_date, MAX(m.date) last_date
       FROM match_events e
       JOIN matches m ON m.id = e.match_id
       JOIN players sp ON sp.id = e.player_id
       JOIN players ap ON ap.id = e.assist_player_id
       WHERE e.type IN ('goal','pen-goal')
         AND e.player_side = 'united'
         AND e.assist_side = 'united'
         AND e.player_id IS NOT NULL
         AND e.assist_player_id IS NOT NULL
       GROUP BY e.player_id, e.assist_player_id
       ORDER BY goals DESC, last_date DESC LIMIT ?`,
    )
    .all(limit) as AssistPartnership[];
}

export function playerAssistPartnerships(id: string, limit = 12): AssistPartnership[] {
  return getDb()
    .prepare(
      `SELECT e.player_id scorer_id, sp.name scorer_name,
              e.assist_player_id assister_id, ap.name assister_name,
              COUNT(*) goals, MIN(m.date) first_date, MAX(m.date) last_date
       FROM match_events e
       JOIN matches m ON m.id = e.match_id
       JOIN players sp ON sp.id = e.player_id
       JOIN players ap ON ap.id = e.assist_player_id
       WHERE e.type IN ('goal','pen-goal')
         AND e.player_side = 'united'
         AND e.assist_side = 'united'
         AND e.player_id IS NOT NULL
         AND e.assist_player_id IS NOT NULL
         AND (e.player_id = ? OR e.assist_player_id = ?)
       GROUP BY e.player_id, e.assist_player_id
       ORDER BY goals DESC, last_date DESC LIMIT ?`,
    )
    .all(id, id, limit) as AssistPartnership[];
}

// --------------------------------------------- curated Tableau season lane
// Hand-curated goals/assists/goal-types by season for 1987-88..2014-15. Not
// match-attributed; surfaced as its own labelled lane (docs/TABLEAU-GOALS-ASSISTS.md).

export interface CuratedTotals {
  goals: number;
  assists: number;
  seasons: number;
  from_season: string | null;
  to_season: string | null;
  source_id: string | null;
  source_url: string | null;
}

/** Curated goal/assist totals for a player, or null when the source has nothing. */
export function playerCuratedTotals(id: string): CuratedTotals | null {
  const row = getDb()
    .prepare(
      `SELECT
         COALESCE(SUM(CASE WHEN kind='goal' THEN count END), 0) goals,
         COALESCE(SUM(CASE WHEN kind='assist' THEN count END), 0) assists,
         COUNT(DISTINCT season) seasons,
         MIN(season) from_season, MAX(season) to_season,
         MIN(source_id) source_id
       FROM tableau_goals_assists WHERE player_id = ?`,
    )
    .get(id) as Omit<CuratedTotals, "source_url"> & { source_id: string | null };
  if (!row || (row.goals === 0 && row.assists === 0)) return null;
  const src = row.source_id
    ? (getDb().prepare("SELECT url FROM sources WHERE id = ?").get(row.source_id) as { url: string | null } | undefined)
    : undefined;
  return { ...row, source_url: src?.url ?? null };
}

export interface CuratedGoalType {
  goal_type: string;
  goals: number;
}

/** Goals broken down by body part / technique, most common first. */
export function playerCuratedGoalTypes(id: string): CuratedGoalType[] {
  return getDb()
    .prepare(
      `SELECT goal_type, SUM(count) goals
       FROM tableau_goal_types WHERE player_id = ?
       GROUP BY goal_type ORDER BY goals DESC, goal_type`,
    )
    .all(id) as CuratedGoalType[];
}

export interface CuratedSeasonSplit {
  season: string;
  goals: number;
  assists: number;
}

/** Curated goals and assists per season for the player. */
export function playerCuratedBySeason(id: string): CuratedSeasonSplit[] {
  return getDb()
    .prepare(
      `SELECT season,
              COALESCE(SUM(CASE WHEN kind='goal' THEN count END), 0) goals,
              COALESCE(SUM(CASE WHEN kind='assist' THEN count END), 0) assists
       FROM tableau_goals_assists WHERE player_id = ?
       GROUP BY season ORDER BY season`,
    )
    .all(id) as CuratedSeasonSplit[];
}

// ---------------------------------------------------------------- analytics

export function eloSeries(): { date: string; elo: number }[] {
  // one point per month keeps the payload small over 130+ years
  return getDb()
    .prepare(
      `SELECT substr(date,1,7) ym, date, elo_post elo FROM elo_history
       GROUP BY ym HAVING date = MAX(date) ORDER BY date`,
    )
    .all() as { date: string; elo: number }[];
}

export function seasonAggregates(): {
  season: string; p: number; w: number; d: number; l: number;
  gf: number; ga: number; win_pct: number; avg_att: number | null;
}[] {
  return getDb()
    .prepare(
      `SELECT season, ${RECORD_COLS},
              ROUND(100.0*SUM(result='W')/COUNT(*),1) win_pct,
              ROUND(AVG(CASE WHEN venue='H' THEN attendance END)) avg_att
       FROM matches GROUP BY season ORDER BY season`,
    )
    .all() as ReturnType<typeof seasonAggregates>;
}

export function biggestWins(limit = 12): MatchRow[] {
  return getDb()
    .prepare(`${MATCH_SELECT} ORDER BY (m.gf - m.ga) DESC, m.gf DESC LIMIT ?`)
    .all(limit) as MatchRow[];
}

export function heaviestDefeats(limit = 12): MatchRow[] {
  return getDb()
    .prepare(`${MATCH_SELECT} ORDER BY (m.ga - m.gf) DESC, m.ga DESC LIMIT ?`)
    .all(limit) as MatchRow[];
}

export function highestAttendances(limit = 12): MatchRow[] {
  return getDb()
    .prepare(`${MATCH_SELECT} WHERE m.attendance IS NOT NULL ORDER BY m.attendance DESC LIMIT ?`)
    .all(limit) as MatchRow[];
}

export function topScorers(limit = 25): PlayerTotals[] {
  return playersIndex().slice(0, limit);
}

export function goalMinuteHistogram(): { bucket: string; n: number }[] {
  return getDb()
    .prepare(
      `SELECT CAST(MIN((minute-1)/15, 5) AS TEXT) bucket, COUNT(*) n
       FROM match_events
       WHERE type IN ('goal','pen-goal') AND minute IS NOT NULL AND minute <= 90
       GROUP BY 1 ORDER BY 1`,
    )
    .all() as { bucket: string; n: number }[];
}

export function venueRecord(): (Record_ & { venue: string })[] {
  return getDb()
    .prepare(
      `SELECT venue, ${RECORD_COLS} FROM matches GROUP BY venue ORDER BY p DESC`,
    )
    .all() as (Record_ & { venue: string })[];
}

export function stadiumsWithRecords(): {
  id: string; name: string; city: string | null; lat: number | null; lng: number | null;
  p: number; w: number; first: string; last: string;
}[] {
  return getDb()
    .prepare(
      `SELECT s.id, s.name, s.city, s.lat, s.lng, COUNT(*) p, SUM(m.result='W') w,
              MIN(m.date) first, MAX(m.date) last
       FROM matches m JOIN stadiums s ON s.id = m.stadium_id
       GROUP BY s.id ORDER BY p DESC`,
    )
    .all() as ReturnType<typeof stadiumsWithRecords>;
}

export function eventCoverage(): { decade: string; matches: number; withEvents: number }[] {
  return getDb()
    .prepare(
      `SELECT substr(date,1,3) || '0s' decade, COUNT(*) matches,
              SUM(CASE WHEN EXISTS (SELECT 1 FROM match_events e WHERE e.match_id = m.id) THEN 1 ELSE 0 END) withEvents
       FROM matches m GROUP BY 1 ORDER BY 1`,
    )
    .all() as { decade: string; matches: number; withEvents: number }[];
}

export function lineupCoverage(): { decade: string; matches: number; withLineups: number }[] {
  return getDb()
    .prepare(
      `SELECT substr(date,1,3) || '0s' decade, COUNT(*) matches,
              SUM(CASE WHEN has_lineup = 1 THEN 1 ELSE 0 END) withLineups
       FROM matches m GROUP BY 1 ORDER BY 1`,
    )
    .all() as { decade: string; matches: number; withLineups: number }[];
}

// ---------------------------------------------------------------- data/provenance

export interface SourceRecord {
  id: string;
  label: string;
  kind: string;
  url: string | null;
  coverage: string | null;
  notes: string | null;
}

export interface MatchSourceRecord extends SourceRecord {
  facet:
    | "result"
    | "united-scorers"
    | "opposition-goals"
    | "assists"
    | "starting-lineup"
    | "used-substitutes"
    | "bench"
    | "cards"
    | "attendance"
    | "notes";
  confidence: "complete" | "partial" | "supporting";
  source_note: string | null;
}

export function sourceCatalog(): SourceRecord[] {
  return getDb()
    .prepare("SELECT id, label, kind, url, coverage, notes FROM sources ORDER BY kind, label")
    .all() as SourceRecord[];
}

export function sourcesForMatch(matchId: string): MatchSourceRecord[] {
  return getDb()
    .prepare(
      `SELECT s.id, s.label, s.kind, s.url, s.coverage, s.notes,
              ms.facet, ms.confidence, ms.note AS source_note
       FROM match_sources ms
       JOIN sources s ON s.id = ms.source_id
       WHERE ms.match_id = ?
       ORDER BY ms.facet, s.label`,
    )
    .all(matchId) as MatchSourceRecord[];
}

/** EXISTS predicate: match `m` has at least one opposition goal recorded as an event. */
const OPP_GOALS_EXISTS = `EXISTS (
  SELECT 1 FROM match_events e WHERE e.match_id = m.id AND e.type IN ('opp-goal','own-goal-against')
)`;

/**
 * Per-match coverage facets — one boolean SUM per data facet — shared by the
 * overall and per-competition-type coverage queries so the two cannot drift.
 * The surrounding query must expose `m` (matches); callers add their own
 * leading columns (and GROUP BY for the per-type variant).
 */
const COVERAGE_FACETS = `
  SUM(CASE WHEN EXISTS (
    SELECT 1 FROM match_events e
    WHERE e.match_id = m.id AND e.type IN ('goal','pen-goal','own-goal-for')
  ) THEN 1 ELSE 0 END) withScorers,
  SUM(m.events_complete = 1) completeScorers,
  SUM(CASE WHEN ${OPP_GOALS_EXISTS} THEN 1 ELSE 0 END) withOppositionGoals,
  SUM(CASE WHEN EXISTS (
    SELECT 1 FROM match_events e
    WHERE e.match_id = m.id AND (e.assist_player_id IS NOT NULL OR e.assist_name IS NOT NULL)
  ) THEN 1 ELSE 0 END) withAssists,
  SUM(CASE WHEN EXISTS (
    SELECT 1 FROM match_lineups l
    WHERE l.match_id = m.id AND l.player_side = 'united' AND l.started = 1
  ) THEN 1 ELSE 0 END) withStartingLineups,
  SUM(CASE WHEN EXISTS (
    SELECT 1 FROM match_lineups l
    WHERE l.match_id = m.id AND l.player_side = 'united' AND l.started = 0 AND l.bench = 0
  ) THEN 1 ELSE 0 END) withUsedSubstitutes,
  SUM(CASE WHEN EXISTS (
    SELECT 1 FROM match_lineups l
    WHERE l.match_id = m.id AND l.bench = 1
  ) THEN 1 ELSE 0 END) withBenches,
  SUM(CASE WHEN EXISTS (
    SELECT 1 FROM match_events e
    WHERE e.match_id = m.id AND e.type IN ('card-yellow','card-red')
  ) THEN 1 ELSE 0 END) withCards,
  SUM(m.attendance IS NOT NULL) withAttendance`;

export function coverageOverview(): {
  matches: number;
  officialMatches: number;
  unofficialMatches: number;
  withScorers: number;
  completeScorers: number;
  withOppositionGoals: number;
  withAssists: number;
  withStartingLineups: number;
  withUsedSubstitutes: number;
  withBenches: number;
  withCards: number;
  withAttendance: number;
} {
  return getDb()
    .prepare(
      `SELECT
         COUNT(*) matches,
         SUM(CASE WHEN c.type != 'unofficial' THEN 1 ELSE 0 END) officialMatches,
         SUM(CASE WHEN c.type = 'unofficial' THEN 1 ELSE 0 END) unofficialMatches,
         ${COVERAGE_FACETS}
       FROM matches m
       JOIN competitions c ON c.id = m.competition_id`,
    )
    .get() as ReturnType<typeof coverageOverview>;
}

export function coverageByCompetitionType(): {
  type: string;
  matches: number;
  withScorers: number;
  completeScorers: number;
  withOppositionGoals: number;
  withAssists: number;
  withStartingLineups: number;
  withUsedSubstitutes: number;
  withBenches: number;
  withCards: number;
  withAttendance: number;
}[] {
  return getDb()
    .prepare(
      `SELECT c.type,
              COUNT(*) matches,
              ${COVERAGE_FACETS}
       FROM matches m
       JOIN competitions c ON c.id = m.competition_id
       GROUP BY c.type
       ORDER BY matches DESC`,
    )
    .all() as ReturnType<typeof coverageByCompetitionType>;
}

export function sourceUsage(): (SourceRecord & { matches: number; facets: string })[] {
  return getDb()
    .prepare(
      `SELECT s.id, s.label, s.kind, s.url, s.coverage, s.notes,
              COUNT(DISTINCT ms.match_id) matches,
              GROUP_CONCAT(DISTINCT ms.facet) facets
       FROM sources s
       LEFT JOIN match_sources ms ON ms.source_id = s.id
       GROUP BY s.id
       ORDER BY matches DESC, s.label`,
    )
    .all() as (SourceRecord & { matches: number; facets: string })[];
}

export function dataGaps(limit = 12): {
  id: string;
  date: string;
  season: string;
  opponent_name: string;
  competition_name: string;
  gf: number;
  ga: number;
  gap: string;
}[] {
  return getDb()
    .prepare(
      `SELECT m.id, m.date, m.season, m.opponent_name, c.name AS competition_name, m.gf, m.ga,
              CASE
                WHEN m.gf > 0 AND m.events_complete = 0 THEN 'United scorers'
                WHEN m.ga > 0 AND NOT ${OPP_GOALS_EXISTS} THEN 'opposition goals'
                WHEN m.has_lineup = 0 THEN 'lineup'
                WHEN m.attendance IS NULL THEN 'attendance'
                ELSE 'source note'
              END gap
       FROM matches m
       JOIN competitions c ON c.id = m.competition_id
       WHERE c.type != 'unofficial'
         AND (
           (m.gf > 0 AND m.events_complete = 0)
           OR (m.ga > 0 AND NOT ${OPP_GOALS_EXISTS})
           OR m.has_lineup = 0
           OR m.attendance IS NULL
         )
       ORDER BY
         CASE
           WHEN m.date >= '1946-01-01' AND m.gf > 0 AND m.events_complete = 0 THEN 0
           WHEN m.date >= '1946-01-01' AND m.ga > 0 AND NOT ${OPP_GOALS_EXISTS} THEN 1
           ELSE 2
         END,
         m.date DESC
       LIMIT ?`,
    )
    .all(limit) as ReturnType<typeof dataGaps>;
}
