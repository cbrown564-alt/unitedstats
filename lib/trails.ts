import { getDb } from "./db";
import { tallyWdl } from "./format";
import { MATCH_SELECT, type MatchRow, type Record_ } from "./queries";

const UNITED_GOAL_TYPES = "('goal','pen-goal','own-goal-for')";

// ---------------------------------------------------------------- late goals

/** Share of United goals (with recorded minutes) scored in the final 15 minutes, per decade. */
export function lateGoalShareByDecade(): { decade: string; timed: number; late: number }[] {
  return getDb()
    .prepare(
      `SELECT substr(m.date,1,3) || '0s' decade,
              COUNT(*) timed,
              SUM(e.minute >= 76) late
       FROM match_events e JOIN matches m ON m.id = e.match_id
       WHERE e.type IN ${UNITED_GOAL_TYPES} AND e.minute IS NOT NULL AND e.minute <= 90
       GROUP BY 1 HAVING COUNT(*) >= 20 ORDER BY 1`,
    )
    .all() as { decade: string; timed: number; late: number }[];
}

export function timedGoalCounts(): { timed: number; total: number } {
  return getDb()
    .prepare(
      `SELECT SUM(minute IS NOT NULL) timed, COUNT(*) total
       FROM match_events WHERE type IN ${UNITED_GOAL_TYPES}`,
    )
    .get() as { timed: number; total: number };
}

/** One-goal wins sealed by a United goal in the 85th minute or later. */
export function lateWinners(limit = 10): MatchRow[] {
  return getDb()
    .prepare(
      `${MATCH_SELECT}
       WHERE m.result = 'W' AND m.gf - m.ga = 1
         AND EXISTS (
           SELECT 1 FROM match_events e
           WHERE e.match_id = m.id AND e.type IN ${UNITED_GOAL_TYPES} AND e.minute >= 85
         )
       ORDER BY m.date DESC LIMIT ?`,
    )
    .all(limit) as MatchRow[];
}

// ---------------------------------------------------------------- bogey sides

export interface BogeyOpponent extends Record_ {
  id: string;
  name: string;
  away_p: number;
  away_w: number;
}

export function bogeyOpponents(minMeetings = 20, limit = 10): BogeyOpponent[] {
  return getDb()
    .prepare(
      `SELECT o.id, o.name, COUNT(*) p,
              SUM(result='W') w, SUM(result='D') d, SUM(result='L') l,
              SUM(gf) gf, SUM(ga) ga,
              SUM(venue='A') away_p, SUM(venue='A' AND result='W') away_w
       FROM matches m JOIN opponents o ON o.id = m.opponent_id
       JOIN competitions c ON c.id = m.competition_id
       WHERE c.type != 'unofficial'
       GROUP BY o.id HAVING p >= ?
       ORDER BY 1.0*w/p ASC LIMIT ?`,
    )
    .all(minMeetings, limit) as BogeyOpponent[];
}

// ---------------------------------------------------------------- European weeks

export interface EuropeanWeekSplit {
  afterEuro: Record_;
  baseline: Record_;
}

/** League matches played 1–4 days after a European tie, vs other league matches in European seasons. */
export function europeanWeekEffect(): EuropeanWeekSplit {
  const rows = getDb()
    .prepare(
      `WITH euro AS (
         SELECT m.date, m.season FROM matches m
         JOIN competitions c ON c.id = m.competition_id WHERE c.type = 'european'
       )
       SELECT CASE WHEN EXISTS (
                SELECT 1 FROM euro e WHERE e.season = m.season
                  AND julianday(m.date) - julianday(e.date) BETWEEN 1 AND 4
              ) THEN 1 ELSE 0 END after_euro,
              COUNT(*) p, SUM(result='W') w, SUM(result='D') d, SUM(result='L') l,
              SUM(gf) gf, SUM(ga) ga
       FROM matches m JOIN competitions c ON c.id = m.competition_id
       WHERE c.type = 'league' AND m.season IN (SELECT DISTINCT season FROM euro)
       GROUP BY after_euro`,
    )
    .all() as (Record_ & { after_euro: number })[];
  const empty: Record_ = { p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 };
  return {
    afterEuro: rows.find((r) => r.after_euro === 1) ?? empty,
    baseline: rows.find((r) => r.after_euro === 0) ?? empty,
  };
}

