import { getDb } from "./db";

export interface MatchRow {
  id: string;
  season: string;
  date: string;
  competition_id: string;
  competition_name: string;
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

const MATCH_SELECT = `
  SELECT m.*, c.name AS competition_name, s.name AS stadium_name, mg.name AS manager_name
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

export function allTimeRecord(): Record_ {
  return getDb()
    .prepare(
      `SELECT COUNT(*) p, SUM(result='W') w, SUM(result='D') d, SUM(result='L') l,
              SUM(gf) gf, SUM(ga) ga FROM matches`,
    )
    .get() as Record_;
}

export function recordByCompetitionType(): (Record_ & { type: string })[] {
  return getDb()
    .prepare(
      `SELECT c.type, COUNT(*) p, SUM(result='W') w, SUM(result='D') d, SUM(result='L') l,
              SUM(m.gf) gf, SUM(m.ga) ga
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
  minute: number | null;
  assist_player_id: string | null;
  assist_name: string | null;
  detail: string | null;
}

export function eventsForMatch(matchId: string): EventRow[] {
  return getDb()
    .prepare(
      `SELECT e.seq, e.type, e.player_id, p.name AS player_name, e.minute,
              e.assist_player_id, ap.name AS assist_name, e.detail
       FROM match_events e
       LEFT JOIN players p ON p.id = e.player_id
       LEFT JOIN players ap ON ap.id = e.assist_player_id
       WHERE e.match_id = ? ORDER BY COALESCE(e.minute, 999), e.seq`,
    )
    .all(matchId) as EventRow[];
}

export interface LineupRow {
  player_id: string;
  player_name: string;
  shirt: number | null;
  role: string | null;
  started: number;
  sub_on: number | null;
  sub_off: number | null;
}

export function lineupForMatch(matchId: string): LineupRow[] {
  return getDb()
    .prepare(
      `SELECT l.player_id, p.name AS player_name, l.shirt, l.role, l.started, l.sub_on, l.sub_off
       FROM match_lineups l JOIN players p ON p.id = l.player_id
       WHERE l.match_id = ? ORDER BY l.started DESC, l.shirt`,
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
      `SELECT COUNT(*) p, COALESCE(SUM(result='W'),0) w, COALESCE(SUM(result='D'),0) d,
              COALESCE(SUM(result='L'),0) l, COALESCE(SUM(gf),0) gf, COALESCE(SUM(ga),0) ga
       FROM matches WHERE opponent_id = ? AND date < ?`,
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
  q?: string;
  limit?: number;
  offset?: number;
}

export function findMatches(f: MatchFilter): { rows: MatchRow[]; total: number } {
  const where: string[] = [];
  const params: Record<string, string | number> = {};
  if (f.competition) { where.push("m.competition_id = @competition"); params.competition = f.competition; }
  if (f.opponent) { where.push("m.opponent_id = @opponent"); params.opponent = f.opponent; }
  if (f.season) { where.push("m.season = @season"); params.season = f.season; }
  if (f.venue) { where.push("m.venue = @venue"); params.venue = f.venue; }
  if (f.result) { where.push("m.result = @result"); params.result = f.result; }
  if (f.q) { where.push("m.opponent_name LIKE @q"); params.q = `%${f.q}%`; }
  const cond = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const total = (
    getDb().prepare(`SELECT COUNT(*) n FROM matches m ${cond}`).get(params) as { n: number }
  ).n;
  const rows = getDb()
    .prepare(`${MATCH_SELECT} ${cond} ORDER BY m.date DESC LIMIT @limit OFFSET @offset`)
    .all({ ...params, limit: f.limit ?? 50, offset: f.offset ?? 0 }) as MatchRow[];
  return { rows, total };
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
  goals: number;
  assists: number;
  first_date: string | null;
  last_date: string | null;
}

export function playersIndex(): PlayerTotals[] {
  return getDb()
    .prepare(
      `SELECT pt.player_id, p.name, pt.apps, pt.starts, pt.goals, pt.assists,
              COALESCE(pt.first_date, (SELECT MIN(m.date) FROM match_events e JOIN matches m ON m.id=e.match_id WHERE e.player_id = pt.player_id)) first_date,
              COALESCE(pt.last_date, (SELECT MAX(m.date) FROM match_events e JOIN matches m ON m.id=e.match_id WHERE e.player_id = pt.player_id)) last_date
       FROM player_totals pt JOIN players p ON p.id = pt.player_id
       WHERE pt.scope = 'all' AND (pt.goals > 0 OR pt.apps > 0 OR pt.assists > 0)
       ORDER BY pt.goals DESC, pt.apps DESC, pt.starts DESC`,
    )
    .all() as PlayerTotals[];
}

export function playerById(id: string): PlayerTotals | undefined {
  return getDb()
    .prepare(
      `SELECT pt.player_id, p.name, pt.apps, pt.starts, pt.goals, pt.assists,
              COALESCE(pt.first_date, (SELECT MIN(m.date) FROM match_events e JOIN matches m ON m.id=e.match_id WHERE e.player_id = pt.player_id)) first_date,
              COALESCE(pt.last_date, (SELECT MAX(m.date) FROM match_events e JOIN matches m ON m.id=e.match_id WHERE e.player_id = pt.player_id)) last_date
       FROM player_totals pt JOIN players p ON p.id = pt.player_id
       WHERE pt.player_id = ? AND pt.scope = 'all'`,
    )
    .get(id) as PlayerTotals | undefined;
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
         SELECT season FROM matches m JOIN match_lineups l ON l.match_id = m.id WHERE l.player_id = ?
         UNION
         SELECT season FROM matches m JOIN match_events e ON e.match_id = m.id WHERE e.player_id = ? OR e.assist_player_id = ?
       )
       SELECT s.season,
              COALESCE((SELECT COUNT(*) FROM match_lineups l JOIN matches m ON m.id=l.match_id
                        WHERE l.player_id = ? AND m.season = s.season), 0) apps,
              COALESCE((SELECT COUNT(*) FROM match_lineups l JOIN matches m ON m.id=l.match_id
                        WHERE l.player_id = ? AND l.started = 1 AND m.season = s.season), 0) starts,
              COALESCE((SELECT COUNT(*) FROM match_events e JOIN matches m ON m.id=e.match_id
                        WHERE e.player_id = ? AND e.type IN ('goal','pen-goal') AND m.season = s.season), 0) goals,
              COALESCE((SELECT COUNT(*) FROM match_events e JOIN matches m ON m.id=e.match_id
                        WHERE e.assist_player_id = ? AND e.type IN ('goal','pen-goal') AND m.season = s.season), 0) assists
       FROM seasons s ORDER BY s.season`,
    )
    .all(id, id, id, id, id, id, id) as {
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
      `SELECT m.*, c.name AS competition_name, s.name AS stadium_name, mg.name AS manager_name,
              l.started, l.sub_on, l.sub_off, l.role
       FROM match_lineups l
       JOIN matches m ON m.id = l.match_id
       JOIN competitions c ON c.id = m.competition_id
       LEFT JOIN stadiums s ON s.id = m.stadium_id
       LEFT JOIN managers mg ON mg.id = m.manager_id
       WHERE l.player_id = ? ORDER BY m.date DESC`,
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
       WHERE e.player_id = ? AND e.type IN ('goal','pen-goal')
       GROUP BY m.season ORDER BY m.season`,
    )
    .all(id) as { season: string; goals: number }[];
}

