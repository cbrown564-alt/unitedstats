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
 *
 * `QUESTIONS` is the curated **front door** — the catalogue the homepage, the
 * explore page, and the surprise feed pull from. A small set of novelty
 * questions live on as linkable **easter eggs** (registered in
 * {@link EASTER_EGGS}) so their routes and OG cards keep resolving without
 * taking a front-door slot a real debate should hold.
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
    slug: "ferguson-era",
    label: "Ferguson era",
    question: "Where did the title floor go?",
    summary:
      "Thirteen league titles under Ferguson, none since — the championship floor traced season by season, and every successor on the same scale.",
  },
  {
    slug: "treble",
    label: "The Treble",
    question: "How does one season hold three trophies?",
    summary:
      "Anatomy of 1998-99: the Premier League, the FA Cup and the Champions League, run by run, down to the deciding nights.",
  },
  {
    slug: "fortress",
    label: "Fortress OT",
    question: "How much of a fortress is Old Trafford?",
    summary:
      "Lead at half-time at Old Trafford and the game is over. See how rarely United surrendered a break-time lead.",
  },
  {
    slug: "late-goals",
    label: "Fergie time",
    question: "Was Fergie time unique to Fergie?",
    summary:
      "The late-goal share jumped under Ferguson and kept climbing after he left — partly habit, partly longer added time. Busby's era had a hint of it too.",
  },
];

/** Linkable curiosities kept off the curated front door. Their routes and OG
 *  cards still resolve (via {@link questionSlugs}), but they do not appear in
 *  the homepage carousel, the explore catalogue, or the surprise feed. */
const EASTER_EGGS: QuestionMeta[] = [
  {
    slug: "europe",
    label: "United in Europe",
    question: "What is United's European record by era?",
    summary:
      "Continental nights across the decades — the wins, the finals reached, the trophies won — from the Busby Babes to the modern Champions League.",
  },
  {
    slug: "manager-bounce",
    label: "Manager bounce",
    question: "Is the new-manager bounce real?",
    summary:
      "Does a new manager change the tide? Compare each manager's first ten matches against the form they inherited.",
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
    question: "How long are United's longest runs?",
    summary:
      "Winning runs, clean-sheet streaks, and matches without defeat. The limits of United's momentum over 140 years.",
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

const ALL = [...QUESTIONS, ...EASTER_EGGS];
const BY_SLUG = new Map(ALL.map((q) => [q.slug, q]));

export function questionBySlug(slug: string): QuestionMeta | undefined {
  return BY_SLUG.get(slug);
}

/** Launch myths on the homepage — one featured card, day-rotated. */
const LAUNCH_QUESTION_SLUGS = [
  "ferguson-era",
  "treble",
  "fortress",
  "late-goals",
] as const;

function dayOfYear(d: Date): number {
  const start = Date.UTC(d.getUTCFullYear(), 0, 0);
  const today = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return Math.floor((today - start) / 86_400_000);
}

/** Today's featured launch myth — rotation is date-based, independent of TonightHero. */
export function featuredLaunchQuestion(now = new Date()): QuestionMeta {
  const slug = LAUNCH_QUESTION_SLUGS[dayOfYear(now) % LAUNCH_QUESTION_SLUGS.length];
  const q = questionBySlug(slug);
  if (!q) throw new Error(`missing launch question: ${slug}`);
  return q;
}

/** Every question route — the curated front door plus the easter eggs — so
 *  `generateStaticParams` and the sitemap cover both. */
export function questionSlugs(): string[] {
  return ALL.map((q) => q.slug);
}
