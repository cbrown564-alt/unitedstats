import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("scheduled update workflow no longer calls the removed history-digest script", () => {
  const yml = fs.readFileSync(".github/workflows/update-results.yml", "utf8");
  assert.doesNotMatch(yml, /generate:history-digests/);
  assert.doesNotMatch(yml, /history-digests/);
  assert.match(yml, /mkdir -p data\/raw/);
});

test("Monday enrich workflow creates data/raw before downloading england.csv", () => {
  const yml = fs.readFileSync(".github/workflows/enrich-results.yml", "utf8");
  assert.match(yml, /mkdir -p data\/raw/);
});