export function leagueMatchesAfterEuropean(limit = 8): MatchRow[] {
  return getDb()
    .prepare(
      `WITH euro AS (
         SELECT m.date, m.season FROM matches m
         JOIN competitions c ON c.id = m.competition_id WHERE c.type = 'european'
       )
       ${MATCH_SELECT}
       WHERE c.type = 'league' AND EXISTS (
         SELECT 1 FROM euro e WHERE e.season = m.season
           AND julianday(m.date) - julianday(e.date) BETWEEN 1 AND 4
       )
       ORDER BY m.date DESC LIMIT ?`,
    )
    .all(limit) as MatchRow[];
}

// ---------------------------------------------------------------- manager bounce

export interface ManagerBounce {
  id: string;
  name: string;
  first_date: string;
  first10: Record_;
  prev10: Record_;
}

/** First 10 matches under each manager vs the club's 10 matches before they took over. */
export function managerBounce(): ManagerBounce[] {
  const db = getDb();
  const managers = db
    .prepare(
      `SELECT mg.id, mg.name, MIN(m.date) first_date, COUNT(*) p
       FROM managers mg JOIN matches m ON m.manager_id = mg.id
       GROUP BY mg.id HAVING p >= 10 ORDER BY first_date`,
    )
    .all() as { id: string; name: string; first_date: string }[];
  const recordOf = (rows: { result: string }[]): Record_ => ({
    p: rows.length,
    ...tallyWdl(rows),
    gf: 0,
    ga: 0,
  });
  const first10Stmt = db.prepare(
    "SELECT result FROM matches WHERE manager_id = ? ORDER BY date LIMIT 10",
  );
  const prev10Stmt = db.prepare(
    "SELECT result FROM matches WHERE date < ? ORDER BY date DESC LIMIT 10",
  );
  return managers
    .map((mg) => ({
      id: mg.id,
      name: mg.name,
      first_date: mg.first_date,
      first10: recordOf(first10Stmt.all(mg.id) as { result: string }[]),
      prev10: recordOf(prev10Stmt.all(mg.first_date) as { result: string }[]),
    }))
    .filter((b) => b.prev10.p === 10);
}

// ---------------------------------------------------------------- fortress Old Trafford

export function oldTraffordByDecade(): (Record_ & { decade: string })[] {
  return getDb()
    .prepare(
      `SELECT substr(date,1,3) || '0s' decade, COUNT(*) p,
              SUM(result='W') w, SUM(result='D') d, SUM(result='L') l,
              SUM(gf) gf, SUM(ga) ga
       FROM matches WHERE stadium_id = 'old-trafford' AND venue = 'H'
       GROUP BY 1 ORDER BY 1`,
    )
    .all() as (Record_ & { decade: string })[];
}

export interface Streak {
  length: number;
  from: string;
  to: string;
}

/** Longest run of consecutive matches without defeat (or without a win, if kind = "winless"). */
export function longestStreak(
  rows: { date: string; result: string }[],
  kind: "unbeaten" | "winning" | "winless",
): Streak | null {
  const holds = (r: string) =>
    kind === "unbeaten" ? r !== "L" : kind === "winning" ? r === "W" : r !== "W";
  let best: Streak | null = null;
  let run: { from: string; len: number } | null = null;
  for (const m of rows) {
    if (holds(m.result)) {
      run = run ?? { from: m.date, len: 0 };
      run.len++;
      if (!best || run.len > best.length) best = { length: run.len, from: run.from, to: m.date };
    } else {
      run = null;
    }
  }
  return best;
}

