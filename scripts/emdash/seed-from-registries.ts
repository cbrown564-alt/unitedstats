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
import { writeFileSync } from "node:fs";
import path from "node:path";
import { CURATED_CUTS } from "../../lib/cut";
import { CURATED_DEBATES, type CompareMode } from "../../lib/curatedDebates";
import { CURATED_NIGHTS } from "../../lib/curatedNights";
import { allQuestionMeta } from "../../lib/questions";
import { storyShelf } from "../../lib/journey";
import { TRANSFER_NOTES } from "../../lib/transferEditorial";
import { CUT_DIMENSIONS, CUT_METRICS, EDITORIAL_COLLECTIONS } from "../../lib/editorial";

type Field = {
  slug: string;
  label: string;
  type: "string" | "text" | "integer" | "select";
  required?: boolean;
  unique?: boolean;
  validation?: { options: readonly string[] };
};
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
    description: "The stories shelf. Bodies stay in code until Phase 4.",
    supports: SUPPORTS,
    titleField: "title",
    fields: [
      { slug: "number", label: "Number", type: "string", required: true },
      { slug: "title", label: "Title", type: "string", required: true },
      { slug: "shelf_title", label: "Shelf title (optional override)", type: "string" },
      { slug: "description", label: "Description", type: "text", required: true },
      { slug: "kicker", label: "Kicker", type: "string", required: true },
      { slug: "prompt", label: "Prompt", type: "text", required: true },
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

const entry = (id: string, slug: string, data: Record<string, unknown>) => ({ id, slug, status: "published" as const, data });

const content = {
  nights: CURATED_NIGHTS.map((n, i) => entry(`night-${n.id}`, n.id, { match_id: n.id, stakes: n.stakes, group: n.group, position: i })),
  stories: storyShelf().map((s, i) =>
    entry(`story-${s.slug}`, s.slug, {
      number: s.number,
      title: s.title,
      ...(s.shelfTitle ? { shelf_title: s.shelfTitle } : {}),
      description: s.description,
      kicker: s.kicker,
      prompt: s.prompt,
      position: i,
    }),
  ),
  questions: allQuestionMeta().map((q, i) =>
    entry(`question-${q.slug}`, q.slug, { label: q.label, question: q.question, summary: q.summary, shelf: q.shelf, position: i }),
  ),
  debates: (Object.keys(CURATED_DEBATES) as CompareMode[]).flatMap((mode) =>
    CURATED_DEBATES[mode].map((d, i) =>
      entry(`debate-${mode}-${d.a}-${d.b}`, `${mode}-${d.a}-${d.b}`, { mode, label: d.label, a: d.a, b: d.b, hook: d.hook, position: i }),
    ),
  ),
  cuts: CURATED_CUTS.map((c, i) =>
    entry(`cut-${c.slug}`, c.slug, { eyebrow: c.eyebrow, title: c.title, blurb: c.blurb, dimension: c.dimension, metric: c.metric, position: i }),
  ),
  transfer_notes: TRANSFER_NOTES.map((t, i) => entry(`transfer-${t.transferId}`, t.transferId, { transfer_id: t.transferId, line: t.line, position: i })),
};

const seed = {
  $schema: "https://emdashcms.com/seed.schema.json",
  version: "1",
  meta: { name: "Red Thread", description: "Editorial content for Red Thread. Facts live in data/canonical/." },
  settings: { title: "Red Thread", tagline: "Every Manchester United match since 1886" },
  collections,
  content,
};

const out = path.join(process.cwd(), "content", "emdash", "seed.json");
writeFileSync(out, JSON.stringify(seed, null, 2) + "\n");
const counts = Object.entries(content).map(([k, v]) => `${k} ${v.length}`).join(", ");
console.log(`wrote ${path.relative(process.cwd(), out)}: ${counts}`);
