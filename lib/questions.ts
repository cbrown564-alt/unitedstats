/**
 * The canonical registry of myth-testing questions.
 *
 * Pure data — no JSX, no database — so it can be imported cheaply by the
 * sitemap, the OG-card routes, `generateMetadata`, and `generateStaticParams`
 * without pulling in chart components or query code. The rendered evidence for
 * each slug lives in `components/QuestionModules.tsx`, keyed by the same slug.
 *
 * `question` is the on-page headline; `summary` is an evergreen, count-free
 * sentence used for the meta description, the OG card, and citations (the live
 * `finding` strings carry counts and would churn the metadata on every update).
 */
export interface QuestionMeta {
  slug: string;
  /** Short nav/label form. */
  label: string;
  /** The headline question, matching the rendered module heading. */
  question: string;
  /** Evergreen one-liner for metadata, the OG card, and citations. */
  summary: string;
}

export const QUESTIONS: QuestionMeta[] = [
  {
    slug: "late-goals",
    label: "Late goals",
    question: "Do United really score late?",
    summary:
      "How often United score after the 85th minute, split decade by decade into the last five regulation minutes and stoppage time.",
  },
  {
    slug: "comebacks",
    label: "Comebacks",
    question: "Are United really the comeback kings?",
    summary:
      "How often United recover from a losing position, replayed minute by minute from the goal record.",
  },
  {
    slug: "runs",
    label: "Great runs",
    question: "How long are United's longest runs?",
    summary:
      "United's longest unbeaten, winning, scoring and clean-sheet runs in official football.",
  },
  {
    slug: "bogey-sides",
    label: "Bogey teams",
    question: "Which sides are the real bogey teams?",
    summary:
      "The opponents United beat least often, among sides met at least twenty times in official competition.",
  },
  {
    slug: "manager-bounce",
    label: "Manager bounce",
    question: "Is the new-manager bounce real?",
    summary:
      "Whether new United managers really start better than the form the club handed them.",
  },
  {
    slug: "fortress",
    label: "Fortress OT",
    question: "How much of a fortress is Old Trafford?",
    summary:
      "How rarely United lose at Old Trafford once they lead at half-time, drawn from the goal record.",
  },
  {
    slug: "cup-specialists",
    label: "Cup specialists",
    question: "Who saved their goals for cup nights?",
    summary:
      "The United scorers who leaned hardest to the cups, measured against the club's own cup-goal rate.",
  },
  {
    slug: "own-goals",
    label: "Own goals",
    question: "Is “Own Goal” one of United's top scorers?",
    summary:
      "Whether own goals, counted together as one scorer, rank among United's leading goal totals.",
  },
  {
    slug: "away-days",
    label: "Away days",
    question: "How far do away days take United?",
    summary:
      "How far away days have carried United, from short Lancashire hops to European nights.",
  },
];

const BY_SLUG = new Map(QUESTIONS.map((q) => [q.slug, q]));

export function questionBySlug(slug: string): QuestionMeta | undefined {
  return BY_SLUG.get(slug);
}

export function questionSlugs(): string[] {
  return QUESTIONS.map((q) => q.slug);
}
