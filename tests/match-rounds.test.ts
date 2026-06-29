import assert from "node:assert/strict";
import { test } from "node:test";
import { findMatches } from "@/lib/queries";
import { isRoundFilterKey, parseRoundPhrase, roundFilterLabel } from "@/lib/matchRounds";
import { shapedAnswers } from "@/lib/search/intent";

test("round filter keys validate and label", () => {
  assert.equal(isRoundFilterKey("final"), true);
  assert.equal(isRoundFilterKey("bogus"), false);
  assert.equal(roundFilterLabel("final"), "Final");
});

test("parseRoundPhrase strips longest match first", () => {
  assert.deepEqual(parseRoundPhrase("champions league finals"), {
    key: "final",
    rest: "champions league",
  });
  assert.deepEqual(parseRoundPhrase("fa cup semi-final"), {
    key: "semi-final",
    rest: "fa cup",
  });
  assert.equal(parseRoundPhrase("league games"), null);
});

test("champions league finals shaped answer links to competition + round", () => {
  const answers = shapedAnswers("champions league finals");
  const hit = answers.find((a) => /champions league final/i.test(a.title));
  assert.ok(hit, `expected a CL finals answer, got: ${answers.map((a) => a.title).join(", ")}`);
  assert.match(hit.href, /competition=champions-league/);
  assert.match(hit.href, /round=final/);
});

test("round filter narrows findMatches", () => {
  const all = findMatches({ competition: "champions-league", round: "final", limit: 100 });
  assert.equal(all.total, 4);
  for (const row of all.rows) {
    assert.match(row.round ?? "", /final/i);
    assert.doesNotMatch(row.round ?? "", /semi|quarter/i);
  }
});

test("bare finals search filters every competition final", () => {
  const finals = findMatches({ round: "final", limit: 1 });
  assert.ok(finals.total >= 40);
});
