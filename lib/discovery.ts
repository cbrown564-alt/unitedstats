import { CURATED_NIGHTS } from "./curatedNights";
import { getDb } from "./db";
import { THREAD_OF_NIGHTS } from "./journey";
import { CUP_WON_PREDICATE, allSeasons, managersIndex, opponentsIndex, playersIndex } from "./queries";
import { europeanFinals } from "./trails";

/**
 * What is published as a static, indexable page. Every season, manager,
 * player and opponent has one. Matches are still a selected set (authored
 * nights, trophy matches, European finals); the rest open in the record
 * reader. See docs/INDEXABLE-RECORDS-SCOPE.md.
 */

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
  "/_emdash/", // the EmDash admin and its API
  "/live-snapshot/", // deploy-time fallbacks for the live routes
] as const;

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
  return playersIndex().map((player) => player.player_id);
}

export function sitemapOpponentIds(): string[] {
  return opponentsIndex().map((opponent) => opponent.id);
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
