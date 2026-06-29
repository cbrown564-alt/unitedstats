import type Database from "better-sqlite3";
import { MATCH_SELECT, type MatchRow } from "./queries";
import { buildCupRun } from "./cupRun";
import { CURATED_NIGHTS } from "./greatNights";
import { ICONIC_LATE_DATES } from "./trails";
import { RIVALRY_IDS } from "./entryPoints";

/**
 * The rediscovery engine's *charge scorer* (Phase 3a — `docs/RESTRAINT-PASS.md`,
 * `CONTEXT.md` §6). The product's strongest organic reaction was a fan
 * rediscovering the 2015 Europa League exit — a *forgotten, emotionally-charged*
 * night. That is a computable class, not random: **charge × fadedness**.
 *
 * This module computes a per-match `charge` (how much a night carries, whoever you
 * are) and `fadedness` (how *forgotten* it is — the inversion that suppresses the
 * famous nights the curated hero already owns), at **build time** into the
 * `match_charge` table. The request-time selector (`lib/rediscovery.ts`) then reads
 * that table cheaply and adds the per-reader "your era" bias. Doing the heavy
 * full-archive scans once at build keeps the static-render guardrail intact.
 *
 * Unlike the positive-only hero (`lib/greatNights.ts`), **defeats are eligible** —
 * a forgotten gut-punch (a knockout exit, a collapse, a shock loss) is exactly the
 * kind of charged night rediscovery is for.
 *
 * Every factor reuses an existing engine rather than re-deriving it
 * (`RESTRAINT-PASS` Principle 4): `buildCupRun` for knockout exits, the
 * `comebacks`/`leadHeldAtHome` replay logic for comebacks & collapses, the
 * `streaks` run logic for streak-enders, `elo_history.expected` for upsets.
 */

// ---------------------------------------------------------------- shape

/** The nine charge factors. Stored as *weighted* contributions, so they sum to
 *  `charge` and the largest is the `reason` (which drives the prompt copy). */
export interface ChargeComponents {
  /** Knocked out of a cup — esp. European, esp. an upset. The 2015 class. */
  knockoutExit: number;
  /** Result far from the Elo expectation: a giant-killing win or a shock loss. */
  upset: number;
  /** Won or rescued a match United had trailed in. */
  comeback: number;
  /** Led, then dropped points — the lead surrendered. */
  collapse: number;
  /** A late or stoppage-time goal that decided a tight match. */
  lateDrama: number;
  /** A meeting with a rivalry club (Liverpool, City, Arsenal, Leeds, Chelsea). */
  rivalry: number;
  /** An extreme margin — a rout, or a hammering taken. */
  scoreline: number;
  /** The match that broke a long unbeaten/winning run, or ended a long drought. */
  streakEnder: number;
  /** A big crowd for its era (attendance percentile within the decade). */
  crowd: number;
}

export type ReasonKind = keyof ChargeComponents;

export interface ChargeRow {
  match_id: string;
  /** Composite, before fadedness — how much the night carries, era-agnostic. */
  charge: number;
  /** 0..1: how *forgotten* the night is (living-memory window × fame penalty). */
  fadedness: number;
  /** `charge * fadedness` — the reader-independent rediscoverability rank. */
  score: number;
  /** The dominant factor, or `"none"` when nothing charged the match. */
  reason: ReasonKind | "none";
  /** The weighted per-factor breakdown (sums to `charge`), for transparency. */
  components: ChargeComponents;
}

// ---------------------------------------------------------------- weights

/**
 * How much each factor is worth at full strength. The raw factor functions return
 * 0..1; these scale them into the composite and decide which factor *wins* a match
 * (the `reason`). Tuned against the inspection script (`scripts/rediscovery-preview.ts`).
 */
const WEIGHTS: Record<ReasonKind, number> = {
  knockoutExit: 1.0,
  upset: 1.0,
  comeback: 0.9,
  collapse: 0.9,
  lateDrama: 0.8,
  rivalry: 0.7,
  scoreline: 0.7,
  streakEnder: 0.6,
  crowd: 0.35,
};

const clamp01 = (n: number): number => (n < 0 ? 0 : n > 1 ? 1 : n);

