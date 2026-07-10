import { matchById, eventsForMatch, lineupForMatch, type EventRow, type LineupRow } from "./queries";
import type { MatchMarks } from "@/components/FormationPitch";
import { scoreline } from "./format";
import { leadHeldAtHome } from "./trails";

/**
 * The journey's chapter registry — one entry per shipped chapter, feeding the
 * quiet cross-links on each chapter's door (the "light index" packaging call in
 * docs/JOURNEY.md §4b). Numbers match the stage kickers ("Red Thread / 01").
 */
export const JOURNEY_CHAPTERS = [
  { number: "01", title: "Two No. 7s", href: "/journey" },
  { number: "02", title: "Eleven days in May", href: "/journey/treble" },
  { number: "03", title: "Fortress OT", href: "/journey/fortress" },
] as const;

/**
 * A single match "receipt" assembled for a journey beat — the same shapes the
 * /match/[id] page feeds to {@link MatchFlow} and {@link FormationPitch}, so the
 * journey shows the real match surfaces rather than a bespoke retelling. All
 * DB-derived (`match_events`, `match_lineups`).
 */
export interface MatchReceipt {
  id: string;
  /** ISO date of the match (e.g. 1999-05-26). */
  date: string;
  /** Calendar year of the match (e.g. 1968). */
  year: number;
  competition: string;
  opponent: string;
  /** Scoreline with penalties/aet suffix, e.g. "4–1" or "1–1 (6–5 pens)". */
  score: string;
  /** Timed United goals, oldest first — MatchFlow input. */
  unitedGoals: EventRow[];
  opponentGoals: EventRow[];
  aet: boolean;
  /** United starting XI — FormationPitch input. */
  starters: LineupRow[];
  /** Substitutes who came on (with their minute) — Bench input. */
  usedSubs: LineupRow[];
  /** Per-player goal/assist/card marks drawn on the pitch shirts. */
  marks: MatchMarks;
  /** Four-digit year string FormationPitch uses to pick the era's shirt/placement. */
  decade: string;
}

const GOAL_TYPES = ["goal", "pen-goal", "own-goal-for"];
const OPP_GOAL_TYPES = ["opp-goal", "own-goal-against"];

/** Assemble the {@link MatchReceipt} for one match, mirroring app/match/[id]/page.tsx. */
export function matchReceipt(matchId: string): MatchReceipt | null {
  const m = matchById(matchId);
  if (!m) return null;

  const events = eventsForMatch(matchId);
  const lineup = lineupForMatch(matchId);

  const unitedGoals = events.filter((e) => GOAL_TYPES.includes(e.type));
  const opponentGoals = events.filter((e) => OPP_GOAL_TYPES.includes(e.type));
  const cards = events.filter((e) => e.type === "card-yellow" || e.type === "card-red");
  const united = lineup.filter((p) => p.player_side === "united" && !p.bench);
  const starters = united.filter((p) => p.started);
  const usedSubs = united.filter((p) => !p.started);

  const goalCount = new Map<string, number>();
  const assistCount = new Map<string, number>();
  for (const g of unitedGoals) {
    if (g.player_id) goalCount.set(g.player_id, (goalCount.get(g.player_id) ?? 0) + 1);
    if (g.assist_player_id && g.assist_side === "united") {
      assistCount.set(g.assist_player_id, (assistCount.get(g.assist_player_id) ?? 0) + 1);
    }
  }
  const cardByPlayer = new Map<string, "yellow" | "red">();
  for (const c of cards) {
    if (!c.player_id) continue;
    const cur = cardByPlayer.get(c.player_id);
    if (c.type === "card-red" || cur === "yellow") cardByPlayer.set(c.player_id, "red");
    else if (!cur) cardByPlayer.set(c.player_id, "yellow");
  }

  const pens: [number | null, number | null] | null = m.pen_gf != null ? [m.pen_gf, m.pen_ga] : null;

  return {
    id: matchId,
    date: m.date,
    year: Number(m.date.slice(0, 4)),
    competition: m.competition_name,
    opponent: m.opponent_name,
    score: scoreline(m.gf, m.ga, pens, !!m.aet),
    unitedGoals,
    opponentGoals,
    aet: !!m.aet,
    starters,
    usedSubs,
    marks: { goals: goalCount, assists: assistCount, cards: cardByPlayer },
    decade: m.date.slice(0, 4),
  };
}

/** A goal scored by a player who came on as a substitute — the Treble chapter's
 *  through-line, read off the receipt so it can never drift from the record. */
export interface SubGoal {
  playerId: string;
  name: string;
  /** Minute the scorer came on. */
  subOn: number | null;
  /** Minute of the goal (regulation part; stoppage carried in `added`). */
  minute: number;
  added: number | null;
}

