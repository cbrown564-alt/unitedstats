import assert from "node:assert/strict";
import test from "node:test";
import { playerUsesDefensiveProfile } from "../lib/playerProfile.ts";

test("playerUsesDefensiveProfile for defenders and keepers", () => {
  assert.equal(playerUsesDefensiveProfile("DEF"), true);
  assert.equal(playerUsesDefensiveProfile("GK"), true);
  assert.equal(playerUsesDefensiveProfile("MID"), false);
  assert.equal(playerUsesDefensiveProfile("FWD"), false);
  assert.equal(playerUsesDefensiveProfile(null), false);
});
