import type { MetadataRoute } from "next";
import {
  API_V1_META_URL,
  DATA_BULK_ACCESS_PATH,
  DATASET_MANIFEST_URL,
  GITHUB_CANONICAL_DATA_URL,
} from "./bulkAccess";
import { SITE_URL } from "./site";

const RULES = {
  userAgent: "*",
  allow: ["/", "/api/v1/", "/dataset/"],
  disallow: ["/api/search/click"],
};

/** Structured robots policy — used by the /robots.txt route and tests. */
export function robotsPolicy(): MetadataRoute.Robots {
  return {
    rules: RULES,
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

/**
 * Full robots.txt body with crawler hints for bulk data. HTML pages stay
 * indexable for fans and search; machines should prefer flat files, the API,
 * or canonical JSON on GitHub instead of walking every match page.
 */
export function robotsTxt(): string {
  const { sitemap, host } = robotsPolicy();

  return [
    "# Red Thread (unitedstats) — bulk data access",
    `# Flat dataset manifest: ${DATASET_MANIFEST_URL}`,
    `# Read-only JSON API: ${API_V1_META_URL}`,
    `# Canonical JSON (git source of truth): ${GITHUB_CANONICAL_DATA_URL}`,
    `# Coverage ledger and download links: ${SITE_URL}${DATA_BULK_ACCESS_PATH}`,
    "# Prefer those endpoints over crawling HTML match/player pages.",
    "",
    `User-agent: ${RULES.userAgent}`,
    ...RULES.allow.map((path) => `Allow: ${path}`),
    ...RULES.disallow.map((path) => `Disallow: ${path}`),
    "",
    `Sitemap: ${sitemap}`,
    host ? `Host: ${host}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
