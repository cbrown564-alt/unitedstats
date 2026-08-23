import assert from "node:assert/strict";
import { test } from "node:test";
import { parseOpenfootball } from "../pipeline/update";
import {
  buildUpcomingOverlay,
  nextOpponent,
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