/** United goals in this receipt whose scorer started on the bench, oldest first. */
export function subGoals(receipt: MatchReceipt): SubGoal[] {
  const subOnById = new Map(
    receipt.usedSubs.filter((p) => p.player_id).map((p) => [p.player_id as string, p.sub_on]),
  );
  return receipt.unitedGoals
    .filter((g) => g.player_id && g.minute != null && subOnById.has(g.player_id))
    .map((g) => ({
      playerId: g.player_id as string,
      name: g.player_display_name ?? g.player_name ?? "",
      subOn: subOnById.get(g.player_id as string) ?? null,
      minute: g.minute as number,
      added: g.added_time,
    }));
}

/**
 * Scoreline while United were behind — lever C on the Treble chapter
 * (docs/JOURNEY.md §4b). Prefers the board at full time when they were still
 * trailing into stoppage ("0–1 at 90′"); otherwise the first deficit
 * ("0–1 after 26′"). Null when United never trailed. Journey-local; not a
 * general-purpose chart.
 */
export type TrailingBoard = {
  /** United goals at the anchored moment. */
  united: number;
  /** Opponent goals at the anchored moment. */
  opponent: number;
  /** En-dash scoreline, e.g. "0–1". */
  score: string;
  /** Fan-facing clock phrase — "after 26′" or "at 90′". */
  when: string;
};

type TimedGoal = {
  clock: number;
  minute: number;
  added: number | null;
  delta: 1 | -1;
};

function eventClock(minute: number, added: number | null): number {
  if (minute === 90 && added != null && added > 0) return 90 + added;
  return minute;
}

export function trailingBoard(receipt: MatchReceipt): TrailingBoard | null {
  const timed: TimedGoal[] = [
    ...receipt.unitedGoals
      .filter((g) => g.minute != null)
      .map((g) => ({
        clock: eventClock(g.minute as number, g.added_time),
        minute: g.minute as number,
        added: g.added_time,
        delta: 1 as const,
      })),
    ...receipt.opponentGoals
      .filter((g) => g.minute != null)
      .map((g) => ({
        clock: eventClock(g.minute as number, g.added_time),
        minute: g.minute as number,
        added: g.added_time,
        delta: -1 as const,
      })),
  ].sort((a, b) => a.clock - b.clock || a.delta - b.delta);

  let united = 0;
  let opponent = 0;
  let firstDeficit: TrailingBoard | null = null;
  let boardAt90: TrailingBoard | null = null;

  for (const g of timed) {
    if (g.delta === 1) united += 1;
    else opponent += 1;

    if (united < opponent) {
      const score = scoreline(united, opponent);
      if (!firstDeficit) {
        firstDeficit = {
          united,
          opponent,
          score,
          when: `after ${g.minute}′`,
        };
      }
      // Still behind at the regulation whistle — the Bayern shape.
      if (g.clock <= 90) {
        boardAt90 = {
          united,
          opponent,
          score,
          when: "at 90′",
        };
      }
    } else if (g.clock <= 90) {
      boardAt90 = null;
    }
  }

  // Prefer trailing-at-90 when they were behind into stoppage; else first deficit.
  return boardAt90 ?? firstDeficit;
}

/** The tail of a date-ordered sequence after its final defeat — the "didn't lose
 *  again" run a season spine proves. Null when the sequence ends on the defeat. */
export function unbeatenTail(
  seq: readonly { date: string; result: string }[],
): { games: number; w: number; d: number; from: string; to: string; lastLoss: string | null } | null {
  let lastLossIdx = -1;
  for (let i = 0; i < seq.length; i++) if (seq[i].result === "L") lastLossIdx = i;
  const tail = seq.slice(lastLossIdx + 1);
  if (tail.length === 0) return null;
  return {
    games: tail.length,
    w: tail.filter((m) => m.result === "W").length,
    d: tail.filter((m) => m.result === "D").length,
    from: tail[0].date,
    to: tail[tail.length - 1].date,
    lastLoss: lastLossIdx >= 0 ? seq[lastLossIdx].date : null,
  };
}

/**
 * One night the fortress nearly cracked — led at half-time, then the margin went
 * negative in the second half, rescued to a draw (docs/JOURNEY.md §4c).
 */
export type FortressCrack = {
  id: string;
  date: string;
  opponent: string;
  /** Half-time scoreline, e.g. "2–0". */
  ht: string;
  /** Full-time scoreline, e.g. "3–3". */
  ft: string;
  htf: number;
  hta: number;
  gf: number;
  ga: number;
  /** Deepest second-half margin (always < 0 for a crack). */
  worst: number;
  /** Minute United first went behind after the break. */
  fellBehindMinute: number | null;
};

/**
 * The Fortress chapter's closed slice — unbeaten run since the last half-time
 * lead lost at Old Trafford, plus the three cracks (fell behind after leading).
 * All derived from {@link leadHeldAtHome}; no hand-asserted counts.
 */