export function homeMatchesAtOldTrafford(): { date: string; result: string }[] {
  return getDb()
    .prepare(
      "SELECT date, result FROM matches WHERE stadium_id = 'old-trafford' AND venue = 'H' ORDER BY date",
    )
    .all() as { date: string; result: string }[];
}

// ---------------------------------------------------------------- cup specialists

export interface CupSpecialist {
  player_id: string;
  name: string;
  total: number;
  cup_goals: number;
  league_goals: number;
}

/** Players whose recorded goals lean most toward cup competitions. */
export function cupSpecialists(minGoals = 25, limit = 10): CupSpecialist[] {
  return getDb()
    .prepare(
      `SELECT e.player_id, p.name, COUNT(*) total,
              SUM(c.type NOT IN ('league','unofficial')) cup_goals,
              SUM(c.type = 'league') league_goals
       FROM match_events e
       JOIN matches m ON m.id = e.match_id
       JOIN competitions c ON c.id = m.competition_id
       JOIN players p ON p.id = e.player_id
       WHERE e.type IN ('goal','pen-goal')
         AND e.player_side = 'united'
         AND e.player_id IS NOT NULL
       GROUP BY e.player_id HAVING total >= ?
       ORDER BY 1.0*cup_goals/total DESC LIMIT ?`,
    )
    .all(minGoals, limit) as CupSpecialist[];
}

// ---------------------------------------------------------------- match trails

/** Other meetings with the same opponent, venue, and scoreline. */
export function similarMatches(m: MatchRow, limit = 6): MatchRow[] {
  return getDb()
    .prepare(
      `${MATCH_SELECT}
       WHERE m.opponent_id = ? AND m.venue = ? AND m.gf = ? AND m.ga = ? AND m.id != ?
       ORDER BY m.date DESC LIMIT ?`,
    )
    .all(m.opponent_id, m.venue, m.gf, m.ga, m.id, limit) as MatchRow[];
}

// ---------------------------------------------------------------- player trails

export function playerGoalsByCompetitionType(id: string): { type: string; goals: number }[] {
  return getDb()
    .prepare(
      `SELECT c.type, COUNT(*) goals
       FROM match_events e
       JOIN matches m ON m.id = e.match_id
       JOIN competitions c ON c.id = m.competition_id
       WHERE e.player_id = ? AND e.player_side = 'united' AND e.type IN ('goal','pen-goal')
       GROUP BY c.type ORDER BY goals DESC`,
    )
    .all(id) as { type: string; goals: number }[];
}

export interface ScoringRun extends Streak {
  matches: number;
}

/**
 * Longest run of consecutive United matches (among matches with complete scorer
 * records) in which the player scored. Coverage-dependent: gaps in scorer data
 * break the sequence conservatively rather than inflating it.
 */
export function playerBestScoringRun(id: string): ScoringRun | null {
  const rows = getDb()
    .prepare(
      `SELECT m.date,
              EXISTS (
                SELECT 1 FROM match_events e
                WHERE e.match_id = m.id AND e.player_id = ? AND e.player_side = 'united' AND e.type IN ('goal','pen-goal')
              ) scored
       FROM matches m
       WHERE m.events_complete = 1
         AND m.date >= (SELECT MIN(m2.date) FROM match_events e2 JOIN matches m2 ON m2.id = e2.match_id
                        WHERE e2.player_id = ? AND e2.player_side = 'united' AND e2.type IN ('goal','pen-goal'))
         AND m.date <= (SELECT MAX(m2.date) FROM match_events e2 JOIN matches m2 ON m2.id = e2.match_id
                        WHERE e2.player_id = ? AND e2.player_side = 'united' AND e2.type IN ('goal','pen-goal'))
       ORDER BY m.date`,
    )
    .all(id, id, id) as { date: string; scored: number }[];
  let best: ScoringRun | null = null;
  let run: { from: string; len: number } | null = null;
  for (const m of rows) {
    if (m.scored) {
      run = run ?? { from: m.date, len: 0 };
      run.len++;
      if (!best || run.len > best.length) {
        best = { length: run.len, from: run.from, to: m.date, matches: run.len };
      }
    } else {
      run = null;
    }
  }
  return best && best.length >= 2 ? best : null;
}

