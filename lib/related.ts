import { CURATED_DEBATES, type CompareMode } from "./compare";
import { questionBySlug, QUESTIONS } from "./questions";
import { queryString } from "./url";

/**
 * The trail at the foot of every answer (Phase 18.3): two or three curated next
 * steps that turn a single question into a session. Deterministic and curated —
 * never behavioural, honouring the static guardrail. Each `hook` is a connective
 * line that carries the *current* answer into the next one, so the rail reads as
 * a guided trail ("if they score late, do they come from behind too?") rather
 * than a generic "see also" list.
 *
 * Every destination is built through the helpers below from a real registry — a
 * curated question, a curated Cut, or a flagship debate — so a link can never
 * 404. The graph is pinned by `tests/phase18-discovery.test.ts`.
 */
/** What form the next step takes — surfaced as the station's eyebrow so the trail
 *  reads as varied moves (another answer, a data slice, a head-to-head). */
export type RelatedKind = "question" | "debate";

export interface RelatedLink {
  kind: RelatedKind;
  href: string;
  label: string;
  /** One line connecting *this* answer to the next — the trail, not a list. */
  hook: string;
}

/** A link to another curated question, labelled with its short form. */
function toQuestion(slug: string, hook: string): RelatedLink {
  const q = questionBySlug(slug);
  if (!q) throw new Error(`related: unknown question slug "${slug}"`);
  return { kind: "question", href: `/questions/${slug}`, label: q.question, hook };
}

/** A link to a flagship debate, labelled with its head-to-head. */
function toDebate(mode: CompareMode, index: number, hook: string): RelatedLink {
  const d = CURATED_DEBATES[mode][index];
  if (!d) throw new Error(`related: no debate ${mode}[${index}]`);
  return { kind: "debate", href: `/compare${queryString({ mode, a: d.a, b: d.b })}`, label: d.label, hook };
}

const RELATED: Record<string, RelatedLink[]> = {
  "ferguson-era": [
    toDebate("managers", 0, "Ferguson beside Busby — trophies and tenure."),
    toQuestion("treble", "1998-99: the peak season of that reign."),
    toQuestion("fortress", "Home leads at half-time through the Ferguson years."),
  ],
  treble: [
    toQuestion("late-goals", "Barcelona was decided after the 90th."),
    toQuestion("ferguson-era", "Where that season sits in the post-1986 ladder."),
    toDebate("players", 0, "Two record-breaking careers on the measures that fit them."),
  ],
  europe: [
    toQuestion("treble", "The European Cup night that completed the Treble."),
    toQuestion("ferguson-era", "League finishes while Europe returned."),
    toDebate("players", 1, "Two European Cup-winning goalkeepers, season by season."),
  ],
  "late-goals": [
    toQuestion("fortress", "Once ahead late at home — how often does the lead hold?"),
    toQuestion("treble", "Two goals after the 90th in Barcelona."),
    toQuestion("comebacks", "Which of those late goals completed a recovery?"),
  ],
  fortress: [
    toQuestion("late-goals", "Scoring late and holding a lead late — same edge, both sides."),
    toQuestion("ferguson-era", "Home half-time leads across the Ferguson years."),
    toQuestion("runs", "How long did the strongest home sequences last?"),
  ],
  comebacks: [
    toQuestion("late-goals", "Most recoveries arrive late — how late?"),
    toQuestion("treble", "Barcelona: two down, two scored after 90."),
    toDebate("managers", 0, "Ferguson and Busby on trophies, tenure and win rate."),
  ],
  runs: [
    toQuestion("treble", "The longest unbeaten run overlapped 1998-99."),
    toQuestion("fortress", "Home form builds and breaks most long runs."),
    toQuestion("comebacks", "The recoveries that kept longer sequences alive."),
  ],
  "manager-bounce": [
    toQuestion("ferguson-era", "Successors measured against the Ferguson floor."),
    toQuestion("comebacks", "Whether the first ten matches contained a recovery."),
    toDebate("managers", 1, "Ferguson to Mourinho — the sharpest succession."),
  ],
  "cup-specialists": [
    toQuestion("europe", "Cup lean in European competition."),
    toQuestion("own-goals", "Own goals on the scorers list."),
    toQuestion("away-days", "How far those cup and European ties carried United."),
  ],
  "own-goals": [
    toQuestion("cup-specialists", "Cup lean among named scorers."),
    toQuestion("europe", "Where own goals sit inside the continental record."),
  ],
  "away-days": [
    toQuestion("fortress", "Home record against the miles travelled."),
    toQuestion("europe", "European away days in the continental record."),
    toDebate("managers", 0, "How two long reigns travelled across competitions."),
  ],
};

/** The curated trail for a question, or an empty list if none is registered. */
export function relatedAnswers(slug: string): RelatedLink[] {
  return RELATED[slug] ?? [];
}

/** Slugs that carry a registered trail — active questions only. */
export function relatedSlugs(): string[] {
  return QUESTIONS.map((q) => q.slug).filter((s) => RELATED[s]?.length);
}
