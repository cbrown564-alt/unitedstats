import assert from "node:assert/strict";
import test from "node:test";
import { peakAssistSeasons, peakGaSeason, peakGoalSeasons, showSeasonDecadeHeaders } from "../lib/playerSeasonHighlights.ts";

test("peakGoalSeasons returns all seasons tied at the max", () => {
  const peaks = peakGoalSeasons([
    { season: "2009-10", apps: 40, starts: 38, goals: 34, assists: 10 },
    { season: "2011-12", apps: 38, starts: 36, goals: 34, assists: 8 },
    { season: "2013-14", apps: 30, starts: 28, goals: 21, assists: 21 },
  ]);
  assert.deepEqual(peaks.map((s) => s.season), ["2009-10", "2011-12"]);
});

test("peakAssistSeasons returns all seasons tied at the max", () => {
  const peaks = peakAssistSeasons([
    { season: "2013-14", apps: 30, starts: 28, goals: 21, assists: 21 },
    { season: "2014-15", apps: 33, starts: 30, goals: 12, assists: 21 },
    { season: "2015-16", apps: 38, starts: 35, goals: 8, assists: 7 },
  ]);
  assert.deepEqual(peaks.map((s) => s.season), ["2013-14", "2014-15"]);
});

test("peakGaSeason picks highest goals plus assists", () => {
  const peak = peakGaSeason([
    { season: "2009-10", apps: 40, starts: 38, goals: 30, assists: 10 },
    { season: "2013-14", apps: 30, starts: 28, goals: 21, assists: 21 },
  ]);
  assert.equal(peak?.season, "2013-14");
});

test("showSeasonDecadeHeaders from fifteen seasons", () => {
  assert.equal(showSeasonDecadeHeaders(Array.from({ length: 14 }, (_, i) => ({
    season: `${1960 + i}-${String(1961 + i).slice(2)}`,
    apps: 1,
    starts: 1,
    goals: 0,
    assists: 0,
  }))), false);
  assert.equal(showSeasonDecadeHeaders(Array.from({ length: 15 }, (_, i) => ({
    season: `${1960 + i}-${String(1961 + i).slice(2)}`,
    apps: 1,
    starts: 1,
    goals: 0,
    assists: 0,
  }))), true);
});
