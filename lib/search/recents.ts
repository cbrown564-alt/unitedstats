/**
 * Recent searches, kept in localStorage so the empty state can offer "pick up
 * where you left off". Exposed as a tiny external store (subscribe + cached
 * snapshot) so components can read it through `useSyncExternalStore` without a
 * set-state-in-effect dance. Client-only and best-effort: any storage error is
 * swallowed (private mode, quota) — recents are a nicety, never a dependency.
 */
const KEY = "unitedstats:recent-searches";
const MAX = 6;

/** Stable empty reference for SSR / no-storage, so snapshots don't thrash. */
const EMPTY: readonly string[] = [];

let cache: readonly string[] | null = null;
const listeners = new Set<() => void>();

function read(): readonly string[] {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(list) ? list.filter((x): x is string => typeof x === "string").slice(0, MAX) : EMPTY;
  } catch {
    return EMPTY;
  }
}

/** Cached snapshot (stable reference until invalidated) for useSyncExternalStore. */
export function getRecentsSnapshot(): readonly string[] {
  if (cache === null) cache = read();
  return cache;
}

/** Server snapshot — never any recents during SSR. */
export function getRecentsServerSnapshot(): readonly string[] {
  return EMPTY;
}

export function subscribeRecents(cb: () => void): () => void {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      cb();
    }
  };
  if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
  };
}

export function pushRecent(q: string): void {
  const query = q.trim();
  if (typeof window === "undefined" || query.length < 2) return;
  try {
    const next = [query, ...read().filter((r) => r.toLowerCase() !== query.toLowerCase())].slice(0, MAX);
    window.localStorage.setItem(KEY, JSON.stringify(next));
    cache = next;
    for (const l of listeners) l();
  } catch {
    // ignore — storage unavailable
  }
}
