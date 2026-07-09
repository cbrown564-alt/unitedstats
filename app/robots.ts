import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Everything is public and crawlable; the only disallow is the click-tracking
 * API, which is a side-effect endpoint rather than content. Static dataset
 * exports under /dataset/ and /llms.txt are intentionally open — no extra rule
 * needed beyond the site-wide allow. Points crawlers at the sitemap so the
 * corpus is discovered as a set.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/api/v1/", "/dataset/"],
      disallow: ["/api/search/click", "/dev/", "/api/dev/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
