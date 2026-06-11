import Database from "better-sqlite3";
import path from "node:path";

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(path.join(process.cwd(), "data", "united.db"), {
      readonly: true,
      fileMustExist: true,
    });
  }
  return db;
}
