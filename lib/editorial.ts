/**
 * Editorial content: the Tier 1 collections EmDash edits (nights, stories,
 * question metadata, debates, cuts, transfer notes). Facts never live here; an
 * entry may reference a record by ID but never restates it (docs/EMDASH-MIGRATION-PLAN.md).
 *
 * Two sources, one shape:
 * - `content/emdash/seed.json`, the committed snapshot of every publish. It feeds
 *   prerendered pages, tests, and the browser.
 * - During a live render on the Worker, the request's entries from D1, installed
 *   by src/middleware.ts through `globalThis.__redthreadEditorial`. That lookup
 *   is request-scoped (AsyncLocalStorage on the server), so a draft preview never
 *   leaks into another request. This module imports nothing server-only, so
 *   client components can read it too.
 *
 * `liveList` returns an array view that resolves on every access. Registries keep
 * exporting plain-looking arrays (`CURATED_NIGHTS.map(...)`) and still follow
 * live content. Values derived once at module load from a list (a Set of IDs, a
 * lookup Map) follow the seed only; derive inside functions where live matters.
 */
import seed from "@/content/emdash/seed.json";

export const EDITORIAL_COLLECTIONS = ["nights", "stories", "questions", "debates", "cuts", "transfer_notes"] as const;
export type EditorialCollection = (typeof EDITORIAL_COLLECTIONS)[number];

/** The cut dimensions and metrics lib/cut.ts implements; the admin may pick only these. */
export const CUT_DIMENSIONS = ["season", "decade", "type", "competition", "venue", "opponent", "result", "manager", "player"] as const;
export const CUT_METRICS = ["winrate", "ppg", "gd", "matches", "goals", "apps", "starts", "goalsperapp"] as const;

type NightEntry = { match_id: string; stakes: string; group: "european" | "finals" | "drama" | "modern"; position: number };
type StoryEntry = {
  number: string;
  title: string;
  shelf_title?: string;
  description: string;
  kicker: string;
  prompt: string;
  position: number;
};
type QuestionEntry = { label: string; question: string; summary: string; shelf: "front-door" | "archived"; position: number };
type DebateEntry = { mode: "players" | "managers" | "eras"; label: string; a: string; b: string; hook: string; position: number };
type CutEntry = {
  eyebrow: string;
  title: string;
  blurb: string;
  dimension: (typeof CUT_DIMENSIONS)[number];
  metric: (typeof CUT_METRICS)[number];
  position: number;
};
type TransferNoteEntry = { transfer_id: string; line: string; position: number };

type DataOf = {
  nights: NightEntry;
  stories: StoryEntry;
  questions: QuestionEntry;
  debates: DebateEntry;
  cuts: CutEntry;
  transfer_notes: TransferNoteEntry;
};

/** One published entry: its slug (the stable key) and its fields. */
export type Entry<C extends EditorialCollection> = { slug: string; data: DataOf[C] };

type SeedEntry = { id: string; slug?: string | null; status?: string; data: Record<string, unknown> };
type LiveSource = { get(collection: EditorialCollection): SeedEntry[] | undefined };

const seeded = (seed as unknown as { content: Record<string, SeedEntry[]> }).content;

function source(): LiveSource | undefined {
  return (globalThis as { __redthreadEditorial?: LiveSource }).__redthreadEditorial;
}

/** Published entries of one collection, in `position` order. */
function entries<C extends EditorialCollection>(collection: C): Entry<C>[] {
  const raw = source()?.get(collection) ?? seeded[collection] ?? [];
  return raw
    .filter((e) => (e.status ?? "published") === "published")
    .map((e) => ({ slug: e.slug ?? e.id, data: e.data as DataOf[C] }))
    .sort((a, b) => (a.data.position ?? 0) - (b.data.position ?? 0));
}

const views = new WeakMap<object, () => unknown[]>();

/**
 * A read-only array that maps a collection's current entries on each access.
 * Mapping is cached per resolved entry list, so repeated reads within a render
 * share one array.
 */
export function liveList<C extends EditorialCollection, T>(
  collection: C,
  map: (e: Entry<C>) => T,
  where: (e: Entry<C>) => boolean = () => true,
): readonly T[] {
  let lastRaw: unknown;
  let last: T[] = [];
  const resolve = (): T[] => {
    const raw = source()?.get(collection) ?? seeded[collection];
    if (raw !== lastRaw) {
      lastRaw = raw;
      last = entries(collection).filter(where).map(map);
    }
    return last;
  };
  const view = new Proxy([] as T[], {
    get: (_t, key) => {
      const arr = resolve();
      const v = Reflect.get(arr, key, arr);
      return typeof v === "function" ? v.bind(arr) : v;
    },
    has: (_t, key) => Reflect.has(resolve(), key),
    ownKeys: () => Reflect.ownKeys(resolve()),
    getOwnPropertyDescriptor: (_t, key) => {
      const d = Reflect.getOwnPropertyDescriptor(resolve(), key);
      // The proxy target's own `length` is non-configurable; report it as such.
      if (d && key === "length") d.configurable = false;
      else if (d) d.configurable = true;
      return d;
    },
    set: () => false,
    defineProperty: () => false,
    deleteProperty: () => false,
  });
  views.set(view, resolve);
  return view;
}

/** A plain copy of a live list, e.g. to hand to a client component as a prop. */
export function snapshot<T>(list: readonly T[]): T[] {
  const resolve = views.get(list as object);
  return resolve ? [...(resolve() as T[])] : [...list];
}
