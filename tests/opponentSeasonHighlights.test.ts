import assert from "node:assert/strict";
import test from "node:test";
import {
  enrichOpponentSeasons,
  opponentBestSeason,
  peakWinRateSeasons,
} from "@/lib/opponentSeasonHighlights";

test("opponentSeasonHighlights picks the highest win-rate season", () => {
  const rows = enrichOpponentSeasons([
    { season: "2020-21", w: 1, d: 1, l: 0 },
    { season: "2021-22", w: 2, d: 0, l: 0 },
    { season: "2022-23", w: 0, d: 1, l: 1 },
  ]);
  const peaks = peakWinRateSeasons(rows);
  assert.deepEqual(peaks.map((s) => s.season), ["2021-22"]);
  assert.equal(opponentBestSeason(rows)?.season, "2021-22");
});

test("opponentSeasonHighlights computes win rate and ppg", () => {
  const rows = enrichOpponentSeasons([{ season: "2020-21", w: 1, d: 1, l: 0 }]);
  const s = rows[0]!;
  assert.equal(s.p, 2);
  assert.equal(s.winPct, 50);
  assert.equal(s.ppg, 2);
});
