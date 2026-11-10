import { cache } from "react";
import { publishedOpponentIds, sitemapMatchIds, sitemapPlayerIds, sitemapSeasonIds } from "./discovery";
import { recordHref } from "./recordHref";
import { cachedQuery } from "./queryCache";

// Server/build-time only: use the same selected IDs as generateStaticParams.
// Match the existing five-minute reference-query cache as well as deduplicating
// within an RSC render. API exports and scripts run outside React's cache scope;
// they must not rebuild the published set for every link in a list.
const referenceTTL = 300_000;
const seasons = cache(() => cachedQuery("published:seasons", referenceTTL, () => new Set(sitemapSeasonIds())));
const matches = cache(() => cachedQuery("published:matches", referenceTTL, () => new Set(sitemapMatchIds())));
const players = cache(() => cachedQuery("published:players", referenceTTL, () => new Set(sitemapPlayerIds())));
const opponents = cache(() => cachedQuery("published:opponents", referenceTTL, () => new Set(publishedOpponentIds())));

export function seasonHref(season: string): string {
  return seasons().has(season) ? `/seasons/${season}` : `/matches?season=${encodeURIComponent(season)}`;
}

export function matchHref(id: string): string {
  return matches().has(id) ? `/match/${id}` : recordHref("match", id);
}

export function playerHref(id: string): string {
  return players().has(id) ? `/player/${id}` : recordHref("player", id);
}

export function opponentHref(id: string): string {
  return opponents().has(id) ? `/opponent/${id}` : recordHref("opponent", id);
}
