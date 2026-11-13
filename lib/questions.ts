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
 * Edited in EmDash (`questions`) and read through lib/editorial.ts; the answer
 * modules stay in code.
 *
 * `QUESTIONS` is the curated **front door** — the catalogue the homepage, the
 * explore page, and the surprise feed pull from.
 *
 * `ARCHIVED_QUESTIONS` are kept linkable (routes, modules, OG cards still
 * resolve) but are off the front door, excluded from the sitemap, and marked
 * `noindex`. See `docs/archived-questions.md` for provenance and rationale.
 */
import { liveList, type Entry } from "./editorial";

export interface QuestionMeta {
  slug: string;
  /** Short nav/label form. */
  label: string;
  /** The headline question, matching the rendered module heading. */
  question: string;
  /** Evergreen one-liner for metadata, the OG card, and citations. */
  summary: string;
}

const meta = (e: Entry<"questions">): QuestionMeta => ({
  slug: e.slug,
  label: e.data.label,
  question: e.data.question,
  summary: e.data.summary,
});

/** The front door. Edited in EmDash (`questions`, shelf "front-door"). */
export const QUESTIONS: readonly QuestionMeta[] = liveList("questions", meta, (e) => e.data.shelf === "front-door");

/** Former front-door and easter-egg questions: modules preserved, discovery off. */
const ARCHIVED_QUESTIONS: readonly QuestionMeta[] = liveList("questions", meta, (e) => e.data.shelf === "archived");

export function questionBySlug(slug: string): QuestionMeta | undefined {
  return QUESTIONS.find((q) => q.slug === slug) ?? ARCHIVED_QUESTIONS.find((q) => q.slug === slug);
}

export function isArchivedQuestion(slug: string): boolean {
  return ARCHIVED_QUESTIONS.some((q) => q.slug === slug);
}

/** Slugs on the curated front door — explore, surprise, sitemap, related trails. */
export function activeQuestionSlugs(): string[] {
  return QUESTIONS.map((q) => q.slug);
}

function dayOfYear(d: Date): number {
  const start = Date.UTC(d.getUTCFullYear(), 0, 0);
  const today = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return Math.floor((today - start) / 86_400_000);
}

/** Today's featured launch myth — one front-door card, day-rotated, independent of TonightHero. */
export function featuredLaunchQuestion(now = new Date()): QuestionMeta {
  const q = QUESTIONS[dayOfYear(now) % QUESTIONS.length];
  if (!q) throw new Error("no front-door questions");
  return q;
}

/** Every question route — active plus archived — for `generateStaticParams`. */
export function questionSlugs(): string[] {
  return [...QUESTIONS, ...ARCHIVED_QUESTIONS].map((q) => q.slug);
}

/** Every question with its shelf, front door first — the editorial collection's shape. */
export function allQuestionMeta(): (QuestionMeta & { shelf: "front-door" | "archived" })[] {
  return [
    ...QUESTIONS.map((q) => ({ ...q, shelf: "front-door" as const })),
    ...ARCHIVED_QUESTIONS.map((q) => ({ ...q, shelf: "archived" as const })),
  ];
}
