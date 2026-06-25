/**
 * Phase 18.3 — serendipity and guided wandering.
 *
 * Three new discovery surfaces share one promise: every link they emit lands on a
 * real, curated-quality page, never a dead end. These tests pin that promise so a
 * future rename of a question slug, curated cut, or debate can't silently leave a
 * "surprise me" roll or an answer-foot trail pointing at a 404.
 *
 *   - the "surprise me" pool (`lib/surprise.ts`)
 *   - the answer-foot related trails (`lib/related.ts`)
 *   - the "what's interesting right now" weave (`lib/now.ts`)
 *
 * The surprise/related checks are pure (no DB); the `whatsInteresting` rotation
 * check reads the live db (npm run build:db).
 */
import assert from "node:assert/strict";
import test from "node:test";

import { QUESTIONS, questionSlugs } from "../lib/questions";
import { CURATED_CUTS } from "../lib/cut";
import { surpriseFacts, pickIndex } from "../lib/surprise";
import { relatedAnswers, relatedSlugs } from "../lib/related";
import { whatsInteresting } from "../lib/now";

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

test("the rotating cut is deterministic by day and lands on /cut", () => {
  // Two dates an even number of cuts apart land on the same curated cut; adjacent
  // days differ. This is the static-guardrail property: rotation, not behaviour.
  const a = whatsInteresting(new Date("2026-01-01T12:00:00Z"));
  const b = whatsInteresting(new Date("2026-01-02T12:00:00Z"));
  const sameDay = whatsInteresting(new Date("2026-01-01T23:00:00Z"));
  assert.ok(a.cut.href.startsWith("/cut"), "today's cut is not a /cut link");
  assert.equal(a.cut.cut.slug, sameDay.cut.cut.slug, "the cut changed within one UTC day");
  if (CURATED_CUTS.length > 1) {
    assert.notEqual(a.cut.cut.slug, b.cut.cut.slug, "the cut did not rotate across days");
  }
  assert.ok(a.today.label.length > 0, "on-this-day label is empty");
});
