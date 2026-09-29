import assert from "node:assert/strict";
import test from "node:test";
import { managerTrophyHaul, managerBestSeason, splitManagerTrophyHaul } from "@/lib/compare";

test("managerBestSeason picks the trophy-heaviest season first", () => {
  const haul = managerTrophyHaul("alex-ferguson");
  const best = managerBestSeason("alex-ferguson", haul);
  assert.ok(best);
  assert.equal(best.reason, "trophies");
  assert.equal(best.season, "1998-99");
  assert.equal(best.trophies, 3);
});

test("splitManagerTrophyHaul separates major and minor honours", () => {
  const haul = managerTrophyHaul("alex-ferguson");
  const { majorTotal, minorTotal } = splitManagerTrophyHaul(haul);
  assert.equal(majorTotal + minorTotal, haul.total);
  assert.equal(majorTotal, 25);
  assert.equal(minorTotal, 13);
});

test("managerBestSeason falls back to league points when no trophies", () => {
  const haul = managerTrophyHaul("ah-albut");
  assert.equal(haul.total, 0);
  const best = managerBestSeason("ah-albut", haul);
  assert.ok(best);
  assert.equal(best.reason, "league-points");
  assert.ok((best.leaguePoints ?? 0) > 0);
});

test("honours include shared Shields and exclude the 2000 group-stage win", () => {
  const ferguson = managerTrophyHaul("alex-ferguson");
  assert.equal(ferguson.total, 38);
  assert.ok(ferguson.entries?.some(e => e.href.includes("1990-08-18-liverpool-n") && e.competition.includes("shared")));
  assert.ok(!ferguson.entries?.some(e => e.href.includes("south-melbourne")));
  const busby = managerTrophyHaul("matt-busby");
  assert.equal(busby.total, 13);
  assert.equal(busby.entries?.filter(e => e.competition.includes("shared")).length, 2);
});

import awards from "../data/canonical/cup-honour-exceptions.json";
import { matchById } from "../lib/queries";
test("explicit honour awards refer to canonical matches with unchanged outcomes", () => {
  assert.equal(new Set(awards.awards.map(award => award.matchId)).size, awards.awards.length);
  for (const award of awards.awards) {
    const match = matchById(award.matchId);
    assert.ok(match, award.matchId);
    assert.equal(match.outcome, award.shared ? "D" : "W");
  }
});
