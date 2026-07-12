import type { FilmEdition } from "../core/types";

export const EUROPEAN_MASTER_90 = {
  id: "european-master-90",
  title: "European master · 90 seconds",
  durationInFrames: 2700,
  format: { width: 1920, height: 1080, fps: 30 },
  openingDurationInFrames: 540,
  openingMatches: [
    { matchId: "1886-10-30-fleetwood-rangers-a", year: 1886, x: 220, start: 24, visualMode: "first-xi", eyebrow: "30 OCTOBER 1886", headline: "The first recorded XI." },
    { matchId: "1968-05-29-benfica-n", year: 1968, x: 2310, start: 150, visualMode: "extra-time-burst", eyebrow: "29 MAY 1968", headline: "Level after 90. Three goals in seven minutes." },
    { matchId: "1999-05-26-bayern-munich-n", year: 1999, x: 3080, start: 285, visualMode: "bench-reversal", eyebrow: "26 MAY 1999", headline: "Two substitutes changed the final." },
    { matchId: "2008-05-21-chelsea-n", year: 2008, x: 3520, start: 415, visualMode: "penalty-constellation", eyebrow: "21 MAY 2008", headline: "Won on penalties." },
  ],
  acts: { rhyme: true, treble: true, fergie: true, fortress: true, receipt: true },
  audioPlanId: "european-score-v3",
} as const satisfies FilmEdition;
