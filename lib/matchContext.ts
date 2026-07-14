import { CURATED_NIGHTS } from "./curatedNights";
import type { EventRow, MatchRow } from "./queries";

type MatchContextLevel = "authored" | "computed";

type MatchContextFact =
  | { kind: "match"; value: string }
  | { kind: "round"; value: string }
  | { kind: "half-time"; value: string }
  | { kind: "event"; value: string }
  | { kind: "penalties"; value: string }
  | { kind: "authored-record"; value: string };

/** Server-safe, deterministic context shown between a score and its evidence. */
interface MatchContext {
  level: MatchContextLevel;
  sentence: string;
  facts: readonly MatchContextFact[];
  related?: { label: string; href: string };
  coverageNote?: string;
}

const AUTHORED = new Map(CURATED_NIGHTS.map((night) => [night.id, night.stakes]));

const RELATED: Readonly<Record<string, { label: string; href: string }>> = {
  "1999-05-26-bayern-munich-n": {
    label: "How the Treble was won",
    href: "/questions/treble",
  },
};

function isFinal(round: string | null): boolean {
  return !!round && /final/i.test(round) && !/semi|quarter/i.test(round);
}

function isSemiFinal(round: string | null): boolean {
  return !!round && /semi/i.test(round);
}

function competitionLabel(name: string): string {
  return name.replace(/^UEFA\s+/i, "");
}

function decisiveStoppageGoal(match: MatchRow, events: EventRow[]): EventRow | null {
  if (match.outcome !== "W" || match.gf - match.ga !== 1) return null;
  const goals = events.filter(
    (event) =>
      ["goal", "pen-goal", "own-goal-for"].includes(event.type) &&
      event.minute != null &&
      (event.minute >= 90 || (event.minute === 45 && (event.added_time ?? 0) > 0)),
  );
  return goals.at(-1) ?? null;
}

/**
 * Resolve context in a strict order: reviewed authored copy, then one canonical
 * computed fact, otherwise no block. An ordinary match is allowed to stay a
 * plain receipt.
 */
export function matchContext(match: MatchRow, events: EventRow[]): MatchContext | null {
  const authored = AUTHORED.get(match.id);
  if (authored) {
    return {
      level: "authored",
      sentence: authored,
      facts: [
        { kind: "match", value: match.id },
        { kind: "authored-record", value: `curated-night:${match.id}` },
      ],
      related: RELATED[match.id],
    };
  }

  if (match.pen_gf != null && match.pen_ga != null && isFinal(match.round)) {
    const won = match.pen_gf > match.pen_ga;
    return {
      level: "computed",
      sentence: `The ${competitionLabel(match.competition_name)} final was ${won ? "won" : "lost"} on penalties.`,
      facts: [
        { kind: "round", value: match.round ?? "Final" },
        { kind: "penalties", value: `${match.pen_gf}-${match.pen_ga}` },
      ],
    };
  }

  if (isFinal(match.round)) {
    return {
      level: "computed",
      sentence: `This was the ${competitionLabel(match.competition_name)} final.`,
      facts: [{ kind: "round", value: match.round ?? "Final" }],
    };
  }

  if (isSemiFinal(match.round)) {
    return {
      level: "computed",
      sentence: `This result decided a place in the ${competitionLabel(match.competition_name)} final.`,
      facts: [{ kind: "round", value: match.round ?? "Semi-final" }],
    };
  }

  if (
    match.outcome === "W" &&
    match.ht_gf != null &&
    match.ht_ga != null &&
    match.ht_gf < match.ht_ga
  ) {
    return {
      level: "computed",
      sentence: `United trailed ${match.ht_gf}–${match.ht_ga} at half-time and came back to win.`,
      facts: [{ kind: "half-time", value: `${match.ht_gf}-${match.ht_ga}` }],
    };
  }

  const stoppageWinner = decisiveStoppageGoal(match, events);
  if (stoppageWinner) {
    const clock = `${stoppageWinner.minute}${stoppageWinner.added_time ? `+${stoppageWinner.added_time}` : ""}`;
    return {
      level: "computed",
      sentence: `A ${clock}’ goal decided the match.`,
      facts: [{ kind: "event", value: `goal:${stoppageWinner.seq}:${clock}` }],
      coverageNote: match.events_complete ? undefined : "Based on the goal events currently recorded for this match.",
    };
  }

  return null;
}
