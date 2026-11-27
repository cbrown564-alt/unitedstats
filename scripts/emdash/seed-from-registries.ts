/**
 * Writes content/emdash/seed.json: the EmDash schema for Red Thread's Tier 1
 * editorial collections, plus their content.
 *
 * Content comes from the editorial readers in lib/ (lib/editorial.ts and the
 * registries built on it). Those first held TS literals and now read this same
 * seed, so running the script again rewrites the seed in canonical form: schema
 * changes here, content round-trips. The publish workflow replaces the content
 * from D1 (`emdash export-seed`); this script owns the schema.
 *
 *   npx tsx scripts/emdash/seed-from-registries.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { CURATED_CUTS } from "../../lib/cut";
import { CURATED_DEBATES, type CompareMode } from "../../lib/curatedDebates";
import { CURATED_NIGHTS } from "../../lib/curatedNights";
import { allQuestionMeta } from "../../lib/questions";
import { storyShelf } from "../../lib/journey";
import { TRANSFER_NOTES } from "../../lib/transferEditorial";
import { CUT_DIMENSIONS, CUT_METRICS, EDITORIAL_COLLECTIONS } from "../../lib/editorial";
import { NIGHT_MOTIFS, THREAD_STORY_SLUG } from "../../lib/threadOfNights";

type Field = {
  slug: string;
  label: string;
  type: "string" | "text" | "integer" | "select" | "blocks";
  required?: boolean;
  unique?: boolean;
  validation?: { options: readonly string[] } | { allowedTypes: readonly string[]; retiredTypes: readonly string[]; minItems: number; maxItems: number };
};
type BlockField = {
  slug: string;
  label: string;
  type: "string" | "text" | "select" | "repeater";
  required?: boolean;
  validation?: { options: readonly string[] } | { subFields: readonly { slug: string; label: string; type: "string"; required?: boolean }[] };
};

/**
 * Block types a story body may hold. Each renders an existing component and
 * names the record by ID; lib/threadOfNights.ts parses it. Phase 4 stopped at
 * one: every other story's visuals would each need a block of their own.
 */
const blockTypes: { slug: string; label: string; description: string; currentVersion: number; versions: { version: number; fields: BlockField[] }[] }[] = [
  {
    slug: "night",
    label: "Night",
    description:
      "One station on A thread of nights. Copy may read the record with tokens: {goal:Name}, {name:Name}, {minute:Name}, {goals:united}, {count:opponent}, {score}, {score:match-id}.",
    currentVersion: 1,
    versions: [
      {
        version: 1,
        fields: [
          { slug: "key", label: "Key (thread anchor, e.g. first-cup)", type: "string", required: true },
          { slug: "match_id", label: "Match ID", type: "string", required: true },
          { slug: "side", label: "Side", type: "select", required: true, validation: { options: ["left", "right"] } },
          { slug: "label", label: "Label", type: "string", required: true },
          { slug: "motif", label: "Motif", type: "select", required: true, validation: { options: NIGHT_MOTIFS } },
          { slug: "title", label: "Title", type: "string", required: true },
          { slug: "title_anchor", label: "Title ending (where the thread catches)", type: "string", required: true },
          { slug: "detail", label: "Detail", type: "text", required: true },
          { slug: "caption", label: "Receipt caption", type: "string", required: true },
          { slug: "focus", label: "Highlighted scorers (comma-separated)", type: "string" },
          { slug: "memory_src", label: "Photo path under /media/", type: "string" },
          { slug: "memory_position", label: "Photo position (e.g. 50% 30%)", type: "string" },
          {
            slug: "earlier",
            label: "Earlier receipts",
            type: "repeater",
            validation: {
              subFields: [
                { slug: "match_id", label: "Match ID", type: "string", required: true },
                { slug: "caption", label: "Caption", type: "string", required: true },
                { slug: "label", label: "Label", type: "string", required: true },
                { slug: "link_label", label: "Link label", type: "string", required: true },
              ],
            },
          },
        ],
      },
    ],
  },
];
type Collection = {
  slug: string;
  label: string;
  labelSingular: string;
  description: string;
  supports: string[];
  titleField: string;
  fields: Field[];
};

// No collection enables `search`: D1 export refuses FTS5 tables (ADR 0006).
const SUPPORTS = ["drafts", "revisions", "preview"];
const position: Field = { slug: "position", label: "Position", type: "integer", required: true };

