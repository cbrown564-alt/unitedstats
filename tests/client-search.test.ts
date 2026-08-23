import assert from "node:assert/strict";
import test from "node:test";

import { buildSearchIndex } from "../lib/search/clientIndex";
import { runClientSearch, searchPageClient } from "../lib/search/clientSearch";

test("client search finds a prominent player from the exported index", () => {
  const index = buildSearchIndex();
  const result = runClientSearch("rooney", index);
  assert.equal(result.shaped.length, 0);
  assert.ok(result.entities.some((e) => e.href === "/player/wayne-rooney"));
  assert.ok(result.total >= 1);
});

test("client search is typo-tolerant for a well-known name", () => {
  const index = buildSearchIndex();
  const result = runClientSearch("roony", index);
  assert.ok(result.entities.some((e) => e.href === "/player/wayne-rooney"));
});

test("client search surfaces curated question pages", () => {
  const index = buildSearchIndex();
  const result = runClientSearch("the treble", index);
  assert.ok(result.questions.some((e) => e.href === "/questions/treble"));
});

test("client search resolves an exact match date", () => {
  const index = buildSearchIndex();
  const result = runClientSearch("1999-05-26", index);
  assert.ok(result.entities.some((e) => e.kind === "match" && e.href === "/match/1999-05-26-bayern-munich-n"));
});

test("client search page groups entities by kind", () => {
  const index = buildSearchIndex();
  const page = searchPageClient("united", index);
  assert.ok(page.groups.length > 0);
  assert.ok(page.counts.every((c) => c.n > 0));
});

test("client search stays empty below the two-character floor", () => {
  const index = buildSearchIndex();
  const result = runClientSearch("r", index);
  assert.deepEqual(result, { shaped: [], questions: [], entities: [], total: 0, displayTotal: 0 });
});
