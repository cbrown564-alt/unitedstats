import { CURATED_CUTS, cutHref, curatedCut } from "./cut";
import { CURATED_DEBATES, type CompareMode } from "./compare";
import { questionBySlug, questionSlugs } from "./questions";
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
export type RelatedKind = "question" | "cut" | "debate";

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

/** A link to a curated Cut, labelled with its title. */
function toCut(slug: string, hook: string): RelatedLink {
  const c = CURATED_CUTS.find((x) => x.slug === slug);
  if (!c) throw new Error(`related: unknown cut slug "${slug}"`);
  return { kind: "cut", href: cutHref(curatedCut(c)), label: c.title, hook };
}

/** A link to a flagship debate, labelled with its head-to-head. */
function toDebate(mode: CompareMode, index: number, hook: string): RelatedLink {
  const d = CURATED_DEBATES[mode][index];
  if (!d) throw new Error(`related: no debate ${mode}[${index}]`);
  return { kind: "debate", href: `/compare${queryString({ mode, a: d.a, b: d.b })}`, label: d.label, hook };
}

const RELATED: Record<string, RelatedLink[]> = {
  "ferguson-era": [
    toDebate("managers", 0, "Set his reign beside Busby's — the club's two architects."),
    toQuestion("treble", "The peak of the Ferguson floor in one season."),
    toQuestion("fortress", "The fortress was at its most impregnable in the Ferguson years."),
  ],
  treble: [
    toQuestion("europe", "The Champions League trophy was one thread of the continental record."),
    toQuestion("late-goals", "That final in Barcelona was decided in stoppage time."),
    toCut("seasons-by-points", "1998-99 against every other season, by points per game."),
  ],
  europe: [
    toQuestion("treble", "The greatest European night is the one that completed the Treble."),
    toQuestion("ferguson-era", "The Ferguson years were when Europe came back to Old Trafford."),
    toCut("opponents-by-win-rate", "The continental record, by opponent, across the decades."),
  ],
  "late-goals": [
    toQuestion("fortress", "And once ahead late, how rarely do they let a lead slip?"),
    toQuestion("treble", "The Treble's last act was two goals after the 90th."),
    toCut("seasons-by-points", "See which seasons those late goals actually rescued points in."),
  ],
  fortress: [
    toQuestion("late-goals", "Holding the fort late is the same edge as scoring late, defended."),
    toQuestion("ferguson-era", "The fortress was at its most impregnable in the Ferguson years."),
    toCut("seasons-by-points", "Which seasons turned the fortress into actual league points?"),
  ],
  comebacks: [
    toQuestion("late-goals", "Most of those recoveries arrive late — how late, exactly?"),
    toQuestion("treble", "Barcelona was the deepest comeback of the lot."),
    toCut("managers-by-points", "Which managers turned the most losing positions around?"),
  ],
  runs: [
    toQuestion("treble", "The longest unbeaten run overlapped the Treble season."),
    toQuestion("fortress", "Home form is where most unbeaten runs are built and broken."),
    toCut("seasons-by-points", "Place those runs against the points the seasons around them returned."),
  ],
  "manager-bounce": [
    toQuestion("ferguson-era", "The bounce every successor promised, measured against the standard he set."),
    toCut("managers-by-points", "See every reign restated on one points-per-game scale."),
    toDebate("managers", 1, "Test the bounce on the sharpest succession: Ferguson to Mourinho."),
  ],
  "cup-specialists": [
    toQuestion("europe", "European nights are where the cup specialists made their name."),
    toQuestion("own-goals", "Counting goals by who scored them raises an odd name near the top."),
    toCut("opponents-by-win-rate", "See which opponents those cup nights were won against."),
  ],
  "own-goals": [
    toQuestion("cup-specialists", "Set that phantom goalscorer beside the players who saved goals for the cups."),
    toCut("opponents-by-win-rate", "Own goals quietly tilt some head-to-head records — see which."),
  ],
  "away-days": [
    toQuestion("fortress", "Old Trafford is the fortress those long trips are measured against."),
    toQuestion("europe", "European away days are where the continental record was built."),
    toCut("opponents-by-win-rate", "Every opponent United have travelled to, by win rate."),
  ],
};

/** The curated trail for a question, or an empty list if none is registered. */
export function relatedAnswers(slug: string): RelatedLink[] {
  return RELATED[slug] ?? [];
}

/** Slugs that carry a registered trail — used by the test to assert full coverage. */
export function relatedSlugs(): string[] {
  return questionSlugs().filter((s) => RELATED[s]?.length);
}
