import { CURATED_CUTS, cutHref, curatedCut } from "./cut";
import { compareDebateKey, type ExploreCompareMode } from "./compareExplore";
import { questionBySlug } from "./questions";
import { CURATED_DEBATES } from "./compare";
import { queryString } from "./url";
import type { RelatedKind, RelatedLink } from "./related";

/**
 * Hand-curated trails at the foot of a resolved comparison — the same connective
 * voice as {@link relatedAnswers}, keyed by canonical debate pair. Custom pairings
 * fall back to a mode-default trail so the page never ends cold.
 *
 * Pinned by `tests/compare-consistency.test.ts`.
 */
function toQuestion(slug: string, hook: string): RelatedLink {
  const q = questionBySlug(slug);
  if (!q) throw new Error(`compareRelated: unknown question slug "${slug}"`);
  return { kind: "question", href: `/questions/${slug}`, label: q.question, hook };
}

function toCut(slug: string, hook: string): RelatedLink {
  const c = CURATED_CUTS.find((x) => x.slug === slug);
  if (!c) throw new Error(`compareRelated: unknown cut slug "${slug}"`);
  return { kind: "cut", href: cutHref(curatedCut(c)), label: c.title, hook };
}

function toDebate(mode: ExploreCompareMode, index: number, hook: string): RelatedLink {
  const d = CURATED_DEBATES[mode][index];
  if (!d) throw new Error(`compareRelated: no debate ${mode}[${index}]`);
  return {
    kind: "debate",
    href: `/compare${queryString({ mode, a: d.a, b: d.b })}`,
    label: d.label,
    hook,
  };
}

const TRAILS: Record<string, RelatedLink[]> = {
  [compareDebateKey("players", "wayne-rooney", "bobby-charlton")]: [
    toQuestion("ferguson-era", "Both men scored through the dynasty Ferguson built — see what happened after he left."),
    toDebate("managers", 0, "Set the two architects beside each other on win rate and silverware."),
    toCut("seasons-by-points", "Place their peak seasons against every other campaign on points per game."),
  ],
  [compareDebateKey("players", "cristiano-ronaldo", "george-best")]: [
    toQuestion("treble", "Ronaldo's peak years overlapped the Treble season — the club's greatest single year."),
    toDebate("players", 0, "The other great scoring debate: who sits atop the all-time charts?"),
    toCut("opponents-by-win-rate", "See which opponents each generation beat most often."),
  ],
  [compareDebateKey("players", "ryan-giggs", "paul-scholes")]: [
    toQuestion("ferguson-era", "They were the home-grown spine of the Ferguson years."),
    toDebate("players", 3, "Two catalyst signings whose arrival tilted the title race."),
    toCut("managers-by-points", "Every reign restated on one points-per-game scale."),
  ],
  [compareDebateKey("players", "eric-cantona", "robin-van-persie")]: [
    toQuestion("treble", "Cantona's arrival unlocked the first title run of the nineties."),
    toQuestion("fortress", "Van Persie's season turned Old Trafford into a fortress again."),
    toDebate("players", 1, "Two No. 7s, two icons — a generation apart."),
  ],
  [compareDebateKey("managers", "alex-ferguson", "matt-busby")]: [
    toQuestion("ferguson-era", "Ferguson's reign against every other manager, then the years since."),
    toDebate("managers", 2, "Busby against the man who built the club's first league dynasty."),
    toCut("managers-by-points", "Every reign on one points-per-game ladder."),
  ],
  [compareDebateKey("managers", "alex-ferguson", "jose-mourinho")]: [
    toQuestion("manager-bounce", "The bounce every successor promised, measured against the standard Ferguson set."),
    toDebate("managers", 0, "Ferguson beside the other quarter-century architect."),
    toCut("seasons-by-points", "See which seasons each reign returned the most points."),
  ],
  [compareDebateKey("managers", "matt-busby", "ernest-mangnall")]: [
    toQuestion("ferguson-era", "The floor every later reign is measured against started with Busby."),
    toDebate("managers", 0, "Busby against the longest reign in the club's history."),
    toCut("managers-by-points", "Mangnall's Newton Heath years beside every other tenure."),
  ],
};

const DEFAULT_TRAILS: Record<ExploreCompareMode, RelatedLink[]> = {
  players: [
    toQuestion("late-goals", "Late goals rescued points in both careers — how late, exactly?"),
    toDebate("players", 0, "The canonical scoring debate at the top of the charts."),
    toCut("opponents-by-win-rate", "Every opponent United have faced, ranked by win rate."),
  ],
  managers: [
    toQuestion("ferguson-era", "Every other reign is read against the Ferguson standard."),
    toDebate("managers", 0, "The two architects, a quarter-century each in charge."),
    toCut("managers-by-points", "Every tenure on one points-per-game scale."),
  ],
};

/** The curated trail for a resolved comparison, or a mode-default for custom pairs. */
export function relatedComparisons(
  mode: ExploreCompareMode,
  idA: string,
  idB: string,
): RelatedLink[] {
  return TRAILS[compareDebateKey(mode, idA, idB)] ?? DEFAULT_TRAILS[mode];
}

/** Debate keys that carry a registered trail — every curated head-to-head. */
export function relatedComparisonKeys(): string[] {
  return Object.keys(TRAILS);
}

export type { RelatedKind, RelatedLink };
