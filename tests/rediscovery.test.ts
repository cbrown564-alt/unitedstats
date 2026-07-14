/**
 * Phase 3a — the rediscovery engine. Charge × fadedness scoring must surface
 * forgotten, emotionally charged nights (including the 2015 Europa exit class)
 * and exclude canonical-fame nights everyone already knows.
 *
 * Reads the live db (npm run build:db).
 */
import assert from "node:assert/strict";
import test from "node:test";

import {
  CANONICAL_FAME,
  matchCharge,
  rediscoveryForEntity,
  rediscoveryPool,
  buildPrompt,
  scorePool,
} from "../lib/rediscovery";
import { matchById } from "../lib/queries";
import { clearQueryCache } from "../lib/queryCache";

const EUROPA_EXIT_HOME = "2016-03-17-liverpool-h";
const EUROPA_EXIT_AWAY = "2016-03-10-liverpool-a";
const TREBLE_FINAL = "1999-05-26-bayern-munich-n";

test("2015 Europa exit class clears the charge floor", () => {
  const home = matchById(EUROPA_EXIT_HOME);
  const away = matchById(EUROPA_EXIT_AWAY);
  assert.ok(home && away, "Europa exit legs must resolve");
  const homeCharge = matchCharge(home, undefined).charge;
  const awayCharge = matchCharge(away, undefined).charge;
  assert.ok(homeCharge >= 80, `home leg charge ${homeCharge} below floor`);
  assert.ok(awayCharge >= 80, `away leg charge ${awayCharge} below floor`);
});

test("canonical-fame nights are excluded from the faded pool", () => {
  clearQueryCache();
  const pool = rediscoveryPool({ now: new Date("2026-07-03T12:00:00Z") });
  const ids = new Set(pool.map((n) => n.match.id));
  for (const famous of [TREBLE_FINAL, ...CANONICAL_FAME].slice(0, 5)) {
    assert.ok(!ids.has(famous), `canonical night "${famous}" should not be in the engine pool`);
  }
});

test("the 2015-16 season rail surfaces a Europa exit leg", () => {
  clearQueryCache();
  const prompt = rediscoveryForEntity("season", "2015-16", { now: new Date("2026-07-03T12:00:00Z") });
  assert.ok(prompt, "2015-16 should have a rediscovery prompt");
  assert.ok(
    prompt.id === EUROPA_EXIT_HOME || prompt.id === EUROPA_EXIT_AWAY,
    `expected a Europa exit leg, got ${prompt.id}`,
  );
  assert.equal(prompt.prompt, "Do you remember…?");
  assert.ok(prompt.reason.length > 0);
});

test("Liverpool head-to-head rail surfaces a charged faded night", () => {
  clearQueryCache();
  const prompt = rediscoveryForEntity("opponent", "liverpool", { now: new Date("2026-07-03T12:00:00Z") });
  assert.ok(prompt, "Liverpool fixture history should yield a prompt");
  assert.ok(prompt.total > 0, "prompt should carry a positive score");
  assert.notEqual(prompt.reason, "a charged night");
});

test("era bias boosts matches in the reader's living memory", () => {
  clearQueryCache();
  const match = matchById(EUROPA_EXIT_HOME)!;
  const neutral = scorePool([match], { now: new Date("2026-07-03T12:00:00Z") });
  const biased = scorePool([match], { now: new Date("2026-07-03T12:00:00Z"), sinceYear: 2010 });
  assert.equal(neutral.length, 1);
  assert.equal(biased.length, 1);
  assert.ok(biased[0].total > neutral[0].total, "since-2010 should lift the 2016 night");
});

test("recognition prompts are match doors, not fixture rows", () => {
  clearQueryCache();
  const pool = rediscoveryPool({ now: new Date("2026-07-03T12:00:00Z") });
  assert.ok(pool.length >= 24, `thin engine pool: ${pool.length}`);
  const prompt = buildPrompt(pool[0]);
  assert.ok(prompt.href.startsWith("/match/"), "prompt must link to a match");
  assert.equal(prompt.prompt, "Do you remember…?");
  assert.notEqual(prompt.reason, "a charged night");
  assert.ok(prompt.line.length > 0, "prompt needs a human line");
});

test("player rails use a proved appearance or contribution reason when available", () => {
  clearQueryCache();
  const prompt = rediscoveryForEntity("player", "wayne-rooney", { now: new Date("2026-07-03T12:00:00Z") });
  assert.ok(prompt, "Rooney should have a rediscovery prompt");
  assert.match(prompt.reason, /debut|goal|assist|final|semi-final|knockout|against|scoreline|ground/i);
});

test("player contribution reasons explain the occasion, not only the action", () => {
  clearQueryCache();
  const prompt = rediscoveryForEntity("player", "dennis-viollet", { now: new Date("2026-07-03T12:00:00Z") });
  assert.ok(prompt, "Dennis Viollet should have a rediscovery prompt");
  assert.equal(prompt.id, "1957-01-16-athletic-bilbao-a");
  assert.equal(prompt.reason, "Dennis Viollet scored a goal in the European Cup quarter-final");
});
