import assert from "node:assert/strict";
import { test } from "node:test";
import { competitionShortName, fmtYearRange, playerCareerSpan } from "@/lib/format";

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

test("competitionShortName abbreviates known competition ids", () => {
  assert.equal(competitionShortName("champions-league", "UEFA Champions League"), "Champions Lg");
  assert.equal(competitionShortName("fa-cup", "FA Cup"), "FA Cup");
  assert.equal(competitionShortName("unknown-cup", "Some Long Cup Name"), "Some Long Cup Name");
});
