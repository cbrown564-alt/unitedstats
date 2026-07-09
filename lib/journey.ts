import { matchById, eventsForMatch, lineupForMatch, type EventRow, type LineupRow } from "./queries";
import type { MatchMarks } from "@/components/FormationPitch";
import { scoreline } from "./format";

/**
 * A single European-final "receipt" assembled for the journey's climax beat —
 * the same shapes the /match/[id] page feeds to {@link MatchFlow} and
 * {@link FormationPitch}, so the journey shows the real match surfaces rather
 * than a bespoke retelling. All DB-derived (`match_events`, `match_lineups`).
 */
export interface FinalReceipt {
  id: string;
  /** Calendar year of the final (e.g. 1968). */
  year: number;
  opponent: string;
  /** Scoreline with penalties/aet suffix, e.g. "4–1" or "1–1 (6–5 pens)". */
  score: string;
  /** Timed United goals, oldest first — MatchFlow input. */
  unitedGoals: EventRow[];
  opponentGoals: EventRow[];
  aet: boolean;
  /** United starting XI — FormationPitch input. */
  starters: LineupRow[];
  /** Per-player goal/assist/card marks drawn on the pitch shirts. */
  marks: MatchMarks;
  /** Four-digit year string FormationPitch uses to pick the era's shirt/placement. */
  decade: string;
}

const GOAL_TYPES = ["goal", "pen-goal", "own-goal-for"];
const OPP_GOAL_TYPES = ["opp-goal", "own-goal-against"];

/** Assemble the {@link FinalReceipt} for one final, mirroring app/match/[id]/page.tsx. */
export function finalReceipt(matchId: string): FinalReceipt | null {
  const m = matchById(matchId);
  if (!m) return null;

  const events = eventsForMatch(matchId);
  const lineup = lineupForMatch(matchId);

  const unitedGoals = events.filter((e) => GOAL_TYPES.includes(e.type));
  const opponentGoals = events.filter((e) => OPP_GOAL_TYPES.includes(e.type));
  const cards = events.filter((e) => e.type === "card-yellow" || e.type === "card-red");
  const starters = lineup.filter((p) => p.player_side === "united" && p.started && !p.bench);

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
    year: Number(m.date.slice(0, 4)),
    opponent: m.opponent_name,
    score: scoreline(m.gf, m.ga, pens, !!m.aet),
    unitedGoals,
    opponentGoals,
    aet: !!m.aet,
    starters,
    marks: { goals: goalCount, assists: assistCount, cards: cardByPlayer },
    decade: m.date.slice(0, 4),
  };
}
