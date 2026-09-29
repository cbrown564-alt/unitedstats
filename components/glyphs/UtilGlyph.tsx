import { B, GlyphSvg, P, T, Under } from "@/components/glyphs/primitives";

export type UtilGlyphId = "search" | "home" | "filter" | "close";

/** Chrome glyphs (search, home, filter, close) in the thread grammar. */
export function UtilGlyph({ id, size = 18, className }: { id: UtilGlyphId; size?: number; className?: string }) {
  return (
    <GlyphSvg size={size} className={className}>
      <UtilPaths id={id} />
    </GlyphSvg>
  );
}

const CLOSE_OVER = "M6 6L18 18";

function UtilPaths({ id }: { id: UtilGlyphId }) {
  switch (id) {
    // The lens is a loop of thread; the handle is its tail.
    case "search":
      return (
        <>
          <T d="M20.5 20.5L14.4 14.4A6.22 6.22 0 1 1 14.41 14.39" />
          <B cx={14.4} cy={14.4} r={1.7} />
        </>
      );
    // The front door: a roofline in thread over the pale record.
    case "home":
      return (
        <>
          <P d="M6 10V20H18V10" />
          <T d="M3 11.5L12 4L21 11.5" />
          <B cx={12} cy={15} r={1.9} />
        </>
      );
    // An abacus: beads slid along strings.
    case "filter":
      return (
        <>
          <P d="M3 6.5H21M3 12H21M3 17.5H21" />
          <B kind="br" cx={15} cy={6.5} r={2.1} />
          <B kind="br" cx={8} cy={12} r={2.1} />
          <B kind="br" cx={17} cy={17.5} r={2.1} />
        </>
      );
    // An X woven over and under.
    case "close":
      return (
        <>
          <Under over={CLOSE_OVER}>
            <P d="M6 18L18 6" />
          </Under>
          <T d={CLOSE_OVER} />
        </>
      );
    default: {
      const _exhaustive: never = id;
      return _exhaustive;
    }
  }
}
