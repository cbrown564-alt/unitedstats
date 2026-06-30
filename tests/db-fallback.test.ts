import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// Mirror of RUNTIME_DB_PATH in lib/runtime-db-path.ts.
const RUNTIME_DB_PATH = path.join(os.tmpdir(), "unitedstats-united.db");
const BLOB_URL = "https://example.public.blob.vercel-storage.com/dataset/united.db";

function clearRuntimeCopy() {
  if (fs.existsSync(RUNTIME_DB_PATH)) fs.unlinkSync(RUNTIME_DB_PATH);
}

// The 2026-06-30 outage: production set UNITEDSTATS_DB_BLOB_URL but /tmp was
// empty, and getDb() hard-threw "Runtime database missing" on every request.
// These guard the contract that a missing/unreadable blob degrades to the
// bundled copy instead of 500ing the whole site.

test("dbSource is bundled when the blob is not configured", async () => {
  delete process.env.UNITEDSTATS_DB_BLOB_URL;
  clearRuntimeCopy();
  const { dbSource } = await import("../lib/db");
  assert.equal(dbSource(), "bundled");
});

test("dbSource falls back to bundled when blob configured but /tmp copy is missing", async () => {
  process.env.UNITEDSTATS_DB_BLOB_URL = BLOB_URL;
  clearRuntimeCopy();
  try {
    const { dbSource } = await import("../lib/db");
    assert.equal(dbSource(), "bundled");
  } finally {
    delete process.env.UNITEDSTATS_DB_BLOB_URL;
  }
});

test("dbSource prefers the blob copy once /tmp is populated", async () => {
  process.env.UNITEDSTATS_DB_BLOB_URL = BLOB_URL;
  fs.writeFileSync(RUNTIME_DB_PATH, "placeholder");
  try {
    const { dbSource } = await import("../lib/db");
    assert.equal(dbSource(), "blob");
  } finally {
    clearRuntimeCopy();
    delete process.env.UNITEDSTATS_DB_BLOB_URL;
  }
});

test("getDb opens the bundled database and is queryable", async () => {
  delete process.env.UNITEDSTATS_DB_BLOB_URL;
  clearRuntimeCopy();
  const { getDb, resetDb } = await import("../lib/db");
  await resetDb(); // drop any cached connection from earlier tests
  const row = getDb().prepare("SELECT 1 AS ok").get();
  assert.deepEqual(row, { ok: 1 });
});

test("getDb falls back to the bundled copy when the /tmp copy is unreadable", async () => {
  const db = await import("../lib/db");
  delete process.env.UNITEDSTATS_DB_BLOB_URL;
  await db.resetDb(); // clear cached connection without touching the network
  process.env.UNITEDSTATS_DB_BLOB_URL = BLOB_URL;
  fs.writeFileSync(RUNTIME_DB_PATH, "not a sqlite file");
  try {
    const row = db.getDb().prepare("SELECT 1 AS ok").get();
    assert.deepEqual(row, { ok: 1 }); // served from bundled despite the bad /tmp copy
  } finally {
    clearRuntimeCopy();
    delete process.env.UNITEDSTATS_DB_BLOB_URL;
    await db.resetDb();
  }
});
