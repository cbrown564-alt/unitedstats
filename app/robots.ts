import type { MetadataRoute } from "next";
import { robotsDisallowPaths } from "@/lib/discovery";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

/**
 * Cooperative crawlers may follow the authored sitemap. APIs, dataset dumps,
 * search, and other query-shaped tools are disallowed so they are not cheap
 * to enumerate. Hostile crawlers ignore this — Vercel bot rules sit in front.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/"],
      disallow: robotsDisallowPaths(),
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
