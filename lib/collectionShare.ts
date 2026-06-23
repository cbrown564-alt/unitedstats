/**
 * Client-safe collection plumbing. The working set lives in localStorage as a
 * list of `/cut` hrefs; viewing a collection always routes through an encoded
 * `/collection?c=` URL the server renders (rendering needs `runCut`/the DB, which
 * the browser can't do). This module carries the encode + storage only — no DB
 * imports — so client components can use it. The server-side decode and Cut
 * rendering live in lib/collections.ts.
 */

export const MAX_COLLECTION_CUTS = 12;
export const MAX_COLLECTION_CHARS = 1800;

const STORAGE_KEY = "unitedstats.collection.v1";

/** Isomorphic UTF-8 → base64url (browser `btoa` or Node `Buffer`), producing the
 *  same base64url that lib/collections.ts `decodeCollection` reads back. */
function encodeBase64Url(value: string): string {
  let base64: string;
  if (typeof btoa === "function") {
    const bytes = new TextEncoder().encode(value);
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    base64 = btoa(binary);
  } else {
    base64 = Buffer.from(value, "utf8").toString("base64");
  }
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function encodeCollectionHrefs(hrefs: string[]): string {
  return encodeBase64Url(JSON.stringify({ v: 1, cuts: hrefs }));
}

/** The shareable URL for a set of `/cut` hrefs. */
export function collectionShareHref(hrefs: string[]): string {
  return `/collection?c=${encodeCollectionHrefs(hrefs)}`;
}

// --- localStorage working set (browser only) --------------------------------

function dedupe(hrefs: string[]): string[] {
  return Array.from(new Set(hrefs));
}

export function readCollection(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return dedupe(parsed.filter((item): item is string => typeof item === "string")).slice(0, MAX_COLLECTION_CUTS);
  } catch {
    return [];
  }
}

export function writeCollection(hrefs: string[]): string[] {
  const next = dedupe(hrefs).slice(0, MAX_COLLECTION_CUTS);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore quota / privacy-mode write failures */
    }
  }
  emit();
  return next;
}

// --- subscribable store, so client components read via useSyncExternalStore ---
// (reading localStorage in an effect trips react-hooks/set-state-in-effect and
//  risks a hydration mismatch; this is the blessed pattern instead.)

const SERVER_SNAPSHOT: string[] = [];
const listeners = new Set<() => void>();
let snapshot: string[] | null = null;

function emit(): void {
  snapshot = null; // invalidate; next getSnapshot re-reads localStorage
  for (const listener of listeners) listener();
}

export function subscribeCollection(listener: () => void): () => void {
  listeners.add(listener);
  // Cross-tab writes fire a storage event; refresh the cache before notifying.
  const onStorage = () => {
    snapshot = null;
    listener();
  };
  if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
  };
}

/** Stable reference between writes — required by useSyncExternalStore. */
export function getCollectionSnapshot(): string[] {
  if (snapshot === null) snapshot = readCollection();
  return snapshot;
}

export function getCollectionServerSnapshot(): string[] {
  return SERVER_SNAPSHOT;
}
