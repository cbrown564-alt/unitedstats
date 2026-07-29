import assert from "node:assert/strict";
import { test } from "node:test";
import { allTransfers, managerTransferTenures } from "@/lib/queries";
import {
  SQUAD_BUILD_ERAS,
  compareSquadBuildThreads,
  filterSquadBuildThreads,
  seasonStartYear,
  squadBuildSeasonLabel,
} from "@/lib/squadBuild";
import { buildAllSquadBuildDatasets, buildSquadBuildDataset } from "@/lib/squadBuild.server";

test("squad-build prototype ships three bounded era datasets", () => {
  const transfers = allTransfers();
  const tenures = managerTransferTenures();
  const datasets = buildAllSquadBuildDatasets(transfers, tenures);

  assert.equal(datasets.length, 3);
  assert.deepEqual(
    datasets.map((dataset) => dataset.era.id),
    ["ferguson-early", "ferguson-late", "post-ferguson"],
  );

  for (const dataset of datasets) {
    assert.ok(dataset.seasons.length > 0, `${dataset.era.id} must include seasons`);
    assert.ok(dataset.threads.length > 0, `${dataset.era.id} must include threads`);
    assert.ok(dataset.managerBands.length > 0, `${dataset.era.id} must include manager bands`);
    for (const thread of dataset.threads) {
      const start = seasonStartYear(thread.season);
      assert.ok(start != null);
      assert.ok(start >= dataset.era.seasonFrom && start <= dataset.era.seasonTo);
      assert.ok(thread.date, "threads must be dated for the timeline");
    }
  }
});

test("squad-build threads stay in chronological keyboard order", () => {
  const dataset = buildSquadBuildDataset("ferguson-early", allTransfers(), managerTransferTenures());
  const sorted = [...dataset.threads].sort(compareSquadBuildThreads);
  assert.deepEqual(
    sorted.map((thread) => thread.id),
    dataset.threads.map((thread) => thread.id),
  );
});

test("squad-build fee scale uses era max and position filter preserves order", () => {
  const dataset = buildSquadBuildDataset("post-ferguson", allTransfers(), managerTransferTenures());
  const feeThreads = dataset.threads.filter((thread) => thread.feeScale != null);
  assert.ok(feeThreads.length > 0);
  assert.ok(feeThreads.every((thread) => thread.feeScale! > 0 && thread.feeScale! <= 1));

  const maxThread = feeThreads.find((thread) => thread.feeScale === 1);
  assert.ok(maxThread);
  assert.equal(maxThread!.feeGbp, dataset.maxKnownFee);

  const mids = filterSquadBuildThreads(dataset.threads, "MID");
  assert.ok(mids.length > 0);
  assert.ok(mids.every((thread) => thread.position === "MID"));
  const resorted = [...mids].sort(compareSquadBuildThreads);
  assert.deepEqual(
    resorted.map((thread) => thread.id),
    mids.map((thread) => thread.id),
  );
});

test("squad-build era windows match the implementation plan labels", () => {
  assert.equal(SQUAD_BUILD_ERAS[0]?.label, "Ferguson 1992–2002");
  assert.equal(SQUAD_BUILD_ERAS[1]?.label, "Ferguson 2003–2013");
  assert.equal(SQUAD_BUILD_ERAS[2]?.label, "Post-Ferguson");
  assert.equal(squadBuildSeasonLabel("1998-99"), "98–99");
});