export function playerGoalMatches(id: string): (MatchRow & { goals: number; minutes: string | null })[] {
  return getDb()
    .prepare(
      `SELECT m.*, c.name AS competition_name, NULL AS stadium_name, NULL AS manager_name,
              COUNT(*) goals,
              GROUP_CONCAT(COALESCE(e.minute, ''), ',') minutes
       FROM match_events e
       JOIN matches m ON m.id = e.match_id
       JOIN competitions c ON c.id = m.competition_id
       WHERE e.player_id = ? AND e.type IN ('goal','pen-goal')
       GROUP BY m.id ORDER BY m.date DESC`,
    )
    .all(id) as (MatchRow & { goals: number; minutes: string | null })[];
}

export function playerGoalMinutes(id: string): number[] {
  return (
    getDb()
      .prepare(
        `SELECT e.minute FROM match_events e
         WHERE e.player_id = ? AND e.type IN ('goal','pen-goal') AND e.minute IS NOT NULL`,
      )
      .all(id) as { minute: number }[]
  ).map((r) => r.minute);
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
       WHERE e.type IN ('goal','pen-goal') AND e.player_id IS NOT NULL AND e.assist_player_id IS NOT NULL
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
         AND e.player_id IS NOT NULL
         AND e.assist_player_id IS NOT NULL
         AND (e.player_id = ? OR e.assist_player_id = ?)
       GROUP BY e.player_id, e.assist_player_id
       ORDER BY goals DESC, last_date DESC LIMIT ?`,
    )
    .all(id, id, limit) as AssistPartnership[];
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
      `SELECT season, COUNT(*) p, SUM(result='W') w, SUM(result='D') d, SUM(result='L') l,
              SUM(gf) gf, SUM(ga) ga,
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
      `SELECT venue, COUNT(*) p, SUM(result='W') w, SUM(result='D') d, SUM(result='L') l,
              SUM(gf) gf, SUM(ga) ga
       FROM matches GROUP BY venue ORDER BY p DESC`,
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
