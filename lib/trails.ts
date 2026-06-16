import { getDb } from "./db";
import { tallyWdl } from "./format";
import { MATCH_SELECT, type MatchRow, type Record_ } from "./queries";

const UNITED_GOAL_TYPES = "('goal','pen-goal','own-goal-for')";

// ---------------------------------------------------------------- late goals

/**
 * Share of United goals (with recorded minutes) scored after the 85th minute,
 * per decade. The whole late-goals module is pinned to this one window — minute
 * ≥ 86, stoppage time included — so the ridge, the decade bars, and the curated
 * match list all describe the same closing five minutes.
 */
export function lateGoalShareByDecade(): { decade: string; timed: number; late: number }[] {
  return getDb()
    .prepare(
      `SELECT substr(m.date,1,3) || '0s' decade,
              COUNT(*) timed,
              SUM(e.minute >= 86) late
       FROM match_events e JOIN matches m ON m.id = e.match_id
       WHERE e.type IN ${UNITED_GOAL_TYPES} AND e.minute IS NOT NULL
       GROUP BY 1 HAVING COUNT(*) >= 20 ORDER BY 1`,
    )
    .all() as { decade: string; timed: number; late: number }[];
}

/**
 * United goals by 5-minute bin across the match, for the late-goals ridge. Same
 * goal definition as {@link lateGoalShareByDecade}; stoppage time folds into the
 * final 86–90+ bin so the closing surge stays on the chart. Returns all 18 bins,
 * zero-filled, so the caller can render an unbroken timeline.
 */
export function goalMinuteRidge(): { lo: number; hi: number; n: number }[] {
  const rows = getDb()
    .prepare(
      `SELECT MIN((e.minute - 1) / 5, 17) AS bin, COUNT(*) n
       FROM match_events e
       WHERE e.type IN ${UNITED_GOAL_TYPES} AND e.minute IS NOT NULL AND e.minute >= 1
       GROUP BY 1 ORDER BY 1`,
    )
    .all() as { bin: number; n: number }[];
  const bins = Array.from({ length: 18 }, (_, i) => ({ lo: i * 5, hi: i * 5 + 5, n: 0 }));
  for (const r of rows) if (bins[r.bin]) bins[r.bin].n = r.n;
  return bins;
}

export function timedGoalCounts(): { timed: number; total: number } {
  return getDb()
    .prepare(
      `SELECT SUM(minute IS NOT NULL) timed, COUNT(*) total
       FROM match_events WHERE type IN ${UNITED_GOAL_TYPES}`,
    )
    .get() as { timed: number; total: number };
}

/**
 * A hand-picked spine of iconic matches United won with a goal after the 85th
 * minute — the late-show greatest hits, oldest first. Curated rather than queried
 * because "iconic" is editorial; every entry is still a real one-goal win sealed
 * in the closing minutes, verified against the record.
 */
const ICONIC_LATE_DATES = [
  "1993-04-10", // Bruce's brace v Sheffield Wednesday — the original "Fergie time"
  "1996-05-11", // Cantona's late winner v Liverpool — the FA Cup final
  "1999-05-26", // Sheringham & Solskjaer v Bayern — the Treble sealed in stoppage
  "2009-04-05", // Macheda's debut winner v Aston Villa
  "2009-09-20", // Owen's 96th-minute derby winner v Manchester City
  "2010-04-17", // Scholes' late header v City at Eastlands
];