// ---------------------------------------------------------------- goal events

/** United's goals count by *type* (an own goal for us carries `player_side =
 *  'opponent'`), matching `lib/trails.ts`. */
const UNITED_GOAL = new Set(["goal", "pen-goal", "own-goal-for"]);
const OPP_GOAL = new Set(["opp-goal", "own-goal-against"]);

interface GoalEv {
  type: string;
  minute: number | null;
  added: number | null;
}

/** Effective clock minute including stoppage — for late-drama detection. */
function effMinute(g: GoalEv): number {
  return (g.minute ?? 0) + (g.added ?? 0);
}
function isStoppage(g: GoalEv): boolean {
  return (g.minute ?? 0) > 90 || ((g.minute ?? 0) >= 90 && (g.added ?? 0) > 0);
}

interface ReplayResult {
  comeback: number;
  collapse: number;
  lateDrama: number;
}

/**
 * Replay one match's goals in order to read its *shape*: the deepest deficit
 * United climbed out of, the biggest lead they surrendered, and whether a late
 * goal decided a tight game. Only trustworthy when every goal carries a minute
 * (`events_complete`) and the replay reproduces the recorded score — the same
 * contract `comebacks()` and `leadHeldAtHome()` use — otherwise these factors stay
 * 0 and the night leans on its era-neutral signals (exit, upset, rivalry, margin).
 */
function replayShape(m: MatchRow, goals: GoalEv[]): ReplayResult {
  const none: ReplayResult = { comeback: 0, collapse: 0, lateDrama: 0 };
  if (!m.events_complete) return none;
  if (goals.length === 0) return none;
  if (goals.some((g) => g.minute == null)) return none;

  let u = 0;
  let o = 0;
  let worst = 0; // most negative running margin (deepest deficit)
  let peak = 0; // most positive running margin (biggest lead)
  let lateSwing = false; // a goal at 88'+ that set the final lead state

  for (const g of goals) {
    const beforeSign = Math.sign(u - o);
    if (UNITED_GOAL.has(g.type)) u++;
    else if (OPP_GOAL.has(g.type)) o++;
    else continue;
    const margin = u - o;
    if (margin < worst) worst = margin;
    if (margin > peak) peak = margin;
    // A goal in the closing minutes that flipped the lead into the final result.
    if (effMinute(g) >= 88 && Math.sign(margin) !== beforeSign && Math.sign(margin) === resultSign(m)) {
      lateSwing = true;
    }
  }

  // Reconstructed score must match the record, else the replay is untrustworthy.
  if (u !== m.gf || o !== m.ga) return none;

  // Comeback: trailed, then didn't lose. Deeper deficit = more charge.
  let comeback = 0;
  if (worst < 0 && m.result !== "L") {
    const deficit = -worst;
    comeback = deficit >= 3 ? 1 : deficit === 2 ? 0.75 : 0.45;
    if (m.result === "W") comeback = clamp01(comeback + 0.1); // won it, not just rescued
  }

  // Collapse: led, then dropped points. Bigger lead blown = more charge; losing
  // from ahead is the real gut-punch.
  let collapse = 0;
  if (peak >= 1 && m.result !== "W") {
    collapse = peak >= 3 ? 0.9 : peak === 2 ? 0.7 : 0.4;
    if (m.result === "L") collapse = clamp01(collapse + 0.25); // led and lost
  }

  // Late drama: a tight game settled in the closing minutes.
  let lateDrama = 0;
  if (lateSwing && Math.abs(m.gf - m.ga) <= 1) {
    const lastLate = goals.filter((g) => effMinute(g) >= 88).some(isStoppage);
    lateDrama = lastLate ? 0.85 : 0.6;
  }

  return { comeback, collapse, lateDrama };
}

function resultSign(m: MatchRow): number {
  return m.result === "W" ? 1 : m.result === "L" ? -1 : 0;
}

// ---------------------------------------------------------------- era-neutral factors

/** Giant-killing / shock loss from the Elo expectation. `expected` is United's
 *  pre-match win expectancy (0..1); a result far from it is a surprise either way. */
