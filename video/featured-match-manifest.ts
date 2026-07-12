type FeaturedMatchVisualMode =
  | "first-xi"
  | "score-storm"
  | "extra-time-burst"
  | "bench-reversal"
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
 * Hybrid cut: four match cards in the lean 18s opening (1886, both European Cup
 * finals, 2008), then the lean Best↔Ronaldo loop / Treble pocket / Fergie bloom /
 * receipt unchanged. The 1954 Chelsea score-storm is dropped so the finals keep
 * readable dwell. Starts leave ~3s on-knot dwell before travel.
 */
export const FEATURED_MATCH_MANIFEST = [
  {
    matchId: "1886-10-30-fleetwood-rangers-a",
    year: 1886,
    x: 220,
    start: 24,
    visualMode: "first-xi",
    eyebrow: "30 OCTOBER 1886",
    headline: "The first XI.",
    featuredPlayers: ["jack-doughty"],
  },
  {
    matchId: "1968-05-29-benfica-n",
    year: 1968,
    x: 2310,
    start: 150,
    visualMode: "extra-time-burst",
    eyebrow: "29 MAY 1968",
    headline: "Level at ninety. Three in seven minutes.",
    featuredPlayers: ["george-best", "bobby-charlton", "brian-kidd"],
  },
  {
    matchId: "1999-05-26-bayern-munich-n",
    year: 1999,
    x: 3080,
    start: 285,
    visualMode: "bench-reversal",
    eyebrow: "26 MAY 1999",
    headline: "The bench enters history.",
    featuredPlayers: ["teddy-sheringham", "ole-gunnar-solskj-r"],
  },
  {
    matchId: "2008-05-21-chelsea-n",
    year: 2008,
    x: 3520,
    start: 415,
    visualMode: "penalty-constellation",
    eyebrow: "21 MAY 2008",
    headline: "Decided from the spot.",
    featuredPlayers: ["cristiano-ronaldo"],
  },
] as const satisfies readonly FeaturedMatchManifestEntry[];
