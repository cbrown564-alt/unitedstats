import assert from "node:assert/strict";
import test from "node:test";
import type React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import OnThisDayPage, { generateStaticParams as onThisDayParams } from "../app/on-this-day/[monthDay]/page";
import { monthDayKeys, onThisDay } from "../lib/onThisDay";

test("on-this-day exposes all 366 UTC month/day keys", () => {
  const keys = monthDayKeys();
  assert.equal(keys.length, 366);
  assert.equal(keys[0], "01-01");
  assert.ok(keys.includes("02-29"));
  assert.equal(keys.at(-1), "12-31");
  assert.equal(onThisDayParams().length, 366);
});

test("on-this-day leads with the standout match and computes the date's rhythm", async () => {
  const finalDay = onThisDay("05-26");
  // The 1999 European Cup final outranks the date's league games as the lead.
  assert.equal(finalDay.lead?.id, "1999-05-26-bayern-munich-n");
  assert.equal(finalDay.lead?.scoreline, "United 2-1 FC Bayern Munich");
  assert.match(finalDay.lead?.round ?? "", /final/i);
  assert.equal(finalDay.prev, "05-25");
  assert.equal(finalDay.next, "05-27");
  assert.ok(finalDay.rhythm && finalDay.rhythm.played >= 4);

  const leap = onThisDay("02-29");
  assert.equal(leap.rhythm?.firstYear, "1896");
  assert.ok([leap.lead, ...leap.rest].some((m) => m?.id === "1908-02-29-birmingham-city-h"));

  const html = renderToStaticMarkup(
    (await OnThisDayPage({ params: Promise.resolve({ monthDay: "05-26" }) })) as React.ReactElement,
  );
  assert.match(html, /United 2-1 FC Bayern Munich/);
  assert.match(html, /href="\/match\/1999-05-26-bayern-munich-n"/);
});

test("on-this-day all keys resolve without crashing and fallback is deterministic", () => {
  for (const key of monthDayKeys()) {
    const entry = onThisDay(key);
    assert.equal(entry.monthDay, key);
    assert.equal(entry.ref.id, `us:on-this-day:${key}`);
    if (entry.lead === null) {
      assert.equal(entry.rest.length, 0);
      assert.ok(entry.fallback?.startsWith("No official United match is recorded on"));
    } else {
      assert.ok(entry.rhythm && entry.rhythm.played >= 1);
    }
  }
});
