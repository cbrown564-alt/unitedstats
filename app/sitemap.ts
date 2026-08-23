import type { MetadataRoute } from "next";
import {
  sitemapManagerIds,
  sitemapMatchIds,
  sitemapPlayerIds,
  sitemapSeasonIds,
  sitemapStaticPaths,
} from "@/lib/discovery";
import { getMeta } from "@/lib/queries";
import { activeQuestionSlugs } from "@/lib/questions";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

/** Next.js writes sitemap <loc> values verbatim — ampersands must be XML-escaped. */
function sitemapLoc(path: string): string {
  return `${SITE_URL}${path}`.replaceAll("&", "&amp;");
}

/**
 * Authored and spine URLs only. The full archive stays routable through
 * internal links; crawlers are not invited to enumerate every receipt.
 * See `lib/discovery.ts` and `docs/VERCEL-HOBBY-ASSESSMENT.md` Move 6.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const meta = getMeta();
  const built = meta.built_at ? new Date(meta.built_at) : new Date();
  const lastMatch = meta.last_match ? new Date(meta.last_match) : built;
  const url = sitemapLoc;

  const staticPages: MetadataRoute.Sitemap = sitemapStaticPaths().map((path) => ({
    url: url(path),
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1 : path === "/explore" ? 0.9 : 0.5,
    lastModified: path === "/" || path === "/seasons" ? lastMatch : built,
  }));

  const questions: MetadataRoute.Sitemap = activeQuestionSlugs().map((slug) => ({
    url: url(`/questions/${slug}`),
    changeFrequency: "weekly",
    priority: 0.8,
    lastModified: built,
  }));

  const seasons: MetadataRoute.Sitemap = sitemapSeasonIds().map((season) => ({
    url: url(`/seasons/${season}`),
    changeFrequency: "monthly",
    priority: 0.5,
    lastModified: lastMatch,
  }));

  const players: MetadataRoute.Sitemap = sitemapPlayerIds().map((id) => ({
    url: url(`/player/${id}`),
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  const managers: MetadataRoute.Sitemap = sitemapManagerIds().map((id) => ({
    url: url(`/manager/${id}`),
    changeFrequency: "monthly",
    priority: 0.4,
  }));

  const matches: MetadataRoute.Sitemap = sitemapMatchIds().map((id) => ({
    url: url(`/match/${id}`),
    changeFrequency: "yearly",
    priority: 0.4,
  }));

  return [...staticPages, ...questions, ...seasons, ...players, ...managers, ...matches];
}
