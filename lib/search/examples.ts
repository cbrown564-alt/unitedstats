/**
 * Worked example queries for the empty state — questions the deterministic
 * parser actually answers, so a first-time searcher sees what the box can do.
 * Shared by the dropdown empty state, the command palette, and /search.
 */
export const POPULAR_SEARCHES: { q: string; hint: string }[] = [
  { q: "record away at Arsenal", hint: "venue-aware head-to-head" },
  { q: "biggest win in the 90s", hint: "era-scoped superlative" },
  { q: "United in Europe", hint: "competition-scoped record" },
  { q: "Rooney vs Charlton", hint: "player comparison" },
  { q: "late goals under Ferguson", hint: "a shaped question" },
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
