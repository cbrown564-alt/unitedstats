import assert from "node:assert/strict";
import { test } from "node:test";
import { allTransfers } from "@/lib/queries";
import { managerTransfers } from "@/lib/queries";
import { getDb } from "@/lib/db";
import {
  AUTHORED_RECEIPT_TRANSFER_IDS,
  buildTransferReceipt,
  buildTransferReceiptsForPlayer,
  shouldRenderTransferReceipt,
} from "@/lib/transferReceipt";
import {
  buildCurrentTransferWindow,
  feeRankLabel,
  relativeCostBandFromMeanMultiple,
  transferLaneKind,
} from "@/lib/currentTransferWindow";
import { loadInflationIndices } from "@/lib/inflationIndices";
import {
  activePlayerPeersByPosition,
  databaseBuiltAt,
  playerPositionMap,
} from "@/lib/queries";
import {
  latestTransferSeasonSummary,
  transferRecordSummary,
} from "@/lib/transferAggregates";
import { buildTransferA0Audit } from "@/lib/transferResearch";
import {
  FEATURED_TRANSFER_WINDOW,
  TRANSFER_LEDGER_SINCE,
  featuredWindowResolves,
  seasonAnchorId,
} from "@/lib/transferFeature";
import {
  AUTHORED_CLUB_CONNECTIONS,
  gatedClubIds,
  passesClubEvidenceGate,
} from "@/lib/transferClubs";
import { buildManagerTransferLens, costBandForMeanMultiple } from "@/lib/transferManagerLens";
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

test("current confirmed window groups lanes and quiet-window context", () => {
  const transfers = allTransfers();
  const indices = loadInflationIndices();
  const window = buildCurrentTransferWindow({
    transfers,
    indices,
    positionMap: playerPositionMap(),
    peersByPosition: activePlayerPeersByPosition("2025-07-01"),
    datasetBuiltAt: databaseBuiltAt(),
  });
  assert.ok(window);
  assert.equal(window.season, "2026-27");
  assert.equal(window.seasonLabel, "2026–27");
  assert.equal(window.dealCount, 3);
  assert.equal(window.quiet, true);
  assert.match(window.quietLead ?? "", /No permanent arrivals/i);
  assert.equal(window.verifiedAtSource, "dataset_build");
  assert.equal(window.lanes.length, 2);
  assert.deepEqual(
    window.lanes.map((lane) => lane.id),
    ["loan-out", "released-out"],
  );
  assert.equal(window.feeCoverage.known, 1);
  assert.equal(window.comparisons.length, 2);
  assert.equal(window.comparisons[0]?.season, "2025-26");
});

test("current window enriches known fees with historical rank and position peers", () => {
  const transfers = allTransfers();
  const indices = loadInflationIndices();
  const window = buildCurrentTransferWindow({
    transfers,
    indices,
    positionMap: playerPositionMap(),
    peersByPosition: activePlayerPeersByPosition("2025-07-01"),
    datasetBuiltAt: databaseBuiltAt(),
  });
  assert.ok(window);
  const hojlund = window.lanes.flatMap((lane) => lane.deals).find((deal) => deal.transfer.id.includes("hojlund"));
  assert.ok(hojlund);
  assert.equal(transferLaneKind(hojlund.transfer), "loan");
  assert.ok(hojlund.feeRank);
  assert.equal(hojlund.feeRank?.rank, 31);
  assert.match(feeRankLabel(hojlund.feeRank!), /31st highest sale receipt/i);
  assert.equal(hojlund.relativeCostBand, null);
  const note = window.positionNotes.find((entry) => entry.transferId === hojlund.transfer.id);
  assert.ok(note);
  assert.equal(note.positionGroup, "FWD");
  assert.ok(note.peers.some((peer) => peer.playerId === "joshua-zirkzee"));
});

