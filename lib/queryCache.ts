type CacheEntry<T> = { value: T; expiresAt: number };

const store = new Map<string, CacheEntry<unknown>>();

/**
 * In-process cache for synchronous SQLite reads. Cross-request in Node/Next SSR;
 * use react `cache()` separately if per-request dedup is also needed.
 */
export function cachedQuery<T>(key: string, ttlMs: number, fn: () => T): T {
  const now = Date.now();
  const hit = store.get(key);
  if (hit && hit.expiresAt > now) return hit.value as T;
  const value = fn();
  store.set(key, { value, expiresAt: now + ttlMs });
  return value;
}

/** Test-only: reset between cases. */
export function clearQueryCache(): void {
  store.clear();
}
