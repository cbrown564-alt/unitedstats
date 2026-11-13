/**
 * Request-scoped editorial content for live renders. Installs the
 * `globalThis.__redthreadEditorial` source lib/editorial.ts reads; outside a
 * live request (prerendering, tests, the browser) it answers nothing and the
 * registries read the committed seed.
 */
import { AsyncLocalStorage } from "node:async_hooks";
import { getEmDashCollection } from "emdash";
import { EDITORIAL_COLLECTIONS, type EditorialCollection } from "@/lib/editorial";

type LiveEntry = { id: string; slug: string; status: "published"; data: Record<string, unknown> };
type Editorial = Map<EditorialCollection, LiveEntry[]>;

const scope = new AsyncLocalStorage<Editorial>();
(globalThis as { __redthreadEditorial?: unknown }).__redthreadEditorial = {
  get: (collection: EditorialCollection) => scope.getStore()?.get(collection),
};

/** EmDash answered but holds no editorial entries: D1 was never seeded or was wiped. */
export class EditorialUnseeded extends Error {
  constructor() {
    super("EmDash holds no editorial entries; seed D1 from content/emdash/seed.json");
    this.name = "EditorialUnseeded";
  }
}

/**
 * Every editorial collection as this request sees it: published entries, or
 * with a valid `_preview` token EmDash's draft revisions over them. A failed
 * query throws; so does an empty D1, which would otherwise render bare
 * shelves as if the editor had unpublished everything. Either way the caller
 * serves the deploy-time snapshot.
 */
export async function loadEditorial(): Promise<Editorial> {
  const results = await Promise.all(
    EDITORIAL_COLLECTIONS.map(async (collection) => {
      const { entries, error } = await getEmDashCollection(collection, { limit: 1000, orderBy: { position: "asc" } });
      if (error) throw error;
      return [
        collection,
        entries.map((e) => {
          const data = e.data as Record<string, unknown>;
          return { id: String(data.id ?? e.id), slug: e.id, status: "published" as const, data };
        }),
      ] as const;
    }),
  );
  if (results.every(([, list]) => list.length === 0)) throw new EditorialUnseeded();
  return new Map(results);
}

export function withEditorial<T>(editorial: Editorial, fn: () => T): T {
  return scope.run(editorial, fn);
}
