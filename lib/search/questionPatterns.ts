import { questionBySlug, questionSlugs } from "../questions";
import { fold } from "./fold";
import type { SearchEntity } from "../search";

/**
 * Pattern registry for curated question pages. Kept free of SQLite so the
 * static-export search client can match myths without pulling the database
 * into the browser bundle.
 */
export interface QuestionPatternEntry {
  slug: string;
  patterns: RegExp[];
  priority?: number;
}

export const QUESTION_PATTERNS: QuestionPatternEntry[] = [
  {
    slug: "treble",
    priority: 10,
    patterns: [
      /\btreble\b/,
      /\b98\s*99\b.*\btreble\b|\btreble\b.*\b98\s*99\b/,
      /\b1998\s*99\b.*\btreble\b|\btreble\b.*\b1998\s*99\b/,
      /\benglish treble\b/,
      /\bonly english treble\b/,
    ],
  },
  {
    slug: "ferguson-era",
    priority: 8,
    patterns: [
      /\bferguson era\b/,
      /\bafter ferguson\b/,
      /\bsince ferguson\b/,
      /\bpost ferguson\b/,
      /\bafter sir alex\b/,
      /\bsince sir alex\b/,
      /\btitles since ferguson\b/,
      /\bafter ferguson left\b/,
      /\bwhat happened after ferguson\b/,
      /\bno league titles since\b/,
    ],
  },
  {
    slug: "fortress",
    priority: 7,
    patterns: [
      /\bfortress ot\b/,
      /\bfortress old trafford\b/,
      /\bold trafford fortress\b/,
      /\bhow much of a fortress\b/,
      /\bfortress\b/,
      /\blead at half time at home\b/,
      /\bhalf time lead at home\b/,
    ],
  },
  {
    slug: "late-goals",
    priority: 8,
    patterns: [
      /\bfergie time\b/,
      /\bfergy time\b/,
      /\bfergie time unique\b/,
      /\bwas fergie time\b/,
      /\blate goals under ferguson\b/,
      /\bgoals after the 85th\b/,
      /\bgoals after 85th\b/,
      /\blate goal share\b/,
    ],
  },
  {
    slug: "europe",
    priority: 6,
    patterns: [
      /\bunited in europe\b/,
      /\bunited european record\b/,
      /\beuropean record by era\b/,
      /\bunited europe record\b/,
    ],
  },
  {
    slug: "manager-bounce",
    priority: 5,
    patterns: [
      /\bmanager bounce\b/,
      /\bnew manager bounce\b/,
      /\bnew manager effect\b/,
      /\bfirst ten matches under\b/,
    ],
  },
  {
    slug: "comebacks",
    priority: 6,
    patterns: [
      /\bcomeback kings\b/,
      /\bcomebacks from behind\b/,
      /\bunited comebacks\b/,
      /\bpoints from losing positions\b/,
    ],
  },
  {
    slug: "runs",
    priority: 5,
    patterns: [
      /\bunbeaten streaks\b/,
      /\bunbeaten streak\b/,
      /\bunbeaten run\b/,
      /\blongest unbeaten\b/,
      /\bwinning streak\b/,
      /\bwinning run\b/,
      /\blongest run without defeat\b/,
      /\bscoring streak\b/,
      /\bclean sheet run\b/,
    ],
  },
  {
    slug: "cup-specialists",
    priority: 5,
    patterns: [
      /\bcup specialists\b/,
      /\bcup goal share\b/,
      /\bgoals in cups\b/,
      /\bsaved their goals for cup\b/,
    ],
  },
  {
    slug: "own-goals",
    priority: 7,
    patterns: [
      /\bown goals\b/,
      /\bown goal top scorer\b/,
      /\bown goals ranked\b/,
      /\bown goal one of united\b/,
      /\bown goal goalscorer\b/,
    ],
  },
  {
    slug: "away-days",
    priority: 5,
    patterns: [
      /\baway days\b/,
      /\btravel distance away\b/,
      /\bfurthest away ground\b/,
      /\bdistance from manchester away\b/,
    ],
  },
];

const slugSet = new Set(questionSlugs());
for (const entry of QUESTION_PATTERNS) {
  if (!slugSet.has(entry.slug)) throw new Error(`questionPatterns: unknown slug "${entry.slug}"`);
}

/** Curated myth pages whose patterns match the query — no SQLite headlines. */
export function matchQuestionPagesLite(q: string): SearchEntity[] {
  const norm = fold(q);
  if (!norm) return [];

  const hits: { entry: QuestionPatternEntry; entity: SearchEntity }[] = [];
  for (const entry of QUESTION_PATTERNS) {
    if (!entry.patterns.some((pattern) => pattern.test(norm))) continue;
    const meta = questionBySlug(entry.slug);
    if (!meta) continue;
    const short = meta.summary.length > 72 ? `${meta.summary.slice(0, 69)}…` : meta.summary;
    hits.push({
      entry,
      entity: {
        kind: "question",
        label: meta.question,
        detail: `${meta.label} · ${short}`,
        href: `/questions/${entry.slug}`,
      },
    });
  }

  hits.sort((a, b) => (b.entry.priority ?? 0) - (a.entry.priority ?? 0));
  return hits.map((hit) => hit.entity);
}
