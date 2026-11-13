import Database from "better-sqlite3";
import { AsyncLocalStorage } from "node:async_hooks";
import path from "node:path";
import { replayKey, type ReplayTable } from "./dbReplay";

let db: Database.Database | null = null;

/**
 * The united.db compiled from canonical JSON in prebuild. Only the build
 * opens it; the Worker replays recorded queries instead (lib/dbReplay.ts).
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
    db = recordable(conn);
  } catch (err) {
    throw new Error(`Database missing or unreadable at ${file}. Run npm run build:db.`, { cause: err });
  }
  return db;
}

const recordings = new AsyncLocalStorage<ReplayTable>();

/**
 * Run `fn` and capture every query it makes, for the Worker's replay
 * (lib/dbReplay.ts). Each result is serialized at once, so a caller that
 * mutates a returned row cannot change what was recorded.
 */
export async function recordQueries<T>(fn: () => Promise<T>): Promise<{ value: T; queries: ReplayTable }> {
  const queries: ReplayTable = {};
  const value = await recordings.run(queries, fn);
  return { value, queries };
}

function recordable(conn: Database.Database): Database.Database {
  const prepare = conn.prepare.bind(conn);
  conn.prepare = ((sql: string) => {
    const stmt = prepare(sql);
    const all = stmt.all.bind(stmt);
    const get = stmt.get.bind(stmt);
    stmt.all = ((...args: unknown[]) => {
      const rows = all(...args);
      const rec = recordings.getStore();
      if (rec) rec[replayKey("all", sql, args)] = JSON.stringify(rows);
      return rows;
    }) as typeof stmt.all;
    stmt.get = ((...args: unknown[]) => {
      const row = get(...args);
      const rec = recordings.getStore();
      if (rec) rec[replayKey("get", sql, args)] = JSON.stringify(row ?? null);
      return row;
    }) as typeof stmt.get;
    return stmt;
  }) as typeof conn.prepare;
  return conn;
}
