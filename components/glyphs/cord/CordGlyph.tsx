import { Bead, Beneath, Cord, CordSvg, Plate, Strand, type CordMotion } from "@/components/glyphs/cord/primitives";
import type { NavIconId } from "@/components/nav/NavIcons";
import type { RecordGlyphId } from "@/components/glyphs/RecordGlyph";
import type { UtilGlyphId } from "@/components/glyphs/UtilGlyph";

/**
 * Cord glyphs: the section, chrome and record icons redrawn in the weighted
 * grammar. Ids match NavIcon, UtilGlyph and RecordGlyph so the set can replace
 * them one import at a time. Each entry names the motion it runs on hover.
 */
export type CordGlyphId = NavIconId | UtilGlyphId | RecordGlyphId;

export const CORD_SECTIONS: NavIconId[] = [
  "journey", "discover", "matches", "seasons", "players", "managers", "opponents", "analytics", "transfers", "data", "more",
];
export const CORD_CHROME: UtilGlyphId[] = ["search", "home", "filter", "close", "share", "sewn"];
export const CORD_RECORD: RecordGlyphId[] = ["darn", "spiral", "tangle", "stitch"];

interface Spec {
  motion?: CordMotion;
  /** What the glyph depicts, for the specimen. */
  says: string;
  draw: () => React.ReactNode;
}

const OPP_CORD = "M9 5.5A6.5 6.5 0 1 0 9.01 5.5";

