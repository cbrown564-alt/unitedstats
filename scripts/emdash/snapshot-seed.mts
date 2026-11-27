/**
 * Turns an `emdash export-seed` dump into content/emdash/seed.json, in the
 * committed shape, so a publish commits only what the editor changed.
 *
 * - Keeps the six editorial collections (lib/editorial.ts), in that order, and
 *   drops what EmDash adds on its own (its default taxonomies, empty menus).
 * - Keeps entries in their committed order; new entries follow. Registries
 *   sort by `position`, so order here is for readable diffs only.
 * - Writes EmDash's own entry IDs (`collection:slug`), as the export does.
 * - Fails, rather than drop it, if the editor used something the site does not
 *   read yet (a menu, a taxonomy, a block type of their own).
 * - Block types and fields are owned by scripts/emdash/seed-from-registries.ts.
 *   The export must carry the committed block types unchanged and every
 *   committed field, or D1 is behind the schema (or ahead of it) and a snapshot
 *   would silently drop content; it fails instead.
 *
 *   npx tsx scripts/emdash/snapshot-seed.mts <export.json>   # rewrites the seed
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { EDITORIAL_COLLECTIONS } from "../../lib/editorial";

type Entry = { id: string; slug: string; status: string; data: Record<string, unknown> };
type Seed = {
  settings?: Record<string, unknown>;
  collections: { slug: string; fields: { slug: string }[] }[];
  content: Record<string, Entry[]>;
  menus?: unknown[];
  taxonomies?: { collections?: string[] }[];
  blockTypes?: unknown[];
  widgetAreas?: unknown[];
};

const exportPath = process.argv[2];
if (!exportPath) throw new Error("usage: snapshot-seed.mts <export.json>");
const seedPath = path.join(process.cwd(), "content", "emdash", "seed.json");
const exported = JSON.parse(readFileSync(exportPath, "utf8")) as Seed;
const committed = JSON.parse(readFileSync(seedPath, "utf8")) as Seed & Record<string, unknown>;

const editorial = new Set<string>(EDITORIAL_COLLECTIONS);
const unread = [
  ...exported.collections.filter((c) => !editorial.has(c.slug)).map((c) => `collection ${c.slug}`),
  ...(exported.menus ?? []).map(() => "a menu"),
  ...(exported.widgetAreas ?? []).map(() => "a widget area"),
  // EmDash creates category/tag taxonomies for its default `posts` collection; one on our collections is new.
  ...(exported.taxonomies ?? []).filter((t) => t.collections?.some((c) => editorial.has(c))).map(() => "a taxonomy"),
];
if (unread.length > 0) {
  throw new Error(`snapshot-seed: the export holds ${[...new Set(unread)].join(", ")}, which the site does not read. Wire it in before publishing.`);
}

/** JSON with sorted keys, so two schemas compare by content, not key order. */
function canonical(value: unknown): string {
  return JSON.stringify(value, (_k, v: unknown) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v as Record<string, unknown>).filter(([, x]) => x !== undefined && x !== null).sort(([a], [b]) => a.localeCompare(b)))
      : v,
  );
}

const committedBlockTypes = committed.blockTypes ?? [];
const exportedBlockTypes = exported.blockTypes ?? [];
if (canonical(exportedBlockTypes) !== canonical(committedBlockTypes)) {
  throw new Error(
    exportedBlockTypes.length < committedBlockTypes.length
      ? "snapshot-seed: D1 lacks block types the seed declares. Apply the schema to D1 first (the Schema changes section of docs/ARCHITECTURE.md)."
      : "snapshot-seed: D1's block types differ from the seed's. Change block types in scripts/emdash/seed-from-registries.ts, not the admin.",
  );
}

const collections = EDITORIAL_COLLECTIONS.map((slug) => {
  const c = exported.collections.find((x) => x.slug === slug);
  if (!c) throw new Error(`snapshot-seed: the export has no ${slug} collection`);
  const missing = (committed.collections.find((x) => x.slug === slug)?.fields ?? []).filter((f) => !c.fields.some((x) => x.slug === f.slug));
  if (missing.length > 0) {
    throw new Error(`snapshot-seed: D1's ${slug} collection lacks ${missing.map((f) => f.slug).join(", ")}. Apply the schema to D1 first (the Schema changes section of docs/ARCHITECTURE.md).`);
  }
  return c;
});

const content = Object.fromEntries(
  collections.map(({ slug: collection, fields }) => {
    const before = (committed.content[collection] ?? []).map((e) => e.slug);
    const rank = (slug: string) => (before.includes(slug) ? before.indexOf(slug) : before.length);
    const order = [...fields.map((f) => f.slug), "position"];
    const entries = (exported.content[collection] ?? [])
      .map((e, i) => ({ e, i }))
      .sort((a, b) => rank(a.e.slug) - rank(b.e.slug) || a.i - b.i)
      .map(({ e }) => ({
        id: `${collection}:${e.slug}`,
        slug: e.slug,
        status: e.status,
        data: Object.fromEntries(Object.entries(e.data).sort(([a], [b]) => keyRank(order, a) - keyRank(order, b))),
      }));
    return [collection, entries];
  }),
);

function keyRank(order: string[], key: string): number {
  const i = order.indexOf(key);
  return i === -1 ? order.length : i;
}

// Settings keep their committed key order; a new one follows.
const settings = { ...(committed.settings ?? {}), ...(exported.settings ?? {}) };
const seed = { ...committed, settings, ...(committedBlockTypes.length > 0 ? { blockTypes: committedBlockTypes } : {}), collections, content };
writeFileSync(seedPath, JSON.stringify(seed, null, 2) + "\n");
console.log(`snapshot-seed: ${Object.values(content).reduce((n, list) => n + list.length, 0)} entries across ${collections.length} collections`);
