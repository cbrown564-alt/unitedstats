/** Canonical input placeholder shared across search entry points. */
export const SEARCH_PLACEHOLDER = "Search names, seasons, or questions…";

/** Shorter placeholder for the mobile overlay — less visual noise above the keyboard. */
export const MOBILE_SEARCH_PLACEHOLDER = "Settle an argument…";

/**
 * Mobile empty-state suggestions — argument-settlers with short labels where the
 * query differs (e.g. "the treble" → 1998-99). Kept separate from POPULAR_SEARCHES
 * so desktop teaching stays rich.
 */
export type MobileSearchSuggestion = { q: string; label: string };

export const MOBILE_SEARCH_SUGGESTIONS: MobileSearchSuggestion[] = [
  { q: "Cantona vs Liverpool", label: "Cantona vs Liverpool" },
  { q: "biggest win in the 90s", label: "biggest win in the 90s" },
  { q: "1998-99", label: "the treble" },
];

/**
 * parser actually answers, so a first-time searcher sees what the box can do.
 * Shared by the dropdown empty state, the command palette, and /search. The
 * natural-language entry ("did United ever beat Barcelona") teaches that the box
 * understands how people actually argue, not only the operator grammar.
 */
export const POPULAR_SEARCHES: { q: string; hint: string }[] = [
  { q: "did United ever beat Barcelona", hint: "ask it plainly" },
  { q: "record away at Arsenal", hint: "venue-aware head-to-head" },
  { q: "biggest win in the 90s", hint: "era-scoped superlative" },
  { q: "United in Europe", hint: "competition-scoped record" },
  { q: "Rooney vs Charlton", hint: "player comparison" },
  { q: "late goals under Ferguson", hint: "a shaped question" },
];

/** Bare example queries — one source of truth for the rotating placeholder and the
 *  never-blank reshape suggestions, drawn from the questions the parser answers. */
export const EXAMPLE_QUERIES: string[] = POPULAR_SEARCHES.map((p) => p.q);

/** A few strong reshapes shown when a query finds nothing, so the box is never a
 *  dead end ("no exact match — try one of these"). */
export const RESHAPE_PROMPTS: string[] = [
  "did United ever beat Barcelona",
  "record away at Liverpool",
  "biggest win in the 90s",
];

/** One-line syntax hints for the scoping operators. */
export const SEARCH_HINTS: string[] = [
  "player:rooney — scope to one kind",
  "season:1999 — jump to a season",
  "vs:liverpool — a head-to-head",
];

/** Display labels for entity kinds, shared across every search surface. */
export const KIND_LABELS: Record<string, string> = {
  player: "Player",
  manager: "Manager",
  opponent: "Opponent",
  season: "Season",
  competition: "Competition",
  stadium: "Stadium",
  city: "City",
  match: "Match",
};

/** Plural group headers for the results page. */
export const KIND_HEADINGS: Record<string, string> = {
  player: "Players",
  manager: "Managers",
  opponent: "Opponents",
  season: "Seasons",
  competition: "Competitions",
  stadium: "Stadiums",
  city: "Cities",
  match: "Matches",
};
