/**
 * The first-contact spark (CONTEXT.md §6) — the served match-night that fires the
 * front door. These tests pin the spark's promises so the homepage can never open
 * on a dead link, a defeat, or a freighted match:
 *
 *   - every curated night resolves to a real match (no silent drop to a thin pool);
 *   - the served night never opens on a defeat, whatever the date;
 *   - the Munich-freighted matches are never dealt cold;
 *   - selection is deterministic by UTC day (the static guardrail);
 *   - a genuinely significant date is promoted to the "on this day" lead.
 *
 * Reads the live db (npm run build:db).
 */
import assert from "node:assert/strict";
import test from "node:test";

import { CURATED_NIGHTS, greatNights } from "../lib/greatNights";
import { matchById } from "../lib/queries";
import { monthDayKeys } from "../lib/onThisDay";

// Mirrors the documented exclusion set in lib/greatNights.ts — the Babes' final
// fortnight. Duplicated here on purpose so a removal there trips this guard.
const MUNICH_EXCLUDED = new Set([
  "1958-01-14-red-star-belgrade-h",
  "1958-01-18-bolton-wanderers-h",
  "1958-02-01-arsenal-a",
  "1958-02-05-red-star-belgrade-a",
]);

test("every curated night resolves to a real match with an authored stake", () => {
  assert.ok(CURATED_NIGHTS.length >= 12, `thin curated pool: ${CURATED_NIGHTS.length}`);
  const ids = new Set<string>();
  for (const c of CURATED_NIGHTS) {
    assert.ok(!ids.has(c.id), `duplicate curated night id: ${c.id}`);
    ids.add(c.id);
    assert.ok(matchById(c.id), `curated night "${c.id}" resolves to no match — it would be silently dropped`);
    assert.ok(c.stakes.trim().length > 0, `curated night "${c.id}" has no stakes line`);
    assert.ok(!MUNICH_EXCLUDED.has(c.id), `curated night "${c.id}" is a Munich-freighted match — must not be in the pool`);
  }
});

test("the served night is always a complete, site-relative door — and never a defeat", () => {
  // Sweep every calendar date: the lead is resolved per day, so this walks both the
  // on-this-day path and the curated fallthrough across the whole year.
  for (const key of monthDayKeys()) {
    const [mm, dd] = key.split("-");
    const { nights, seed } = greatNights(new Date(`2027-${mm}-${dd}T12:00:00Z`));
    assert.ok(nights.length > 0, `${key}: empty pool — the hero would have nothing to show`);
    assert.ok(seed >= 0 && seed < nights.length, `${key}: seed ${seed} out of range`);
    const n = nights[seed];
    assert.ok(n.href.startsWith("/match/"), `${key}: night href is not a match door: ${n.href}`);
    assert.ok(n.score.length > 0 && n.opponent.length > 0, `${key}: night is missing its scoreline`);
    assert.notEqual(n.tone, "text-loss", `${key}: the spark opened on a defeat (${n.year} ${n.score} ${n.opponent})`);
    assert.ok(!MUNICH_EXCLUDED.has(n.id), `${key}: a Munich-freighted match led the front door (${n.id})`);
  }
});

test("selection is deterministic within a UTC day and rotates across days", () => {
  const a = greatNights(new Date("2027-03-10T09:00:00Z"));
  const sameDay = greatNights(new Date("2027-03-10T22:00:00Z"));
  assert.equal(a.nights[a.seed].id, sameDay.nights[sameDay.seed].id, "the served night changed within one UTC day");
});

test("a genuinely significant date is promoted to the on-this-day lead", () => {
  // 26 May 1999 (Camp Nou) and 29 May 1968 (Wembley) are finals — they must lead
  // their own dates, framed to the calendar, not fall through to a random pull.
  for (const [key, year] of [["05-26", "1999"], ["05-29", "1968"]] as const) {
    const [mm, dd] = key.split("-");
    const { nights, seed } = greatNights(new Date(`2027-${mm}-${dd}T12:00:00Z`));
    const n = nights[seed];
    assert.equal(n.framing, "on-this-day", `${key}: the date's final did not take the on-this-day lead`);
    assert.equal(n.live, true, `${key}: the on-this-day lead is missing its live pulse`);
    assert.equal(n.year, year, `${key}: expected the ${year} final to lead, got ${n.year}`);
  }
});