function upsetFactor(m: MatchRow, expected: number | undefined): number {
  if (expected == null) return 0;
  const actual = m.result === "W" ? 1 : m.result === "D" ? 0.5 : 0;
  const surprise = Math.abs(actual - expected);
  return clamp01((surprise - 0.25) / 0.6); // only count surprises beyond a coin-flip
}

/** A meeting with a rivalry club, charged a little more by the margin. */
function rivalryFactor(m: MatchRow): number {
  if (!RIVALRY_IDS.has(m.opponent_id)) return 0;
  return clamp01(0.45 + 0.1 * Math.abs(m.gf - m.ga));
}

/** An extreme margin in either direction (a rout given, or a hammering taken). */
function scorelineFactor(m: MatchRow): number {
  const margin = Math.abs(m.gf - m.ga);
  return margin >= 3 ? clamp01((margin - 2) / 4) : 0;
}

// ---------------------------------------------------------------- fadedness

const FAMOUS_PENALTY = 0.15;

/**
 * How *forgotten* a night is by years-ago: a living-memory window. Rises from a
 * low floor for last season (a fan hasn't forgotten it yet), plateaus across the
 * ~5–28-years-ago zone (the rediscovery sweet spot), then decays toward a low
 * floor for the pre-living-memory deep archive — which is the curated hero's
 * "a night you never saw" mode, not this engine's. Never zero: a charged deep-cut
 * can still surface, just rarely.
 */
export function ageBand(yearsAgo: number): number {
  if (yearsAgo < 1) return 0.15;
  if (yearsAgo < 5) return 0.15 + 0.85 * ((yearsAgo - 1) / 4); // ramp 0.15 → 1.0
  if (yearsAgo <= 28) return 1.0; // the sweet spot
  if (yearsAgo <= 66) return 1.0 - 0.8 * ((yearsAgo - 28) / 38); // decay 1.0 → 0.2
  return 0.2; // deep archive floor (pre-~1960)
}

/** `ageBand` × a strong penalty when the night is canonically famous (so the
 *  curated hero owns it, not rediscovery). */
export function fadedness(year: number, famous: boolean, now = new Date()): number {
  const band = ageBand(now.getUTCFullYear() - year);
  return famous ? band * FAMOUS_PENALTY : band;
}

// ---------------------------------------------------------------- the orchestrator

/**
 * Score every match into a `ChargeRow`, in a small fixed number of full scans (no
 * per-match queries). Takes the *build's* db handle so it runs during `build-db.ts`
 * against the freshly-populated tables, not the readonly `getDb()` singleton.
 */
export function computeAllCharge(db: Database.Database, now = new Date()): ChargeRow[] {
  const matches = db.prepare(`${MATCH_SELECT} ORDER BY m.date, m.id`).all() as MatchRow[];

  // One pass for every goal, grouped by match (united + opponent goals only).
  const goalsByMatch = new Map<string, GoalEv[]>();
  const goalRows = db
    .prepare(
      `SELECT match_id, type, minute, added_time AS added FROM match_events
       WHERE type IN ('goal','pen-goal','own-goal-for','opp-goal','own-goal-against')
       ORDER BY match_id, (minute IS NULL), minute, seq`,
    )
    .all() as { match_id: string; type: string; minute: number | null; added: number | null }[];
  for (const r of goalRows) {
    const arr = goalsByMatch.get(r.match_id) ?? [];
    arr.push({ type: r.type, minute: r.minute, added: r.added });
    goalsByMatch.set(r.match_id, arr);
  }

  // Elo expectancy per match.
  const expectedByMatch = new Map<string, number>();
  for (const r of db.prepare("SELECT match_id, expected FROM elo_history").all() as {
    match_id: string;
    expected: number;
  }[]) {
    expectedByMatch.set(r.match_id, r.expected);
  }

  const knockoutExitById = knockoutExits(matches);
  const streakEnderById = streakEnders(matches);
  const crowdPctById = crowdPercentiles(matches);
  const famousIds = famousSet(matches);

  return matches.map((m) => {
    const goals = goalsByMatch.get(m.id) ?? [];
    const shape = replayShape(m, goals);

    // Weighted contributions — these sum to `charge` and pick the `reason`.
    const components: ChargeComponents = {
      knockoutExit: WEIGHTS.knockoutExit * (knockoutExitById.get(m.id) ?? 0),
      upset: WEIGHTS.upset * upsetFactor(m, expectedByMatch.get(m.id)),
      comeback: WEIGHTS.comeback * shape.comeback,
      collapse: WEIGHTS.collapse * shape.collapse,
      lateDrama: WEIGHTS.lateDrama * shape.lateDrama,
      rivalry: WEIGHTS.rivalry * rivalryFactor(m),
      scoreline: WEIGHTS.scoreline * scorelineFactor(m),
      streakEnder: WEIGHTS.streakEnder * (streakEnderById.get(m.id) ?? 0),
      crowd: WEIGHTS.crowd * (crowdPctById.get(m.id) ?? 0),
    };

    const charge = (Object.values(components) as number[]).reduce((a, b) => a + b, 0);
    const reason = dominant(components);
    const faded = fadedness(Number(m.date.slice(0, 4)), famousIds.has(m.id), now);

    return {
      match_id: m.id,
      charge,
      fadedness: faded,
      score: charge * faded,
      reason,
      components,
    };
  });
}

