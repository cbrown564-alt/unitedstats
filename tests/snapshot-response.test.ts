import assert from "node:assert/strict";
import test from "node:test";
import { snapshotResponse } from "../src/rt/snapshot-response";

test("a public fallback does not inherit the private snapshot's noindex header", async () => {
  const response = snapshotResponse(new Response("Committed page", { headers: {
    "x-robots-tag": "noindex, nofollow", "content-type": "text/html", "cache-control": "public, max-age=3600",
  } }), "unseeded");
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-robots-tag"), null);
  assert.equal(response.headers.get("content-type"), "text/html");
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("x-redthread-live"), "snapshot; unseeded");
  assert.equal(await response.text(), "Committed page");
});

test("a missing snapshot stays a server failure", () => {
  assert.equal(snapshotResponse(new Response("Missing", { status: 404 }), "unavailable").status, 500);
});
