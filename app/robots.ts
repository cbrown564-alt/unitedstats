import type { Robots } from "@/src/rt/endpoints";
import { robotsDisallowPaths } from "@/lib/discovery";
import { SITE_URL } from "@/lib/site";

/**
 * Cooperative crawlers may follow the authored sitemap. APIs, dataset dumps,
 * search, and other query-shaped tools are disallowed so they are not cheap
 * to enumerate. Hostile crawlers ignore this; only Cloudflare edge protections apply to them.
 */
export default function robots(): Robots {
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