const collections: Collection[] = [
  {
    slug: "nights",
    label: "Nights",
    labelSingular: "Night",
    description: "Curated great nights: the homepage spark, rediscovery and on-this-day. Each references one match.",
    supports: SUPPORTS,
    titleField: "match_id",
    fields: [
      { slug: "match_id", label: "Match ID", type: "string", required: true, unique: true },
      { slug: "stakes", label: "Stakes", type: "text", required: true },
      { slug: "group", label: "Group", type: "select", required: true, validation: { options: ["european", "finals", "drama", "modern"] } },
      position,
    ],
  },
  {
    slug: "stories",
    label: "Stories",
    labelSingular: "Story",
    description: "The stories shelf. A thread of nights takes its body from night blocks; the other bodies are in code.",
    supports: SUPPORTS,
    titleField: "title",
    fields: [
      { slug: "number", label: "Number", type: "string", required: true },
      { slug: "title", label: "Title", type: "string", required: true },
      { slug: "shelf_title", label: "Shelf title (optional override)", type: "string" },
      { slug: "description", label: "Description", type: "text", required: true },
      { slug: "kicker", label: "Kicker", type: "string", required: true },
      { slug: "prompt", label: "Prompt", type: "text", required: true },
      // EmDash's defaults for a blocks field written out, as `export-seed` writes them.
      { slug: "body", label: "Body", type: "blocks", validation: { allowedTypes: ["night"], retiredTypes: [], minItems: 0, maxItems: 100 } },
      position,
    ],
  },
  {
    slug: "questions",
    label: "Questions",
    labelSingular: "Question",
    description: "Question metadata. The answer modules stay in code, keyed by slug.",
    supports: SUPPORTS,
    titleField: "question",
    fields: [
      { slug: "label", label: "Label", type: "string", required: true },
      { slug: "question", label: "Question", type: "string", required: true },
      { slug: "summary", label: "Summary (evergreen, no counts)", type: "text", required: true },
      { slug: "shelf", label: "Shelf", type: "select", required: true, validation: { options: ["front-door", "archived"] } },
      position,
    ],
  },
  {
    slug: "debates",
    label: "Debates",
    labelSingular: "Debate",
    description: "Curated head-to-heads for /compare and /explore. Subjects are player, manager or era IDs.",
    supports: SUPPORTS,
    titleField: "label",
    fields: [
      { slug: "mode", label: "Mode", type: "select", required: true, validation: { options: ["players", "managers", "eras"] } },
      { slug: "label", label: "Label", type: "string", required: true },
      { slug: "a", label: "Subject A", type: "string", required: true },
      { slug: "b", label: "Subject B", type: "string", required: true },
      { slug: "hook", label: "Hook", type: "text", required: true },
      position,
    ],
  },
  {
    slug: "cuts",
    label: "Cuts",
    labelSingular: "Cut",
    description: "Curated cuts. Dimension and metric are what the code implements.",
    supports: SUPPORTS,
    titleField: "title",
    fields: [
      { slug: "eyebrow", label: "Eyebrow", type: "string", required: true },
      { slug: "title", label: "Title", type: "string", required: true },
      { slug: "blurb", label: "Blurb", type: "text", required: true },
      { slug: "dimension", label: "Dimension", type: "select", required: true, validation: { options: CUT_DIMENSIONS } },
      { slug: "metric", label: "Metric", type: "select", required: true, validation: { options: CUT_METRICS } },
      position,
    ],
  },
  {
    slug: "transfer_notes",
    label: "Transfer notes",
    labelSingular: "Transfer note",
    description: "One-liners for featured deals. Deals without one get the line built from the record.",
    supports: SUPPORTS,
    titleField: "transfer_id",
    fields: [
      { slug: "transfer_id", label: "Transfer ID", type: "string", required: true, unique: true },
      { slug: "line", label: "Line", type: "text", required: true },
      position,
    ],
  },
];

if (collections.map((c) => c.slug).join() !== EDITORIAL_COLLECTIONS.join()) {
  throw new Error("seed-from-registries: collections out of step with lib/editorial.ts EDITORIAL_COLLECTIONS");
}

const entry = (slug: string, data: Record<string, unknown>) => ({ slug, status: "published" as const, data });

// Story bodies are block content no registry rebuilds, so they carry over from the seed.
const seedPath = path.join(process.cwd(), "content", "emdash", "seed.json");
const committedStories = (JSON.parse(readFileSync(seedPath, "utf8")) as { content: { stories?: { slug: string; data: { body?: unknown } }[] } }).content.stories ?? [];
const bodyOf = (slug: string) => committedStories.find((e) => e.slug === slug)?.data.body;
if (!bodyOf(THREAD_STORY_SLUG)) throw new Error(`seed-from-registries: the seed has no body for ${THREAD_STORY_SLUG}`);

const content = {
  nights: CURATED_NIGHTS.map((n, i) => entry(n.id, { match_id: n.id, stakes: n.stakes, group: n.group, position: i })),
  stories: storyShelf().map((s, i) =>
    entry(s.slug, {
      number: s.number,
      title: s.title,
      ...(s.shelfTitle ? { shelf_title: s.shelfTitle } : {}),
      description: s.description,
      kicker: s.kicker,
      prompt: s.prompt,
      body: bodyOf(s.slug) ?? [],
      position: i,
    }),
  ),
  questions: allQuestionMeta().map((q, i) =>
    entry(q.slug, { label: q.label, question: q.question, summary: q.summary, shelf: q.shelf, position: i }),
  ),
  debates: (Object.keys(CURATED_DEBATES) as CompareMode[]).flatMap((mode) =>
    CURATED_DEBATES[mode].map((d, i) =>
      entry(`${mode}-${d.a}-${d.b}`, { mode, label: d.label, a: d.a, b: d.b, hook: d.hook, position: i }),
    ),
  ),
  cuts: CURATED_CUTS.map((c, i) =>
    entry(c.slug, { eyebrow: c.eyebrow, title: c.title, blurb: c.blurb, dimension: c.dimension, metric: c.metric, position: i }),
  ),
  transfer_notes: TRANSFER_NOTES.map((t, i) => entry(t.transferId, { transfer_id: t.transferId, line: t.line, position: i })),
};

/** EmDash's own entry IDs (`collection:slug`), as `emdash export-seed` writes them. */
const withIds = Object.fromEntries(
  Object.entries(content).map(([collection, list]) => [collection, list.map((e) => ({ id: `${collection}:${e.slug}`, ...e }))]),
);

const seed = {
  $schema: "https://emdashcms.com/seed.schema.json",
  version: "1",
  meta: { name: "Red Thread", description: "Editorial content for Red Thread. Facts live in data/canonical/." },
  settings: { title: "Red Thread", tagline: "Every Manchester United match since 1886", timezone: "Europe/London" },
  blockTypes,
  collections,
  content: withIds,
};

const out = seedPath;
writeFileSync(out, JSON.stringify(seed, null, 2) + "\n");
const counts = Object.entries(content).map(([k, v]) => `${k} ${v.length}`).join(", ");
console.log(`wrote ${path.relative(process.cwd(), out)}: ${counts}`);
