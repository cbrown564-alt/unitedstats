import fs from "node:fs";
import path from "node:path";

/**
 * Append-only search telemetry. The main DB is opened read-only, so queries,
 * zero-result events, and click-throughs land in a JSONL sidecar instead — the
 * raw material Phase 4 feeds back into `prominence` and popular-questions.
 *
 * Best-effort by design: on a read-only filesystem (serverless) the append
 * simply fails and is swallowed, so logging can never degrade search itself.
 * Path is overridable with SEARCH_LOG_PATH; set SEARCH_LOG=0 to disable.
 */
const LOG_PATH = process.env.SEARCH_LOG_PATH || path.join(process.cwd(), "output", "search-log.jsonl");
const ENABLED = process.env.SEARCH_LOG !== "0";

export type SearchLogEntry =
  | { kind: "query"; q: string; resultCount: number; shaped: number }
  | { kind: "click"; q: string; href: string; resultCount: number };

export function logSearch(entry: SearchLogEntry): void {
  if (!ENABLED) return;
  try {
    fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
    fs.appendFileSync(LOG_PATH, `${JSON.stringify({ ...entry, ts: new Date().toISOString() })}\n`);
  } catch {
    // read-only FS or quota — telemetry is optional, never fatal
  }
}
