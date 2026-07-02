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
