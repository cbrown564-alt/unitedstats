import assert from "node:assert/strict";
import { test } from "node:test";
import { competitionShortName, fmtSeasonShort, fmtYearRange, playerCareerSpan, scoreline, scoreNote } from "@/lib/format";

test("fmtSeasonShort renders compact season labels", () => {
  assert.equal(fmtSeasonShort("2003-04"), "03/04");
  assert.equal(fmtSeasonShort("2009-10"), "09/10");
});

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

test("scoreline and scoreNote format extra time after the score", () => {
  assert.equal(scoreline(2, 1, null, true), "2–1 (a.e.t)");
  assert.equal(scoreline(1, 1, [4, 3], true), "1–1 (4–3 pens) (a.e.t)");
  assert.equal(scoreNote(null, true), "(a.e.t)");
  assert.equal(scoreNote([4, 3], true), "(a.e.t) · 4–3 pens");
});
