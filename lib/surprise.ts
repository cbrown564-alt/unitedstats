import { QUESTIONS } from "./questions";
import { CURATED_CUTS, cutHref, curatedCut } from "./cut";
import { CURATED_DEBATES, type CompareMode } from "./compare";
import { queryString } from "./url";

type SurpriseKind = "question" | "cut" | "debate";

export interface SurpriseDestination {
  href: string;
  label: string;
  kind: SurpriseKind;
}

const COMPARE_MODES: CompareMode[] = ["players", "managers", "eras"];

/**
 * The curated pool the "surprise me" door draws from. Every entry is a real,
 * hand-picked surface — a tested question, a curated Cut, or a flagship debate —
 * so a random landing is serendipity, never random noise, and never a dead end
 * (the 18.3 guarantee: only ever land on something curated-quality). Pure data,
 * no DB: cheap to assemble and golden-testable.
 */
export function surpriseDestinations(): SurpriseDestination[] {
  const questions: SurpriseDestination[] = QUESTIONS.map((q) => ({
    href: `/questions/${q.slug}`,
    label: q.question,
    kind: "question",
  }));
  const cuts: SurpriseDestination[] = CURATED_CUTS.map((c) => ({
    href: cutHref(curatedCut(c)),
    label: c.title,
    kind: "cut",
  }));
  const debates: SurpriseDestination[] = COMPARE_MODES.flatMap((mode) =>
    CURATED_DEBATES[mode].map((d) => ({
      href: `/compare${queryString({ mode, a: d.a, b: d.b })}`,
      label: d.label,
      kind: "debate" as const,
    })),
  );
  return [...questions, ...cuts, ...debates];
}

/** Roll the die over the curated pool. `rng` is injectable so tests are
 *  deterministic; the route handler passes `Math.random`. */
export function pickSurprise(rng: () => number = Math.random): SurpriseDestination {
  const pool = surpriseDestinations();
  return pool[Math.floor(rng() * pool.length) % pool.length];
}
