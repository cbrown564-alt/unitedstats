/**
 * A thread of nights reads its stations from night blocks in EmDash. These
 * tests run in the publish workflow too, so an edit whose tokens the record
 * cannot answer stops before it reaches git. They pin how tokens resolve, not
 * the prose: editing the copy is the point. tests/journey.test.ts pins the ten
 * matches and their scorelines.
 *
 * Run: npm test (requires data/united.db — npm run build:db)
 */
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";

import { goalMinute, resolveNight } from "../lib/nightCopy";
import { threadNights, type NightBlock } from "../lib/threadOfNights";

test("thread of nights: every night's tokens and receipts resolve against the record", () => {
  const nights = threadNights();
  assert.equal(nights.length, 10);
  for (const night of nights) {
    const resolved = resolveNight(night);
    for (const copy of [resolved.title, resolved.titleAnchor, resolved.detail]) {
      assert.doesNotMatch(copy, /[{}]/, `${night.key}: ${copy}`);
    }
    if (night.memory_src) assert.ok(existsSync(`public${night.memory_src}`), `${night.key}: ${night.memory_src} is not in public/`);
  }
});

test("thread of nights: tokens read the block's own match", () => {
  const firstCup = threadNights().find((n) => n.key === "first-cup");
  assert.ok(firstCup);
  const read = (detail: string, extra: Partial<NightBlock> = {}) => resolveNight({ ...firstCup, ...extra, detail }).detail;
  assert.equal(read("{goal:Turnbull}"), "Turnbull 22′");
  assert.equal(read("{name:Turnbull}"), "Turnbull");
  assert.equal(read("{minute:Turnbull}"), "22′");
  assert.equal(read("{score}"), "1–0");
  assert.equal(read("{count:united}-{count:opponent}"), "1-0");
  assert.equal(read("{score:1983-05-21-brighton-and-hove-albion-n}"), "2–2 (a.e.t)");
  assert.equal(goalMinute("1909-04-24-bristol-city-n", "Turnbull"), "22′");
  assert.deepEqual(resolveNight({ ...firstCup, focus: "Turnbull" }).focusPlayerIds, ["sandy-turnbull"]);
});

test("thread of nights: a token the record cannot answer fails the render", () => {
  const firstCup = threadNights().find((n) => n.key === "first-cup");
  assert.ok(firstCup);
  const read = (extra: Partial<NightBlock>) => () => resolveNight({ ...firstCup, ...extra });
  assert.throws(read({ detail: "{goal:Charlton}" }), /no goal by "Charlton"/);
  assert.throws(read({ detail: "{scorer:Turnbull}" }), /unknown token/);
  assert.throws(read({ detail: "{goals:home}" }), /united or opponent/);
  assert.throws(read({ detail: "{goal:Turnbull" }), /malformed token/);
  assert.throws(read({ focus: "Charlton" }), /no goal by "Charlton"/);
  assert.throws(read({ match_id: "1909-04-24-bristol-city-x" }), /unknown match/);
  assert.throws(read({ earlier: [{ match_id: "nope", caption: "c", label: "l", link_label: "x" }] }), /unknown match "nope"/);
});
