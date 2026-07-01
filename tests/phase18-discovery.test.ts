/**
 * Phase 18.3/18.4 — serendipity, guided wandering, and personal entry points.
 *
 * The discovery surfaces share one promise: every link they emit lands on a real,
 * curated-quality page, never a dead end. These tests pin that promise so a future
 * rename of a question slug, curated cut, debate, or entity id can't silently
 * leave a "surprise me" roll, an answer-foot trail, or a homepage entry chip
 * pointing at a 404.
 *
 *   - the "surprise me" pool (`lib/surprise.ts`)
 *   - the answer-foot related trails (`lib/related.ts`)
 *   - the personal entry chips + breadth tease (`lib/entryPoints.ts`)
 *
 * The surprise/related checks are pure (no DB); the entry-point resolution reads
 * the live db (npm run build:db).
 */
import assert from "node:assert/strict";
import test from "node:test";

import { QUESTIONS, questionSlugs } from "../lib/questions";
import { CURATED_CUTS } from "../lib/cut";
import { surpriseFacts, pickIndex } from "../lib/surprise";
import { relatedAnswers, relatedSlugs } from "../lib/related";
import { allEntryPoints, entryStrip } from "../lib/entryPoints";

const slugSet = new Set(questionSlugs());

test("every surprise fact is a complete, curated morsel with a door", () => {
  const facts = surpriseFacts();
  // The nine questions and three cuts always resolve; records depend on data, so
  // the floor is the curated minimum, not an exact count.
  assert.ok(facts.length >= QUESTIONS.length + CURATED_CUTS.length, `thin surprise pool: ${facts.length}`);
  const ids = new Set<string>();
  const validTone = new Set(["devil", "gold", "win"]);
  for (const f of facts) {
    assert.ok(!ids.has(f.id), `duplicate surprise fact id: ${f.id}`);
    ids.add(f.id);
    assert.ok(f.figure.length > 0, `${f.id} has no figure`);
    assert.notEqual(f.figure, "—", `${f.id} figure fell back to the no-data placeholder`);
    assert.ok(f.line.length > 0, `${f.id} has no line`);
    assert.ok(f.cta.length > 0, `${f.id} has no door label`);
    assert.ok(f.href.startsWith("/"), `${f.id} href not site-relative: ${f.href}`);
    assert.ok(validTone.has(f.tone), `${f.id} has an unknown tone: ${f.tone}`);
  }
});

test("pickIndex stays in-bounds across the rng range", () => {
  const len = surpriseFacts().length;
  assert.equal(pickIndex(len, () => 0), 0);
  assert.equal(pickIndex(len, () => 0.999999), len - 1);
});

test("every answer carries a curated trail of 2–3 valid next steps", () => {
  assert.deepEqual(relatedSlugs().sort(), questionSlugs().sort(), "a question is missing its trail");
  for (const { slug } of QUESTIONS) {
    const links = relatedAnswers(slug);
    assert.ok(links.length >= 2 && links.length <= 3, `${slug} trail has ${links.length} links`);
    const seen = new Set<string>();
    const validKind = new Set(["question", "cut", "debate"]);
    for (const l of links) {
      assert.ok(l.href.startsWith("/"), `${slug} trail href not site-relative: ${l.href}`);
      assert.ok(validKind.has(l.kind), `${slug} trail step has an unknown kind: ${l.kind}`);
      assert.ok(l.hook.length > 0, `${slug} trail link missing a hook: ${l.href}`);
      assert.ok(!seen.has(l.href), `${slug} trail repeats ${l.href}`);
      seen.add(l.href);
      assert.notEqual(l.href, `/questions/${slug}`, `${slug} trail links to itself`);
      if (l.href.startsWith("/questions/")) {
        const target = l.href.slice("/questions/".length);
        assert.ok(slugSet.has(target), `${slug} trail points at unknown question "${target}"`);
      }
    }
  }
});

test("every entry chip resolves to a real entity page with an honest hint", () => {
  const HREF_PREFIX: Record<string, string> = {
    player: "/player/",
    rivalry: "/opponent/",
    era: "/", // a season (/seasons/) or a manager (/manager/)
  };
  const points = allEntryPoints(); // throws if any id is unknown — that *is* the check
  assert.ok(points.length >= 8 + 5 + 4, `thin entry registry: ${points.length}`);
  const validKind = new Set(["player", "rivalry", "era"]);
  for (const p of points) {
    assert.ok(validKind.has(p.kind), `entry has unknown kind: ${p.kind}`);
    assert.ok(p.label.length > 0, `entry ${p.href} has no label`);
    assert.ok(p.hint.length > 0, `entry ${p.href} has no hint`);
    assert.ok(p.href.startsWith(HREF_PREFIX[p.kind]), `entry ${p.label} href mismatches its kind: ${p.href}`);
    if (p.kind === "era") {
      assert.ok(
        p.href.startsWith("/seasons/") || p.href.startsWith("/manager/") || p.href.startsWith("/questions/"),
        `era ${p.label} must land on a season, manager, or curated question page: ${p.href}`,
      );
    }
  }
});

test("the entry strip is balanced, distinct, and rotates by day", () => {
  const a = entryStrip(new Date("2026-01-01T12:00:00Z"));
  const sameDay = entryStrip(new Date("2026-01-01T23:00:00Z"));
  const next = entryStrip(new Date("2026-01-02T12:00:00Z"));

  // Two players, a rivalry, an era — the shape the homepage hero renders.
  assert.equal(a.filter((p) => p.kind === "player").length, 2, "strip should show two players");
  assert.equal(a.filter((p) => p.kind === "rivalry").length, 1, "strip should show one rivalry");
  assert.equal(a.filter((p) => p.kind === "era").length, 1, "strip should show one era");

  // The two players are always distinct (drawn half the pool apart).
  const players = a.filter((p) => p.kind === "player").map((p) => p.href);
  assert.equal(new Set(players).size, players.length, "strip repeated a player");

  // Deterministic within a UTC day; turns over across days (the static guardrail).
  assert.deepEqual(a.map((p) => p.href), sameDay.map((p) => p.href), "strip changed within one UTC day");
  assert.notDeepEqual(a.map((p) => p.href), next.map((p) => p.href), "strip did not rotate across days");
});
