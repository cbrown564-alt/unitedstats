import { matchById, eventsForMatch, lineupForMatch, type EventRow, type LineupRow } from "./queries";
import type { MatchMarks } from "@/components/FormationPitch";
import { scoreline } from "./format";

/**
 * The journey's chapter registry — one entry per shipped chapter, feeding the
 * quiet cross-links on each chapter's door (the "light index" packaging call in
 * docs/JOURNEY.md §4b). Numbers match the stage kickers ("Red Thread / 01").
 */
export const JOURNEY_CHAPTERS = [
  { number: "01", title: "Two No. 7s", href: "/journey" },
  { number: "02", title: "Eleven days in May", href: "/journey/treble" },
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
