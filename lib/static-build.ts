import { isFullBuild, PREVIEW_STATIC_SAMPLE } from "./build-profile";

/**
 * Evenly sample a stable subset for preview SSG. Full builds return every id.
 *
 * Pages that use this must also set `export const dynamicParams = true` (a Next
 * route-segment literal — it cannot be computed): preview builds prerender only a
 * sample, so non-sampled ids render on demand; full builds prerender every id, so
 * only genuinely missing ids fall through to notFound().
 */
export function sampleStaticIds(ids: readonly string[]): string[] {
  if (isFullBuild() || ids.length <= PREVIEW_STATIC_SAMPLE) return [...ids];
  const step = Math.max(1, Math.floor(ids.length / PREVIEW_STATIC_SAMPLE));
  const out: string[] = [];
  for (let i = 0; i < ids.length && out.length < PREVIEW_STATIC_SAMPLE; i += step) {
    out.push(ids[i]!);
  }
  return out;
}
