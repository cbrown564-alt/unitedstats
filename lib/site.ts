/**
 * Canonical origin and site identity for absolute URLs — sitemap, robots, OG
 * cards, canonical tags, and citations all resolve through here so they never
 * disagree.
 *
 * An explicit `NEXT_PUBLIC_SITE_URL` wins (local previews, alternate hosts);
 * otherwise every build points at the production domain.
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  return "https://utdred.com";
}

export const SITE_URL = resolveSiteUrl();
export const SITE_TAGLINE = "United history, evidenced — every match since 1886";
