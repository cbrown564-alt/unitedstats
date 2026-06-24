// Small monochrome glyphs for the filter facets — single-weight strokes in
// currentColor, so they inherit the row's text tone. Kept deliberately quiet:
// these are scanning aids in the add-filter menu, not decoration.

const PATHS: Record<string, React.ReactNode> = {
  shield: <path d="M8 2.5l4.5 1.8v3.7c0 2.8-1.9 4.6-4.5 5.5-2.6-.9-4.5-2.7-4.5-5.5V4.3L8 2.5z" />,
  clipboard: (
    <>
      <rect x="3.5" y="3.5" width="9" height="10" rx="1.2" />
      <path d="M6 3.5V2.9a.8.8 0 0 1 .8-.8h2.4a.8.8 0 0 1 .8.8v.6M6 7h4M6 9.6h4" />
    </>
  ),
  person: (
    <>
      <circle cx="8" cy="5.5" r="2.2" />
      <path d="M3.8 13c0-2.3 1.9-3.9 4.2-3.9s4.2 1.6 4.2 3.9" />
    </>
  ),
  target: (
    <>
      <circle cx="8" cy="8" r="5.2" />
      <circle cx="8" cy="8" r="2.2" />
      <circle cx="8" cy="8" r="0.5" fill="currentColor" stroke="none" />
    </>
  ),
  arrow: <path d="M3 8h9M8.4 4.4 12 8l-3.6 3.6" />,
  trophy: (
    <>
      <path d="M5 3h6v3.2a3 3 0 0 1-6 0V3z" />
      <path d="M5 4H3.3v1.1A2 2 0 0 0 5 7M11 4h1.7v1.1A2 2 0 0 1 11 7M8 9.2v2M6 13h4M7 11h2" />
    </>
  ),
  tag: (
    <>
      <path d="M3.2 8.3V4.4a1 1 0 0 1 1-1h3.9l5 5L8.3 13.2l-5-5z" />
      <circle cx="6" cy="6.2" r="0.8" />
    </>
  ),
  flag: <path d="M4 2.6v10.8M4 3.3h7l-1.4 2.2L11 7.7H4" />,
  hourglass: <path d="M5 3h6M5 13h6M5 3c0 2.5 3 3.4 3 5 0-1.6 3-2.5 3-5M5 13c0-2.5 3-3.4 3-5 0 1.6 3 2.5 3 5" />,
  home: <path d="M3.5 7.5 8 3.5l4.5 4M4.6 7v6h6.8V7" />,
  stadium: (
    <>
      <ellipse cx="8" cy="8" rx="5.5" ry="3" />
      <ellipse cx="8" cy="8" rx="2.3" ry="1.2" />
    </>
  ),
  pin: (
    <>
      <path d="M8 13.5s4-3.6 4-6.5a4 4 0 0 0-8 0c0 2.9 4 6.5 4 6.5z" />
      <circle cx="8" cy="7" r="1.4" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="3.6" width="10" height="9.4" rx="1.2" />
      <path d="M3 6.3h10M6 2.6v2M10 2.6v2" />
    </>
  ),
  stopwatch: (
    <>
      <circle cx="8" cy="9" r="4.4" />
      <path d="M8 9V6.4M6.6 2.8h2.8M8 2.8v1.8" />
    </>
  ),
};

export function FacetIcon({ name, className }: { name?: string; className?: string }) {
  const glyph = name ? PATHS[name] : undefined;
  if (!glyph) return <span aria-hidden className={`inline-block h-4 w-4 ${className ?? ""}`} />;
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {glyph}
    </svg>
  );
}
