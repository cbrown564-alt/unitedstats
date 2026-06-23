import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { questionSlugs } from "@/lib/questions";
import {
  allMatchIds, allSeasons, getMeta, managersIndex, opponentsIndex, playersIndex,
} from "@/lib/queries";

/**
 * The whole corpus as one crawlable set. Detail pages are statically generated
 * and individually addressable, but without a sitemap a crawler only reaches
 * them by following internal links; this lists every canonical URL directly.
 *
 * Well under Google's 50,000-URL ceiling (~13k), so a single sitemap suffices —
 * split with `generateSitemaps` if the record ever outgrows it.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const meta = getMeta();
  const built = meta.built_at ? new Date(meta.built_at) : new Date();
  const lastMatch = meta.last_match ? new Date(meta.last_match) : built;
  const url = (path: string) => `${SITE_URL}${path}`;

  const staticPages: MetadataRoute.Sitemap = [
    { url: url("/"), changeFrequency: "daily", priority: 1, lastModified: lastMatch },
    { url: url("/questions"), changeFrequency: "weekly", priority: 0.9, lastModified: built },
    { url: url("/explore"), changeFrequency: "weekly", priority: 0.8, lastModified: built },
    { url: url("/matches"), changeFrequency: "daily", priority: 0.7, lastModified: lastMatch },
    { url: url("/seasons"), changeFrequency: "weekly", priority: 0.6, lastModified: lastMatch },
    { url: url("/players"), changeFrequency: "weekly", priority: 0.6, lastModified: built },
    { url: url("/managers"), changeFrequency: "monthly", priority: 0.5, lastModified: built },
    { url: url("/opponents"), changeFrequency: "weekly", priority: 0.6, lastModified: built },
    { url: url("/analytics"), changeFrequency: "weekly", priority: 0.5, lastModified: built },
    { url: url("/compare"), changeFrequency: "monthly", priority: 0.5, lastModified: built },
    { url: url("/transfers"), changeFrequency: "monthly", priority: 0.4, lastModified: built },
    { url: url("/search"), changeFrequency: "monthly", priority: 0.3, lastModified: built },
    { url: url("/data"), changeFrequency: "monthly", priority: 0.4, lastModified: built },
  ];

  const questions: MetadataRoute.Sitemap = questionSlugs().map((slug) => ({
    url: url(`/questions/${slug}`),
    changeFrequency: "weekly",
    priority: 0.8,
    lastModified: built,
  }));

  const seasons: MetadataRoute.Sitemap = allSeasons().map((season) => ({
    url: url(`/seasons/${season}`),
    changeFrequency: "monthly",
    priority: 0.5,
    lastModified: lastMatch,
  }));

  const players: MetadataRoute.Sitemap = playersIndex().map((p) => ({
    url: url(`/player/${p.player_id}`),
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  const managers: MetadataRoute.Sitemap = managersIndex().map((m) => ({
    url: url(`/manager/${m.id}`),
    changeFrequency: "monthly",
    priority: 0.4,
  }));

  const opponents: MetadataRoute.Sitemap = opponentsIndex().map((o) => ({
    url: url(`/opponent/${o.id}`),
    changeFrequency: "monthly",
    priority: 0.4,
  }));

  const matches: MetadataRoute.Sitemap = allMatchIds().map((id) => ({
    url: url(`/match/${id}`),
    changeFrequency: "yearly",
    priority: 0.3,
  }));

  return [
    ...staticPages, ...questions, ...seasons,
    ...players, ...managers, ...opponents, ...matches,
  ];
}
