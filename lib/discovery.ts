import { CURATED_DEBATES } from "./curatedDebates";
import { CURATED_NIGHTS } from "./curatedNights";
import { getDb } from "./db";
import { THREAD_OF_NIGHTS } from "./journey";
import { CUP_WON_PREDICATE, allSeasons, managersIndex, playersIndex } from "./queries";
import { europeanFinals } from "./trails";

/**
 * Hobby Move 6: crawlers get the authored front door and the spine of the
 * record (seasons, managers, major careers, selected nights). The full
 * archive stays linkable; it is no longer cheap to enumerate from the sitemap.
 */

export const MAJOR_PLAYER_APPS_FLOOR = 150;

export const DISCOVERY_UTILITY_PATHS = [
  "/surprise",
  "/search",
  "/matches",
  "/players",
  "/compare",
  "/corrections",
  "/feedback",
  "/cut",
] as const;

const ROBOTS_DISALLOW_PATHS = [
  "/api/",
  "/dataset/",
  "/search",
  "/matches",
  "/surprise",
  "/compare",
  "/cut",
  "/on-this-day",
  "/dev/",
] as const;

const FEATURED_PLAYER_IDS = new Set(
  CURATED_DEBATES.players.flatMap((debate) => [debate.a, debate.b]),
);

export function sitemapStaticPaths(): string[] {
  return [
    "/",
    "/explore",
    "/stories",
    "/seasons",
    "/managers",
    "/analytics",
    "/transfers",
    "/data",
  ];
}

export function robotsDisallowPaths(): string[] {
  return [...ROBOTS_DISALLOW_PATHS];
}

export function sitemapSeasonIds(): string[] {
  return allSeasons();
}

export function sitemapManagerIds(): string[] {
  return managersIndex().map((manager) => manager.id);
}

export function sitemapPlayerIds(): string[] {
  return playersIndex()
    .filter((player) => FEATURED_PLAYER_IDS.has(player.player_id) || player.apps >= MAJOR_PLAYER_APPS_FLOOR)
    .map((player) => player.player_id);
}

function authoredMatchIds(): string[] {
  return [...CURATED_NIGHTS.map((night) => night.id), ...THREAD_OF_NIGHTS.map((night) => night.id)];
}

function trophyMatchIds(): string[] {
  const cup = getDb()
    .prepare(`SELECT m.id FROM matches m JOIN competitions c ON c.id = m.competition_id WHERE ${CUP_WON_PREDICATE}`)
    .all() as { id: string }[];
  const league = getDb()
    .prepare(
      `SELECT m.id
       FROM matches m
       JOIN competitions c ON c.id = m.competition_id
       JOIN season_summaries ss ON ss.season = m.season AND ss.competition_id = c.id
       WHERE c.type = 'league'
         AND ss.position = 1
         AND c.name IN ('First Division','Premier League')
         AND m.date = (
           SELECT MAX(m2.date) FROM matches m2
           WHERE m2.season = m.season AND m2.competition_id = m.competition_id
         )`,
    )
    .all() as { id: string }[];
  return [...cup.map((row) => row.id), ...league.map((row) => row.id)];
}

export function sitemapMatchIds(): string[] {
  return [...new Set([
    ...authoredMatchIds(),
    ...trophyMatchIds(),
    ...europeanFinals().map((match) => match.id),
  ])];
}
