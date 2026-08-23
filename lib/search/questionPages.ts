import { questionBySlug } from "../questions";
import { questionHeadlines } from "../questionHeadlines";
import { fold } from "./fold";
import { QUESTION_PATTERNS, type QuestionPatternEntry } from "./questionPatterns";
import type { SearchEntity } from "../search";

function questionDetail(slug: string, label: string): string {
  const headline = questionHeadlines()[slug];
  if (headline) {
    const glossBit = headline.gloss.split("—")[0].trim();
    return `${label} · ${headline.stat} ${glossBit}`;
  }
  const meta = questionBySlug(slug);
  if (!meta) return label;
  const short = meta.summary.length > 72 ? `${meta.summary.slice(0, 69)}…` : meta.summary;
  return `${label} · ${short}`;
}

/** Curated myth pages whose patterns match the query — empty when none do. */
export function matchQuestionPages(q: string): SearchEntity[] {
  const norm = fold(q);
  if (!norm) return [];

  const hits: { entry: QuestionPatternEntry; entity: SearchEntity }[] = [];
  for (const entry of QUESTION_PATTERNS) {
    if (!entry.patterns.some((pattern) => pattern.test(norm))) continue;
    const meta = questionBySlug(entry.slug);
    if (!meta) continue;
    hits.push({
      entry,
      entity: {
        kind: "question",
        label: meta.question,
        detail: questionDetail(entry.slug, meta.label),
        href: `/questions/${entry.slug}`,
      },
    });
  }

  hits.sort((a, b) => (b.entry.priority ?? 0) - (a.entry.priority ?? 0));
  return hits.map((hit) => hit.entity);
}
