import assert from "node:assert/strict";
import test from "node:test";
import { pitchPlacement, summarizeCareerAppearances } from "../lib/placement.ts";

test("pitchPlacement prefers recorded role over career band", () => {
  const at = pitchPlacement(
    { role: "Left-Back", shirt: 10, career_band: "FWD" },
    2010,
  );
  assert.equal(at?.band, "DEF");
  assert.equal(at?.via, "role");
});

test("summarizeCareerAppearances aggregates lineup rows onto pitch slots", () => {
  const summary = summarizeCareerAppearances([
    { date: "2010-01-01", role: "Striker", shirt: 10, career_band: "FWD" },
    { date: "2010-02-01", role: "Centre Forward", shirt: 10, career_band: "FWD" },
    { date: "2010-03-01", role: null, shirt: null, career_band: "FWD" },
  ]);
  assert.equal(summary.total, 3);
  assert.equal(summary.placed, 3);
  assert.equal(summary.bandTotals.FWD, 3);
  assert.ok(summary.topRoles.some((r) => r.role === "Striker"));
});
