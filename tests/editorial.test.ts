/**
 * Editorial content (lib/editorial.ts) and the record guard
 * (plugins/record-guard). The seed must pass the guard, so restoring D1 from
 * git can never load an entry the admin would refuse; registries must follow a
 * live source, so an edit published in EmDash shows on a live render.
 *
 * Run: npm test (requires data/united.db and the record index — npm run prebuild)
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { createGuard } from "../plugins/record-guard/guard.mjs";
import { CURATED_NIGHTS } from "../lib/curatedNights";
import { EDITORIAL_COLLECTIONS, snapshot, type EditorialCollection } from "../lib/editorial";
import { homepageNightCatalog } from "../lib/greatNights";
import { QUESTIONS, questionBySlug } from "../lib/questions";

const index = JSON.parse(readFileSync("plugins/record-guard/record-index.json", "utf8"));
const check = createGuard(index);
type SeedEntry = { id: string; slug: string; status: string; data: Record<string, unknown> };
const seed = JSON.parse(readFileSync("content/emdash/seed.json", "utf8")) as {
  collections: { slug: string }[];
  content: Record<string, SeedEntry[]>;
};

function withLive<T>(entries: Partial<Record<EditorialCollection, SeedEntry[]>>, fn: () => T): T {
  const g = globalThis as { __redthreadEditorial?: unknown };
  g.__redthreadEditorial = { get: (c: EditorialCollection) => entries[c] };
  try {
    return fn();
  } finally {
    delete g.__redthreadEditorial;
  }
}

test("the seed declares exactly the editorial collections", () => {
  assert.deepEqual(seed.collections.map((c) => c.slug), [...EDITORIAL_COLLECTIONS]);
});

test("every seed entry passes the record guard", () => {
  for (const [collection, entries] of Object.entries(seed.content)) {
    for (const e of entries) {
      assert.deepEqual(check(collection, { ...e.data, slug: e.slug }), [], `${collection}/${e.slug}`);
    }
  }
});

test("the guard rejects references the record does not hold", () => {
  assert.match(check("nights", { match_id: "1999-05-26-bayern-munich-x" }).join(), /Unknown match ID/);
  assert.match(check("transfer_notes", { transfer_id: "nope" }).join(), /Unknown transfer ID/);
  assert.match(check("debates", { mode: "players", a: "wayne-rooney", b: "matt-busby" }).join(), /Subject B/);
  assert.match(check("debates", { mode: "eras", a: "1990s", b: "1990s" }).join(), /same/);
  assert.match(check("questions", { slug: "who-is-best" }).join(), /No answer module/);
  assert.match(check("stories", { slug: "a-new-story" }).join(), /Phase 4/);
  assert.deepEqual(check("debates", { mode: "managers", a: "alex-ferguson", b: "matt-busby" }), []);
});

test("registries follow a live source and fall back to the seed", () => {
  const seeded = snapshot(CURATED_NIGHTS);
  const first = seed.content.nights[0];
  const edited = { ...first, data: { ...first.data, stakes: "Edited live." } };
  withLive({ nights: [edited] }, () => {
    assert.equal(CURATED_NIGHTS.length, 1);
    assert.equal(CURATED_NIGHTS[0].stakes, "Edited live.");
    assert.equal(homepageNightCatalog().pool[0]?.line, "Edited live.");
  });
  assert.deepEqual(snapshot(CURATED_NIGHTS), seeded);
  assert.notEqual(homepageNightCatalog().pool[0]?.line, "Edited live.");
});

test("drafts never reach a registry", () => {
  const q = seed.content.questions[0];
  withLive({ questions: [{ ...q, status: "draft" }] }, () => {
    assert.equal(QUESTIONS.length, 0);
    assert.equal(questionBySlug(q.slug), undefined);
  });
  assert.ok(questionBySlug(q.slug));
});
