import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

// scripts/package-assets.mjs writes these to out/_redirects; the Worker never sees them.
const file = path.join(import.meta.dirname, "..", "scripts", "legacy-redirects.json");
const { redirects } = JSON.parse(readFileSync(file, "utf8")) as {
  redirects: { source: string; destination: string; permanent?: boolean }[];
};

test("legacy redirects are permanent and point at current pages", () => {
  assert.ok(redirects.every((r) => r.permanent === true));
  const bySource = new Map(redirects.map((r) => [r.source, r.destination]));
  assert.equal(bySource.size, redirects.length, "each source appears once");
  assert.equal(bySource.get("/analytics/odds"), "/analytics");
  assert.equal(bySource.get("/analytics/travel"), "/questions/away-days");
  assert.equal(bySource.get("/questions/ferguson"), "/questions/ferguson-era");
  assert.equal(bySource.get("/questions/decline"), "/questions/ferguson-era");
  assert.equal(bySource.get("/opponents"), "/search");
  assert.equal(bySource.get("/journey"), "/stories/two-no-7s");
  assert.equal(bySource.get("/stories/forgotten-night"), "/stories/a-thread-of-nights");
  assert.equal(bySource.get("/api/v1"), "/api/v1.json");
});
