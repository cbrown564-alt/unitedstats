import Database from "better-sqlite3";
import path from "node:path";

let db: Database.Database | null = null;

/**
 * The united.db compiled from canonical JSON in prebuild. Only `next build`
 * opens it: the deployed site is a static export and never reads SQLite.
 */
function dbPath(): string {
  return path.join(process.cwd(), "data", "united.db");
}

export function getDb(): Database.Database {
  if (db) return db;
  const file = dbPath();
  try {
    const conn = new Database(file, { readonly: true, fileMustExist: true });
    // better-sqlite3 opens lazily; read the header now so a truncated or
    // corrupt file fails here with a clear message instead of at a query.
    conn.pragma("user_version");
    db = conn;
  } catch (err) {
    throw new Error(`Database missing or unreadable at ${file}. Run npm run build:db.`, { cause: err });
  }
  return db;
}
