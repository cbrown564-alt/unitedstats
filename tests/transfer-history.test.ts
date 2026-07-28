import assert from "node:assert/strict";
import { test } from "node:test";
import { allTransfers } from "@/lib/queries";
import { getDb } from "@/lib/db";
import { loadInflationIndices } from "@/lib/inflationIndices";
import {
  latestTransferSeasonSummary,
  transferRecordSummary,
} from "@/lib/transferAggregates";
import { buildTransferA0Audit } from "@/lib/transferResearch";
import { transferHistoryJsonLd } from "@/lib/structuredData";

test("transfer history summary includes dated and undated canonical rows", () => {
  const transfers = allTransfers();
  const summary = transferRecordSummary(transfers);
  assert.equal(summary.total, 1967);
  assert.equal(summary.knownFees, 451);
  assert.equal(summary.firstYear, 1883);
  assert.equal(summary.lastYear, 2026);
  assert.ok(transfers.some((row) => row.date == null), "undated archival rows must remain in the hub input");
});

test("latest recorded transfer season is a confirmed-data summary", () => {
  const latest = latestTransferSeasonSummary(allTransfers());
  assert.ok(latest);
  assert.equal(latest.season, "2026-27");
  assert.equal(latest.arrivals, 0);
  assert.equal(latest.departures, 3);
  assert.equal(latest.knownFees, 1);
  assert.equal(latest.lastVerifiedDate, "2026-06-30");
});

test("A0 keeps descriptive research open and modelling closed", () => {
  const audit = buildTransferA0Audit(
    getDb(),
    loadInflationIndices(),
    "2026-07-28T00:00:00.000Z",
  );
  assert.equal(audit.summary.candidateSignings, 747);
  assert.equal(audit.summary.knownFeeSignings, 239);
  assert.ok(audit.summary.knownFeeWithSpellAppearances >= 220);
  assert.equal(audit.coverage.find((row) => row.field === "age_at_signing")?.covered, 0);
  assert.equal(audit.coverage.find((row) => row.field === "fee_pl_percentile")?.covered, 0);
  assert.equal(audit.plComparisonCorpus.supportsPercentiles, false);
  assert.equal(audit.conclusion.descriptiveStudy, "supported_with_limits");
  assert.equal(audit.conclusion.probabilityModel, "closed");
  assert.equal(audit.conclusion.bestValueRanking, "closed");
  assert.ok(audit.candidates.every((row) => !("success" in row)));
});

test("transfer history structured data mirrors the rendered paths", () => {
  const jsonLd = transferHistoryJsonLd("2026-27");
  const graph = jsonLd["@graph"] as Array<Record<string, unknown>>;
  assert.equal(graph[0]?.["@type"], "BreadcrumbList");
  assert.equal(graph[1]?.["@type"], "ItemList");
  const items = graph[1]?.itemListElement as Array<Record<string, unknown>>;
  assert.equal(items.length, 4);
  assert.match(String(items[0]?.url), /#current-window$/);
  assert.match(String(items[1]?.url), /#txseason-1998-99$/);
});
