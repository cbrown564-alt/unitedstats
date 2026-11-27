/**
 * Brings a running site's D1 up to the committed seed's schema through the
 * EmDash admin API: block types it lacks, fields its editorial collections
 * lack, collection labels and descriptions that differ, and story bodies the
 * seed holds that D1 doesn't. `emdash seed` writes
 * only a local SQLite file, and the setup wizard applies the seed once, so a
 * schema change in scripts/emdash/seed-from-registries.ts needs this before the
 * next publish (snapshot-seed refuses an export that is behind the seed).
 *
 * It never changes a block type or field D1 already has (only a collection's
 * label and description), and touches no other content. Without --apply it only reports what it would do.
 *
 *   EMDASH_TOKEN=… npx tsx scripts/emdash/apply-schema.mts https://utdred.com [--apply]
 *
 * The token is an API token from the admin (Settings → API tokens) with the
 * scopes schema:read, schema:write, content:read and content:write. Publishing
 * the updated story sends the usual publish dispatch, so the publish workflow
 * then checks the D1 export against the seed.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { EDITORIAL_COLLECTIONS } from "../../lib/editorial";

type Field = { slug: string; label: string; type: string; required?: boolean; unique?: boolean; validation?: unknown };
type BlockType = { slug: string; label: string; description?: string; currentVersion: number; versions: { version: number; fields: unknown[] }[] };
type Seed = {
  blockTypes?: BlockType[];
  collections: { slug: string; label: string; labelSingular?: string; description?: string; fields: Field[] }[];
  content: Record<string, { slug: string; data: Record<string, unknown> }[]>;
};

const [origin, ...flags] = process.argv.slice(2);
const apply = flags.includes("--apply");
const token = process.env.EMDASH_TOKEN;
if (!origin || !/^https?:\/\//.test(origin)) throw new Error("usage: apply-schema.mts <origin> [--apply]");
if (!token) throw new Error("apply-schema: set EMDASH_TOKEN to an admin API token");

const seed = JSON.parse(readFileSync(path.join(process.cwd(), "content", "emdash", "seed.json"), "utf8")) as Seed;

async function api<T>(method: string, route: string, body?: unknown): Promise<T> {
  const res = await fetch(new URL(`/_emdash/api${route}`, origin), {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "X-EmDash-Request": "1" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`apply-schema: ${method} ${route} → ${res.status} ${text.slice(0, 300)}`);
  const json = text ? (JSON.parse(text) as { data?: T }) : {};
  return (json.data ?? json) as T;
}

/** JSON with sorted keys and no empty values, so schemas compare by content. */
function canonical(value: unknown): string {
  return JSON.stringify(value, (_k, v: unknown) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v as Record<string, unknown>).filter(([, x]) => x !== undefined && x !== null).sort(([a], [b]) => a.localeCompare(b)))
      : v,
  );
}

const steps: { what: string; run: () => Promise<unknown> }[] = [];
const problems: string[] = [];

// 1. Block types, before the fields that allow them.
const { items: liveTypes } = await api<{ items: BlockType[] }>("GET", "/schema/block-types");
for (const bt of seed.blockTypes ?? []) {
  const live = liveTypes.find((t) => t.slug === bt.slug);
  const fields = bt.versions.find((v) => v.version === bt.currentVersion)?.fields ?? [];
  if (!live) {
    if (bt.currentVersion !== 1) problems.push(`block type ${bt.slug} is at version ${bt.currentVersion}; create versions by hand`);
    else steps.push({ what: `create block type ${bt.slug}`, run: () => api("POST", "/schema/block-types", { slug: bt.slug, label: bt.label, description: bt.description, fields }) });
  } else {
    const liveFields = live.versions.find((v) => v.version === live.currentVersion)?.fields ?? [];
    if (canonical(liveFields) !== canonical(fields)) problems.push(`block type ${bt.slug} exists in D1 with different fields; reconcile it by hand`);
  }
}

// 2. Collection labels and descriptions, and the fields the collections lack.
for (const slug of EDITORIAL_COLLECTIONS) {
  const collection = seed.collections.find((c) => c.slug === slug);
  if (collection) {
    const { item: live } = await api<{ item: { label: string; labelSingular?: string | null; description?: string | null } }>("GET", `/schema/collections/${slug}`);
    const text = { label: collection.label, labelSingular: collection.labelSingular, description: collection.description };
    const changed = (Object.keys(text) as (keyof typeof text)[]).filter((k) => text[k] !== undefined && text[k] !== (live[k] ?? undefined));
    if (changed.length > 0) {
      const update = Object.fromEntries(changed.map((k) => [k, text[k]]));
      steps.push({ what: `update ${slug} ${changed.join(", ")}`, run: () => api("PUT", `/schema/collections/${slug}`, update) });
    }
  }
  const want = collection?.fields ?? [];
  const { items: have } = await api<{ items: Field[] }>("GET", `/schema/collections/${slug}/fields`);
  for (const f of want) {
    if (have.some((h) => h.slug === f.slug)) continue;
    steps.push({
      what: `add field ${slug}.${f.slug} (${f.type})`,
      run: () => api("POST", `/schema/collections/${slug}/fields`, { slug: f.slug, label: f.label, type: f.type, required: f.required, unique: f.unique, validation: f.validation ?? null }),
    });
  }
}

// 3. Story bodies the seed holds and D1 doesn't (the field is new, so D1's is empty).
for (const entry of seed.content.stories ?? []) {
  const body = entry.data.body;
  if (!Array.isArray(body) || body.length === 0) continue;
  steps.push({
    what: `write and publish the body of stories/${entry.slug} (${body.length} blocks)`,
    run: async () => {
      const { item } = await api<{ item: { id: string; data: Record<string, unknown> } }>("GET", `/content/stories/${entry.slug}`);
      const live = item.data.body;
      if (Array.isArray(live) && live.length > 0) {
        if (canonical(live) !== canonical(body)) throw new Error(`apply-schema: stories/${entry.slug} already has a different body in D1; leaving it`);
        return;
      }
      await api("PUT", `/content/stories/${item.id}`, { data: { body } });
      await api("POST", `/content/stories/${item.id}/publish`);
    },
  });
}

for (const p of problems) console.error(`! ${p}`);
if (steps.length === 0) console.log("apply-schema: D1 already matches the seed's schema.");
for (const step of steps) {
  console.log(`${apply ? "→" : "would"} ${step.what}`);
  if (apply) await step.run();
}
if (!apply && steps.length > 0) console.log("apply-schema: dry run; pass --apply to make these changes.");
if (problems.length > 0) process.exitCode = 1;
