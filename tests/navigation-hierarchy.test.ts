import assert from "node:assert/strict";
import test from "node:test";

import { NAV_SECTIONS, PRIMARY_NAV, SECONDARY_NAV, mobileNavLabel } from "../lib/navSections";

test("navigation exposes five primary destinations before secondary disclosure", () => {
  assert.deepEqual(PRIMARY_NAV.map((item) => item.label), ["Stories", "Discover", "Matches", "Seasons", "Players"]);
  assert.equal(PRIMARY_NAV.length, 5);
  assert.deepEqual(SECONDARY_NAV.map((item) => item.label), ["Managers", "Analytics", "Transfers", "Data"]);
});

test("active labels still resolve for demoted routes", () => {
  assert.equal(mobileNavLabel("/analytics"), "Analytics");
  assert.equal(mobileNavLabel("/manager/alex-ferguson"), "Managers");
  assert.equal(NAV_SECTIONS.length, PRIMARY_NAV.length + SECONDARY_NAV.length);
});
