/**
 * Frozen claim manifest for the 14-second loop prototype.
 *
 * These facts mirror the golden-pinned journey claims in docs/JOURNEY.md and
 * tests/journey.test.ts. The video renders from this deliberately small fixture
 * instead of querying SQLite on every frame.
 */
export const LOOP_PROTOTYPE = {
  title: "The line through time",
  durationSeconds: 14,
  archiveKnots: [
    {
      year: 1909,
      opponent: "Bristol City",
      score: "1–0",
      fact: "First FA Cup",
      matchId: "1909-04-24-bristol-city-n",
    },
    {
      year: 1954,
      opponent: "Chelsea",
      score: "6–5",
      fact: "Eleven goals",
      matchId: "1954-10-16-chelsea-a",
    },
  ],
  rhyme: {
    gapYears: 40,
    shirt: 7,
    left: {
      name: "George Best",
      familyName: "Best",
      year: 1968,
      peak: "32 in 53",
      finalOpponent: "Benfica",
      finalScore: "4–1 aet",
      finalGoal: "92′",
      finalLabel: "European Cup final",
      matchId: "1968-05-29-benfica-n",
      image: "media/journey/george-best.webp",
      imageCredit: "Hans Peters / Anefo — CC0",
    },
    right: {
      name: "Cristiano Ronaldo",
      familyName: "Ronaldo",
      year: 2008,
      peak: "42 in 49",
      finalOpponent: "Chelsea",
      finalScore: "1–1 · 6–5 pens",
      finalGoal: "25′",
      finalLabel: "Champions League final",
      matchId: "2008-05-21-chelsea-n",
      image: "media/journey/cristiano-ronaldo.webp",
      imageCredit: "Gordon Flood — CC BY 2.0",
    },
  },
} as const;

