import assert from "node:assert/strict";
import test from "node:test";
import type React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import ComparePage from "../app/compare/page";
import ExplorePage from "../app/explore/page";

test("Discover promotes questions and curated comparisons only", () => {
  const html = renderToStaticMarkup(ExplorePage() as React.ReactElement);
  assert.match(html, />Questions</);
  assert.match(html, />Curated debates</);
  assert.doesNotMatch(html, /Curated cuts/i);
  assert.doesNotMatch(html, /custom matchup/i);
});

test("Compare exposes no unrestricted creator", async () => {
  const html = renderToStaticMarkup(
    (await ComparePage({ searchParams: Promise.resolve({}) })) as React.ReactElement,
  );
  assert.match(html, /Curated debates/);
  assert.doesNotMatch(html, /<form/);
  assert.doesNotMatch(html, /Build a custom matchup/i);
  assert.doesNotMatch(html, /type="search"/);
});

test("valid incoming arbitrary comparison URLs remain readable but unlisted", async () => {
  const html = renderToStaticMarkup(
    (await ComparePage({
      searchParams: Promise.resolve({ mode: "players", a: "wayne-rooney", b: "paul-scholes" }),
    })) as React.ReactElement,
  );
  assert.match(html, /Wayne Rooney/);
  assert.match(html, /Paul Scholes/);
  assert.doesNotMatch(html, /<form/);
  assert.match(html, /Another curated debate/);
});
