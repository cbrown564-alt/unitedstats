/**
 * Journey chapter facts — golden pins for the numbers the /stories chapters put
 * in copy. Each chapter's headlines state facts read from the DB at render; these
 * tests pin the closed historical slices behind them (docs/JOURNEY.md §4, §4b) so
 * an ingest regression can't silently rewrite a story.
 *
 * Run: npm test (requires data/united.db — npm run build:db)
 */
import assert from "node:assert/strict";
import test from "node:test";

import {
  JOURNEY_CHAPTERS,
  crackRescuer,
  fergieTimeEchoes,
  fortressRun,
  journeyChapterBySlug,
  matchReceipt,
  subGoals,
  trailingBoard,
  unbeatenTail,
} from "../lib/journey";

test("published stories have stable slugs and canonical story routes", () => {
  assert.deepEqual(
    JOURNEY_CHAPTERS.map(({ slug, href }) => ({ slug, href })),
    [
      { slug: "two-no-7s", href: "/stories/two-no-7s" },
      { slug: "eleven-days-in-may", href: "/stories/eleven-days-in-may" },
      { slug: "fortress-ot", href: "/stories/fortress-ot" },
      { slug: "fergie-time", href: "/stories/fergie-time" },
    ],
  );
  assert.equal(journeyChapterBySlug("fortress-ot")?.title, "Fortress OT");
  assert.equal(journeyChapterBySlug("fergie-time")?.title, "Fergie time");
  assert.equal(journeyChapterBySlug("not-a-story"), undefined);
});

test("fergie time: three late two-goal comebacks share the 0–1 to 2–1 shape", () => {
  assert.deepEqual(
    fergieTimeEchoes().map((night) => ({
      id: night.id,
      score: night.score,
      deficit: night.deficit.score,
      lateGoals: night.lateGoals.map((goal) => ({ name: goal.name, minute: goal.minute, added: goal.added })),
    })),
    [
      {
        id: "1993-04-10-sheffield-wednesday-h",
        score: "2–1",
        deficit: "0–1",
        lateGoals: [
          { name: "Steve Bruce", minute: 86, added: null },
          { name: "Steve Bruce", minute: 90, added: 6 },
        ],
      },
      {
        id: "1999-05-26-bayern-munich-n",
        score: "2–1",
        deficit: "0–1",
        lateGoals: [
          { name: "Teddy Sheringham", minute: 90, added: 1 },
          { name: "Ole Gunnar Solskjær", minute: 90, added: 3 },
        ],
      },
      {
        id: "2023-10-07-brentford-h",
        score: "2–1",
        deficit: "0–1",
        lateGoals: [
          { name: "Scott McTominay", minute: 90, added: 3 },
          { name: "Scott McTominay", minute: 90, added: 7 },
        ],
      },
    ],
  );
});
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

test("fortress: last half-time lead lost is Ipswich 1984; run is unbeaten since", () => {
  const run = fortressRun();
  assert.ok(run);
  assert.equal(run.lastLoss.id, "1984-05-07-ipswich-town-h");
  assert.equal(run.lastLoss.date, "1984-05-07");
  assert.equal(run.lastLoss.gf, 1);
  assert.equal(run.lastLoss.ga, 2);
  assert.equal(run.lastLoss.htf, 1);
  assert.equal(run.lastLoss.hta, 0);
  // Sample tail — Opta cites 400; our minute-complete slice is the verifiable run.
  assert.equal(run.games, 395);
  assert.equal(run.w, 360);
  assert.equal(run.d, 35);
});

test("fortress: fallen behind only three times in the run — all draws", () => {
  const run = fortressRun();
  assert.ok(run);
  assert.equal(run.cracks.length, 3);
  assert.deepEqual(
    run.cracks.map((c) => ({
      id: c.id,
      ht: c.ht,
      ft: c.ft,
      worst: c.worst,
      fellBehindMinute: c.fellBehindMinute,
    })),
    [
      { id: "1986-12-07-tottenham-hotspur-h", ht: "2–0", ft: "3–3", worst: -1, fellBehindMinute: 73 },
      { id: "1995-12-09-sheffield-wednesday-h", ht: "1–0", ft: "2–2", worst: -1, fellBehindMinute: 79 },
      { id: "2025-12-15-bournemouth-h", ht: "2–1", ft: "4–4", worst: -1, fellBehindMinute: 52 },
    ],
  );
});

test("fortress: Ipswich hinge and Bournemouth crack receipts carry the flow", () => {
  const ipswich = matchReceipt("1984-05-07-ipswich-town-h");
  assert.ok(ipswich);
  assert.equal(ipswich.unitedGoals.length, 1);
  assert.equal(ipswich.opponentGoals.length, 2);
  assert.equal(ipswich.unitedGoals[0]?.minute, 25);
  assert.equal(ipswich.opponentGoals[1]?.minute, 86);

  const bourne = matchReceipt("2025-12-15-bournemouth-h");
  assert.ok(bourne);
  assert.deepEqual(trailingBoard(bourne), {
    united: 2,
    opponent: 3,
    score: "2–3",
    when: "after 52′",
  });
});

test("fortress: crackRescuer is the United equaliser after falling behind", () => {
  const spurs = matchReceipt("1986-12-07-tottenham-hotspur-h");
  assert.ok(spurs);
  assert.deepEqual(crackRescuer(spurs), {
    playerId: "peter-davenport",
    name: "Peter Davenport",
    minute: 88,
    added: null,
  });

  const wednesday = matchReceipt("1995-12-09-sheffield-wednesday-h");
  assert.ok(wednesday);
  assert.equal(crackRescuer(wednesday)?.playerId, "eric-cantona");

  const bourne = matchReceipt("2025-12-15-bournemouth-h");
  assert.ok(bourne);
  assert.equal(crackRescuer(bourne)?.playerId, "bruno-fernandes");
});
