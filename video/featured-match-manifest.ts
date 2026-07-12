type FeaturedMatchVisualMode =
  | "first-xi"
  | "score-storm"
  | "year-mark"
  | "penalty-constellation";

export type FeaturedMatchManifestEntry = {
  matchId: string;
  year: number;
  start: number;
  x: number;
  visualMode: FeaturedMatchVisualMode;
  eyebrow: string;
  headline: string;
  featuredPlayers: readonly string[];
};

/**
 * Editorial choices for the opening archive run. Facts are generated from the
 * canonical database; this file only declares which truth each match should
 * foreground and how it should behave on film.
 *
 * Lean cut: only 1886, 1954 and 2008 get full signatures. 1968 and 1999 pass as
 * year marks so their proofs land later (loop / Treble), not as opening trailers.
 */
export const FEATURED_MATCH_MANIFEST = [
  {
    matchId: "1886-10-30-fleetwood-rangers-a",
    year: 1886,
    x: 220,
    start: 18,
    visualMode: "first-xi",
    eyebrow: "30 OCTOBER 1886",
    headline: "The first eleven.",
    featuredPlayers: ["jack-doughty"],
  },
  {
    matchId: "1954-10-16-chelsea-a",
    year: 1954,
    x: 1200,
    start: 90,
    visualMode: "score-storm",
    eyebrow: "16 OCTOBER 1954",
    headline: "Eleven goals.",
    featuredPlayers: ["dennis-viollet"],
  },
  {
    matchId: "1968-05-29-benfica-n",
    year: 1968,
    x: 2310,
    start: 165,
    visualMode: "year-mark",
    eyebrow: "29 MAY 1968",
    headline: "Wembley.",
    featuredPlayers: ["george-best"],
  },
  {
    matchId: "1999-05-26-bayern-munich-n",
    year: 1999,
    x: 3080,
    start: 210,
    visualMode: "year-mark",
    eyebrow: "26 MAY 1999",
    headline: "Camp Nou.",
    featuredPlayers: ["teddy-sheringham"],
  },
  {
    matchId: "2008-05-21-chelsea-n",
    year: 2008,
    x: 3520,
    start: 255,
    visualMode: "penalty-constellation",
    eyebrow: "21 MAY 2008",
    headline: "One night, decided from the spot.",
    featuredPlayers: ["cristiano-ronaldo"],
  },
] as const satisfies readonly FeaturedMatchManifestEntry[];
