import assert from "node:assert/strict";
import test from "node:test";
import type React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import MatchPage from "../app/match/[id]/page";
import { CURATED_NIGHTS } from "../lib/curatedNights";
import { matchContext } from "../lib/matchContext";
import { eventsForMatch, matchById } from "../lib/queries";

function contextFor(id: string) {
  const match = matchById(id);
  assert.ok(match, `missing match ${id}`);
  return matchContext(match, eventsForMatch(id));
}

test("every curated night resolves to reviewed authored context", () => {
  for (const night of CURATED_NIGHTS) {
    const context = contextFor(night.id);
    assert.ok(context, `${night.id} has no context`);
    assert.equal(context.level, "authored");
    assert.equal(context.sentence, night.stakes);
    assert.ok(context.facts.some((fact) => fact.value === night.id));
  }
});

test("the 1999 final pins the approved claim and one deeper route", () => {
  const context = contextFor("1999-05-26-bayern-munich-n");
  assert.ok(context);
  assert.equal(context.sentence, "Bayern led from the sixth minute. Two stoppage-time goals completed the Treble.");
  assert.deepEqual(context.related, { label: "How the Treble was won", href: "/questions/treble" });
});

test("computed context uses available canonical facts and suppresses plain receipts", () => {
  const europeanFinal = contextFor("2025-05-21-tottenham-hotspur-n");
  assert.ok(europeanFinal);
  assert.equal(europeanFinal.level, "computed");
  assert.match(europeanFinal.sentence, /final/);

  const comeback = contextFor("2025-02-07-leicester-city-h");
  assert.ok(comeback);
  assert.match(comeback.sentence, /trailed 0–1 at half-time/);

  const ordinary = contextFor("2024-12-30-newcastle-united-h");
  assert.equal(ordinary, null);
});

test("the 1999 context is integrated into the score header before the breadcrumb and tabs", async () => {
  const html = renderToStaticMarkup(
    (await MatchPage({ params: Promise.resolve({ id: "1999-05-26-bayern-munich-n" }) })) as React.ReactElement,
  );
  const contextIndex = html.indexOf("Bayern led from the sixth minute");
  const breadcrumbIndex = html.indexOf("detail-breadcrumb");
  const tabsIndex = html.indexOf('role="tablist"');
  assert.ok(contextIndex > -1, "context missing from server HTML");
  assert.ok(breadcrumbIndex > contextIndex, "breadcrumb should follow the header context in source order");
  assert.ok(tabsIndex > contextIndex, "tabs should follow the context in source order");
  assert.match(html, /href="\/questions\/treble"/);
  assert.doesNotMatch(html, /Reviewed context/);
});
