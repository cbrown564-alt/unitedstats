import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  adjustFeeGbp,
  transferSeason,
} from "../lib/inflation";
import {
  loadInflationIndices,
  resetInflationCache,
} from "../lib/inflationIndices";
import {
  buildInflationIndex,
  buildSeasonStats,
  mean,
  mergeFeeCorpus,
  parseTmUkFees,
  saisonIdToSeason,
  tmHySeasonToCanonical,
} from "../scripts/ingest/pl-transfer-index";

describe("pl-transfer-index", () => {
  test("season parsers", () => {
    assert.equal(tmHySeasonToCanonical("1992/1993"), "1992-93");
    assert.equal(tmHySeasonToCanonical("2002/03"), "2002-03");
    assert.equal(saisonIdToSeason(1992), "1992-93");
    assert.equal(saisonIdToSeason(2024), "2024-25");
  });

  test("index covers PL era from 1992", () => {
    const bySeason = buildSeasonStats([
      { season: "1992-93", feeGbp: 1_000_000, source: "tmarkt-seed" },
      { season: "1992-93", feeGbp: 3_000_000, source: "tmarkt-seed" },
      { season: "2024-25", feeGbp: 20_000_000, source: "tmarkt-seed" },
      { season: "2024-25", feeGbp: 30_000_000, source: "tmarkt-seed" },
    ]);
    const index = buildInflationIndex(bySeason, "2024-25");
    assert.equal(index.seasons["1992-93"]!.factor, 12.5);
    assert.equal(index.seasons["2024-25"]!.factor, 1);
  });

  test("loaded corpus spans 1992–2024 with rising factors for older seasons", () => {
    resetInflationCache();
    const { football } = loadInflationIndices();
    assert.ok(football.seasons["1992-93"]);
    assert.ok(football.seasons["2002-03"]);
    assert.ok(football.seasons["2024-25"]);
    assert.ok(football.seasons["1992-93"]!.factor > football.seasons["2002-03"]!.factor);
    assert.ok(football.seasons["2002-03"]!.factor > football.seasons["2024-25"]!.factor);
    assert.ok(football.corpusSize! > 4000);
  });

  test("Sky-style benchmarks with scrape-shaped means", () => {
    resetInflationCache();
    const { football } = loadInflationIndices();
    const shevchenko = Math.round(30.8e6 * football.seasons["2006-07"]!.factor);
    const rio = Math.round(29e6 * football.seasons["2002-03"]!.factor);
    // Sky published ~£215m and ~£199m; TM UK scrape corpus should land closer than seed-only.
    assert.ok(shevchenko >= 150e6 && shevchenko <= 230e6, `Shevchenko adj ${shevchenko}`);
    assert.ok(rio >= 140e6 && rio <= 210e6, `Rio adj ${rio}`);
    assert.ok(football.scrapeSeasons != null && football.scrapeSeasons >= 30);
  });

  test("parseTmUkFees reads jumplist fee cells", () => {
    const html = `<thead><tr><th>Joined</th><th class="abloese-transfer-cell">Fee</th></tr></thead><tbody>
      <tr><td class="rechts "><a href="/jumplist/transfers/spieler/1/transfer_id/1">€116.00m</a></td></tr>
      <tr><td class="rechts "><a href="/jumplist/transfers/spieler/2/transfer_id/2">loan transfer</a></td></tr>
    </tbody>`;
    const fees = parseTmUkFees(html, 2023);
    assert.equal(fees.length, 1);
    assert.ok(fees[0]! > 100_000_000);
  });

  test("mergeFeeCorpus prefers scrape seasons", () => {
    const merged = mergeFeeCorpus(
      [
        { season: "2002-03", feeGbp: 1_000_000, source: "tmarkt-seed" },
        { season: "2003-04", feeGbp: 2_000_000, source: "tmarkt-seed" },
      ],
      [{ season: "2002-03", feeGbp: 5_000_000, source: "transfermarkt-uk-scrape" }],
    );
    assert.equal(merged.filter((f) => f.season === "2002-03").length, 1);
    assert.equal(merged.find((f) => f.season === "2002-03")!.feeGbp, 5_000_000);
    assert.equal(merged.filter((f) => f.season === "2003-04").length, 1);
  });
});

describe("inflation adjustFeeGbp", () => {
  test("nominal passthrough", () => {
    resetInflationCache();
    const indices = loadInflationIndices();
    assert.equal(
      adjustFeeGbp(29_000_000, "fee", "2002-08-01", "2002-03", "nominal", indices),
      29_000_000,
    );
  });

  test("football mode uses PL index from 1992", () => {
    resetInflationCache();
    const indices = loadInflationIndices();
    const adj = adjustFeeGbp(29_000_000, "fee", "2002-08-01", "2002-03", "football", indices)!;
    assert.ok(adj > 29_000_000);
  });

  test("football mode falls back to CPI before PL era", () => {
    resetInflationCache();
    const indices = loadInflationIndices();
    const adj = adjustFeeGbp(100_000, "fee", "1985-07-01", "1985-86", "football", indices)!;
    assert.ok(adj > 100_000);
  });

  test("transferSeason resolves from date", () => {
    assert.equal(transferSeason("2002-08-01", null), "2002-03");
    assert.equal(transferSeason("2003-01-15", null), "2002-03");
    assert.equal(transferSeason("2003-08-01", null), "2003-04");
  });

  test("mean helper", () => {
    assert.equal(mean([1, 2, 3]), 2);
  });
});
