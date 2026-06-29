/**
 * Shared, DB-free vocabulary for the rediscovery reveal's "your era" mechanic.
 *
 * Kept apart from `lib/rediscovery.ts` (which imports the SQLite driver) so the
 * client island can import the era options and the serialized pick shape without
 * dragging `better-sqlite3` into the browser bundle.
 *
 * The "your era" knob (CONTEXT.md §6 / RESTRAINT-PASS Phase 3a) is the reminiscence
 * bump made concrete: a reader recalls their *formative* years most vividly, so each
 * option is a window — the decade you started watching, plus the years that bedded
 * in — not an open "since X onward" range. The window, not a bias, is what makes the
 * reveal lean into the early-years nights that have aged into the right bittersweet.
 */

export interface EraOption {
  /** Stable key, also the value persisted to `localStorage`. */
  key: string;
  /** Chip label, reads after "I started watching in…". */
  label: string;
  /** Inclusive formative window (decade start → ~15 years on). */
  fromYear: number;
  toYear: number;
}

export const ERA_STORAGE_KEY = "rt:era";

export const ERA_OPTIONS: EraOption[] = [
  { key: "1970s", label: "the 1970s", fromYear: 1970, toYear: 1985 },
  { key: "1980s", label: "the 1980s", fromYear: 1980, toYear: 1995 },
  { key: "1990s", label: "the 1990s", fromYear: 1990, toYear: 2005 },
  { key: "2000s", label: "the 2000s", fromYear: 2000, toYear: 2015 },
  { key: "2010s", label: "the 2010s", fromYear: 2010, toYear: 2025 },
];

/** A rediscovery pick flattened for the client — plain, serializable, with the
 *  result split into the *withheld* prompt and the *revealed* facts. */
export interface RevealPick {
  id: string;
  /** The curiosity-gap question — result withheld. */
  prompt: string;
  /** The line shown once revealed. */
  caption: string;
  /** Final scoreline, e.g. "4–5" or "1–1 (7–8 pens)". */
  scoreText: string;
  /** Result-coloured text class for the scoreline. */
  toneClass: string;
  opponent: string;
  venue: "H" | "A" | "N";
  competition: string;
  round: string | null;
  year: string;
  /** Link to the full match — the deepening. */
  href: string;
}
