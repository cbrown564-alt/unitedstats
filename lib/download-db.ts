import fs from "node:fs";
import path from "node:path";
import { RUNTIME_DB_PATH, usesRuntimeDbBlob } from "./runtime-db-path";

// Re-exported so instrumentation can grab the guard alongside the downloader.
export { usesRuntimeDbBlob };

/** Scoped to data/ — see lib/db.ts LOCAL_DB_PATH. */
const LOCAL_DB_PATH = path.join(process.cwd(), "data", "united.db");

function runtimeDbBlobUrl(): string | null {
  return process.env.UNITEDSTATS_DB_BLOB_URL ?? null;
}

export async function downloadRuntimeDb(force = false): Promise<string> {
  const url = runtimeDbBlobUrl();
  if (!url) return LOCAL_DB_PATH;

  if (force && fs.existsSync(RUNTIME_DB_PATH)) fs.unlinkSync(RUNTIME_DB_PATH);

  if (fs.existsSync(RUNTIME_DB_PATH)) return RUNTIME_DB_PATH;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to download united.db (${res.status}) from blob`);

  const bytes = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(RUNTIME_DB_PATH, bytes);
  return RUNTIME_DB_PATH;
}
