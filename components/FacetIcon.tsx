import { Bead, Cord, CordSvg, Plate } from "@/components/glyphs/cord/primitives";

/*
 * Facet glyphs for the match filters, drawn in Cord: a tonal plate for the
 * thing the facet is about, one cord for its gesture. Monochrome in
 * currentColor so they take the row's text tone; quiet scanning aids in the
 * add-filter menu and chips, not decoration.
 */

const TROPHY = (
  <>
    <Plate d="M6.4 3H17.6V8.6A5.6 5.6 0 0 1 6.4 8.6ZM8.6 19H15.4V21.6H8.6Z" strong />
    <Cord d="M6.4 4.8H3.6C3.6 8.8 5.8 11 9 11.6M17.6 4.8H20.4C20.4 8.8 18.2 11 15 11.6M12 14.2V19" />
  </>
);

const GLYPHS: Record<string, React.ReactNode> = {
  // Competition: a shield, its chevron sewn across.
  shield: (
    <>
      <Plate d="M12 2.8L19.6 5.8V11.6C19.6 16.1 16.4 19 12 20.8C7.6 19 4.4 16.1 4.4 11.6V5.8Z" strong />
      <Cord d="M7.6 10.2L12 13.6L16.4 10.2" />
    </>
  ),
  // Manager: the gaffer's head over a suit, lapels in one pull.
  suit: (
    <>
      <Plate d="M12 3A3.3 3.3 0 1 1 11.99 3ZM4.6 21.4C4.6 16.8 7.4 14 11 13.6H13C16.6 14 19.4 16.8 19.4 21.4Z" strong />
      <Cord d="M8.8 14.2L12 18.8L15.2 14.2" />
    </>
  ),
  // Player: a bust, shoulders drawn as the cord.
  person: (
    <>
      <Plate d="M12 3.4A3.6 3.6 0 1 1 11.99 3.4Z" strong />
      <Cord d="M4.8 20.6C4.8 16.4 8 13.8 12 13.8S19.2 16.4 19.2 20.6" />
    </>
  ),
  // Scorer: the target, a ring of thread round a proven bead.
  target: (
    <>
      <Plate d="M12 3.6A8.4 8.4 0 1 1 11.99 3.6Z" />
      <Cord d="M12 7.6A4.4 4.4 0 1 1 11.99 7.6" />
      <Bead kind="thread" cx={12} cy={12} r={1.9} />
    </>
  ),
  // Margin: the goal frame, its net as the plate.
  margin: (
    <>
      <Plate d="M5 6H19V19H5Z" />
      <Cord d="M4.2 19.6V5.2H19.8V19.6" />
    </>
  ),
  arrow: <Cord d="M3.6 12H19.4M14 6.6L19.4 12L14 17.4" />,
  trophy: TROPHY,
  // Round / stage: a tag tied on a thread.
  tag: (
    <>
      <Plate d="M4.6 12.2V5.6A1.6 1.6 0 0 1 6.2 4H12.8L20.2 11.4L12.6 19ZM8.8 7A1.6 1.6 0 1 0 8.81 7Z" strong />
      <Cord d="M8.8 8.6C7.4 11.4 5 13.8 2.6 15" />
    </>
  ),
  // Country / region: a flag on its pole.
  flag: (
    <>
      <Plate d="M6 4.2H18.6L16 8L18.6 11.8H6Z" strong />
      <Cord d="M6 21V3.2" />
    </>
  ),
  // Era: the sand in an hourglass, its frame one cord.
  hourglass: (
    <>
      <Plate d="M8.2 5H15.8C15.8 8.2 12 9.6 12 12C12 9.6 8.2 8.2 8.2 5ZM12 12C12 14.4 15.8 15.8 15.8 19H8.2C8.2 15.8 12 14.4 12 12Z" strong />
      <Cord d="M6.4 3.4H17.6M6.4 20.6H17.6" />
    </>
  ),
  // Venue: home, the roofline over a lit house.
  home: (
    <>
      <Plate d="M6 10.8L12 5.8L18 10.8V20.4H6Z" strong />
      <Cord d="M3 12L12 4.4L21 12" />
    </>
  ),
  // Stadium: the stands round a pitch.
  stadium: (
    <>
      <Plate d="M12 6.2C17.3 6.2 21.2 8.8 21.2 12S17.3 17.8 12 17.8 2.8 15.2 2.8 12 6.7 6.2 12 6.2ZM12 9.6C9.4 9.6 7.6 10.6 7.6 12S9.4 14.4 12 14.4 16.4 13.4 16.4 12 14.6 9.6 12 9.6Z" strong />
      <Cord d="M7.6 12C7.6 10.6 9.4 9.6 12 9.6S16.4 10.6 16.4 12 14.6 14.4 12 14.4 7.6 13.4 7.6 12" />
    </>
  ),
  // City / ground: a pin, the place threaded through.
  pin: (
    <>
      <Plate d="M12 21.6S19.2 15.4 19.2 10A7.2 7.2 0 0 0 4.8 10C4.8 15.4 12 21.6 12 21.6Z" strong />
      <Cord d="M12 7.4A2.6 2.6 0 1 1 11.99 7.4" />
    </>
  ),
  // Date: a calendar page, its rings and rule one cord, a day beaded.
  calendar: (
    <>
      <Plate d="M4 6H20V20.6H4Z" />
      <Cord d="M8 3.2V7.6M16 3.2V7.6M4 10.6H20" />
      <Bead kind="thread" cx={15.2} cy={15.4} r={1.9} />
    </>
  ),
  // Minute: a stopwatch, crown and hand.
  stopwatch: (
    <>
      <Plate d="M12 6.6A7.4 7.4 0 1 1 11.99 6.6Z" />
      <Cord d="M9.4 2.8H14.6M12 2.8V6.6M12 14V9.6" />
    </>
  ),
};

export function FacetIcon({ name, className }: { name?: string; className?: string }) {
  const glyph = name ? GLYPHS[name] : undefined;
  if (!glyph) return <span aria-hidden className={`inline-block h-4 w-4 ${className ?? ""}`} />;
  return (
    <CordSvg size={16} className={["cd-facet", className].filter(Boolean).join(" ")}>
      {glyph}
    </CordSvg>
  );
}
