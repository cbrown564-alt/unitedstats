import assert from "node:assert/strict";
import { test } from "node:test";
import { parseOpenfootball } from "../pipeline/update";
import {
  buildUpcomingOverlay,
  nextOpponent,
  overdueFixtures,
  playedFixtureFor,
  upcomingVsOpponent,
  type KnownResultKey,
} from "../pipeline/upcoming";

const SAMPLE = `
= English Premier League 2026/27

▪ Matchday 1
 Sat Aug 22 2026
 12:30  Hull City AFC v Manchester United FC
▪ Matchday 2
 Sat Aug 29
 15:00  Manchester United FC v Ipswich Town FC
 15:00  Arsenal FC  v  Chelsea FC   2-1
▪ Matchday 3
 Sat Sep 5
 15:00  Everton FC v Manchester United FC
`;

test("parseOpenfootball still returns only scored lines", () => {
  const scored = parseOpenfootball(SAMPLE, 2026);
  assert.equal(scored.length, 1);
  assert.equal(scored[0].home, "Arsenal FC");
  assert.deepEqual(scored[0].ft, [2, 1]);
});

test("buildUpcomingOverlay keeps United rows without scores", () => {
  const overlay = buildUpcomingOverlay({
    season: "2026-27",
    updatedAt: "2026-08-23",
    sources: [{ competition: "premier-league", text: SAMPLE }],
    aliases: {},
    known: [],
  });

  assert.deepEqual(overlay.competitions, ["premier-league"]);
  assert.equal(overlay.source, "openfootball");
  assert.equal(overlay.fixtures.length, 3);
  assert.equal(overlay.fixtures[0].opponentId, "hull-city");
  assert.equal(overlay.fixtures[0].venue, "A");
  assert.equal(overlay.fixtures[0].kickoff, "12:30");
  assert.equal(overlay.fixtures[1].opponentId, "ipswich-town");
  assert.equal(overlay.fixtures[1].venue, "H");
  assert.equal(overlay.fixtures[2].opponentId, "everton");
});

test("buildUpcomingOverlay drops league meetings already in the result record", () => {
  const known: KnownResultKey[] = [
    { competition: "premier-league", opponentId: "hull-city", venue: "A" },
  ];
  const overlay = buildUpcomingOverlay({
    season: "2026-27",
    updatedAt: "2026-08-23",
    sources: [{ competition: "premier-league", text: SAMPLE }],
    aliases: {},
    known,
  });

  assert.deepEqual(
    overlay.fixtures.map((f) => f.opponentId),
    ["ipswich-town", "everton"],
  );
});

test("nextOpponent is the earliest remaining United fixture", () => {
  const overlay = buildUpcomingOverlay({
    season: "2026-27",
    updatedAt: "2026-08-23",
    sources: [{ competition: "premier-league", text: SAMPLE }],
    aliases: {},
    known: [{ competition: "premier-league", opponentId: "hull-city", venue: "A" }],
  });

  const next = nextOpponent(overlay);
  assert.ok(next);
  assert.equal(next.opponentId, "ipswich-town");
  assert.equal(upcomingVsOpponent(overlay, "everton")?.date, "2026-09-05");
  assert.equal(upcomingVsOpponent(overlay, "hull-city"), undefined);
});

const STALLED: import("../pipeline/upcoming").UpcomingOverlay = {
  season: "2026-27",
  source: "openfootball",
  updatedAt: "2026-11-10",
  competitions: ["premier-league"],
  fixtures: [
    { date: "2026-11-07", competition: "premier-league", competitionName: "Premier League", round: null, opponent: "Aston Villa", opponentId: "aston-villa", venue: "H", kickoff: null },
    { date: "2026-11-21", competition: "premier-league", competitionName: "Premier League", round: null, opponent: "Liverpool", opponentId: "liverpool", venue: "A", kickoff: null },
    { date: "2027-01-16", competition: "premier-league", competitionName: "Premier League", round: null, opponent: "Aston Villa", opponentId: "aston-villa", venue: "A", kickoff: null },
  ],
};

test("overdueFixtures reports only fixtures past the grace period", () => {
  assert.deepEqual(overdueFixtures(STALLED, "2026-11-09").map((f) => f.opponentId), []);
  assert.deepEqual(overdueFixtures(STALLED, "2026-11-10").map((f) => f.opponentId), ["aston-villa"]);
  assert.equal(overdueFixtures(STALLED, "2026-11-24").length, 2);
});

test("playedFixtureFor fills a past fixture moved by a day, on the right venue only", () => {
  const moved = { date: "2026-11-08", opponentId: "aston-villa", venue: "H" as const };
  assert.equal(playedFixtureFor(STALLED, moved, "2026-11-10")?.date, "2026-11-07");
  assert.equal(playedFixtureFor(STALLED, { ...moved, venue: "A" }, "2026-11-10"), undefined);
  assert.equal(playedFixtureFor(STALLED, { ...moved, date: "2026-11-20" }, "2026-11-21"), undefined);
});

test("playedFixtureFor never fills a fixture or result dated in the future", () => {
  const early = { date: "2026-11-20", opponentId: "liverpool", venue: "A" as const };
  assert.equal(playedFixtureFor(STALLED, early, "2026-11-20"), undefined);
  assert.equal(playedFixtureFor(STALLED, { ...early, date: "2026-11-21" }, "2026-11-20"), undefined);
});
