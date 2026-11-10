import { CordGlyph } from "@/components/glyphs/cord/CordGlyph";

export type UtilGlyphId = "search" | "home" | "filter" | "close" | "share" | "sewn";

/** Chrome glyphs (search, home, filter, close, share, sewn), drawn in the Cord grammar. */
export function UtilGlyph({ id, size = 18, className }: { id: UtilGlyphId; size?: number; className?: string }) {
  return <CordGlyph id={id} size={size} className={className} />;
}