/** The factor that contributed most, or `"none"` when the match isn't charged. */
function dominant(c: ChargeComponents): ReasonKind | "none" {
  let best: ReasonKind | "none" = "none";
  let bestVal = 0.01; // epsilon: an essentially-flat match has no reason
  for (const [k, v] of Object.entries(c) as [ReasonKind, number][]) {
    if (v > bestVal) {
      bestVal = v;
      best = k;
    }
  }
  return best;
}

// ---------------------------------------------------------------- knockout exits

/**
 * The matches that knocked United out of a cup, via `buildCupRun` (`lib/cupRun.ts`)
 * — the honest model of each run's exit. Every leg of an exiting tie (or the lost
 * final) is charged; the heavier-defeat leg also picks up upset/rivalry/scoreline
 * on its own, so it naturally outranks a quiet 1-1 second leg. European exits and
 * lost finals weigh most.
 */
function knockoutExits(matches: MatchRow[]): Map<string, number> {
  const out = new Map<string, number>();
  const CUP_TYPES = new Set(["domestic-cup", "league-cup", "european", "super-cup", "world", "playoff"]);

  // Group by season + competition, cups only. Domestic shields/super-cups are
  // one-off curtain-raisers, not a run you "exit" — they still earn charge via
  // comeback/upset/rivalry, just not a (misleading) elimination boost.
  const groups = new Map<string, MatchRow[]>();
  for (const m of matches) {
    if (!CUP_TYPES.has(m.competition_type)) continue;
    if (m.competition_type === "super-cup" && m.competition_id !== "uefa-super-cup") continue;
    const key = `${m.season}::${m.competition_id}`;
    (groups.get(key) ?? groups.set(key, []).get(key)!).push(m);
  }

  for (const group of groups.values()) {
    const european = group[0].competition_type === "european";
    const { stages } = buildCupRun(group);
    if (stages.length === 0) continue;

    // The exit is the *chronologically last* stage United played — not the deepest
    // by round. `buildCupRun` ranks a play-off deeper than a group stage, so a
    // depth read mislabels a *won* play-off (played before a group) as the exit.
    const lastDate = group.reduce((d, m) => (m.date > d ? m.date : d), group[0].date);
    const exit = stages.find((s) =>
      s.kind === "group"
        ? s.matches.some((m) => m.date === lastDate)
        : s.legs.some((m) => m.date === lastDate),
    );
    if (!exit || exit.kind !== "tie") continue; // group-stage exits are fuzzier; skip
    // Won your last single match → trophy / one-off win, not an exit.
    if (exit.format === "single" && exit.decisive.outcome === "W") continue;

    const lostFinal = exit.round === "Final";
    let sev = 0.55;
    if (european) sev += 0.3;
    if (lostFinal) sev += 0.25;
    sev = clamp01(sev);
    // Attach the exit to the *decisive* (last-played) leg — the match United were
    // actually eliminated in — not the earlier leg, which may have been a win.
    out.set(exit.decisive.id, Math.max(out.get(exit.decisive.id) ?? 0, sev));
  }
  return out;
}

