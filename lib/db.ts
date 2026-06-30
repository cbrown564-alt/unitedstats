import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { RUNTIME_DB_PATH, usesRuntimeDbBlob } from "./runtime-db-path";

let db: Database.Database | null = null;

/**
 * The united.db built from canonical JSON in prebuild and bundled into every
 * server function (via `outputFileTracingIncludes` in next.config.ts). This is
 * the runtime floor — it always exists at deploy time, so the site can never go
 * down because a blob is missing.
 */
function bundledDbPath(): string {
  return path.join(process.cwd(), "data", "united.db");
}

/**
 * Which united.db to read at runtime. The blob-backed `/tmp` copy is a freshness
 * *upgrade* (newer than the deploy) populated by `instrumentation.ts` on cold
 * start and `resetDb()` on revalidation; the bundled copy is the floor. We only
 * prefer `/tmp` when it actually exists, so a blob hiccup degrades to "data as
 * of the last deploy" instead of a 500.
 *
 * Note: only `fs.existsSync` against `RUNTIME_DB_PATH` (under os.tmpdir(), not a
 * project path) touches the filesystem here. We deliberately never `fs`-probe a
 * `process.cwd()` path — @vercel/nft would then trace the whole repo into every
 * function bundle and blow past Vercel's 250MB limit.
 */
function resolveDbPath(): string {
  if (usesRuntimeDbBlob() && fs.existsSync(RUNTIME_DB_PATH)) return RUNTIME_DB_PATH;
  return bundledDbPath();
}

/** "blob" when serving the fresh /tmp copy, "bundled" when serving the deploy's copy. */
export function dbSource(): "blob" | "bundled" {
  return resolveDbPath() === RUNTIME_DB_PATH ? "blob" : "bundled";
}

function open(file: string): Database.Database {
  const conn = new Database(file, { readonly: true, fileMustExist: true });
  try {
    // better-sqlite3 opens lazily — force the header read now so a truncated or
    // corrupt file (e.g. a half-downloaded blob) throws here and triggers the
    // fallback, rather than lazily 500ing at the first real query.
    conn.pragma("user_version");
  } catch (err) {
    conn.close();
    throw err;
  }
  return conn;
}

export function getDb(): Database.Database {
  if (db) return db;
  const preferred = resolveDbPath();
  const fallback = bundledDbPath();
  try {
    db = open(preferred);
  } catch (err) {
    if (preferred === fallback) {
      throw new Error(`Database missing at ${fallback}. Run npm run build:db.`, { cause: err });
    }
    // The /tmp blob copy vanished or was unreadable mid-flight — serve the
    // bundled copy rather than failing the request.
    console.error(`[db] falling back to bundled united.db (preferred ${preferred} unreadable)`, err);
    db = open(fallback);
  }
  return db;
}

/**
 * Drop the cached connection and pull the latest blob into `/tmp` so the next
 * getDb() serves fresh data. Best-effort: if the download fails we keep serving
 * the bundled copy. Returns whether the refresh from blob actually landed.
 */
export async function resetDb(): Promise<boolean> {
  if (db) {
    db.close();
    db = null;
  }
  if (!usesRuntimeDbBlob()) return false;
  // Dynamic import keeps the fs-backed downloader out of every page's bundle.
  const { downloadRuntimeDb } = await import("./download-db");
  try {
    await downloadRuntimeDb(true);
    return fs.existsSync(RUNTIME_DB_PATH);
  } catch (err) {
    console.error("[db] blob refresh failed; serving bundled united.db", err);
    return false;
  }
}
