import os from "node:os";
import path from "node:path";

/**
 * Where the runtime db copy lives, and whether the blob-backed runtime db is in
 * use. Deliberately fs-free: `lib/db.ts` (imported by every page) loads this so
 * the actual downloader (`lib/download-db.ts`, which does fs writes) stays out of
 * the static graph and isn't traced into every function bundle.
 */
export const RUNTIME_DB_PATH = path.join(os.tmpdir(), "unitedstats-united.db");

export function usesRuntimeDbBlob(): boolean {
  // Never during `next build`: prerendering must read the freshly-built local
  // data/united.db, not the blob's /tmp copy (instrumentation only downloads it
  // at server startup, so /tmp is empty at build time). Production sets
  // UNITEDSTATS_DB_BLOB_URL for both build and runtime; this scopes it to runtime.
  if (process.env.NEXT_PHASE === "phase-production-build") return false;
  return Boolean(process.env.UNITEDSTATS_DB_BLOB_URL);
}
