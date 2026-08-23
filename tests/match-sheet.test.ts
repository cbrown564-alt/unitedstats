import assert from "node:assert/strict";
import test from "node:test";

import type { LineupEntry, Match, MatchEvent } from "../scripts/lib";
import { assessMatchSheet, latestMatches } from "../pipeline/matchSheet";

function match(partial: Partial<Match> = {}): Match {
  return {
    id: "2026-08-22-hull-city-a",
    date: "2026-08-22",
    competition: "premier-league",
    opponent: "Hull City",
    opponentId: "hull-city",
    venue: "A",
    score: { ft: [1, 0] },
    sources: ["openfootball"],
    ...partial,
  };
}

function starter(i: number, opts: Partial<LineupEntry> = {}): LineupEntry {
  return {
    player: `player-${i}`,
    playerName: `Player ${i}`,
    playerSide: "united",
    start: true,
    bench: false,
    shirt: i,
    ...opts,
  };
}

test("a score-only match is incomplete", () => {
  const sheet = assessMatchSheet(match());
  assert.equal(sheet.complete, false);
  assert.deepEqual(sheet.missing, [
    "united-starters",
    "starter-shirts",
    "bench",
    "united-goals",
  ]);
});

test("a modern sheet with XI, shirts, bench, and both sides' goals is complete", () => {
  const lineup = [
    ...Array.from({ length: 11 }, (_, i) => starter(i + 1)),
    { player: "sub-1", playerName: "Sub", playerSide: "united" as const, start: false, bench: true, shirt: 12, on: 70 },
  ];
  const events: MatchEvent[] = [
    { type: "goal", player: "player-9", minute: 12, assist: "player-8", assistName: "Player 8" },
    { type: "opp-goal", playerName: "Opponent", minute: 40 },
    { type: "card-yellow", player: "player-4", minute: 55 },
  ];
  const sheet = assessMatchSheet(match({
    score: { ft: [1, 1] },
    lineup,
    events,
    sources: ["openfootball", "transfermarkt-datasets"],
  }));
  assert.equal(sheet.complete, true);
  assert.deepEqual(sheet.missing, []);
  assert.equal(sheet.unitedStarters, 11);
  assert.equal(sheet.starterShirts, 11);
  assert.equal(sheet.unitedBench, 1);
  assert.equal(sheet.substitutions, 1);
  assert.equal(sheet.assists, 1);
  assert.equal(sheet.cards, 1);
});

test("opponent starters do not count toward the United XI", () => {
  const lineup = [
    ...Array.from({ length: 11 }, (_, i) => starter(i + 1, { playerSide: "opponent", player: null })),
    ...Array.from({ length: 11 }, (_, i) => starter(i + 1)),
    { player: "sub-1", start: false, bench: true, playerSide: "united" as const },
  ];
  const sheet = assessMatchSheet(match({
    lineup,
    events: [{ type: "goal", player: "player-9", minute: 1 }],
  }));
  assert.equal(sheet.unitedStarters, 11);
  assert.equal(sheet.complete, true);
});

test("own goals count toward the side that scored them", () => {
  const sheet = assessMatchSheet(match({
    score: { ft: [1, 1] },
    lineup: [
      ...Array.from({ length: 11 }, (_, i) => starter(i + 1)),
      { player: "sub-1", start: false, bench: true, playerSide: "united" },
    ],
    events: [
      { type: "own-goal-for", playerName: "Opponent", minute: 10 },
      { type: "own-goal-against", player: "player-2", minute: 80 },
    ],
  }));
  assert.equal(sheet.unitedGoalEvents, 1);
  assert.equal(sheet.oppGoalEvents, 1);
  assert.equal(sheet.complete, true);
});

test("latestMatches returns newest dates first and caps the count", () => {
  const newest = latestMatches({
    season: "2026-27",
    matches: [
      match({ id: "a", date: "2026-08-22" }),
      match({ id: "c", date: "2026-08-29" }),
      match({ id: "b", date: "2026-08-22", opponentId: "other" }),
    ],
  }, 2);
  assert.deepEqual(newest.map((m) => m.id), ["c", "b"]);
});
