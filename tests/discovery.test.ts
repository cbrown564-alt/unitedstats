import assert from "node:assert/strict";
import { test } from "node:test";
import { CURATED_NIGHTS } from "../lib/curatedNights";
import { THREAD_OF_NIGHTS } from "../lib/journey";
import { CURATED_DEBATES } from "../lib/compare";
import { allMatchIds, allSeasons, managersIndex, playersIndex } from "../lib/queries";
import {
  DISCOVERY_UTILITY_PATHS,
  MAJOR_PLAYER_APPS_FLOOR,
  robotsDisallowPaths,
  sitemapManagerIds,
  sitemapMatchIds,
  sitemapPlayerIds,
  sitemapSeasonIds,
  sitemapStaticPaths,
} from "../lib/discovery";

test("sitemap static paths keep the authored front door and drop utility routes", () => {
  const paths = sitemapStaticPaths();
  for (const keep of ["/", "/explore", "/stories", "/seasons", "/managers", "/data", "/analytics", "/transfers"]) {
    assert.ok(paths.includes(keep), `expected ${keep} in the sitemap`);
  }
  for (const drop of DISCOVERY_UTILITY_PATHS) {
    assert.ok(!paths.includes(drop), `utility route ${drop} must stay off the sitemap`);
  }
  assert.ok(!paths.some((path) => path.startsWith("/on-this-day")));
});

test("sitemap match ids are the authored and trophy set, not the full archive", () => {
  const selected = new Set(sitemapMatchIds());
  const archive = allMatchIds();
  assert.ok(selected.size < 400, `selected matches should stay well under 400, got ${selected.size}`);
  assert.ok(selected.size < archive.length / 10);
  for (const night of CURATED_NIGHTS) {
    assert.ok(selected.has(night.id), `curated night ${night.id} must stay discoverable`);
  }
  for (const night of THREAD_OF_NIGHTS) {
    assert.ok(selected.has(night.id), `thread night ${night.id} must stay discoverable`);
  }
  assert.ok(selected.has("1999-05-26-bayern-munich-n"));
  assert.ok(selected.has("1968-05-29-benfica-n"));
});

test("sitemap player ids are major careers and authored debates, not the register", () => {
  const selected = new Set(sitemapPlayerIds());
  const register = playersIndex();
  assert.ok(selected.size < 200, `major players should stay well under 200, got ${selected.size}`);
  assert.ok(selected.size < register.length / 3);
  for (const debate of CURATED_DEBATES.players) {
    assert.ok(selected.has(debate.a), debate.a);
    assert.ok(selected.has(debate.b), debate.b);
  }
  const byId = new Map(register.map((player) => [player.player_id, player]));
  for (const id of selected) {
    const player = byId.get(id);
    assert.ok(player, `unknown player ${id}`);
    const featured = CURATED_DEBATES.players.some((debate) => debate.a === id || debate.b === id);
    assert.ok(
      featured || player.apps >= MAJOR_PLAYER_APPS_FLOOR,
      `${id} is neither a debate player nor at the appearance floor`,
    );
  }
});

test("sitemap still lists every season and manager", () => {
  assert.deepEqual(sitemapManagerIds().sort(), managersIndex().map((manager) => manager.id).sort());
  assert.deepEqual(sitemapSeasonIds().sort(), [...allSeasons()].sort());
});

test("robots disallows APIs, datasets, and utility crawls", () => {
  const disallow = robotsDisallowPaths();
  for (const path of ["/api/", "/dataset/", "/search", "/matches", "/surprise", "/compare", "/cut", "/on-this-day", "/dev/"]) {
    assert.ok(disallow.includes(path), `robots should disallow ${path}`);
  }
  assert.ok(!disallow.includes("/"));
  assert.ok(!disallow.includes("/player/"));
  assert.ok(!disallow.includes("/match/"));
});
