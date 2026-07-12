export type FilmMatchLibraryEntry = {
  matchId: string;
  featuredPlayers: readonly string[];
};

/** Factual material made available to films. Timing, copy and visual treatment live in editions. */
export const FILM_MATCH_LIBRARY = [
  { matchId: "1886-10-30-fleetwood-rangers-a", featuredPlayers: ["jack-doughty"] },
  { matchId: "1954-10-16-chelsea-a", featuredPlayers: ["dennis-viollet"] },
  { matchId: "1968-05-29-benfica-n", featuredPlayers: ["george-best", "bobby-charlton", "brian-kidd"] },
  { matchId: "1999-05-26-bayern-munich-n", featuredPlayers: ["teddy-sheringham", "ole-gunnar-solskj-r"] },
  { matchId: "2008-05-21-chelsea-n", featuredPlayers: ["cristiano-ronaldo"] },
] as const satisfies readonly FilmMatchLibraryEntry[];
