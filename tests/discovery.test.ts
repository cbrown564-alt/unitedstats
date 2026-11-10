import assert from "node:assert/strict";
import { test } from "node:test";
import { CURATED_NIGHTS } from "../lib/curatedNights";
import { THREAD_OF_NIGHTS } from "../lib/journey";
import { CURATED_DEBATES } from "../lib/compare";
import { allMatchIds, allSeasons, managersIndex, opponentsIndex, playersIndex } from "../lib/queries";
import {
  DISCOVERY_UTILITY_PATHS,
  robotsDisallowPaths,
  sitemapManagerIds,
  sitemapMatchIds,
  sitemapOpponentIds,
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

test("every player, opponent and season is a published page", () => {
  assert.deepEqual(sitemapPlayerIds().sort(), playersIndex().map((player) => player.player_id).sort());
  assert.deepEqual(sitemapOpponentIds().sort(), opponentsIndex().map((opponent) => opponent.id).sort());
  assert.deepEqual(sitemapSeasonIds(), allSeasons());
  for (const debate of CURATED_DEBATES.players) {
    assert.ok(sitemapPlayerIds().includes(debate.a), debate.a);
    assert.ok(sitemapPlayerIds().includes(debate.b), debate.b);
  }
});

test("sitemap keeps every manager", () => {
  assert.deepEqual(sitemapManagerIds().sort(), managersIndex().map((manager) => manager.id).sort());
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
