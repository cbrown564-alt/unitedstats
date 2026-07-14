import assert from "node:assert/strict";
import test from "node:test";

import { playerAppearanceEndpoints } from "../lib/queries";

test("player plate endpoints use appearances rather than scoring matches", () => {
  const { debut, latest } = playerAppearanceEndpoints("wayne-rooney");
  assert.equal(debut?.id, "2004-09-28-fenerbahce-h");
  assert.equal(latest?.id, "2017-05-24-afc-ajax-n");
});

test("appearance endpoints work for a player without a goal record", () => {
  const { debut, latest } = playerAppearanceEndpoints("sergio-reguilon");
  assert.ok(debut);
  assert.ok(latest);
  assert.ok(debut.date <= latest.date);
});
