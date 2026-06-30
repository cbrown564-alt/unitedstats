import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { RUNTIME_DB_PATH, usesRuntimeDbBlob } from "./runtime-db-path";

let db: Database.Database | null = null;
let resolvedPath: string | null = null;

function openDb(file: string): Database.Database {
  return new Database(file, { readonly: true, fileMustExist: true });
}

function resolveLocalPath(): string {
  if (resolvedPath) return resolvedPath;
  resolvedPath = usesRuntimeDbBlob()
    ? RUNTIME_DB_PATH
    : path.join(process.cwd(), "data", "united.db");
  return resolvedPath;
}

export function getDb(): Database.Database {
  if (!db) {
    const file = resolveLocalPath();
    if (!fs.existsSync(file)) {
      throw new Error(
        usesRuntimeDbBlob()
          ? `Runtime database missing at ${file}. Ensure instrumentation ran or call resetDb() after upload.`
          : `Database missing at ${file}. Run npm run build:db.`,
      );
    }
    db = openDb(file);
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
