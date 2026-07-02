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
 * explore page, and the surprise feed pull from.
 *
 * `ARCHIVED_QUESTIONS` are kept linkable (routes, modules, OG cards still
 * resolve) but are off the front door, excluded from the sitemap, and marked
 * `noindex`. See `docs/archived-questions.md` for provenance and rationale.
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

/** The four active myths on the front door (July 2026 curation). */
export const QUESTIONS: QuestionMeta[] = [
  {
    slug: "ferguson-era",
    label: "Ferguson era",
    question: "What happened after Ferguson left?",
    summary:
      "Thirteen league titles under Ferguson, none since — league finishes traced season by season, with every successor on the same scale.",
  },
  {
    slug: "treble",
    label: "The Treble",
    question: "How did United win the Treble?",
    summary:
      "Anatomy of 1998-99: the Premier League, the FA Cup and the Champions League, run by run, down to the deciding nights.",
  },
  {
    slug: "fortress",
    label: "Fortress OT",
    question: "How much of a fortress is Old Trafford?",
    summary:
      "United rarely lose a home league game they lead at half-time — the full record, the historic exceptions, and the unbeaten run since 1984.",
  },
  {
    slug: "late-goals",
    label: "Fergie time",
    question: "Was Fergie time unique to Fergie?",
    summary:
      "The late-goal share jumped under Ferguson and kept climbing after he left — partly habit, partly longer added time. Busby's era had a hint of it too.",
  },
];

/** Former front-door and easter-egg questions — modules preserved, discovery off. */
export const ARCHIVED_QUESTIONS: QuestionMeta[] = [
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

const ALL = [...QUESTIONS, ...ARCHIVED_QUESTIONS];
const BY_SLUG = new Map(ALL.map((q) => [q.slug, q]));
const ARCHIVED_SLUGS = new Set(ARCHIVED_QUESTIONS.map((q) => q.slug));

export function questionBySlug(slug: string): QuestionMeta | undefined {
  return BY_SLUG.get(slug);
}

export function isArchivedQuestion(slug: string): boolean {
  return ARCHIVED_SLUGS.has(slug);
}

/** Slugs on the curated front door — explore, surprise, sitemap, related trails. */
export function activeQuestionSlugs(): string[] {
  return QUESTIONS.map((q) => q.slug);
}

/** Launch myths on the homepage — one featured card, day-rotated. */
const LAUNCH_QUESTION_SLUGS = activeQuestionSlugs();

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

/** Every question route — active plus archived — for `generateStaticParams`. */
export function questionSlugs(): string[] {
  return ALL.map((q) => q.slug);
}
