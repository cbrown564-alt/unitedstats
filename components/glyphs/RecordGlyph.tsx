import { CordGlyph } from "@/components/glyphs/cord/CordGlyph";
import { GlyphSvg, P, T, Under } from "@/components/glyphs/primitives";

export type RecordGlyphId = "darn" | "spiral" | "tangle" | "stitch";

/** Glyphs about the record itself (mending it, returning to it, pulling on it), drawn in the Cord grammar. */
export function RecordGlyph({ id, size = 16, className }: { id: RecordGlyphId; size?: number; className?: string }) {
  return <CordGlyph id={id} size={size} className={className} />;
}

const WEAVE_X = [5, 9.5, 14.5, 19];
const WEAVE_Y = [5, 9.7, 14.3, 19];

/**
 * Coverage as fabric: rows are woven in proportion to covered / total, the
 * last row stitched part-way. Four warps keep it legible at text size.
 */
export function CoverageWeave({ fraction, size = 14, className }: { fraction: number; size?: number; className?: string }) {
  const f = Math.min(1, Math.max(0, fraction));
  const rows = WEAVE_Y.length;
  const full = Math.floor(f * rows + 1e-6);
  const rem = f * rows - full;
  const woven = WEAVE_Y.slice(0, full);
  const warps = WEAVE_X.map((x) => `M${x} 2.5V21.5`).join("");
  const wefts = woven.map((y) => `M2.5 ${y}H21.5`).join("");
  const over = woven
    .flatMap((y, i) => WEAVE_X.filter((_, j) => (i + j) % 2).map((x) => `M${x} ${y - 2.1}V${y + 2.1}`))
    .join("");
  const partialY = WEAVE_Y[full];

  return (
    <GlyphSvg size={size} className={["tg-weave", className].filter(Boolean).join(" ")}>
      {wefts ? (
        <>
          <Under over={wefts}>
            <P d={warps} />
          </Under>
          <Under over={over} butt>
            <T d={wefts} />
          </Under>
          <P butt d={over} />
        </>
      ) : (
        <P d={warps} />
      )}
      {rem > 0.02 && partialY !== undefined && <T st d={`M2.5 ${partialY}H${(2.5 + 19 * rem).toFixed(2)}`} />}
    </GlyphSvg>
  );
}
