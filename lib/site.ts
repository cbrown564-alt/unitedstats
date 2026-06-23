/**
 * Canonical origin and site identity for absolute URLs — sitemap, robots, OG
 * cards, canonical tags, and citations all resolve through here so they never
 * disagree.
 *
 * Resolution order: an explicit `NEXT_PUBLIC_SITE_URL`, then the Vercel
 * production domain at build time, then a hardcoded fallback. Set
 * `NEXT_PUBLIC_SITE_URL` in the deployment env to pin the real domain.
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  return "https://unitedstats.vercel.app";
}

export const SITE_URL = resolveSiteUrl();
export const SITE_TAGLINE = "The open history of Manchester United";
