import type { SitemapEntry } from "@/src/rt/endpoints";
import {
  sitemapManagerIds,
  sitemapMatchIds,
  sitemapOpponentIds,
  sitemapPlayerIds,
  sitemapSeasonIds,
  sitemapStaticPaths,
} from "@/lib/discovery";
import { getMeta } from "@/lib/queries";
import { activeQuestionSlugs } from "@/lib/questions";
import { SITE_URL } from "@/lib/site";

/** sitemapXml writes <loc> values verbatim, so ampersands must be XML-escaped. */
function sitemapLoc(path: string): string {
  return `${SITE_URL}${path}`.replaceAll("&", "&amp;");
}

/**
 * Every published static page: the authored front door, plus every season,
 * manager, player and opponent, and the selected set of matches.
 * See `lib/discovery.ts`.
 */
export default function sitemap(): SitemapEntry[] {
  const meta = getMeta();
  const built = meta.built_at ? new Date(meta.built_at) : new Date();
  const lastMatch = meta.last_match ? new Date(meta.last_match) : built;
  const url = sitemapLoc;

  const staticPages: SitemapEntry[] = sitemapStaticPaths().map((path) => ({
    url: url(path),
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1 : path === "/explore" ? 0.9 : 0.5,
    lastModified: path === "/" || path === "/seasons" ? lastMatch : built,
  }));

  const questions: SitemapEntry[] = activeQuestionSlugs().map((slug) => ({
    url: url(`/questions/${slug}`),
    changeFrequency: "weekly",
    priority: 0.8,
    lastModified: built,
  }));

  const seasons: SitemapEntry[] = sitemapSeasonIds().map((season) => ({
    url: url(`/seasons/${season}`),
    changeFrequency: "monthly",
    priority: 0.5,
    lastModified: lastMatch,
  }));

  const players: SitemapEntry[] = sitemapPlayerIds().map((id) => ({
    url: url(`/player/${id}`),
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  const managers: SitemapEntry[] = sitemapManagerIds().map((id) => ({
    url: url(`/manager/${id}`),
    changeFrequency: "monthly",
    priority: 0.4,
  }));

  const opponents: SitemapEntry[] = sitemapOpponentIds().map((id) => ({
    url: url(`/opponent/${id}`),
    changeFrequency: "monthly",
    priority: 0.4,
  }));

  const matches: SitemapEntry[] = sitemapMatchIds().map((id) => ({
    url: url(`/match/${id}`),
    changeFrequency: "yearly",
    priority: 0.4,
  }));

  return [...staticPages, ...questions, ...seasons, ...players, ...managers, ...opponents, ...matches];
}
