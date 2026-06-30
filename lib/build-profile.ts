export type BuildProfile = "full" | "preview";

/** How many SSG paths to prerender per heavy route in preview builds. */
export const PREVIEW_STATIC_SAMPLE = 24;

/**
 * Full builds prerender ~7,400 entity pages for CDN-fast UX. Preview builds
 * sample a slice so Vercel PR deploys finish in a few minutes while the data
 * layer is stable and only UI is changing.
 *
 * Override with UNITEDSTATS_BUILD_PROFILE=full|preview. On Vercel, preview
 * deployments default to preview; production defaults to full.
 */
export function buildProfile(): BuildProfile {
  const explicit = process.env.UNITEDSTATS_BUILD_PROFILE;
  if (explicit === "full" || explicit === "preview") return explicit;
  if (process.env.VERCEL_ENV === "preview") return "preview";
  return "full";
}

export function isFullBuild(): boolean {
  return buildProfile() === "full";
}

/** When false, only paths from generateStaticParams are served; when true, others SSR on demand. */
export function staticBuildDynamicParams(): boolean {
  return !isFullBuild();
}
