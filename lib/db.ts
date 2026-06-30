import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { RUNTIME_DB_PATH, usesRuntimeDbBlob } from "./runtime-db-path";

/** Scoped to data/ so the file tracer does not pull the whole repo into every function. */
const LOCAL_DB_PATH = path.join(process.cwd(), "data", "united.db");

let db: Database.Database | null = null;
let resolvedPath: string | null = null;

function openDb(file: string): Database.Database {
  return new Database(file, { readonly: true, fileMustExist: true });
}

function resolveLocalPath(): string {
  if (resolvedPath) return resolvedPath;
  resolvedPath = usesRuntimeDbBlob() ? RUNTIME_DB_PATH : LOCAL_DB_PATH;
  return resolvedPath;
}

function missingDbMessage(file: string): string {
  return usesRuntimeDbBlob()
    ? `Runtime database missing at ${file}. Ensure instrumentation ran or call resetDb() after upload.`
    : `Database missing at ${file}. Run npm run build:db.`;
}

export function getDb(): Database.Database {
  if (!db) {
    const file = resolveLocalPath();
    try {
      db = openDb(file);
    } catch {
      throw new Error(missingDbMessage(file));
    }
  }
  return db;
}

/** Drop the cached connection and local blob copy so the next getDb() picks up a fresh upload. */
export async function resetDb(): Promise<void> {
  if (db) {
    db.close();
    db = null;
  }
  resolvedPath = null;
  if (usesRuntimeDbBlob()) {
    // Dynamic import keeps the fs-backed downloader out of every page's bundle.
    const { downloadRuntimeDb } = await import("./download-db");
    if (fs.existsSync(RUNTIME_DB_PATH)) fs.unlinkSync(RUNTIME_DB_PATH);
    resolvedPath = await downloadRuntimeDb();
  }
}