export const CORD_SPECS: Record<CordGlyphId, Spec> = {
  // ---------------------------------------------------------------- sections
  journey: {
    says: "A night under the floodlights, and the thread that loops back to it.",
    draw: () => (
      <>
        <Plate d="M15.5 4.5A6.5 6.5 0 1 1 15.49 4.5Z" />
        <Cord d="M2.5 19C7 19 8.6 15.6 10.6 12.4C12.6 9.2 16.4 7.4 18.4 9.8C20.4 12.2 17.4 15.6 14.8 14.1C12.4 12.7 14.6 8.2 21.5 5.5" />
        <Bead cx={2.5} cy={19} r={2.1} />
      </>
    ),
  },
  discover: {
    motion: "run",
    says: "A needle: pull the thread through and see where it goes.",
    draw: () => (
      <>
        <Plate d="M3.2 21L15.4 6.1C16.7 4.5 19.1 4.1 19.9 5.1C20.7 6.1 20 8.3 18.3 9.3ZM17.1 6.7A.9.9 0 1 0 17.11 6.7Z" strong />
        <Cord d="M17.2 7.3C21.6 9.3 21.3 13.4 17.6 14.4C13.9 15.4 10.6 13.8 9.6 16.7C8.9 18.9 10.6 20.6 13.4 20.6" />
      </>
    ),
  },
  matches: {
    says: "A ticket stub, its tear-line sewn.",
    draw: () => (
      <>
        <Plate d="M2.5 5.5H13.6A2.4 2.4 0 0 0 18.4 5.5H21.5V18.5H18.4A2.4 2.4 0 0 0 13.6 18.5H2.5Z" strong />
        <Cord d="M16 3.5V7.4L17.6 9L14.4 10.6L17.6 12.2L14.4 13.8L17.6 15.4L16 17V20.5" />
        <Strand d="M5.6 10.4H10.4M5.6 13.6H8.8" />
      </>
    ),
  },
  seasons: {
    says: "One lap of the calendar, finished on a proven bead.",
    draw: () => (
      <>
        <Plate d="M12 6.5A5.5 5.5 0 1 1 11.99 6.5Z" />
        <Cord d="M12 21A9 9 0 1 1 20.4 15.3" />
        <Bead cx={20.4} cy={15.3} r={2.2} />
      </>
    ),
  },
  players: {
    says: "A shirt, its collar drawn in one pull.",
    draw: () => (
      <>
        <Plate d="M8 3.4L2.6 6.6L4.7 11L7 10V21H17V10L19.3 11L21.4 6.6L16 3.4C15 5.3 13.6 6.6 12 6.6C10.4 6.6 9 5.3 8 3.4Z" strong />
        <Cord d="M8 3.4C9 6.4 10.4 8.8 12 8.8C13.6 8.8 15 6.4 16 3.4" />
      </>
    ),
  },
  managers: {
    says: "A spool: each manager holds the thread for an era.",
    draw: () => (
      <>
        <Plate d="M4.5 2.8H19.5V5.6H4.5ZM4.5 18.4H19.5V21.2H4.5Z" strong />
        <Plate d="M7 5.6H17V18.4H7Z" />
        <Cord d="M7.4 7.6L16.6 9.2L7.4 10.8L16.6 12.4L7.4 14L16.6 15.6C19.6 16 21.2 13.6 22 10.6" />
      </>
    ),
  },
  opponents: {
    says: "Two records that overlap: the shared history is where they meet.",
    draw: () => (
      <>
        <Plate d="M15 5.5A6.5 6.5 0 1 1 14.99 5.5Z" strong />
        <Cord d={OPP_CORD} />
        <Bead kind="thread" cx={12} cy={6.23} r={1.8} />
        <Bead kind="thread" cx={12} cy={17.77} r={1.8} i={1} />
      </>
    ),
  },
  analytics: {
    says: "Elo over its 1500 line, the ground under it filled, the peak proven.",
    draw: () => (
      <>
        <Plate d="M2 17C5 17 6 11 9 12C12 13 12 6 15 5.5C18 5 18 13 22 11V21H2Z" />
        <Strand d="M2 14H22" dashed />
        <Cord d="M2 17C5 17 6 11 9 12C12 13 12 6 15 5.5C18 5 18 13 22 11" />
        <Bead cx={15.1} cy={5.5} r={2.1} />
      </>
    ),
  },
  transfers: {
    says: "A splice: one club's thread bound into another's.",
    draw: () => (
      <>
        <Strand d="M1.8 16C5.6 16 7.6 12 12 12" />
        <Cord d="M22.2 8C18.4 8 16.4 12 12 12" />
        <Plate d="M9.2 9H14.8A3 3 0 0 1 14.8 15H9.2A3 3 0 0 1 9.2 9Z" strong />
      </>
    ),
  },
  data: {
    says: "Warp and weft: one thread woven back and forth through the record.",
    draw: () => (
      <>
        <Plate d="M5.2 2.5H7.6V21.5H5.2ZM10.8 2.5H13.2V21.5H10.8ZM16.4 2.5H18.8V21.5H16.4Z" strong />
        <Cord d="M2.5 5.5H18.5C21 5.5 21 10 18.5 10H5.5C3 10 3 14.5 5.5 14.5H18.5C21 14.5 21 19 18.5 19H2.5" />
      </>
    ),
  },
  more: {
    motion: "pull",
    says: "Slack in the middle thread: there is more to pull on.",
    draw: () => (
      <>
        <Strand d="M4 6.5H20M4 17.5H20" />
        <Cord
          d="M4 12C7 12 8 9 10 9S12.6 15 14.6 15S17 12 20 12"
          pull="M4 12C7 12 8 12 10 12S12.6 12 14.6 12S17 12 20 12"
        />
      </>
    ),
  },

  // ------------------------------------------------------------------ chrome
  search: {
    motion: "run",
    says: "The lens is a loop of thread; the handle is its tail.",
    draw: () => (
      <>
        <Plate d="M10.3 4.6A5.7 5.7 0 1 1 10.29 4.6Z" />
        <Cord d="M21 21L14.6 14.6A6.3 6.3 0 1 1 14.61 14.59" />
      </>
    ),
  },
  home: {
    says: "The front door: a roofline over the lit house.",
    draw: () => (
      <>
        <Plate d="M5.5 10.6L12 5.2L18.5 10.6V21H5.5Z" strong />
        <Cord d="M2.5 12L12 4L21.5 12" />
        <Bead cx={12} cy={15.6} r={2} />
      </>
    ),
  },
  filter: {
    motion: "slide",
    says: "An abacus: beads slid along their strings.",
    draw: () => (
      <>
        <Strand d="M3 6H21M3 12H21M3 18H21" />
        <Bead kind="thread" cx={15} cy={6} r={2.5} dx={-4} />
        <Bead kind="thread" cx={8} cy={12} r={2.5} dx={6} i={1} />
        <Bead kind="thread" cx={17} cy={18} r={2.5} dx={-7} i={2} />
      </>
    ),
  },
  close: {
    motion: "unravel",
    says: "An X woven over and under; dismissing pulls the thread out.",
    draw: () => (
      <>
        <Beneath over="M5.5 5.5L18.5 18.5">
          <Strand d="M5.5 18.5L18.5 5.5" />
        </Beneath>
        <Cord d="M5.5 5.5L18.5 18.5" />
      </>
    ),
  },
  share: {
    motion: "run",
    says: "One thread, three beads: it leaves here and arrives twice.",
    draw: () => (
      <>
        <Cord d="M18 4.8C12 4.8 10 9 6 12C10 15 12 19.2 18 19.2" />
        <Bead kind="thread" cx={6} cy={12} r={2.7} />
        <Bead kind="pale" cx={18} cy={4.8} r={2.3} i={1} />
        <Bead kind="pale" cx={18} cy={19.2} r={2.3} i={2} />
      </>
    ),
  },
  sewn: {
    motion: "knot",
    says: "Done: a tick sewn in one pass and knotted off.",
    draw: () => (
      <>
        <Cord d="M4 12.6L9.4 18L20 6.4" />
        <circle className="cd-ripple" cx={20} cy={6.4} r={2.2} />
        <Bead kind="thread" cx={20} cy={6.4} r={2.2} />
      </>
    ),
  },

  // ------------------------------------------------------------------ record
  darn: {
    says: "A tear in the record, cross-stitched shut.",
    draw: () => (
      <>
        <Plate d="M2.5 11.2L6.5 9.6L9.6 12.4L12.6 9.4L15.6 12.4L18.4 10L21.5 11.4V13.2L18.4 11.8L15.6 14.4L12.6 11.4L9.6 14.4L6.5 11.6L2.5 13Z" strong />
        <Cord d="M5 8L7.2 16L9.4 8L11.6 16L13.8 8L16 16L18.2 8" />
      </>
    ),
  },
  spiral: {
    motion: "run",
    says: "Same date, one turn further out each year.",
    draw: () => (
      <>
        <Plate d="M12 9.2A3.3 3.3 0 1 1 11.99 9.2Z" />
        <Cord d="M12 11A1.5 1.5 0 0 1 12 14A3 3 0 0 1 12 8A4.6 4.6 0 0 1 12 17.2A6.4 6.4 0 0 1 12 4.4" />
        <Bead kind="pale" cx={12} cy={11} r={1.3} />
        <Bead cx={12} cy={4.4} r={2.2} i={1} />
      </>
    ),
  },
  tangle: {
    motion: "run",
    says: "A tangle with one bead at the end to pull.",
    draw: () => (
      <>
        <Cord d="M2.5 20.5C6 20.5 7 16 9 13.5C11.5 10.5 17 9 16 5.8C15 3 10 4.2 10.3 7.8C10.6 11.4 17.5 12.5 18.2 16.2C18.9 19.8 13.8 20.8 12.6 17.8C11.6 15.4 14.5 12.6 20.8 11.8" />
        <Bead cx={20.8} cy={11.8} r={2.2} />
      </>
    ),
  },
  stitch: {
    says: "Sewn where the record holds, open where it does not.",
    draw: () => (
      <>
        <Plate d="M2.5 9.5H12V14.5H2.5Z" />
        <Cord d="M2.5 12H12" />
        <Cord d="M14 12H21.5" dashed />
        <Bead kind="thread" cx={12} cy={12} r={1.9} />
      </>
    ),
  },
};

export function CordGlyph({
  id,
  size = 20,
  className,
  label,
}: {
  id: CordGlyphId;
  size?: number;
  className?: string;
  label?: string;
}) {
  const spec = CORD_SPECS[id];
  return (
    <CordSvg size={size} className={className} motion={spec.motion} label={label}>
      {spec.draw()}
    </CordSvg>
  );
}
