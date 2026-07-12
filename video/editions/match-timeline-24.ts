import type { FilmEdition } from "../core/types";

export const MATCH_TIMELINE_24 = {
  id: "match-timeline-24",
  title: "Low-key match timeline · 24 seconds",
  durationInFrames: 720,
  format: { width: 1920, height: 1080, fps: 30 },
  openingDurationInFrames: 720,
  openingMatches: [
    { matchId: "1886-10-30-fleetwood-rangers-a", year: 1886, x: 220, start: 24, visualMode: "first-xi", eyebrow: "30 OCTOBER 1886", headline: "The first recorded XI." },
    { matchId: "1954-10-16-chelsea-a", year: 1954, x: 1370, start: 155, visualMode: "score-storm", eyebrow: "16 OCTOBER 1954", headline: "Eleven goals. One night." },
    { matchId: "1968-05-29-benfica-n", year: 1968, x: 2200, start: 285, visualMode: "extra-time-burst", eyebrow: "29 MAY 1968", headline: "Level after 90. Three goals in seven minutes." },
    { matchId: "1999-05-26-bayern-munich-n", year: 1999, x: 3050, start: 420, visualMode: "bench-reversal", eyebrow: "26 MAY 1999", headline: "Two substitutes changed the final." },
    { matchId: "2008-05-21-chelsea-n", year: 2008, x: 3700, start: 555, visualMode: "penalty-constellation", eyebrow: "21 MAY 2008", headline: "Won on penalties." },
  ],
  acts: { rhyme: false, treble: false, fergie: false, fortress: false, receipt: false },
  audioPlanId: "timeline-low-key",
} as const satisfies FilmEdition;
