import assert from "node:assert/strict";
import { test } from "node:test";
import { fmtYearRange, playerCareerSpan } from "@/lib/format";

test("fmtYearRange uses en-dash and present for open careers", () => {
  assert.equal(fmtYearRange(1992, null), "1992–present");
  assert.equal(fmtYearRange(1992, undefined), "1992–present");
  assert.equal(fmtYearRange(1990, 2014), "1990–2014");
  assert.equal(fmtYearRange(null), "?");
});

test("playerCareerSpan prefers structured years", () => {
  assert.equal(
    playerCareerSpan({ first_year: 1990, last_year: 2014, career: "1990-2014" }),
    "1990–2014",
  );
  assert.equal(playerCareerSpan({ first_year: 1992, last_year: null }), "1992–present");
});

test("playerCareerSpan normalizes stored career strings", () => {
  assert.equal(playerCareerSpan({ career: "1990-2014" }), "1990–2014");
  assert.equal(playerCareerSpan({ career: "1990–" }), "1990–present");
  assert.equal(playerCareerSpan({ career: "1990-" }), "1990–present");
});
