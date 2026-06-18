/**
 * Shared campaign-outcome glyphs. A won campaign earns a trophy, a runners-up
 * finish a medal — used both in the season page's competition-lane verdict and
 * the {@link CupRun} bracket's terminal node, so the same season reads the same
 * trophy in both places.
 */

/** Trophy glyph for a won campaign. */
export function TrophyIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M4.5 2.5h7v2.2a3.5 3.5 0 0 1-7 0V2.5Z M4.5 3.2H2.8v1a2 2 0 0 0 1.9 2 M11.5 3.2h1.7v1a2 2 0 0 1-1.9 2 M8 8.2v2.3 M5.6 13.5h4.8 M6.4 11.6h3.2l.4 1.9H6l.4-1.9Z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Medal glyph for a runners-up campaign — the near-miss achievement. */
export function MedalIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M5.8 2.5 8 6.2 M10.2 2.5 8 6.2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <circle cx="8" cy="10" r="3.4" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  );
}
