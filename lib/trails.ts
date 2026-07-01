import { getDb } from "./db";
import { tallyWdl } from "./format";
import { roundFilterPredicate } from "./matchRounds";
import {
  allSeasons,
  CUP_WON_PREDICATE,
  MATCH_SELECT,
  eventsForMatch,
  matchWhere,
  type MatchFilter,
  type MatchRow,
  type Record_,
} from "./queries";
import { seasonsAscending } from "./seasonBounds";

/** One-off final only — excludes semis *and* quarter-finals (which contain the
 *  substring "final"). Shared with the matches browser so the definition can't
 *  drift. */
const FINAL_PREDICATE = roundFilterPredicate("final", "m");

const UNITED_GOAL_TYPES = "('goal','pen-goal','own-goal-for')";

// ---------------------------------------------------------------- late goals

/**
 * Share of United goals (with recorded minutes) scored after the 85th minute,
 * per decade — split into the two parts that the headline figure quietly conflates:
 *
 *   - `reg`: the last five *regulation* minutes (86–90, no stoppage). A genuine,
 *     fixed five-minute slot, so it is fair to compare against an even spread.
 *   - `stoppage`: anything past the 90th (minute > 90, or the 90th carrying added
 *     time). This is *not* a five-minute slot — it is however long the fourth
 *     official adds, which has grown from a minute or two mid-century to ten-plus
 *     today, and which our sources only began notating in the modern era.
 *
 * `late = reg + stoppage`. Keeping the two apart is the whole point of the module:
 * the regulation share is flat across every era, while the modern "Fergie time"
 * surge is almost entirely the stoppage column — a lengthening of the closing
 * window, not a United trait. We cannot normalise by each match's true stoppage
 * length (no source records it before the Opta era, ~2006, and never for the deep
 * archive), so we show the split rather than claim a rate we can't measure.
 */
export function lateGoalShareByDecade(): {
  decade: string;
  timed: number;
  late: number;
  reg: number;
  stoppage: number;
}[] {
  return getDb()
    .prepare(
      `SELECT substr(m.date,1,3) || '0s' decade,
              COUNT(*) timed,
              SUM(e.minute >= 86) late,
              SUM(e.minute BETWEEN 86 AND 90 AND COALESCE(e.added_time, 0) = 0) reg,
              SUM(e.minute > 90 OR (e.minute = 90 AND COALESCE(e.added_time, 0) > 0)) stoppage
       FROM match_events e JOIN matches m ON m.id = e.match_id
       WHERE e.type IN ${UNITED_GOAL_TYPES} AND e.minute IS NOT NULL
       GROUP BY 1 HAVING COUNT(*) >= 20 ORDER BY 1`,
    )
    .all() as { decade: string; timed: number; late: number; reg: number; stoppage: number }[];
}

/**
 * United goals by 5-minute bin across the match, for the late-goals ridge. Same
 * goal definition as {@link lateGoalShareByDecade}, but stoppage time is kept
 * *out* of the 86–90 bin and returned separately as `stoppage`, so the ridge can
 * draw the genuine regulation late-spike (a real edge over an even spread) and the
 * added-time goals as two distinct things rather than one fat, misleading bar.
 * Returns all 18 regulation bins, zero-filled, for an unbroken timeline.
 */
