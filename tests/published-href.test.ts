import assert from "node:assert/strict";
import { test } from "node:test";
import { matchHref, opponentHref, playerHref, seasonHref } from "../lib/publishedHref";

test("published records keep their authored pages", () => {
  assert.equal(seasonHref("1998-99"), "/seasons/1998-99");
  assert.equal(matchHref("1999-05-26-bayern-munich-n"), "/match/1999-05-26-bayern-munich-n");
  assert.equal(playerHref("wayne-rooney"), "/player/wayne-rooney");
  assert.equal(opponentHref("bayern-munich"), "/opponent/bayern-munich");
});

test("newly indexable entities use static pages while unpublished matches keep their reader", () => {
  assert.equal(seasonHref("2014-15"), "/seasons/2014-15");
  assert.equal(seasonHref("9999-00"), "/matches?season=9999-00");
  assert.equal(matchHref("2004-09-28-fenerbahce-h"), "/record?kind=match&id=2004-09-28-fenerbahce-h");
  assert.equal(playerHref("jaap-stam"), "/player/jaap-stam");
  assert.equal(opponentHref("fleetwood-rangers"), "/opponent/fleetwood-rangers");
});