export function iconicLateWinners(): MatchRow[] {
  const placeholders = ICONIC_LATE_DATES.map(() => "?").join(",");
  return getDb()
    .prepare(`${MATCH_SELECT} WHERE m.date IN (${placeholders}) ORDER BY m.date ASC`)
    .all(...ICONIC_LATE_DATES) as MatchRow[];
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

const UNITED_GOAL = "('goal','pen-goal','own-goal-for')";
const OPP_GOAL = "('opp-goal','own-goal-against')";
const UNITED_GOAL_SET = new Set(["goal", "pen-goal", "own-goal-for"]);

export interface LeadHeldGame {
  id: string;
  date: string;
  season: string;
  result: string;
  gf: number;
  ga: number;
  opponent_name: string;
  /** United's half-time margin (always > 0 here — these are the games led at the break). */
  htf: number;
  hta: number;
  /** Lowest United margin reached after half-time: 0 = pegged level, < 0 = fell behind. */
  worst: number;
  /** Latest minute United were level or behind in the second half, or null if never. */
  riskMinute: number | null;
}

export interface LeadHeldSummary {
  games: LeadHeldGame[];
  w: number;
  d: number;
  l: number;
  from: string;
  to: string;
}

/**
 * Old Trafford home *league* games United led at half-time, in chronological order
 * — the canonical-record view of the "lead at the break and the fortress holds"
 * rule. Half-time scores are reconstructed from minute-stamped events, so this is
 * restricted to matches where every goal carries a minute and the reconstructed
 * full-time score matches the recorded one; that pins coverage to the mid-1980s on
 * (see {@link goalMinuteRidge} for why minute data thins before then). The published
 * run is longer and older — Opta has it unbeaten across 400 such games back to
 * August 1984 — so what we render here is the verifiable tail of that record, and
 * the point it proves is the zero in the loss column.
 *
 * `worst`/`riskMinute` come from replaying each match's goals in order, so the
 * caller can surface the games where the lead was surrendered or, rarer still,
 * where United fell behind after the break and still rescued the result.
 */
export function leadHeldAtHome(): LeadHeldSummary {
  const db = getDb();
  const candidates = db
    .prepare(
      `SELECT m.id, m.date, m.season, m.result, m.gf, m.ga, m.opponent_name,
              SUM(CASE WHEN e.type IN ${UNITED_GOAL} OR e.type IN ${OPP_GOAL} THEN (e.minute IS NULL) ELSE 0 END) nomin,
              COALESCE(SUM(CASE WHEN e.minute <= 45 AND e.type IN ${UNITED_GOAL} THEN 1 ELSE 0 END), 0) htf,
              COALESCE(SUM(CASE WHEN e.minute <= 45 AND e.type IN ${OPP_GOAL} THEN 1 ELSE 0 END), 0) hta,
              COALESCE(SUM(e.type IN ${UNITED_GOAL}), 0) ftf,
              COALESCE(SUM(e.type IN ${OPP_GOAL}), 0) fta
       FROM matches m
       JOIN competitions c ON c.id = m.competition_id
       LEFT JOIN match_events e ON e.match_id = m.id
       WHERE m.events_complete = 1 AND m.stadium_id = 'old-trafford'
         AND m.venue = 'H' AND c.type = 'league'
       GROUP BY m.id ORDER BY m.date`,
    )
    .all() as (Omit<LeadHeldGame, "worst" | "riskMinute"> & {
      nomin: number;
      ftf: number;
      fta: number;
    })[];

  // Trustworthy half-time only: no minute gaps, and the reconstructed full-time
  // score reproduces the recorded one. Then keep the games led at the break.
  const led = candidates.filter(
    (r) => r.nomin === 0 && r.ftf === r.gf && r.fta === r.ga && r.htf > r.hta,
  );
  if (led.length === 0) return { games: [], w: 0, d: 0, l: 0, from: "", to: "" };

  // One pass for every goal in the qualifying matches; replay each to find the
  // deepest second-half wobble and how late United were last level or behind.
  const ids = led.map((r) => r.id);
  const events = db
    .prepare(
      `SELECT match_id, type, minute FROM match_events
       WHERE match_id IN (${ids.map(() => "?").join(",")})
         AND (type IN ${UNITED_GOAL} OR type IN ${OPP_GOAL})
       ORDER BY match_id, minute, seq`,
    )
    .all(...ids) as { match_id: string; type: string; minute: number }[];

  const byMatch = new Map<string, { type: string; minute: number }[]>();
  for (const e of events) (byMatch.get(e.match_id) ?? byMatch.set(e.match_id, []).get(e.match_id)!).push(e);

  const games: LeadHeldGame[] = led.map((r) => {
    let uf = 0;
    let oa = 0;
    let worst = r.htf - r.hta;
    let riskMinute: number | null = null;
    for (const e of byMatch.get(r.id) ?? []) {
      if (UNITED_GOAL_SET.has(e.type)) uf++;
      else oa++;
      if (e.minute > 45) {
        const margin = uf - oa;
        if (margin < worst) worst = margin;
        if (margin <= 0) riskMinute = e.minute;
      }
    }
    return {
      id: r.id, date: r.date, season: r.season, result: r.result,
      gf: r.gf, ga: r.ga, opponent_name: r.opponent_name,
      htf: r.htf, hta: r.hta, worst, riskMinute,
    };
  });

  return {
    games,
    w: games.filter((g) => g.result === "W").length,
    d: games.filter((g) => g.result === "D").length,
    l: games.filter((g) => g.result === "L").length,
    from: games[0].date,
    to: games[games.length - 1].date,
  };
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
