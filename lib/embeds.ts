import { embedRef } from "./citations";
import { CURATED_CUTS, curatedCut, runCut } from "./cut";

export const EMBED_FRAME_HEADERS = [
  { key: "Cache-Control", value: "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800" },
  { key: "Content-Security-Policy", value: "frame-ancestors *" },
];

export function cutEmbed(slug: string) {
  const curated = CURATED_CUTS.find((cut) => cut.slug === slug);
  if (!curated) return null;
  const cut = curatedCut(curated);
  const result = runCut(cut, 8);
  return {
    ref: embedRef("cut-card", slug, `/embed/cut/${slug}`),
    curated,
    cut,
    result,
  };
}
