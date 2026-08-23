import assert from "node:assert/strict";
import test from "node:test";

import { buildMatchesPageView } from "../lib/buildMatchesPageView";
import { buildMatchesCatalog, filterCatalogMatches } from "../lib/matches/catalog";
import { findMatches } from "../lib/queries";
import { roundMatchesFilter } from "../lib/matchRounds";

test("the match catalog covers every official fixture", () => {
  const catalog = buildMatchesCatalog();
  const { total } = findMatches({ limit: 1, offset: 0 });
  assert.equal(catalog.matches.length, total);
  assert.ok(catalog.matches.some((m) => m.id === "1999-05-26-bayern-munich-n"));
});

test("catalog filters agree with findMatches on common slices", () => {
  const catalog = buildMatchesCatalog();
  const cases = [
    { venue: "H" as const },
    { opponent: "liverpool" },
    { season: "1998-99" },
    { result: "W" as const, type: "european" },
    { scorer: "wayne-rooney" },
    { player: "ryan-giggs" },
    { round: "final" as const, competition: "champions-league" },
  ];
  for (const filter of cases) {
    const expected = findMatches({ ...filter, limit: 1, offset: 0 }).total;
    const got = filterCatalogMatches(catalog.matches, filter).length;
    assert.equal(got, expected, JSON.stringify(filter));
  }
});

test("the static default archive omits the full-record spine", () => {
  const view = buildMatchesPageView({});
  assert.equal(view.sequence.length, 0);
});

test("catalog-backed page view matches the SQLite default archive", () => {
  const catalog = buildMatchesCatalog();
  const fromDb = buildMatchesPageView({});
  const fromCatalog = buildMatchesPageView({}, catalog);
  assert.equal(fromCatalog.total, fromDb.total);
  assert.equal(fromCatalog.rows.length, fromDb.rows.length);
  assert.deepEqual(
    fromCatalog.rows.map((r) => r.id),
    fromDb.rows.map((r) => r.id),
  );
  assert.ok(fromCatalog.sequence.length >= 24);
});

test("roundMatchesFilter mirrors the SQL knockout predicates", () => {
  assert.equal(roundMatchesFilter("Final", "final"), true);
  assert.equal(roundMatchesFilter("Semi-Final", "final"), false);
  assert.equal(roundMatchesFilter("Champions League Group A", "group-stage"), true);
  assert.equal(roundMatchesFilter(null, "final"), false);
});
