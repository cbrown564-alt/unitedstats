/**
 * The Worker's stand-in for lib/db.ts. The Worker has no SQLite: the build
 * records every query the live routes run (lib/db.ts, `recordQueries`) and
 * publishes the results as a static asset. A live render replays them here.
 *
 * A query the build never ran is a miss. A miss means the render needs record
 * data this deploy does not have, e.g. a night added in the admin since the
 * last deploy. It throws `ReplayMiss`, and the middleware serves the page
 * prerendered at deploy time instead, so a live page never shows a guessed or
 * empty record. The publish that added the entry also redeploys, which records
 * the new queries.
 *
 * The Vite config aliases lib/db.ts to this module in the Worker build only.
 */
import { AsyncLocalStorage } from "node:async_hooks";

/** The key a recorded query is stored under: method, SQL and bound arguments. */
export function replayKey(method: "all" | "get", sql: string, args: unknown[]): string {
  return JSON.stringify([method, sql, args]);
}

/** Recorded results by `replayKey`, each JSON-encoded (`get` misses as `null`). */
export type ReplayTable = Record<string, string>;

class ReplayMiss extends Error {
  constructor(readonly key: string) {
    super(`record snapshot has no result for ${key.slice(0, 200)}`);
    this.name = "ReplayMiss";
  }
}

let table: ReplayTable | null = null;
const misses = new AsyncLocalStorage<{ missed: string[] }>();

export function installReplay(next: ReplayTable): void {
  table = next;
}

export function replayInstalled(): boolean {
  return table !== null;
}

/** Run a render and report the queries it missed, if any (an error boundary may swallow the throw). */
export async function trackMisses<T>(fn: () => Promise<T>): Promise<{ value: T | undefined; missed: string[]; error?: unknown }> {
  const store = { missed: [] as string[] };
  try {
    const value = await misses.run(store, fn);
    return { value, missed: store.missed };
  } catch (error) {
    return { value: undefined, missed: store.missed, error };
  }
}

function look(method: "all" | "get", sql: string, args: unknown[]): unknown {
  if (!table) throw new Error("record snapshot not installed");
  const key = replayKey(method, sql, args);
  const hit = table[key];
  if (hit === undefined) {
    misses.getStore()?.missed.push(key);
    throw new ReplayMiss(key);
  }
  const value = JSON.parse(hit) as unknown;
  return value === null && method === "get" ? undefined : value;
}

const statement = (sql: string) => ({
  all: (...args: unknown[]) => look("all", sql, args),
  get: (...args: unknown[]) => look("get", sql, args),
});

const replayDb = { prepare: statement };

export function getDb(): typeof replayDb {
  return replayDb;
}
