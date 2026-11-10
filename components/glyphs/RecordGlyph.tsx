import { CordGlyph } from "@/components/glyphs/cord/CordGlyph";

export type RecordGlyphId = "darn" | "spiral" | "tangle" | "stitch";

/** Glyphs about the record itself (mending it, returning to it, pulling on it), drawn in the Cord grammar. */
export function RecordGlyph({ id, size = 16, className }: { id: RecordGlyphId; size?: number; className?: string }) {
  return <CordGlyph id={id} size={size} className={className} />;
}
