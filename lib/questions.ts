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
    label: "Fergie time",
    question: "Do United really score late?",
    summary:
      "Do United really score late? Track the post-85th minute edge by decade, from Bruce’s header to stoppage-time drama.",
  },
  {
    slug: "comebacks",
    label: "Comeback kings",
    question: "Are United really the comeback kings?",
    summary:
      "Test the legend of the fightback. How often United fell behind — and avoided defeat — replayed minute by minute.",
  },
  {
    slug: "runs",
    label: "Unbeaten streaks",
    question: "How long are United’s longest runs?",
    summary:
      "Winning runs, clean-sheet streaks, and matches without defeat. The limits of United’s momentum over 140 years.",
  },
  {
    slug: "bogey-sides",
    label: "Bogey teams",
    question: "Which sides are the real bogey teams?",
    summary:
      "The sides United beat least often. The historical obstacles, filtered for opponents met at least twenty times.",
  },
  {
    slug: "manager-bounce",
    label: "Manager bounce",
    question: "Is the new-manager bounce real?",
    summary:
      "Does a new manager change the tide? Compare each manager’s first ten matches against the form they inherited.",
  },
  {
    slug: "fortress",
    label: "Fortress OT",
    question: "How much of a fortress is Old Trafford?",
    summary:
      "Lead at half-time at Old Trafford and the game is over. See how rarely United surrendered a break-time lead.",
  },
  {
    slug: "cup-specialists",
    label: "Cup specialists",
    question: "Who saved their goals for cup nights?",
    summary:
      "Who saved their goals for cup nights? The goalscorers whose records lean heavily toward domestic and European cups.",
  },
  {
    slug: "own-goals",
    label: "Own goals",
    question: "Is “Own Goal” one of United’s top goalscorers?",
    summary:
      "Is ‘Own Goal’ one of the club’s leading goalscorers? The bizarre tally of opponent errors stacked against history’s legends.",
  },
  {
    slug: "away-days",
    label: "Away days",
    question: "How far do away days take United?",
    summary:
      "From Lancashire hops to European nights. Trace the geographic footprint of United’s away trips since 1886.",
  },
];

const BY_SLUG = new Map(QUESTIONS.map((q) => [q.slug, q]));

export function questionBySlug(slug: string): QuestionMeta | undefined {
  return BY_SLUG.get(slug);
}

export function questionSlugs(): string[] {
  return QUESTIONS.map((q) => q.slug);
}
