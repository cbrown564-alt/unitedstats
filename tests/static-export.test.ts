import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.join(import.meta.dirname, "..");

test("next.config is a static export with unoptimized images", () => {
  const src = readFileSync(path.join(root, "next.config.ts"), "utf8");
  assert.match(src, /output:\s*["']export["']/);
  assert.match(src, /unoptimized:\s*true/);
  assert.doesNotMatch(src, /async redirects\s*\(/);
  assert.doesNotMatch(src, /async headers\s*\(/);
});

test("legacy redirects live on the static host, not in Next middleware", () => {
  assert.equal(existsSync(path.join(root, "middleware.ts")), false);
  const vercel = JSON.parse(readFileSync(path.join(root, "vercel.json"), "utf8")) as {
    redirects?: { source: string; destination: string; permanent?: boolean }[];
  };
  const bySource = new Map((vercel.redirects ?? []).map((r) => [r.source, r.destination]));
  assert.equal(bySource.get("/analytics/odds"), "/analytics");
  assert.equal(bySource.get("/analytics/travel"), "/questions/away-days");
  assert.equal(bySource.get("/questions/ferguson"), "/questions/ferguson-era");
  assert.equal(bySource.get("/questions/decline"), "/questions/ferguson-era");
  assert.equal(bySource.get("/opponents"), "/search");
  assert.equal(bySource.get("/journey"), "/stories/two-no-7s");
  assert.equal(bySource.get("/stories/forgotten-night"), "/stories/a-thread-of-nights");
  assert.equal(bySource.get("/api/v1"), "/api/v1.json");
});
