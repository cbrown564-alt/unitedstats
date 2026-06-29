import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  seasonBounds,
  seasonIndicesForDecade,
  seasonIndicesFromParams,
  seasonsAscending,
} from "../lib/seasonBounds";

const SEASONS = ["2025-26", "2024-25", "1999-00", "1998-99", "1886-87"];

describe("seasonBounds", () => {
  it("uses Jul–Jun football boundaries", () => {
    assert.deepEqual(seasonBounds("1998-99"), { from: "1998-07-01", to: "1999-06-30" });
  });

  it("maps URL dates to season indices", () => {
    const asc = seasonsAscending(SEASONS);
    assert.deepEqual(seasonIndicesFromParams(asc, "1998", "1999"), [1, 2]);
    assert.deepEqual(seasonIndicesFromParams(asc, undefined, undefined), [0, asc.length - 1]);
  });

  it("snaps decade jumps to whole seasons", () => {
    const asc = seasonsAscending(SEASONS);
    assert.deepEqual(seasonIndicesForDecade(asc, 1990), [1, 2]);
    assert.deepEqual(seasonIndicesForDecade(asc, 2020), [3, 4]);
  });
});