// ---------------------------------------------------------------- streak enders

/**
 * The match that *ended* a notable run — a defeat that broke a long unbeaten or
 * winning run, or a win that ended a long winless drought. Reads the same
 * date-ordered official sequence the `streaks` module does (friendlies/wartime
 * excluded). Severity scales with the broken run's length.
 */
function streakEnders(matches: MatchRow[]): Map<string, number> {
  const seq = matches.filter((m) => m.competition_type !== "unofficial");
  const out = new Map<string, number>();
  const sevForLen = (len: number): number => (len >= 15 ? 0.85 : len >= 10 ? 0.6 : len >= 7 ? 0.4 : 0);

  const mark = (holds: (m: MatchRow) => boolean) => {
    // The breaking match never satisfies `holds`, so it can't start a new run —
    // reset to 0 after recording it.
    let runLen = 0;
    for (const m of seq) {
      if (holds(m)) {
        runLen++;
      } else {
        const sev = sevForLen(runLen);
        if (sev > 0) out.set(m.id, Math.max(out.get(m.id) ?? 0, sev));
        runLen = 0;
      }
    }
  };

  // An unbeaten run (W/D) is broken by a defeat; a winning run by any non-win; a
  // winless drought (D/L) is broken by a win.
  mark((m) => m.result !== "L");
  mark((m) => m.result === "W");
  mark((m) => m.result !== "W");
  return out;
}

// ---------------------------------------------------------------- crowd percentile

/** Each match's attendance as a percentile *within its decade*, so a packed
 *  mid-century terrace isn't dwarfed by a routine modern all-seater crowd. */
function crowdPercentiles(matches: MatchRow[]): Map<string, number> {
  const byDecade = new Map<string, { id: string; att: number }[]>();
  for (const m of matches) {
    if (m.attendance == null) continue;
    const decade = m.date.slice(0, 3);
    (byDecade.get(decade) ?? byDecade.set(decade, []).get(decade)!).push({ id: m.id, att: m.attendance });
  }
  const out = new Map<string, number>();
  for (const rows of byDecade.values()) {
    rows.sort((a, b) => a.att - b.att);
    const n = rows.length;
    rows.forEach((r, i) => out.set(r.id, n <= 1 ? 0 : i / (n - 1)));
  }
  return out;
}

// ---------------------------------------------------------------- famous set

/**
 * The canonically-famous nights — the ones a fan *hasn't* forgotten, which the
 * curated hero already serves. They get the fadedness penalty so rediscovery
 * pushes past them to the charged-but-forgotten middle. Assembled from the
 * hand-vouched pools plus the obvious record nights, read from the build handle.
 */
function famousSet(matches: MatchRow[]): Set<string> {
  const famous = new Set<string>();
  for (const c of CURATED_NIGHTS) famous.add(c.id);
  // ICONIC_LATE_DATES are dates, not ids — match any match on that date.
  const iconicDates = new Set<string>(ICONIC_LATE_DATES);
  for (const m of matches) if (iconicDates.has(m.date)) famous.add(m.id);

  // Trophy nights: any one-off final United won.
  for (const m of matches) {
    const round = (m.round ?? "").toLowerCase();
    const isFinal = /final/.test(round) && !/semi|quarter/.test(round);
    if (isFinal && m.outcome === "W") famous.add(m.id);
  }

  // The headline club records — biggest win, heaviest defeat, record crowd.
  const official = matches.filter((m) => m.competition_type !== "unofficial");
  const byMargin = (sign: number) =>
    official.reduce<MatchRow | null>((best, m) => {
      const d = sign * (m.gf - m.ga);
      return !best || d > sign * (best.gf - best.ga) ? m : best;
    }, null);
  const biggestWin = byMargin(1);
  const heaviestDefeat = byMargin(-1);
  const recordCrowd = official.reduce<MatchRow | null>(
    (best, m) => (m.attendance != null && (!best || m.attendance > (best.attendance ?? 0)) ? m : best),
    null,
  );
  for (const m of [biggestWin, heaviestDefeat, recordCrowd]) if (m) famous.add(m.id);

  return famous;
}