export function goalMinuteRidge(): { bins: { lo: number; hi: number; n: number }[]; stoppage: number } {
  const db = getDb();
  const notStoppage = `NOT (e.minute > 90 OR (e.minute = 90 AND COALESCE(e.added_time, 0) > 0))`;
  const rows = db
    .prepare(
      `SELECT MIN((e.minute - 1) / 5, 17) AS bin, COUNT(*) n
       FROM match_events e
       WHERE e.type IN ${UNITED_GOAL_TYPES} AND e.minute IS NOT NULL AND e.minute >= 1
         AND ${notStoppage}
       GROUP BY 1 ORDER BY 1`,
    )
    .all() as { bin: number; n: number }[];
  const bins = Array.from({ length: 18 }, (_, i) => ({ lo: i * 5, hi: i * 5 + 5, n: 0 }));
  for (const r of rows) if (bins[r.bin]) bins[r.bin].n = r.n;
  const { stoppage } = db
    .prepare(
      `SELECT COUNT(*) stoppage FROM match_events e
       WHERE e.type IN ${UNITED_GOAL_TYPES} AND e.minute IS NOT NULL AND NOT (${notStoppage})`,
    )
    .get() as { stoppage: number };
  return { bins, stoppage };
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
 * Map a recorded goal to its clock position for plotting. Stoppage is 90+added;
 * older sources sometimes write 93 or 99 directly instead of 90+3 / 90+9.
 */
function lateGoalClock(minute: number, added: number | null): number {
  if (minute === 90 && added != null && added > 0) return 90 + added;
  return minute;
}

function isStoppageGoal(minute: number, added: number | null): boolean {
  return minute > 90 || (minute === 90 && (added ?? 0) > 0);
}

export interface LateGoalPoint {
  matchId: string;
  date: string;
  opponent: string;
  venue: string;
  gf: number;
  ga: number;
  minute: number;
  added: number | null;
  scorer: string | null;
  clock: number;
  stoppage: boolean;
}

/** Every United goal after the 85th minute with a recorded clock — the scatter cloud. */
export function lateGoalScatter(from = "1950-01-01"): LateGoalPoint[] {
  const rows = getDb()
    .prepare(
      `SELECT m.id matchId, m.date, m.opponent_name opponent, m.venue, m.gf, m.ga,
              e.minute, e.added_time added, e.player_name scorer
       FROM match_events e JOIN matches m ON m.id = e.match_id
       WHERE e.type IN ${UNITED_GOAL_TYPES} AND e.minute >= 86 AND e.minute IS NOT NULL
         AND m.date >= ?
       ORDER BY m.date, e.minute, COALESCE(e.added_time, 0)`,
    )
    .all(from) as Omit<LateGoalPoint, "clock" | "stoppage">[];
  return rows.map((r) => ({
    ...r,
    clock: lateGoalClock(r.minute, r.added),
    stoppage: isStoppageGoal(r.minute, r.added),
  }));
}

/** Ten nights spread across the record — lightly labelled on the scatter, detailed below. */
const ANNOTATED_LATE: {
  matchId: string;
  minute: number;
  added: number | null;
  tag: string;
  note: string;
}[] = [
  {
    matchId: "1968-05-29-benfica-n",
    minute: 99,
    added: null,
    tag: "Busby's European Cup",
    note: "Charlton in extra time at Wembley — late drama long before the phrase existed.",
  },
  {
    matchId: "1985-05-18-everton-n",
    minute: 110,
    added: null,
    tag: "Whiteside final",
    note: "Whiteside's extra-time winner — the last trophy before Ferguson.",
  },
  {
    matchId: "1993-04-10-sheffield-wednesday-h",
    minute: 90,
    added: 6,
    tag: "The original",
    note: "Bruce's stoppage-time brace — where 'Fergie time' was coined.",
  },
  {
    matchId: "1996-05-11-liverpool-n",
    minute: 86,
    added: null,
    tag: "FA Cup final",
    note: "Cantona's 86th-minute winner at Wembley.",
  },
  {
    matchId: "1999-05-26-bayern-munich-n",
    minute: 90,
    added: 3,
    tag: "The Treble",
    note: "Solskjaer's stoppage-time winner — the myth at full volume.",
  },
  {
    matchId: "2009-04-05-aston-villa-h",
    minute: 90,
    added: 3,
    tag: "The debut",
    note: "Macheda's first touch, 90+3.",
  },
  {
    matchId: "2009-09-20-manchester-city-h",
    minute: 90,
    added: 6,
    tag: "The derby",
    note: "Owen's 96th-minute winner against City.",
  },
  {
    matchId: "2010-04-17-manchester-city-a",
    minute: 90,
    added: 3,
    tag: "Title race",
    note: "Scholes' header at Eastlands.",
  },
  {
    matchId: "2023-10-07-brentford-h",
    minute: 90,
    added: 7,
    tag: "Since Ferguson",
    note: "McTominay twice in stoppage time — the habit outlasted the manager.",
  },
  {
    matchId: "2024-02-01-wolverhampton-wanderers-a",
    minute: 90,
    added: 7,
    tag: "Mainoo",
    note: "A teenager's 90+7 winner — late goals still landing deep in added time.",
  },
];

export interface AnnotatedLateGoal extends LateGoalPoint {
  tag: string;
  note: string;
}

export function annotatedLateGoals(): AnnotatedLateGoal[] {
  const cloud = lateGoalScatter();
  return ANNOTATED_LATE.flatMap((a) => {
    const hit = cloud.find(
      (p) =>
        p.matchId === a.matchId &&
        p.minute === a.minute &&
        (p.added ?? 0) === (a.added ?? 0),
    );
    if (!hit) return [];
    return [{ ...hit, tag: a.tag, note: a.note }];
  });
}

export interface LateGoalEraSlice {
  label: string;
  timed: number;
  reg: number;
  stoppage: number;
}

/**
 * Late-goal share by manager era — Busby, the wilderness years, Ferguson, and
 * since. The jump arrives with Ferguson; the share keeps climbing after he leaves
 * as added time lengthens. Busby's era already showed a hint of the same habit.
 */
export function lateGoalManagerEras(): LateGoalEraSlice[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT
         CASE
           WHEN m.date < '1945-01-01' THEN 'Early record'
           WHEN m.date <= '1969-06-04' THEN 'Busby'
           WHEN m.date < '1986-11-08' THEN 'Between'
           WHEN m.date <= '2013-05-19' THEN 'Ferguson'
           ELSE 'Since Ferguson'
         END AS label,
         COUNT(*) timed,
         SUM(e.minute BETWEEN 86 AND 90 AND COALESCE(e.added_time, 0) = 0) reg,
         SUM(e.minute > 90 OR (e.minute = 90 AND COALESCE(e.added_time, 0) > 0)) stoppage
       FROM match_events e JOIN matches m ON m.id = e.match_id
       WHERE e.type IN ${UNITED_GOAL_TYPES} AND e.minute IS NOT NULL
       GROUP BY 1
       ORDER BY MIN(m.date)`,
    )
    .all() as LateGoalEraSlice[];
  return rows.filter((r) => r.timed >= 20 && r.label !== "Early record");
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
  thumb_url: string | null;
  image_url: string | null;
}

/** First 10 matches under each manager vs the club's 10 matches before they took over. */
export function managerBounce(): ManagerBounce[] {
  const db = getDb();
  const managers = db
    .prepare(
      `SELECT mg.id, mg.name, MIN(m.date) first_date, COUNT(*) p,
              mm.local_path thumb_url,
              mm.local_path image_url
       FROM managers mg JOIN matches m ON m.manager_id = mg.id
       LEFT JOIN manager_media mm ON mm.manager_id = mg.id
       GROUP BY mg.id HAVING p >= 10 ORDER BY first_date`,
    )
    .all() as { id: string; name: string; first_date: string; thumb_url: string | null; image_url: string | null }[];
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
      thumb_url: mg.thumb_url,
      image_url: mg.image_url,
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

/**
 * A match in a tenure / head-to-head sequence, carrying enough identity to link
 * it and draw its scoreline. Date-ordered by the queries that build it; the
 * extra fields beyond `date`/`result` feed {@link notableMatches} while
 * {@link longestStreak} reads only those two.
 */
export interface SequenceMatch {
  id: string;
  date: string;
  season: string;
  venue: string;
  result: string;
  gf: number;
  ga: number;
  aet: number;
  pen_gf: number | null;
  pen_ga: number | null;
  opponent_name: string;
  competition_name: string;
}

const SEQ_SELECT = `m.id, m.date, m.season, m.venue, m.result, m.gf, m.ga, m.aet,
  m.pen_gf, m.pen_ga, m.opponent_name, c.name AS competition_name`;

/** A {@link SequenceMatch} surfaced as a standout, with the reason it earned a card. */
export interface NotableMatch extends SequenceMatch {
  reason: string;
}

/**
 * Curated "standout matches" for a tenure or head-to-head: the biggest win and
 * heaviest defeat by margin, plus the match that *ended* each supplied run.
 *
 * Each card appears only when it is real — no win means no biggest-win card, an
 * ongoing run has no ender, so it drops silently rather than printing a blank.
 * Below `minMatches` the whole set is suppressed: extremes off a handful of
 * games are noise, not a finding. Notability is computed only from signals the
 * page already owns (margin, the runs it already draws), never asserted.
 */
export function notableMatches(
  seq: SequenceMatch[],
  runs: { streak: Streak | null; noun: string }[] = [],
  opts: { minMatches?: number; runThreshold?: number } = {},
): NotableMatch[] {
  const { minMatches = 15, runThreshold = 5 } = opts;
  if (seq.length < minMatches) return [];

  const out: NotableMatch[] = [];
  const seen = new Set<string>();
  const push = (m: SequenceMatch | null | undefined, reason: string) => {
    if (!m || seen.has(m.id)) return;
    seen.add(m.id);
    out.push({ ...m, reason });
  };

  // Margin extremes over the whole history. Ties break to the bigger score
  // (6–1 beats 5–0), then to the earlier match (the original feat). `sign` flips
  // the comparison so the same routine finds the heaviest defeat.
  const better = (best: SequenceMatch | null, m: SequenceMatch, sign: 1 | -1): SequenceMatch => {
    if (!best) return m;
    const dm = sign * (m.gf - m.ga);
    const db = sign * (best.gf - best.ga);
    if (dm !== db) return dm > db ? m : best;
    const sm = sign > 0 ? m.gf : m.ga;
    const sb = sign > 0 ? best.gf : best.ga;
    if (sm !== sb) return sm > sb ? m : best;
    return m.date < best.date ? m : best;
  };
  let bestWin: SequenceMatch | null = null;
  let worstLoss: SequenceMatch | null = null;
  for (const m of seq) {
    if (m.result === "W") bestWin = better(bestWin, m, 1);
    else if (m.result === "L") worstLoss = better(worstLoss, m, -1);
  }
  push(bestWin, "Biggest win");
  push(worstLoss, "Heaviest defeat");

  // The match that ended each run: the row right after the run's final date in
  // the date-ordered sequence. A run that is still current has no following row
  // and drops. Runs shorter than the threshold aren't notable enough to mark.
  for (const { streak, noun } of runs) {
    if (!streak || streak.length < runThreshold) continue;
    const endIdx = seq.findIndex((m) => m.date === streak.to);
    const ender = endIdx >= 0 ? seq[endIdx + 1] : undefined;
    push(ender, `Ended a ${streak.length}-match ${noun}`);
  }

  return out;
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

const UNITED_GOAL = "('goal','pen-goal','own-goal-for')";
const OPP_GOAL = "('opp-goal','own-goal-against')";
const UNITED_GOAL_SET = new Set(["goal", "pen-goal", "own-goal-for"]);

interface LeadHeldGame {
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

// ---------------------------------------------------------------- comebacks

export interface ComebackMatch {
  id: string;
  date: string;
  season: string;
  venue: string;
  result: string;
  gf: number;
  ga: number;
  opponent_name: string;
  competition_name: string;
  /** Deepest deficit United climbed out of (positive: goals once behind by). */
  deficit: number;
}

export interface ComebackSummary {
  /** Official matches whose goals all carry a minute, so a comeback can be verified. */
  replayable: number;
  fellBehind: number;
  /** Trailed at some point but did not lose (won or drew). */
  recovered: number;
  wonFromBehind: number;
  fellTwoPlus: number;
  /** Trailed by two or more and still avoided defeat. */
  twoPlusRecovered: number;
}

/**
 * United's recoveries from a losing position, reconstructed by replaying every
 * minute-stamped goal in the official record. A match "fell behind" if United's
 * running margin ever went negative; it is a comeback win if they then won, a
 * rescue if they avoided defeat. Restricted to matches whose goals all carry a
 * minute (`events_complete`), so this is the verifiable part of the record — the
 * same contract the fortress module uses — and the deepest comebacks are the
 * matches won after trailing furthest.
 */
export function comebacks(limit = 6): { summary: ComebackSummary; deepest: ComebackMatch[] } {
  const db = getDb();
  const matches = db
    .prepare(
      `SELECT m.id, m.date, m.season, m.venue, m.result, m.gf, m.ga,
              m.opponent_name, c.name AS competition_name
       FROM matches m JOIN competitions c ON c.id = m.competition_id
       WHERE c.type != 'unofficial' AND m.events_complete = 1
       ORDER BY m.date`,
    )
    .all() as Omit<ComebackMatch, "deficit">[];

  const ids = matches.map((m) => m.id);
  const byMatch = new Map<string, { type: string; minute: number }[]>();
  // Pull goals in chunks so the IN-list never blows past SQLite's parameter cap.
  for (let i = 0; i < ids.length; i += 800) {
    const chunk = ids.slice(i, i + 800);
    const rows = db
      .prepare(
        `SELECT match_id, type, minute FROM match_events
         WHERE match_id IN (${chunk.map(() => "?").join(",")})
           AND (type IN ${UNITED_GOAL} OR type IN ${OPP_GOAL})
         ORDER BY match_id, (minute IS NULL), minute, seq`,
      )
      .all(...chunk) as { match_id: string; type: string; minute: number }[];
    for (const r of rows) (byMatch.get(r.match_id) ?? byMatch.set(r.match_id, []).get(r.match_id)!).push(r);
  }

  const summary: ComebackSummary = {
    replayable: matches.length,
    fellBehind: 0,
    recovered: 0,
    wonFromBehind: 0,
    fellTwoPlus: 0,
    twoPlusRecovered: 0,
  };
  const deepest: ComebackMatch[] = [];
  for (const m of matches) {
    let u = 0;
    let o = 0;
    let worst = 0;
    for (const e of byMatch.get(m.id) ?? []) {
      if (UNITED_GOAL_SET.has(e.type)) u++;
      else o++;
      if (u - o < worst) worst = u - o;
    }
    if (worst >= 0) continue; // never trailed
    const deficit = -worst;
    summary.fellBehind++;
    if (m.result !== "L") summary.recovered++;
    if (m.result === "W") summary.wonFromBehind++;
    if (deficit >= 2) {
      summary.fellTwoPlus++;
      if (m.result !== "L") summary.twoPlusRecovered++;
    }
    if (m.result === "W" && deficit >= 2) deepest.push({ ...m, deficit });
  }

  deepest.sort((a, b) => b.deficit - a.deficit || b.date.localeCompare(a.date));
  return { summary, deepest: deepest.slice(0, limit) };
}

// ---------------------------------------------------------------- cup specialists

export interface CupSpecialist {
  player_id: string;
  name: string;
  total: number;
  cup_goals: number;
  league_goals: number;
  thumb_url: string | null;
  image_url: string | null;
}

/** Players whose recorded goals lean most toward cup competitions. */
export function cupSpecialists(minGoals = 25, limit = 10): CupSpecialist[] {
  return getDb()
    .prepare(
      `SELECT e.player_id, p.name, COUNT(*) total,
              SUM(c.type NOT IN ('league','unofficial')) cup_goals,
              SUM(c.type = 'league') league_goals,
              pm.local_path thumb_url,
              pm.local_path image_url
       FROM match_events e
       JOIN matches m ON m.id = e.match_id
       JOIN competitions c ON c.id = m.competition_id
       JOIN players p ON p.id = e.player_id
       LEFT JOIN player_media pm ON pm.player_id = e.player_id
       WHERE e.type IN ('goal','pen-goal')
         AND e.player_side = 'united'
         AND e.player_id IS NOT NULL
       GROUP BY e.player_id HAVING total >= ?
       ORDER BY 1.0*cup_goals/total DESC LIMIT ?`,
    )
    .all(minGoals, limit) as CupSpecialist[];
}

/**
 * Club-wide split of recorded United goals into cup vs league — the baseline a
 * specialist's cup share is measured against. The `cup` fraction is the rate any
 * given goal lands in a cup, so a player well above it "saved goals for cup nights".
 */
export function cupGoalShareBaseline(): { total: number; cup: number; league: number; share: number } {
  const r = getDb()
    .prepare(
      `SELECT COUNT(*) total,
              SUM(c.type NOT IN ('league','unofficial')) cup,
              SUM(c.type = 'league') league
       FROM match_events e
       JOIN matches m ON m.id = e.match_id
       JOIN competitions c ON c.id = m.competition_id
       WHERE e.type IN ('goal','pen-goal')
         AND e.player_side = 'united'
         AND e.player_id IS NOT NULL`,
    )
    .get() as { total: number; cup: number; league: number };
  return { ...r, share: r.cup / r.total };
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
  domesticCup: Record_;
  europeanCup: Record_;
}

// Competition-type buckets. The two 'super-cup' edges are split by id — the UEFA
// Super Cup is European, the Charity/Community Shield and Screen Sport Super Cup are
// domestic. Friendlies/wartime ('unofficial') and the intercontinental finals
// ('world': Intercontinental Cup, Club World Cup) sit outside all buckets.
const DOMESTIC_CUP = "(c.type IN ('domestic-cup','league-cup','playoff') OR (c.type = 'super-cup' AND c.id <> 'uefa-super-cup'))";
const EUROPEAN_CUP = "(c.type = 'european' OR c.id = 'uefa-super-cup')";

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
    domesticCup: rec(DOMESTIC_CUP),
    europeanCup: rec(EUROPEAN_CUP),
  };
}

/** Every match under this manager in date order — feeds {@link longestStreak} and {@link notableMatches}. */
export function managerResultSequence(id: string): SequenceMatch[] {
  return getDb()
    .prepare(
      `SELECT ${SEQ_SELECT}
       FROM matches m JOIN competitions c ON c.id = m.competition_id
       WHERE m.manager_id = ? ORDER BY m.date`,
    )
    .all(id) as SequenceMatch[];
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

export function opponentResultSequence(id: string): SequenceMatch[] {
  return getDb()
    .prepare(
      `SELECT ${SEQ_SELECT}
       FROM matches m JOIN competitions c ON c.id = m.competition_id
       WHERE m.opponent_id = ? ORDER BY m.date`,
    )
    .all(id) as SequenceMatch[];
}

/**
 * Every match in a filtered slice, date-ordered, for the `/matches` ResultSpine.
 * Reads the same filter the list and summary do (via {@link matchWhere}), but is
 * never paginated and always chronological — the spine shows the *shape* of the
 * slice over time regardless of how the list below is sorted.
 */
export function matchesSequence(f: MatchFilter): SequenceMatch[] {
  const { cond, params } = matchWhere(f);
  return getDb()
    .prepare(
      `SELECT ${SEQ_SELECT}
       FROM matches m JOIN competitions c ON c.id = m.competition_id ${cond}
       ORDER BY m.date`,
    )
    .all(params) as SequenceMatch[];
}

// ---------------------------------------------------------------- club records

/** A record-holding match, carrying attendance so the crowd record can lead with it. */
interface RecordMatch extends SequenceMatch {
  attendance: number | null;
}

export interface ClubRecords {
  biggestWin: RecordMatch | null;
  heaviestDefeat: RecordMatch | null;
  recordCrowd: RecordMatch | null;
  mostGoalsInSeason: { season: string; gf: number; p: number } | null;
  longestUnbeaten: Streak | null;
  longestWinning: Streak | null;
}

const REC_SELECT = `m.id, m.date, m.season, m.venue, m.result, m.gf, m.ga, m.aet,
  m.pen_gf, m.pen_ga, m.opponent_name, m.attendance, c.name AS competition_name`;

/**
 * The club's all-time peaks — biggest win, heaviest defeat, record crowd,
 * highest-scoring season, and the longest unbeaten / winning runs — each an
 * answer-object the records chapter leads with rather than a link to a sort.
 *
 * Everything is computed over *official* matches only (friendlies and wartime
 * excluded), so a friendly thrashing or a wartime-league goal glut can't pose as
 * a club record; the runs read off the same date-ordered official sequence. Nulls
 * drop rather than printing a blank card.
 */
export function clubRecords(): ClubRecords {
  const db = getDb();
  const official = "c.type != 'unofficial'";
  const recMatch = (cond: string, order: string) =>
    (db
      .prepare(
        `SELECT ${REC_SELECT} FROM matches m JOIN competitions c ON c.id = m.competition_id
         WHERE ${official} AND ${cond} ORDER BY ${order} LIMIT 1`,
      )
      .get() as RecordMatch | undefined) ?? null;

  const mostGoalsInSeason =
    (db
      .prepare(
        `SELECT m.season, SUM(m.gf) gf, COUNT(*) p
         FROM matches m JOIN competitions c ON c.id = m.competition_id
         WHERE ${official}
         GROUP BY m.season ORDER BY gf DESC, m.season LIMIT 1`,
      )
      .get() as { season: string; gf: number; p: number } | undefined) ?? null;

  const seq = db
    .prepare(
      `SELECT m.date, m.result FROM matches m JOIN competitions c ON c.id = m.competition_id
       WHERE ${official} ORDER BY m.date`,
    )
    .all() as { date: string; result: string }[];

  return {
    biggestWin: recMatch("m.result = 'W'", "(m.gf - m.ga) DESC, m.gf DESC, m.date ASC"),
    heaviestDefeat: recMatch("m.result = 'L'", "(m.gf - m.ga) ASC, m.ga DESC, m.date ASC"),
    recordCrowd: recMatch("m.attendance IS NOT NULL", "m.attendance DESC, m.date ASC"),
    mostGoalsInSeason,
    longestUnbeaten: longestStreak(seq, "unbeaten"),
    longestWinning: longestStreak(seq, "winning"),
  };
}

// ---------------------------------------------------------------- the decline

/** Sir Alex Ferguson's last match in charge — the hinge of the post-Ferguson era. */
const FERGUSON_END = "2013-05-19";

/**
 * A club record (W/D/L/GF/GA) over official matches played in an inclusive date
 * range, plus the derived three-points-per-game rate — the like-for-like era
 * comparison the deep record carries honestly without modern advanced metrics.
 */
export interface EraRecord extends Record_ {
  /** Three-points-per-game, restating older eras on today's terms. */
  ppg: number;
  goalsPerGame: number;
  concededPerGame: number;
}

export function eraRecord(from: string, to: string): EraRecord {
  const r = getDb()
    .prepare(
      `SELECT ${RECORD_COLS_OFFICIAL}
       FROM matches m JOIN competitions c ON c.id = m.competition_id
       WHERE m.date >= ? AND m.date <= ?`,
    )
    .get(from, to) as Record_;
  const p = r.p || 1;
  return {
    ...r,
    ppg: (3 * r.w + r.d) / p,
    goalsPerGame: r.gf / p,
    concededPerGame: r.ga / p,
  };
}

const RECORD_COLS_OFFICIAL = `COUNT(*) p,
  COALESCE(SUM(result='W'),0) w, COALESCE(SUM(result='D'),0) d, COALESCE(SUM(result='L'),0) l,
  COALESCE(SUM(gf),0) gf, COALESCE(SUM(ga),0) ga`;

interface SeasonFinishRow {
  season: string;
  position: number;
  league_size: number;
  competition: string;
}

/** Top-flight league finishes (First Division / Premier League), season by season. */
function topFlightFinishes(): SeasonFinishRow[] {
  return getDb()
    .prepare(
      `SELECT ss.season, ss.position, ss.league_size, c.name AS competition
       FROM season_summaries ss JOIN competitions c ON c.id = ss.competition_id
       WHERE c.type = 'league' AND c.name IN ('First Division','Premier League')
         AND ss.position IS NOT NULL
       ORDER BY ss.season`,
    )
    .all() as SeasonFinishRow[];
}

/** Top-flight titles won across seasons in an inclusive [from,to] season range. */
function titlesInRange(fromSeason: string, toSeason: string): number {
  return (
    getDb()
      .prepare(
        `SELECT COUNT(*) n FROM season_summaries ss JOIN competitions c ON c.id = ss.competition_id
         WHERE c.type = 'league' AND c.name IN ('First Division','Premier League')
           AND ss.position = 1 AND ss.season >= ? AND ss.season <= ?`,
      )
      .get(fromSeason, toSeason) as { n: number }
  ).n;
}

/** Ferguson-era vs post-Ferguson championship floor — titles, average finish, top-four share. */
export interface FergusonFloorSummary {
  fergTitles: number;
  sinceTitles: number;
  fergSeasons: number;
  sinceSeasons: number;
  fergAvgFinish: number;
  sinceAvgFinish: number;
  fergTop4: number;
  sinceTop4: number;
  sinceWorst: number;
}

export function fergusonFloorSummary(): FergusonFloorSummary {
  const fergTitles = titlesInRange("1986-87", "2012-13");
  const sinceTitles = titlesInRange("2013-14", "2999-99");
  const finishes = topFlightFinishes();
  const fergFinishes = finishes.filter((f) => f.season >= "1986-87" && f.season <= "2012-13");
  const sinceFinishes = finishes.filter((f) => f.season >= "2013-14");
  const avg = (rows: SeasonFinishRow[]) =>
    rows.length ? rows.reduce((s, f) => s + f.position, 0) / rows.length : 0;
  return {
    fergTitles,
    sinceTitles,
    fergSeasons: fergFinishes.length,
    sinceSeasons: sinceFinishes.length,
    fergAvgFinish: avg(fergFinishes),
    sinceAvgFinish: avg(sinceFinishes),
    fergTop4: fergFinishes.filter((f) => f.position <= 4).length,
    sinceTop4: sinceFinishes.filter((f) => f.position <= 4).length,
    sinceWorst: sinceFinishes.length ? Math.max(...sinceFinishes.map((f) => f.position)) : 0,
  };
}

interface PostFergusonStint {
  id: string;
  name: string;
  dateFrom: string;
  dateTo: string | null;
  note: string | null;
  interim: boolean;
  p: number;
  ppg: number;
  /** Top-flight league finishes attributed to this stint. */
  finishes: { season: string; position: number }[];
  avgFinish: number | null;
  worstFinish: number | null;
}

function seasonOverlapsTenure(season: string, from: string, to: string | null): boolean {
  const y = Number(season.slice(0, 4));
  const seasonStart = `${y}-07-01`;
  const seasonEnd = `${y + 1}-06-30`;
  const end = to ?? "9999-12-31";
  return from <= seasonEnd && end >= seasonStart;
}

/** Season-by-season league finish from Ferguson's arrival — the title-floor timeline. */
export interface FloorTimelinePoint {
  season: string;
  year: number;
  position: number;
  leagueSize: number;
  champion: boolean;
  postFerguson: boolean;
}

export function fergusonFloorTimeline(): FloorTimelinePoint[] {
  return topFlightFinishes()
    .filter((f) => f.season >= "1986-87")
    .map((f) => ({
      season: f.season,
      year: Number(f.season.slice(0, 4)),
      position: f.position,
      leagueSize: f.league_size,
      champion: f.position === 1,
      postFerguson: f.season >= "2013-14",
    }));
}

/** Post-Ferguson managerial stints with league finishes — the succession story. */
function postFergusonStints(): PostFergusonStint[] {
  const tenures = getDb()
    .prepare(
      `SELECT mt.manager_id id, mg.name, mt.date_from dateFrom, mt.date_to dateTo, mt.note
       FROM manager_tenures mt JOIN managers mg ON mg.id = mt.manager_id
       WHERE mt.date_from >= ?
       ORDER BY mt.date_from`,
    )
    .all(FERGUSON_END) as {
    id: string;
    name: string;
    dateFrom: string;
    dateTo: string | null;
    note: string | null;
  }[];

  const seasons = getDb()
    .prepare(
      `WITH primary_manager AS (
         SELECT m.season, m.manager_id,
                ROW_NUMBER() OVER (PARTITION BY m.season ORDER BY COUNT(*) DESC) rn
         FROM matches m JOIN competitions c ON c.id = m.competition_id
         WHERE c.type = 'league' AND m.season >= '2013-14'
         GROUP BY m.season, m.manager_id
       )
       SELECT pm.season, pm.manager_id id, ss.position
       FROM primary_manager pm
       JOIN season_summaries ss ON ss.season = pm.season
       JOIN competitions c ON c.id = ss.competition_id
       WHERE pm.rn = 1 AND c.type = 'league' AND ss.position IS NOT NULL
         AND c.name IN ('First Division','Premier League')
       ORDER BY pm.season`,
    )
    .all() as { season: string; id: string; position: number }[];

  return tenures.map((t) => {
    const record = eraRecord(t.dateFrom, t.dateTo ?? "9999-12-31");
    const finishes = seasons.filter(
      (s) => s.id === t.id && seasonOverlapsTenure(s.season, t.dateFrom, t.dateTo),
    );
    const positions = finishes.map((f) => f.position);
    const interim = Boolean(
      record.p < 15
      && (t.note?.toLowerCase().includes("interim") || t.note?.toLowerCase().includes("caretaker"))
      && !t.note?.toLowerCase().includes("permanent"),
    );
    return {
      id: t.id,
      name: t.name,
      dateFrom: t.dateFrom,
      dateTo: t.dateTo,
      note: t.note,
      interim,
      p: record.p,
      ppg: record.ppg,
      finishes,
      avgFinish: positions.length ? positions.reduce((a, b) => a + b, 0) / positions.length : null,
      worstFinish: positions.length ? Math.max(...positions) : null,
    };
  });
}

export interface PostFergusonFloorMoment {
  id: "first" | "best" | "worst";
  tag: string;
  season: string;
  managerId: string;
  managerName: string;
  league: {
    season: string;
    competition_id: string;
    competition_name: string;
    type: string;
    p: number;
    w: number;
    d: number;
    l: number;
    gf: number;
    ga: number;
    furthest_round: string | null;
    position: number;
    league_size: number;
  };
  note: string;
  /** Set when another post-Ferguson season tied the same league finish (e.g. two 2nds). */
  footnote?: string;
  tone: "first" | "peak" | "floor";
}

/** Three inspectable post-Ferguson seasons — first, best, and worst league finishes. */
export function postFergusonFloorMoments(): PostFergusonFloorMoment[] {
  const rows = getDb()
    .prepare(
      `WITH primary_manager AS (
         SELECT m.season, m.manager_id, mg.name,
                ROW_NUMBER() OVER (PARTITION BY m.season ORDER BY COUNT(*) DESC) rn
         FROM matches m
         JOIN managers mg ON mg.id = m.manager_id
         JOIN competitions c ON c.id = m.competition_id
         WHERE c.type = 'league' AND m.season >= '2013-14'
         GROUP BY m.season, m.manager_id
       )
       SELECT pm.season, pm.manager_id id, pm.name,
              ss.competition_id, c.name AS competition_name, c.type,
              ss.p, ss.w, ss.d, ss.l, ss.gf, ss.ga, ss.furthest_round,
              ss.position, ss.league_size
       FROM primary_manager pm
       JOIN season_summaries ss ON ss.season = pm.season AND ss.competition_id IN (
         SELECT id FROM competitions WHERE type = 'league' AND name IN ('First Division','Premier League')
       )
       JOIN competitions c ON c.id = ss.competition_id
       WHERE pm.rn = 1 AND ss.position IS NOT NULL
       ORDER BY pm.season`,
    )
    .all() as {
    season: string;
    id: string;
    name: string;
    competition_id: string;
    competition_name: string;
    type: string;
    p: number;
    w: number;
    d: number;
    l: number;
    gf: number;
    ga: number;
    furthest_round: string | null;
    position: number;
    league_size: number;
  }[];

  if (rows.length === 0) return [];

  const first = rows[0];
  const minPos = Math.min(...rows.map((r) => r.position));
  const best = rows.find((r) => r.position === minPos)!;
  const worst = rows.reduce((a, b) => (a.position > b.position ? a : b));

  const ord = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
  };

  const toMoment = (
    row: typeof rows[number],
    id: PostFergusonFloorMoment["id"],
    tag: string,
    note: string,
    tone: PostFergusonFloorMoment["tone"],
    footnote?: string,
  ): PostFergusonFloorMoment => ({
    id,
    tag,
    season: row.season,
    managerId: row.id,
    managerName: row.name,
    league: {
      season: row.season,
      competition_id: row.competition_id,
      competition_name: row.competition_name,
      type: row.type,
      p: row.p,
      w: row.w,
      d: row.d,
      l: row.l,
      gf: row.gf,
      ga: row.ga,
      furthest_round: row.furthest_round,
      position: row.position,
      league_size: row.league_size,
    },
    note,
    footnote,
    tone,
  });

  const tiedBest = rows.filter((r) => r.position === minPos && r.season !== best.season);
  const bestFootnote =
    tiedBest.length > 0
      ? `Also finished ${ord(minPos)} in ${tiedBest.map((r) => `${r.season} under ${managerSurname(r.name)}`).join(" and ")}.`
      : undefined;

  return [
    toMoment(
      first,
      "first",
      "First season after Ferguson",
      "Seven weeks after Ferguson left, United finished seventh — their lowest placing since 1990 and the first campaign outside the top four in twenty years.",
      "first",
    ),
    toMoment(
      best,
      "best",
      "Best finish since Ferguson",
      best.position === 2
        ? "Nineteen points behind City, but second place — as close as any successor has come to bridging the gap."
        : `Finished ${ord(best.position)} — the best league campaign of the post-Ferguson era.`,
      "peak",
      bestFootnote,
    ),
    toMoment(
      worst,
      "worst",
      "Worst finish since Ferguson",
      worst.position >= 15
        ? "Fifteenth in the table — three places off the relegation zone, the lowest finish in the Premier League era."
        : `Finished ${ord(worst.position)} — the deepest the floor has fallen since May 2013.`,
      "floor",
    ),
  ];
}

// ---------------------------------------------------------------- ferguson vs field

export interface ManagerLongevityPoint {
  id: string;
  name: string;
  label: string;
  matches: number;
  ppg: number;
  href: string;
  kind: "ferguson" | "busby" | "since" | "other";
  tenureFrom?: string;
}

function managerSurname(name: string): string {
  return name.replace(/^Sir |^José |^Louis |^Erik |^Rúben |^Ralf |^Ole Gunnar /, "").split(" ").pop() ?? name;
}

/**
 * Every permanent manager on longevity (official matches) × points per game.
 * Ferguson and Busby carry career totals; post-2013 spells are tenure-by-tenure
 * so the churn reads as a cluster short on games. Caretaker/interim spells under
 * 20 matches are dropped.
 */
export function managerLongevityField(minSinceMatches = 20): ManagerLongevityPoint[] {
  const ranking = managerPpgRanking(30);
  const sinceIds = new Set(postFergusonStints().map((s) => s.id));
  const points: ManagerLongevityPoint[] = [];

  const push = (row: Omit<ManagerLongevityPoint, "label"> & { label?: string }) => {
    points.push({ ...row, label: row.label ?? managerSurname(row.name) });
  };

  const ferg = ranking.find((m) => m.id === "alex-ferguson");
  if (ferg) {
    push({
      id: ferg.id,
      name: ferg.name,
      label: "Ferguson",
      matches: ferg.p,
      ppg: ferg.ppg,
      href: `/manager/${ferg.id}`,
      kind: "ferguson",
    });
  }

  const busby = ranking.find((m) => m.id === "matt-busby");
  if (busby) {
    push({
      id: busby.id,
      name: busby.name,
      label: "Busby",
      matches: busby.p,
      ppg: busby.ppg,
      href: `/manager/${busby.id}`,
      kind: "busby",
    });
  }

  for (const m of ranking) {
    if (m.id === "alex-ferguson" || m.id === "matt-busby" || sinceIds.has(m.id)) continue;
    push({
      id: m.id,
      name: m.name,
      matches: m.p,
      ppg: m.ppg,
      href: `/manager/${m.id}`,
      kind: "other",
    });
  }

  for (const s of postFergusonStints()) {
    if (s.interim || s.p < minSinceMatches) continue;
    push({
      id: s.id,
      name: s.name,
      label: `${s.dateFrom.slice(2, 4)}–${(s.dateTo ?? "now").slice(2, 4)} · ${managerSurname(s.name)}`,
      matches: s.p,
      ppg: s.ppg,
      href: `/manager/${s.id}`,
      kind: "since",
      tenureFrom: s.dateFrom,
    });
  }

  return points;
}

interface ManagerRateRow extends Record_ {
  id: string;
  name: string;
  ppg: number;
}

/**
 * Permanent managers ranked by three-points-per-game over official matches.
 * Caretakers (under 30 matches) are dropped so a four-game caretaker stint can
 * never top a real reign — the comparison the question "was he that far ahead?"
 * actually asks.
 */
function managerPpgRanking(minMatches = 30): ManagerRateRow[] {
  const rows = getDb()
    .prepare(
      `SELECT mg.id, mg.name, ${RECORD_COLS_OFFICIAL}
       FROM managers mg JOIN matches m ON m.manager_id = mg.id
       JOIN competitions c ON c.id = m.competition_id
       WHERE c.type != 'unofficial'
       GROUP BY mg.id HAVING p >= ? ORDER BY 1.0*(3*SUM(m.result='W')+SUM(m.result='D'))/COUNT(*) DESC`,
    )
    .all(minMatches) as (Record_ & { id: string; name: string })[];
  return rows.map((r) => ({
    ...r,
    ppg: (3 * r.w + r.d) / (r.p || 1),
  }));
}

// ---------------------------------------------------------------- treble season

/** A single competition's run within a season, with its deciding (last) match. */
export interface SeasonRun {
  competition_id: string;
  competition_name: string;
  type: string;
  p: number; w: number; d: number; l: number; gf: number; ga: number;
  position: number | null;
  /** Was the trophy won this season (the deciding final won, or league pos 1)? */
  won: boolean;
  /** The deciding match: the last league game, or the final. */
  decider: SequenceMatch | null;
}

/**
 * The 1998-99 Treble broken into its three winning runs — Premier League, FA
 * Cup, Champions League — each with its record and the match that decided it.
 * Drawn from the complete result-level record for that season.
 */
export function trebleRuns(season = "1998-99"): SeasonRun[] {
  const db = getDb();
  const comps = db
    .prepare(
      `SELECT c.id AS competition_id, c.name AS competition_name, c.type,
              COUNT(*) p, SUM(m.result='W') w, SUM(m.result='D') d, SUM(m.result='L') l,
              SUM(m.gf) gf, SUM(m.ga) ga, ss.position
       FROM matches m JOIN competitions c ON c.id = m.competition_id
       LEFT JOIN season_summaries ss ON ss.season = m.season AND ss.competition_id = c.id
       WHERE m.season = ? AND c.type IN ('league','domestic-cup','european')
       GROUP BY c.id ORDER BY c.type, c.name`,
    )
    .all(season) as (Omit<SeasonRun, "won" | "decider"> & { type: string })[];

  return comps.map((c) => {
    const won = c.type === "league" ? c.position === 1 : cupWon(c.competition_id, season);
    const decider = c.type === "league"
      ? lastMatch(season, c.competition_id)
      : decidingFinal(season, c.competition_id);
    return { ...c, won, decider };
  });
}

/** One United goal in a deciding match, minute-stamped and named. */
interface TrebleGoal {
  minute: number;
  added: number | null;
  scorer: string | null;
  /** Scored in the 90th minute or later. */
  stoppage: boolean;
}

/** A trophy-deciding night, with United's goals as the record holds them. */
export interface TrebleDecider {
  competition_id: string;
  competition_name: string;
  id: string;
  date: string;
  opponent_name: string;
  venue: string;
  gf: number;
  ga: number;
  aet: number;
  goals: TrebleGoal[];
  /** Every United goal came at 90'+ — the Champions League final, won from behind. */
  wonInStoppage: boolean;
}

/**
 * The three nights that clinched the Treble, in the order they happened — the
 * last league game, the FA Cup final, the European Cup final — each with United's
 * minute-stamped, named goals. The drama is in the timings the record holds: the
 * European Cup was won with two goals after the 90th minute, the only United
 * goals of the match.
 */
export function trebleDeciders(season = "1998-99"): TrebleDecider[] {
  return trebleRuns(season)
    .filter((r) => r.won && r.decider)
    .map((r) => {
      const d = r.decider!;
      const goals: TrebleGoal[] = eventsForMatch(d.id)
        .filter((e) => e.type === "goal" && e.player_side === "united")
        .map((e) => ({
          minute: e.minute ?? 0,
          added: e.added_time,
          scorer: e.player_display_name,
          stoppage: (e.minute ?? 0) >= 90,
        }));
      return {
        competition_id: r.competition_id,
        competition_name: r.competition_name,
        id: d.id,
        date: d.date,
        opponent_name: d.opponent_name,
        venue: d.venue,
        gf: d.gf,
        ga: d.ga,
        aet: d.aet,
        goals,
        wonInStoppage: goals.length > 0 && goals.every((g) => g.stoppage),
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Aggregate facts for a Treble season — volume, goals, losses, decider span. */
export interface TrebleSummary {
  season: string;
  trophies: number;
  matches: number;
  losses: number;
  goals: number;
  spanDays: number;
  month: string;
  year: string;
  /** Deciders where United trailed at some point during the match. */
  decidersFromBehind: number;
  wonRuns: SeasonRun[];
}

/**
 * Shared Treble headline numbers — match count from the full season sequence,
 * losses and goals from the whole season, calendar span of the three deciders,
 * and how many of those nights required chasing the score.
 */
export function trebleSummary(season = "1998-99"): TrebleSummary {
  const runs = trebleRuns(season);
  const wonRuns = runs.filter((r) => r.won);
  const deciders = trebleDeciders(season);
  const seasonSeq = matchesSequence({ season });
  const db = getDb();
  const seasonRec = db
    .prepare(`SELECT COUNT(*) p, SUM(m.result='L') l, SUM(m.gf) gf FROM matches m WHERE m.season = ?`)
    .get(season) as { p: number; l: number; gf: number };

  const first = deciders[0];
  const last = deciders[deciders.length - 1];
  const spanDays =
    first && last ? Math.round((Date.parse(last.date) - Date.parse(first.date)) / 86_400_000) : 0;
  const month = first
    ? new Date(`${first.date}T00:00:00`).toLocaleDateString("en-GB", { month: "long" })
    : "";
  const year = first ? first.date.slice(0, 4) : "";

  let decidersFromBehind = 0;
  for (const d of deciders) {
    const events = eventsForMatch(d.id).filter(
      (e) =>
        (UNITED_GOAL_SET.has(e.type) || e.type === "opp-goal" || e.type === "own-goal-against") &&
        e.minute != null,
    );
    if (events.length === 0) {
      if (d.ga > 0 && d.gf > d.ga) decidersFromBehind++;
      continue;
    }
    let u = 0;
    let o = 0;
    let trailed = false;
    for (const e of events) {
      if (e.player_side === "united" || UNITED_GOAL_SET.has(e.type)) u++;
      else o++;
      if (u - o < 0) trailed = true;
    }
    if (trailed) decidersFromBehind++;
  }

  return {
    season,
    trophies: wonRuns.length,
    matches: seasonSeq.length,
    losses: seasonRec.l,
    goals: seasonRec.gf,
    spanDays,
    month,
    year,
    decidersFromBehind,
    wonRuns,
  };
}

/** Short competition label for Treble OG rows (League / FA Cup / Europe). */
export function trebleRunLabel(r: SeasonRun): string {
  if (r.type === "league") return "League";
  if (r.type === "european") return "Europe";
  return "FA Cup";
}

/** Shared gloss for explore headline and OG card — derived from `trebleSummary`. */
export function trebleGloss(s: TrebleSummary): string {
  return `trophies in ${s.season} — ${s.losses} defeats, all three won inside ${s.spanDays} days in ${s.month} ${s.year}`;
}

/** One goal in a Treble semi-final, with the side that scored. */
interface TrebleSemiGoal {
  minute: number;
  added: number | null;
  scorer: string | null;
  side: "united" | "opponent";
  stoppage: boolean;
}

/** A semi-final from the Treble season, with the full goal replay both sides. */
export interface TrebleSemi extends SequenceMatch {
  goals: TrebleSemiGoal[];
  /** Deepest deficit United climbed out of (0 = never trailed). */
  deficit: number;
}

const SEMI_PREDICATE = roundFilterPredicate("semi-final", "m");

/**
 * The semi-final nights that forged the Treble — the Juventus second leg (2-0
 * down after 11 minutes, won 3-2) and the FA Cup semi-final replay (won in extra
 * time). Each carries the minute-stamped goals *both sides* scored, so the
 * comeback is visible in the timings, not just the scoreline. Restricted to
 * United wins so the scoreless first legs drop.
 */
export function trebleSemis(season = "1998-99"): TrebleSemi[] {
  const db = getDb();
  const matches = db
    .prepare(
      `SELECT ${SEQ_SELECT}
       FROM matches m JOIN competitions c ON c.id = m.competition_id
       WHERE m.season = ? AND c.type IN ('domestic-cup','european')
         AND ${SEMI_PREDICATE} AND m.result = 'W'
       ORDER BY m.date`,
    )
    .all(season) as SequenceMatch[];

  return matches.map((m) => {
    const events = eventsForMatch(m.id).filter(
      (e) =>
        (UNITED_GOAL_SET.has(e.type) || e.type === "opp-goal" || e.type === "own-goal-against") &&
        e.minute != null,
    );
    const goals: TrebleSemiGoal[] = events.map((e) => ({
      minute: e.minute ?? 0,
      added: e.added_time,
      scorer: e.player_display_name,
      side: e.player_side,
      stoppage: (e.minute ?? 0) >= 90,
    }));
    let u = 0, o = 0, worst = 0;
    for (const e of events) {
      if (e.player_side === "united") u++;
      else o++;
      if (u - o < worst) worst = u - o;
    }
    return { ...m, goals, deficit: Math.max(0, -worst) };
  });
}

function cupWon(competitionId: string, season: string): boolean {
  return (
    (getDb()
      .prepare(
        `SELECT COUNT(*) n FROM matches m JOIN competitions c ON c.id = m.competition_id
         WHERE ${CUP_WON_PREDICATE} AND m.season = ? AND m.competition_id = ?`,
      )
      .get(season, competitionId) as { n: number }).n > 0
  );
}

function lastMatch(season: string, competitionId: string): SequenceMatch | null {
  return (
    (getDb()
      .prepare(
        `SELECT ${SEQ_SELECT} FROM matches m JOIN competitions c ON c.id = m.competition_id
         WHERE m.season = ? AND m.competition_id = ? ORDER BY m.date DESC LIMIT 1`,
      )
      .get(season, competitionId) as SequenceMatch | undefined) ?? null
  );
}

function decidingFinal(season: string, competitionId: string): SequenceMatch | null {
  return (
    (getDb()
      .prepare(
        `SELECT ${SEQ_SELECT} FROM matches m JOIN competitions c ON c.id = m.competition_id
         WHERE m.season = ? AND m.competition_id = ?
           AND ${FINAL_PREDICATE}
         ORDER BY m.date DESC LIMIT 1`,
      )
      .get(season, competitionId) as SequenceMatch | undefined) ?? null
  );
}

// ---------------------------------------------------------------- europe

export interface EuropeDecadeRow extends Record_ {
  decade: string;
}

/** European record (Champions League / UEFA Cup / Europa League / Cup Winners' Cup / Super Cup) by decade. */
export function europeByDecade(): EuropeDecadeRow[] {
  return getDb()
    .prepare(
      `SELECT substr(m.date,1,3) || '0s' decade, ${RECORD_COLS_OFFICIAL}
       FROM matches m JOIN competitions c ON c.id = m.competition_id
       WHERE (c.type = 'european' OR c.id = 'uefa-super-cup')
       GROUP BY 1 ORDER BY 1`,
    )
    .all() as EuropeDecadeRow[];
}

interface EuropeSeasonRow extends Record_ {
  season: string;
}

export interface EuropeSeasonPoint extends EuropeSeasonRow {
  /** Win percentage when p ≥ 2; null when no football or too few matches for a rate. */
  rate: number | null;
}

/** Every season from first to last European match, with gaps where United didn't play in Europe. */
export function europeWinRateTimeline(): EuropeSeasonPoint[] {
  const rows = getDb()
    .prepare(
      `SELECT m.season, ${RECORD_COLS_OFFICIAL}
       FROM matches m JOIN competitions c ON c.id = m.competition_id
       WHERE (c.type = 'european' OR c.id = 'uefa-super-cup')
       GROUP BY 1 ORDER BY 1`,
    )
    .all() as EuropeSeasonRow[];
  if (rows.length === 0) return [];

  const bySeason = new Map(rows.map((r) => [r.season, r]));
  const allAsc = seasonsAscending(allSeasons());
  const lo = allAsc.indexOf(rows[0].season);
  const hi = allAsc.indexOf(rows[rows.length - 1].season);
  if (lo < 0 || hi < 0) return [];

  return allAsc.slice(lo, hi + 1).map((season) => {
    const row = bySeason.get(season);
    if (!row) {
      return { season, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, rate: null };
    }
    return {
      ...row,
      rate: row.p >= 2 ? Math.round((100 * row.w) / row.p) : null,
    };
  });
}

/** Every official European match in date order — same slice as {@link europeByDecade}. */
export function europeMatchSequence(): SequenceMatch[] {
  return getDb()
    .prepare(
      `SELECT ${SEQ_SELECT}
       FROM matches m JOIN competitions c ON c.id = m.competition_id
       WHERE (c.type = 'european' OR c.id = 'uefa-super-cup')
       ORDER BY m.date`,
    )
    .all() as SequenceMatch[];
}

/** Every European final (won or lost) United has reached. */
export function europeanFinals(): (SequenceMatch & { outcome: string; won: boolean })[] {
  const rows = getDb()
    .prepare(
      `SELECT ${SEQ_SELECT}, m.outcome
       FROM matches m JOIN competitions c ON c.id = m.competition_id
       WHERE (c.type = 'european' OR c.id = 'uefa-super-cup')
         AND ${FINAL_PREDICATE}
       ORDER BY m.date`,
    )
    .all() as (SequenceMatch & { outcome: string })[];
  return rows.map((r) => ({ ...r, won: r.outcome === "W" }));
}
