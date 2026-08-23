import assert from "node:assert/strict";
import test from "node:test";

import { enrichLanes } from "../pipeline/enrichLanes";

test("plans Wikipedia, Transfermarkt, MUFCInfo, and positions", () => {
  const lanes = enrichLanes({ write: true, refresh: true });
  assert.deepEqual(lanes.map((l) => l.id), [
    "wikipedia",
    "transfermarkt",
    "mufcinfo-lineups",
    "mufcinfo-stadiums",
    "mufcinfo-assists",
    "positions",
  ]);
  assert.ok(lanes.find((l) => l.id === "transfermarkt")?.args.includes("--refresh"));
  assert.ok(lanes.find((l) => l.id === "mufcinfo-lineups")?.args.includes("--write"));
});

test("omits refresh unless asked", () => {
  const lanes = enrichLanes({ write: true, refresh: false });
  assert.ok(!lanes.find((l) => l.id === "transfermarkt")?.args.includes("--refresh"));
  assert.ok(lanes.find((l) => l.id === "transfermarkt")?.args.includes("--write"));
});
