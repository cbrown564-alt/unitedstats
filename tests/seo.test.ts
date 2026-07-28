import assert from "node:assert/strict";
import { test } from "node:test";
import { matchById, playerById } from "@/lib/queries";
import {
  listSeo,
  matchSeoDescription,
  matchSeoTitle,
  onThisDaySeoDescription,
  onThisDaySeoTitle,
  playerSeoDescription,
  playerSeoTitle,
  seasonSeoDescription,
  seasonSeoTitle,
  seoMetadata,
} from "@/lib/seo";
import { onThisDay } from "@/lib/onThisDay";

test("matchSeoTitle and description for 1999 Champions League final", () => {
  const m = matchById("1999-05-26-bayern-munich-n");
  assert.ok(m, "fixture match must exist");
  assert.equal(matchSeoTitle(m), "Manchester United 2–1 FC Bayern Munich (26 May 1999)");
  assert.match(matchSeoDescription(m), /Champions League final/);
  assert.match(matchSeoDescription(m), /won 2–1 against FC Bayern Munich/);
});

test("matchSeoTitle for 2003 Real Madrid quarter-final", () => {
  const m = matchById("2003-04-23-real-madrid-h");
  assert.ok(m);
  assert.equal(matchSeoTitle(m), "Manchester United 4–3 Real Madrid C.F. (23 Apr 2003)");
});

test("playerSeoTitle and description for Cristiano Ronaldo", () => {
  const p = playerById("cristiano-ronaldo");
  assert.ok(p);
  assert.equal(playerSeoTitle(p), "Cristiano Ronaldo — Manchester United stats & career record");
  assert.match(playerSeoDescription(p), /145 goals/);
  assert.match(playerSeoDescription(p), /346 appearances/);
});

test("playerSeoTitle and description for George Best", () => {
  const p = playerById("george-best");
  assert.ok(p);
  assert.match(playerSeoTitle(p), /George Best/);
  assert.match(playerSeoDescription(p), /179 goals/);
});

test("seasonSeo helpers highlight the treble season", () => {
  assert.equal(seasonSeoTitle("1998-99"), "Manchester United 1998-99 treble season results");
  assert.match(seasonSeoDescription("1998-99"), /treble-winning/);
  assert.equal(seasonSeoTitle("2003-04"), "Manchester United 2003-04 season results");
  assert.match(seasonSeoDescription("2003-04"), /2003-04 season results/);
});

test("on-this-day SEO leads with Manchester United and the calendar date", () => {
  const entry = onThisDay("05-26");
  assert.equal(onThisDaySeoTitle(entry), "Manchester United on this day — 26 May");
  assert.match(onThisDaySeoDescription(entry), /1999 — Manchester United 2–1 FC Bayern Munich/);
  assert.equal(entry.lead?.id, "1999-05-26-bayern-munich-n");
});

test("seoMetadata keeps Open Graph in sync", () => {
  const meta = seoMetadata("Test title", "Test description", { alternates: { canonical: "/test" } });
  assert.equal(meta.title, "Test title");
  assert.equal(meta.description, "Test description");
  assert.equal(meta.openGraph?.title, "Test title · Red Thread");
  assert.equal(meta.openGraph?.description, "Test description");
  assert.deepEqual(meta.alternates, { canonical: "/test" });
});

test("listSeo uses fan-search phrases with Manchester United", () => {
  assert.match(listSeo.matches.title, /Manchester United/);
  assert.match(listSeo.players.description, /appearances/);
  assert.match(listSeo.seasons.description, /treble seasons/);
  assert.equal(listSeo.transfers.title, "Manchester United Transfer History — Every Signing and Sale");
  assert.match(listSeo.transfers.description, /1883 to 2026/);
  assert.match(listSeo.transfers.description, /undisclosed/);
});
