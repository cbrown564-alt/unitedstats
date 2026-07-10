/**
 * Journey chapter facts — golden pins for the numbers the /journey chapters put
 * in copy. Each chapter's headlines state facts read from the DB at render; these
 * tests pin the closed historical slices behind them (docs/JOURNEY.md §4, §4b) so
 * an ingest regression can't silently rewrite a story.
 *
 * Run: npm test (requires data/united.db — npm run build:db)
 */
import assert from "node:assert/strict";
import test from "node:test";

import { matchReceipt, subGoals, unbeatenTail, trailingBoard } from "../lib/journey";
import { matchesSequence } from "../lib/trails";

test("unbeatenTail reads the run after the last defeat", () => {
  const seq = [
    { date: "2000-01-01", result: "W" },
    { date: "2000-01-08", result: "L" },
    { date: "2000-01-15", result: "D" },
    { date: "2000-01-22", result: "W" },
  ];
  assert.deepEqual(unbeatenTail(seq), {
    games: 2,
    w: 1,
    d: 1,
    from: "2000-01-15",
    to: "2000-01-22",
    lastLoss: "2000-01-08",
  });
});

test("unbeatenTail is null when the sequence ends on a defeat", () => {
  assert.equal(unbeatenTail([{ date: "2000-01-01", result: "L" }]), null);
});

test("unbeatenTail with no defeat spans the whole sequence", () => {
  const t = unbeatenTail([
    { date: "2000-01-01", result: "W" },
    { date: "2000-01-08", result: "D" },
  ]);
  assert.deepEqual(t, { games: 2, w: 1, d: 1, from: "2000-01-01", to: "2000-01-08", lastLoss: null });
});

test("treble: 1998-99 played 63 official games and never lost after 19 December", () => {
  const seq = matchesSequence({ season: "1998-99" });
  assert.equal(seq.length, 63);
  const tail = unbeatenTail(seq);
  assert.ok(tail);
  assert.equal(tail.lastLoss, "1998-12-19");
  assert.equal(tail.games, 33);
  assert.equal(tail.w, 23);
  assert.equal(tail.d, 10);
  assert.equal(tail.to, "1999-05-26");
});

test("treble: a substitute scored in all three deciders", () => {
  // Day one — the league. Cole on at half-time, scored two minutes later.
  const spurs = matchReceipt("1999-05-16-tottenham-hotspur-h");
  assert.ok(spurs);
  assert.deepEqual(
    subGoals(spurs).map((g) => ({ name: g.name, subOn: g.subOn, minute: g.minute, added: g.added })),
    [{ name: "Andy Cole", subOn: 46, minute: 48, added: null }],
  );

  // Day seven — the Cup. Sheringham on 9', scored 11'.
  const newcastle = matchReceipt("1999-05-22-newcastle-united-n");
  assert.ok(newcastle);
  assert.deepEqual(
    subGoals(newcastle).map((g) => ({ name: g.name, subOn: g.subOn, minute: g.minute, added: g.added })),
    [{ name: "Teddy Sheringham", subOn: 9, minute: 11, added: null }],
  );

  // Day eleven — both goals off the bench, in stoppage time.
  const bayern = matchReceipt("1999-05-26-bayern-munich-n");
  assert.ok(bayern);
  assert.equal(bayern.unitedGoals.length, 2, "United scored exactly twice");
  assert.deepEqual(
    subGoals(bayern).map((g) => ({ name: g.name, subOn: g.subOn, minute: g.minute, added: g.added })),
    [
      { name: "Teddy Sheringham", subOn: 67, minute: 90, added: 1 },
      { name: "Ole Gunnar Solskjær", subOn: 81, minute: 90, added: 3 },
    ],
  );
  // The jolt the teamsheet proves: no starter scored.
  for (const p of bayern.starters) {
    assert.equal(bayern.marks.goals.get(p.player_id ?? ""), undefined, `${p.player_display_name} did not score`);
  }
});

test("treble: trailingBoard pins the from-behind scorelines (lever C)", () => {
  // Spurs — behind after Ferdinand 26′, leveled before half-time; first deficit.
  const spurs = matchReceipt("1999-05-16-tottenham-hotspur-h");
  assert.ok(spurs);
  assert.deepEqual(trailingBoard(spurs), {
    united: 0,
    opponent: 1,
    score: "0–1",
    when: "after 26′",
  });

  // Newcastle — never trailed; no board.
  const newcastle = matchReceipt("1999-05-22-newcastle-united-n");
  assert.ok(newcastle);
  assert.equal(trailingBoard(newcastle), null);

  // Bayern — still 0–1 at the regulation whistle.
  const bayern = matchReceipt("1999-05-26-bayern-munich-n");
  assert.ok(bayern);
  assert.deepEqual(trailingBoard(bayern), {
    united: 0,
    opponent: 1,
    score: "0–1",
    when: "at 90′",
  });
});
