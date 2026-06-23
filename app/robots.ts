import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Everything is public and crawlable; the only disallow is the click-tracking
 * API, which is a side-effect endpoint rather than content. Points crawlers at
 * the sitemap so the corpus is discovered as a set.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/api/v1/"],
      disallow: ["/api/search/click"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