export type FortressRun = {
  /** Games led at HT after the last loss, chronological. */
  games: number;
  w: number;
  d: number;
  /** The last home-league half-time lead that was actually lost. */
  lastLoss: {
    id: string;
    date: string;
    opponent: string;
    gf: number;
    ga: number;
    htf: number;
    hta: number;
  };
  /** Nights in the run where the second-half margin went negative — all draws. */
  cracks: FortressCrack[];
  from: string;
  to: string;
};

/** Compact opponent labels for stage / crack copy — not a general name helper. */
export function fortressShortOpponent(name: string): string {
  const map: Record<string, string> = {
    "Tottenham Hotspur": "Spurs",
    "Sheffield Wednesday": "Wednesday",
    "AFC Bournemouth": "Bournemouth",
    "Ipswich Town": "Ipswich",
  };
  return map[name] ?? name;
}

/** Fortress OT run + three cracks, read off `leadHeldAtHome()` (docs/JOURNEY.md §4c). */
export function fortressRun(): FortressRun | null {
  const lh = leadHeldAtHome();
  if (lh.games.length === 0) return null;

  const losses = lh.games.filter((g) => g.result === "L");
  const last = losses[losses.length - 1];
  if (!last) return null;

  const lastIdx = lh.games.findIndex((g) => g.id === last.id);
  const since = lh.games.slice(lastIdx + 1);
  if (since.length === 0) return null;

  const cracks: FortressCrack[] = since
    .filter((g) => g.worst < 0)
    .map((g) => {
      const receipt = matchReceipt(g.id);
      let uf = 0;
      let oa = 0;
      let fellBehindMinute: number | null = null;
      if (receipt) {
        const timed = [
          ...receipt.unitedGoals
            .filter((e) => e.minute != null)
            .map((e) => ({ minute: e.minute as number, delta: 1 as const })),
          ...receipt.opponentGoals
            .filter((e) => e.minute != null)
            .map((e) => ({ minute: e.minute as number, delta: -1 as const })),
        ].sort((a, b) => a.minute - b.minute);
        for (const e of timed) {
          if (e.delta === 1) uf += 1;
          else oa += 1;
          if (e.minute > 45 && uf < oa && fellBehindMinute == null) {
            fellBehindMinute = e.minute;
          }
        }
      }
      return {
        id: g.id,
        date: g.date,
        opponent: g.opponent_name,
        ht: scoreline(g.htf, g.hta),
        ft: scoreline(g.gf, g.ga),
        htf: g.htf,
        hta: g.hta,
        gf: g.gf,
        ga: g.ga,
        worst: g.worst,
        fellBehindMinute,
      };
    });

  return {
    games: since.length,
    w: since.filter((g) => g.result === "W").length,
    d: since.filter((g) => g.result === "D").length,
    lastLoss: {
      id: last.id,
      date: last.date,
      opponent: last.opponent_name,
      gf: last.gf,
      ga: last.ga,
      htf: last.htf,
      hta: last.hta,
    },
    cracks,
    from: since[0].date,
    to: since[since.length - 1].date,
  };
}

/**
 * The United scorer who restored level after the crack — the face the ThreeCracks
 * beat puts in the shadow. Null when the receipt has no such goal (shouldn't
 * happen on a rescued draw).
 */
export type CrackRescuer = {
  playerId: string;
  name: string;
  minute: number;
  added: number | null;
};

/** First United goal that returns the margin to 0 after it has gone negative. */
export function crackRescuer(receipt: MatchReceipt): CrackRescuer | null {
  const timed = [
    ...receipt.unitedGoals
      .filter((g) => g.minute != null && g.player_id)
      .map((g) => ({
        clock: g.minute === 90 && g.added_time ? 90 + g.added_time : (g.minute as number),
        minute: g.minute as number,
        added: g.added_time,
        delta: 1 as const,
        playerId: g.player_id as string,
        name: g.player_display_name ?? g.player_name ?? "",
      })),
    ...receipt.opponentGoals
      .filter((g) => g.minute != null)
      .map((g) => ({
        clock: g.minute === 90 && g.added_time ? 90 + g.added_time : (g.minute as number),
        minute: g.minute as number,
        added: g.added_time,
        delta: -1 as const,
        playerId: "",
        name: "",
      })),
  ].sort((a, b) => a.clock - b.clock || a.delta - b.delta);

  let margin = 0;
  let cracked = false;
  for (const g of timed) {
    margin += g.delta;
    if (!cracked && margin < 0) {
      cracked = true;
      continue;
    }
    if (cracked && g.delta === 1 && margin === 0) {
      return { playerId: g.playerId, name: g.name, minute: g.minute, added: g.added };
    }
  }
  return null;
}
