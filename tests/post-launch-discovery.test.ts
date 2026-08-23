import assert from "node:assert/strict";
import test from "node:test";
import type React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import ExplorePage from "../app/explore/page";
import { ComparePageView } from "../components/compare/ComparePageClient";
import { compareManagers, comparePlayers, CURATED_DEBATES, type Comparison } from "../lib/compare";
import { curatedComparisonKey } from "../lib/curatedDebates";

function curatedComparisons() {
  const curated: Record<string, Comparison> = {};
  for (const debate of CURATED_DEBATES.players) {
    const comparison = comparePlayers(debate.a, debate.b);
    if (comparison) curated[curatedComparisonKey("players", debate.a, debate.b)] = comparison;
  }
  for (const debate of CURATED_DEBATES.managers) {
    const comparison = compareManagers(debate.a, debate.b);
    if (comparison) curated[curatedComparisonKey("managers", debate.a, debate.b)] = comparison;
  }
  return curated;
}

test("Discover promotes questions and curated comparisons only", () => {
  const html = renderToStaticMarkup(ExplorePage() as React.ReactElement);
  assert.match(html, />Questions</);
  assert.match(html, />Curated debates</);
  assert.doesNotMatch(html, /Curated cuts/i);
  assert.doesNotMatch(html, /custom matchup/i);
});

test("Compare exposes no unrestricted creator", () => {
  const html = renderToStaticMarkup(
    ComparePageView({ curated: curatedComparisons() }) as React.ReactElement,
  );
  assert.match(html, /Curated debates/);
  assert.doesNotMatch(html, /<form/);
  assert.doesNotMatch(html, /Build a custom matchup/i);
  assert.doesNotMatch(html, /type="search"/);
});

test("curated comparison URLs still resolve", () => {
  const html = renderToStaticMarkup(
    ComparePageView({
      curated: curatedComparisons(),
      mode: "players",
      a: "wayne-rooney",
      b: "bobby-charlton",
    }) as React.ReactElement,
  );
  assert.match(html, /Wayne Rooney/);
  assert.match(html, /Bobby Charlton/);
  assert.doesNotMatch(html, /<form/);
  assert.match(html, /Another curated debate/);
});

test("arbitrary comparison URLs no longer resolve", () => {
  const html = renderToStaticMarkup(
    ComparePageView({
      curated: curatedComparisons(),
      mode: "players",
      a: "wayne-rooney",
      b: "paul-scholes",
    }) as React.ReactElement,
  );
  assert.match(html, /no longer resolves/);
  assert.match(html, /Curated debates/);
  assert.doesNotMatch(html, /<form/);
});
