import type { CSSProperties } from "react";
import { Cord, CordSvg, Plate } from "@/components/glyphs/cord/primitives";

/**
 * Shared campaign-outcome glyphs, drawn in Cord. A won campaign earns a
 * trophy, a runners-up finish a medal: used in the season page's competition
 * lanes, the CupRun bracket, honours badges, tables and cabinets, so the same
 * season reads the same trophy everywhere. Monochrome in currentColor: the
 * caller's text colour (gold, silver, a competition tone) tints cup and cord.
 */

const CUP = "M6.4 3H17.6V8.6A5.6 5.6 0 0 1 6.4 8.6Z";
const BASE = "M8.6 19H15.4V21.6H8.6Z";
const HANDLES = "M6.4 4.8H3.6C3.6 8.8 5.8 11 9 11.6M17.6 4.8H20.4C20.4 8.8 18.2 11 15 11.6M12 14.2V19";

/** Trophy for a won campaign: a solid cup, its handles and stem one cord. */
export function TrophyIcon({ className = "" }: { className?: string }) {
  return (
    <CordSvg size={14} className={`cd-solid ${className}`}>
      <Plate d={CUP} strong />
      <Plate d={BASE} strong />
      <Cord d={HANDLES} />
    </CordSvg>
  );
}

/** Medal for a runners-up campaign: the near miss, hung from its ribbon. */
export function MedalIcon({ className = "" }: { className?: string }) {
  return (
    <CordSvg size={13} className={`cd-solid ${className}`}>
      <Plate d="M12 10A5.6 5.6 0 1 1 11.99 10ZM12 13A2.6 2.6 0 1 0 12.01 13Z" strong />
      <Cord d="M6.6 2.6L12 10L17.4 2.6" />
    </CordSvg>
  );
}

/** Filled trophy for cabinet walls (manager detail, compare): the cup at full tone. */
export function TrophyGlyphFilled({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <CordSvg size={16} className={`cd-cabinet ${className}`} style={style}>
      <Plate d={CUP} />
      <Plate d={BASE} />
      <Cord d={HANDLES} />
    </CordSvg>
  );
}

/** Competition-category colours for trophy cabinet glyphs. */
export const TROPHY_CAT_TONE: Record<string, string> = {
  league: "var(--color-gold)",
  european: "var(--color-europe)",
  "domestic-cup": "var(--color-silver)",
  "league-cup": "var(--color-devil-bright)",
  "super-cup": "var(--color-ink-dim)",
  world: "var(--color-win)",
};
