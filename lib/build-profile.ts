export type BuildProfile = "full" | "preview";

/** How many SSG paths to prerender per heavy route in preview builds. */
export const PREVIEW_STATIC_SAMPLE = 24;

/**
 * Full builds prerender ~7,400 entity pages for CDN-fast UX. Preview builds
 * sample a slice so UI iteration builds finish in a few minutes while the data
 * layer is stable.
 *
 * Select with UNITEDSTATS_BUILD_PROFILE=full|preview; anything else is full.
 */
export function buildProfile(): BuildProfile {
  const explicit = process.env.UNITEDSTATS_BUILD_PROFILE;
  if (explicit === "full" || explicit === "preview") return explicit;
  return "full";
}

export function isFullBuild(): boolean {
  return buildProfile() === "full";
}
