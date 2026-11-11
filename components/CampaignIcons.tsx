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

/** Trophy for a won campaign: a solid cup, its handles and stem one cord. A CSS
 * mask over currentColor (globals.css `.cd-mask--trophy`), so it costs one node. */
export function TrophyIcon({ className = "" }: { className?: string }) {
  return <span aria-hidden className={`cd-mask cd-mask--trophy ${className}`} />;
}

/** Medal for a runners-up campaign: the near miss, hung from its ribbon. */
export function MedalIcon({ className = "" }: { className?: string }) {
  return <span aria-hidden className={`cd-mask cd-mask--medal ${className}`} />;
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
