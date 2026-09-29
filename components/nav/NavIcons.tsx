import { B, GlyphSvg, P, T, Under } from "@/components/glyphs/primitives";

export type NavIconId =
  | "journey"
  | "discover"
  | "matches"
  | "seasons"
  | "players"
  | "managers"
  | "opponents"
  | "analytics"
  | "transfers"
  | "data"
  | "more";

const WEAVE_X = [4, 8, 12, 16, 20];
const WEAVE_Y = [4.5, 8.25, 12, 15.75, 19.5];
const WARPS = WEAVE_X.map((x) => `M${x} 2.5V21.5`).join("");
const WEFTS = WEAVE_Y.map((y) => `M2.5 ${y}H21.5`).join("");
const WARP_OVER = WEAVE_Y.flatMap((y, i) =>
  WEAVE_X.filter((_, j) => (i + j) % 2).map((x) => `M${x} ${y - 1.9}V${y + 1.9}`),
).join("");

const OPP_OVER = "M2 8C7 8 9 16 12 16C15 16 17 8 22 8";
const OPP_TOP = "M12 8C15 8 17 16 22 16";

/** Section glyphs, drawn in the Red Thread grammar (docs/GLYPHS.md). */
export function NavIcon({ id, className }: { id: NavIconId; className?: string }) {
  return (
    <GlyphSvg className={className}>
      <NavGlyph id={id} />
    </GlyphSvg>
  );
}

function NavGlyph({ id }: { id: NavIconId }) {
  switch (id) {
    // The loop-fold: a story connects a night to its echo.
    case "journey":
      return (
        <>
          <T d="M1.5 12H22.5" />
          <P d="M4 10.5v3" />
          <T d="M8 12C10.2 12 11 6.5 15 6.5C18.4 6.5 20.5 9 20.5 12C20.5 15 18.4 17.5 15 17.5C11 17.5 10.2 12 8 12" />
          <B cx={8} cy={12} r={2} />
        </>
      );
    // The needle's eye: a lens you pull the thread through.
    case "discover":
      return (
        <>
          <P d="M3.5 20.5L15.9 6.3C16.9 5.1 18.7 4.8 19.3 5.5C19.9 6.2 19.4 7.8 18.2 8.5Z" />
          <T d="M17.4 6.8C21.5 8.5 22 12.5 18.5 14C15 15.5 11 13.8 9.5 17C8.7 18.7 9.6 20.4 11.5 21M17.4 6.8C16.6 6 15.8 5.2 14.6 4.4" />
        </>
      );
    // A ticket stub, its perforation sewn in thread.
    case "matches":
      return (
        <>
          <P d="M3 6H14A2 2 0 0 0 18 6H21V18H18A2 2 0 0 0 14 18H3Z" />
          <T st d="M16 8.6V15.4" />
          <P d="M6 10.5H11M6 13.5H9.5" />
        </>
      );
    // A bracketed run of fixtures with one proven moment in it.
    case "seasons":
      return (
        <>
          <P d="M4.5 7V5.5H19.5V7" />
          <T d="M2 13H22" />
          <P d="M4.5 10.5v5M8.25 11.5v3M12 10.5v5M19.5 10.5v5" />
          <B cx={15.75} cy={13} r={2} />
        </>
      );
    // A laced collar, the way shirts were once tied at the neck.
    case "players":
      return (
        <>
          <P d="M8 3.5L3 6.5L4.8 10.5L7 9.6V20.5H17V9.6L19.2 10.5L21 6.5L16 3.5C15 5 13.6 5.8 12 5.8C10.4 5.8 9 5 8 3.5Z" />
          <P d="M12 5.8V10" />
          <T d="M10.7 6.2L13.3 7.3L10.8 8.4L13.2 9.5M12 10C11.4 11.2 10.8 12 10 12.8M12 10C12.6 11.2 13.2 12 14 12.8" />
        </>
      );
    // A spool: each manager holds the thread for an era.
    case "managers":
      return (
        <>
          <rect className="tg-p" x="5" y="3" width="14" height="2.6" rx="1.1" />
          <rect className="tg-p" x="5" y="18.4" width="14" height="2.6" rx="1.1" />
          <T d="M7.5 7.6L16.5 8.4M7.5 10L16.5 10.8M7.5 12.4L16.5 13.2M7.5 14.8L16.5 15.6C19.4 15.9 21 13.6 21.8 10.4" />
        </>
      );
    // A twisted pair: a rivalry is two threads wound together.
    case "opponents":
      return (
        <>
          <Under over={OPP_OVER}>
            <P d="M2 16C7 16 9 8 12 8" />
          </Under>
          <Under over={OPP_TOP} butt>
            <T d={OPP_OVER} />
          </Under>
          <P d={OPP_TOP} />
        </>
      );
    // Elo over its 1500 baseline, the peak beaded.
    case "analytics":
      return (
        <>
          <P dashed d="M2 14H22" />
          <T d="M2 17C5 17 6 11 9 12C12 13 12 6 15 5.5C18 5 18 13 22 11" />
          <B cx={15.2} cy={5.5} r={1.9} />
        </>
      );
    // A splice: one club's thread bound into another's.
    case "transfers":
      return (
        <>
          <P d="M2 14.5C6 14.5 8 12 15 12" />
          <T d="M22 9.5C18 9.5 16 12 9 12" />
          <T d="M10.5 9.8v4.4M12.3 9.8v4.4M14.1 9.8v4.4" />
        </>
      );
    // Warp and weft: the record as woven fabric.
    case "data":
      return (
        <>
          <Under over={WEFTS}>
            <P d={WARPS} />
          </Under>
          <Under over={WARP_OVER} butt>
            <T d={WEFTS} />
          </Under>
          <P butt d={WARP_OVER} />
        </>
      );
    // Three threads, the middle one left slack: more to pull on.
    case "more":
      return (
        <>
          <P d="M4 7H20M4 17H20" />
          <T d="M4 12C7 12 8 10.5 10 10.5S12.5 13.5 14.5 13.5S17 12 20 12" />
        </>
      );
    default: {
      const _exhaustive: never = id;
      return _exhaustive;
    }
  }
}
