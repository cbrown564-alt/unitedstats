/**
 * Pins for the copy-review catalog (Phase 1).
 *
 * Ensures Tier A registries stay in the extract allowlist and that a fresh
 * extract covers the launch-critical surfaces. Run `npm run copy:extract`
 * before relying on content/copy-catalog.json in Studio.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  COPY_CATALOG_PATH,
  COPY_QUEUE_PATH,
  TIER_A_SOURCE_FILES,
  countByStatus,
  loadCopyCatalog,
  loadCopyQueue,
  mergeQueue,
  emptyQueue,
  updateQueueEntry,
} from "../lib/copyCatalog";
import { QUESTIONS, questionSlugs } from "../lib/questions";
import { CURATED_NIGHTS } from "../lib/curatedNights";
import { CURATED_CUTS } from "../lib/cut";
import { CURATED_DEBATES } from "../lib/compare";

test("Tier A source files exist on disk", () => {
  for (const rel of TIER_A_SOURCE_FILES) {
    assert.ok(fs.existsSync(rel), `missing Tier A source: ${rel}`);
  }
});

test("mergeQueue preserves status and adds new ids as todo", () => {
  const prev = emptyQueue();
  prev.entries["site:tagline"] = {
    id: "site:tagline",
    status: "keep",
    notes: "fine",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
  const merged = mergeQueue(prev, ["site:tagline", "home:dek"], "2026-07-09T00:00:00.000Z");
  assert.equal(merged.entries["site:tagline"]?.status, "keep");
  assert.equal(merged.entries["site:tagline"]?.notes, "fine");
  assert.equal(merged.entries["home:dek"]?.status, "todo");
  assert.equal(Object.keys(merged.entries).length, 2);
});

test("updateQueueEntry sets status and clears empty notes", () => {
  const queue = emptyQueue();
  queue.entries["site:tagline"] = {
    id: "site:tagline",
    status: "todo",
    notes: "old",
  };
  const next = updateQueueEntry(queue, "site:tagline", { status: "keep", notes: "  " });
  assert.equal(next.entries["site:tagline"]?.status, "keep");
  assert.equal(next.entries["site:tagline"]?.notes, undefined);
  assert.throws(() => updateQueueEntry(queue, "missing", { status: "keep" }));
});

test("copy catalog exists and covers Tier A registries", () => {
  assert.ok(
    fs.existsSync(COPY_CATALOG_PATH),
    `missing ${COPY_CATALOG_PATH} — run npm run copy:extract`,
  );
  assert.ok(
    fs.existsSync(COPY_QUEUE_PATH),
    `missing ${COPY_QUEUE_PATH} — run npm run copy:extract`,
  );

  const catalog = loadCopyCatalog();
  const queue = loadCopyQueue();
  assert.ok(catalog.itemCount > 0);
  assert.equal(catalog.items.length, catalog.itemCount);
  assert.ok(catalog.byTier.A > 0, "expected Tier A items");

  const ids = new Set(catalog.items.map((i) => i.id));
  const files = new Set(catalog.items.map((i) => i.file));

  for (const rel of TIER_A_SOURCE_FILES) {
    assert.ok(files.has(rel), `catalog missing items from ${rel}`);
  }

  assert.ok(ids.has("site:tagline"), "missing site tagline");

  for (const q of QUESTIONS) {
    assert.ok(ids.has(`question:${q.slug}:summary`), `missing summary for ${q.slug}`);
    assert.ok(
      [...ids].some((id) => id === `question:${q.slug}:finding` || id.startsWith(`question:${q.slug}:finding:`)),
      `missing finding for ${q.slug}`,
    );
    assert.ok(ids.has(`question:${q.slug}:gloss`), `missing gloss for ${q.slug}`);
  }

  // Every question route (active + archived) has registry copy.
  for (const slug of questionSlugs()) {
    assert.ok(ids.has(`question:${slug}:question`), `missing question headline for ${slug}`);
  }

  assert.ok(
    catalog.items.filter((i) => i.group === "home:nights" && i.kind === "stakes").length ===
      CURATED_NIGHTS.length,
    "stakes count should match CURATED_NIGHTS",
  );

  for (const cut of CURATED_CUTS) {
    assert.ok(ids.has(`cut:${cut.slug}:blurb`), `missing cut blurb ${cut.slug}`);
  }

  const debateHooks = catalog.items.filter((i) => i.file === "lib/compare.ts" && i.kind === "hook");
  const expectedDebates = Object.values(CURATED_DEBATES).reduce((n, list) => n + list.length, 0);
  assert.equal(debateHooks.length, expectedDebates);

  // Queue covers every catalog id.
  for (const id of ids) {
    assert.ok(queue.entries[id], `queue missing ${id}`);
  }
  const status = countByStatus(queue);
  assert.equal(
    status.todo + status.rewritten + status.keep + status.skip,
    catalog.itemCount,
  );
});