test("relative cost bands use PL season-mean multiples, not percentiles", () => {
  assert.equal(relativeCostBandFromMeanMultiple(0.4), "low");
  assert.equal(relativeCostBandFromMeanMultiple(0.8), "lower-middle");
  assert.equal(relativeCostBandFromMeanMultiple(1.5), "upper-middle");
  assert.equal(relativeCostBandFromMeanMultiple(3), "high");
  assert.equal(relativeCostBandFromMeanMultiple(4.2), "extreme");
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

test("the featured window resolves to an anchor the archive actually renders", () => {
  const transfers = allTransfers();

  // The hub leads with this window and names it in structured data. `TransferArchive`
  // only emits a per-season anchor at or after the cutoff — earlier seasons collapse
  // into the "Before {since}" summary — so both conditions have to hold.
  assert.ok(
    featuredWindowResolves(transfers),
    `featured window ${FEATURED_TRANSFER_WINDOW.season} has no anchor target in the ledger`,
  );
  assert.ok(
    Number.parseInt(FEATURED_TRANSFER_WINDOW.season.slice(0, 4), 10) >= TRANSFER_LEDGER_SINCE,
    "featured season must sit at or after the archive cutoff",
  );
  assert.ok(
    transfers.some((row) => row.season === FEATURED_TRANSFER_WINDOW.season),
    "featured season must exist in canonical transfer data",
  );
  assert.equal(seasonAnchorId(FEATURED_TRANSFER_WINDOW.season), "txseason-1998-99");
});

test("a featured window below the ledger cutoff is rejected", () => {
  const transfers = allTransfers();
  // 1957-58 is real history but sits inside the collapsed pre-1980 summary, which
  // carries no per-season id — so featuring it would ship a dead link.
  const preCutoff = { ...FEATURED_TRANSFER_WINDOW, season: "1957-58" };
  assert.equal(featuredWindowResolves(transfers, preCutoff), false);
  // A season absent from canonical data is rejected even above the cutoff.
  const missing = { ...FEATURED_TRANSFER_WINDOW, season: "1823-24" };
  assert.equal(featuredWindowResolves(transfers, missing, 1800), false);
});

test("transfer history structured data mirrors the rendered paths", () => {
  const jsonLd = transferHistoryJsonLd("2026-27", FEATURED_TRANSFER_WINDOW);
  const graph = jsonLd["@graph"] as Array<Record<string, unknown>>;
  assert.equal(graph[0]?.["@type"], "BreadcrumbList");
  assert.equal(graph[1]?.["@type"], "ItemList");
  const items = graph[1]?.itemListElement as Array<Record<string, unknown>>;
  assert.equal(items.length, 4);
  assert.match(String(items[0]?.url), /#current-window$/);
  assert.match(String(items[1]?.url), /#txseason-1998-99$/);
});

test("structured data drops the featured window when the page will not render it", () => {
  const jsonLd = transferHistoryJsonLd("2026-27", undefined);
  const graph = jsonLd["@graph"] as Array<Record<string, unknown>>;
  const items = graph[1]?.itemListElement as Array<Record<string, unknown>>;
  assert.equal(items.length, 3);
  assert.ok(
    items.every((item) => !String(item.url).includes("txseason-")),
    "no season anchor may be claimed without a featured window",
  );
});

test("club evidence gate requires three market moves or two plus authored connection", () => {
  const transfers = allTransfers();
  assert.ok(passesClubEvidenceGate("leeds-united", transfers));
  assert.ok(passesClubEvidenceGate("real-madrid-cf", transfers));
  assert.equal(passesClubEvidenceGate("real-madrid-cf", transfers, {}), false);
  assert.ok(passesClubEvidenceGate("borussia-dortmund", transfers));
  assert.equal(passesClubEvidenceGate("napoli", transfers), false);
  assert.ok(gatedClubIds(transfers).includes("leeds-united"));
  assert.ok(gatedClubIds(transfers).includes("real-madrid-cf"));
  assert.ok(!gatedClubIds(transfers).includes("napoli"));
  assert.ok(AUTHORED_CLUB_CONNECTIONS["real-madrid-cf"]);
});

test("manager transfer lens exposes season, band, and spell evidence for Ferguson", () => {
  const indices = loadInflationIndices();
  const transfers = managerTransfers("alex-ferguson");
  const lens = buildManagerTransferLens("alex-ferguson", transfers, "nominal", indices);
  assert.ok(lens.seasons.length > 5);
  assert.ok(lens.costBands.some((band) => band.count > 0));
  assert.ok(lens.positionMix.length > 0);
  assert.ok(lens.completedSpells.length > 20);
  assert.ok(lens.definingLinks.some((link) => link.href.includes("/seasons/1998-99")));
  assert.equal(costBandForMeanMultiple(0.3), "low");
  assert.equal(costBandForMeanMultiple(5), "extreme");
});

test("transfer receipts keep signing spells separate for repeat players", () => {
  const indices = loadInflationIndices();
  const pogbaIn = buildTransferReceipt("2016-08-09-paul-pogba-in", indices);
  assert.ok(pogbaIn);
  assert.equal(pogbaIn.spell?.spellId, "paul-pogba:1");
  assert.ok((pogbaIn.spell?.apps ?? 0) > 100);
  assert.equal(pogbaIn.exit?.feeKind, "free");
  assert.notEqual(pogbaIn.spell?.signingTransferId, "undated-paul-pogba-in");

  const pogbaReceipts = buildTransferReceiptsForPlayer("paul-pogba", indices);
  assert.ok(pogbaReceipts.some((row) => row.deal.transferId === "2016-08-09-paul-pogba-in"));
  assert.ok(!pogbaReceipts.some((row) => row.deal.transferId === "undated-paul-pogba-in"));
});

test("transfer receipt fee kinds degrade without becoming zero", () => {
  const indices = loadInflationIndices();
  const ronaldoOut = buildTransferReceipt("2009-07-01-cristiano-ronaldo-out", indices);
  assert.ok(ronaldoOut);
  assert.equal(ronaldoOut.deal.feeGbp, 80_000_000);
  assert.equal(ronaldoOut.deal.feeKind, "fee");

  const pogbaOut = buildTransferReceipt("2022-07-11-paul-pogba-out", indices);
  assert.ok(pogbaOut);
  assert.equal(pogbaOut.deal.feeGbp, null);
  assert.equal(pogbaOut.deal.feeKind, "free");
  assert.ok(shouldRenderTransferReceipt(pogbaOut));
});

test("canonical exemplar receipts expose spell and team context", () => {
  const indices = loadInflationIndices();
  const cantona = buildTransferReceipt("1992-11-27-eric-cantona-in", indices);
  assert.ok(cantona);
  assert.ok((cantona.spell?.apps ?? 0) > 100);
  assert.ok((cantona.teamContext?.honourSeasons.length ?? 0) >= 3);
  assert.ok(cantona.deal.feeBand);

  const ronaldoOut = buildTransferReceipt("2009-07-01-cristiano-ronaldo-out", indices);
  assert.ok(ronaldoOut?.spell);
  assert.ok((ronaldoOut.spell?.goals ?? 0) > 100);
  assert.equal(ronaldoOut.exit?.transferId, "2009-07-01-cristiano-ronaldo-out");

  for (const id of AUTHORED_RECEIPT_TRANSFER_IDS) {
    const receipt = buildTransferReceipt(id, indices);
    assert.ok(receipt, `authored receipt ${id}`);
    assert.ok(shouldRenderTransferReceipt(receipt!));
  }
});

test("pre-1900 fee-less transfers without linkage do not render empty receipts", () => {
  const transfers = allTransfers();
  const archival = transfers.find(
    (row) =>
      row.date &&
      Number.parseInt(row.date.slice(0, 4), 10) < 1900 &&
      row.fee_kind !== "fee" &&
      row.player_id,
  );
  assert.ok(archival, "expected a pre-1900 non-fee transfer with player linkage");
  const receipt = buildTransferReceipt(archival!.id);
  assert.ok(receipt);
  assert.equal(shouldRenderTransferReceipt(receipt!), false);
});