// ---------------------------------------------------------------- manager trails

export function managerFirstMatches(id: string, n = 10): MatchRow[] {
  return getDb()
    .prepare(`${MATCH_SELECT} WHERE m.manager_id = ? ORDER BY m.date LIMIT ?`)
    .all(id, n) as MatchRow[];
}

export interface ManagerSplits {
  home: Record_;
  away: Record_;
  league: Record_;
  cup: Record_;
}

export function managerSplits(id: string): ManagerSplits {
  const db = getDb();
  const rec = (cond: string): Record_ =>
    db
      .prepare(
        `SELECT COUNT(*) p, COALESCE(SUM(result='W'),0) w, COALESCE(SUM(result='D'),0) d,
                COALESCE(SUM(result='L'),0) l, COALESCE(SUM(m.gf),0) gf, COALESCE(SUM(m.ga),0) ga
         FROM matches m JOIN competitions c ON c.id = m.competition_id
         WHERE m.manager_id = ? AND ${cond}`,
      )
      .get(id) as Record_;
  return {
    home: rec("m.venue = 'H'"),
    away: rec("m.venue = 'A'"),
    league: rec("c.type = 'league'"),
    cup: rec("c.type NOT IN ('league','unofficial')"),
  };
}

// ---------------------------------------------------------------- opponent trails

export function opponentVenueSplits(id: string): (Record_ & { venue: string })[] {
  return getDb()
    .prepare(
      `SELECT venue, COUNT(*) p, SUM(result='W') w, SUM(result='D') d, SUM(result='L') l,
              SUM(gf) gf, SUM(ga) ga
       FROM matches WHERE opponent_id = ? GROUP BY venue ORDER BY p DESC`,
    )
    .all(id) as (Record_ & { venue: string })[];
}

export function opponentCupRecord(id: string): Record_ & { first: string | null; last: string | null } {
  return getDb()
    .prepare(
      `SELECT COUNT(*) p, COALESCE(SUM(result='W'),0) w, COALESCE(SUM(result='D'),0) d,
              COALESCE(SUM(result='L'),0) l, COALESCE(SUM(m.gf),0) gf, COALESCE(SUM(m.ga),0) ga,
              MIN(m.date) first, MAX(m.date) last
       FROM matches m JOIN competitions c ON c.id = m.competition_id
       WHERE m.opponent_id = ? AND c.type NOT IN ('league','unofficial')`,
    )
    .get(id) as Record_ & { first: string | null; last: string | null };
}

export function opponentResultSequence(id: string): { date: string; result: string }[] {
  return getDb()
    .prepare("SELECT date, result FROM matches WHERE opponent_id = ? ORDER BY date")
    .all(id) as { date: string; result: string }[];
}

// ---------------------------------------------------------------- homepage evidence

/** Matches with the fullest recorded sheets — scorers, opposition goals, lineups. */
export function fullestMatchSheets(limit = 6): (MatchRow & { facets: number })[] {
  return getDb()
    .prepare(
      `${MATCH_SELECT.replace("FROM matches m", `, (
          m.events_complete
          + (m.has_lineup = 1)
          + EXISTS (SELECT 1 FROM match_events e WHERE e.match_id = m.id AND e.type IN ('opp-goal','own-goal-against'))
          + EXISTS (SELECT 1 FROM match_events e WHERE e.match_id = m.id AND (e.assist_player_id IS NOT NULL OR e.assist_name IS NOT NULL))
          + EXISTS (SELECT 1 FROM match_events e WHERE e.match_id = m.id AND e.type IN ('card-yellow','card-red'))
        ) facets
        FROM matches m`)}
       ORDER BY facets DESC, m.date DESC LIMIT ?`,
    )
    .all(limit) as (MatchRow & { facets: number })[];
}
