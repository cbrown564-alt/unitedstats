/**
 * Upload united.db to Vercel Blob for runtime refresh without a full redeploy.
 *
 * Usage:
 *   BLOB_READ_WRITE_TOKEN=... npm run upload:db
 *
 * Sets/overwrites pathname `dataset/united.db`. Point UNITEDSTATS_DB_BLOB_URL at
 * the returned URL in the Vercel project env.
 */
import fs from "node:fs";
import path from "node:path";
import { put } from "@vercel/blob";
import { DB_PATH } from "./lib";

async function main() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error("BLOB_READ_WRITE_TOKEN is required");

  if (!fs.existsSync(DB_PATH)) throw new Error(`Missing ${DB_PATH}. Run npm run build:db first.`);

  const blob = await put("dataset/united.db", fs.readFileSync(DB_PATH), {
    access: "public",
    token,
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/octet-stream",
    // The pathname is fixed and overwritten in place each ingest, so the default
    // month-long CDN cache would serve a stale db after upload — defeating the
    // point of revalidation. Force a no-cache so resetDb() always pulls fresh.
    cacheControlMaxAge: 0,
  });

  console.log(`uploaded ${path.basename(DB_PATH)} (${fs.statSync(DB_PATH).size} bytes)`);
  console.log(`UNITEDSTATS_DB_BLOB_URL=${blob.url}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
