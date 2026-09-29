import { B, GlyphSvg, P, T, Under } from "@/components/glyphs/primitives";

export type RecordGlyphId = "darn" | "spiral" | "tangle" | "stitch";

/** Glyphs about the record itself: mending it, returning to it, pulling on it. */
export function RecordGlyph({ id, size = 16, className }: { id: RecordGlyphId; size?: number; className?: string }) {
  return (
    <GlyphSvg size={size} className={className}>
      <RecordPaths id={id} />
    </GlyphSvg>
  );
}

function RecordPaths({ id }: { id: RecordGlyphId }) {
  switch (id) {
    // A darn: a tear in the record, stitched shut.
    case "darn":
      return (
        <>
          <P d="M3 13L6.5 10.5L9.5 13.5L12.5 10L15.5 13.5L18 11L21 12.5" />
          <T d="M5 8.5L6.8 15.5M8.8 8.5L10.6 15.5M12.6 8.5L14.4 15.5M16.4 8.5L18.2 15.5" />
        </>
      );
    // Same date, a turn apart each year.
    case "spiral":
      return (
        <>
          <T d="M12 11.5A2 2 0 0 1 12 15.5A3.5 3.5 0 0 1 12 8.5A5 5 0 0 1 12 18.5A6.5 6.5 0 0 1 12 5.5" />
          <B kind="bp" cx={12} cy={11.5} r={1.2} />
          <B cx={12} cy={8.5} r={1.5} />
          <B cx={12} cy={5.5} r={1.9} />
        </>
      );
    // A tangle with one bead at the end to pull.
    case "tangle":
      return (
        <>
          <T d="M3 20C6 20 7 16 9 13.5C11.5 10.5 17 9 16 5.8C15 3 10 4.2 10.3 7.8C10.6 11.4 17.5 12.5 18.2 16.2C18.9 19.8 13.8 20.8 12.6 17.8C11.6 15.4 14.5 12.6 20.5 11.8" />
          <B cx={20.5} cy={11.8} r={1.9} />
        </>
      );
    // Partial coverage: still being sewn between two complete rules.
    case "stitch":
      return (
        <>
          <P d="M2 7.5H22M2 16.5H22" />
          <T st d="M3 12H21" />
        </>
      );
    default: {
      const _exhaustive: never = id;
      return _exhaustive;
    }
  }
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
