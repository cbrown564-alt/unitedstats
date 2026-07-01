import assert from "node:assert/strict";
import test from "node:test";
import {
  mergeSeasonRanges,
  playerSeasonChartFootnotes,
  seasonsWithLimitedGoalScorerCoverage,
} from "../lib/playerSeasonChartNotes.ts";

test("mergeSeasonRanges groups contiguous canonical seasons", () => {
  assert.deepEqual(
    mergeSeasonRanges(["1895-96", "1896-97", "1897-98", "1900-01"]),
    [
      { from: "1895-96", to: "1897-98" },
      { from: "1900-01", to: "1900-01" },
    ],
  );
});

test("playerSeasonChartFootnotes is empty for post-87/88 debuts", () => {
  assert.deepEqual(
    playerSeasonChartFootnotes(["2004-05", "2005-06", "2016-17"]),
    [],
  );
});

test("playerSeasonChartFootnotes flags pre-87/88 assists only when relevant", () => {
  const notes = playerSeasonChartFootnotes(["1963-64", "1964-65", "1965-66"]);
  assert.ok(notes.some((n) => n.includes("Assists first recorded from 87/88 onwards")));
});

test("seasonsWithLimitedGoalScorerCoverage only includes pre-87/88 gaps", () => {
  const seasons = seasonsWithLimitedGoalScorerCoverage();
  assert.ok(seasons.length > 0);
  assert.ok(seasons.every((s) => s < "1987-88"));
  assert.ok(seasons.includes("1895-96"));
  assert.ok(!seasons.includes("2011-12"));
});

test("playerSeasonChartFootnotes flags limited goal seasons in early careers", () => {
  const notes = playerSeasonChartFootnotes(["1895-96", "1896-97", "1897-98"]);
  assert.ok(notes.some((n) => n.includes("Limited coverage of goals during seasons 95/96–97/98")));
});
