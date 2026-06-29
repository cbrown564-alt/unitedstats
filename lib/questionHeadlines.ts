import { fmtNum, pct } from "./format";
import {
  comebacks, cupGoalShareBaseline, cupSpecialists,
  lateGoalShareByDecade, leadHeldAtHome, managerBounce,
  eraRecord, FERGUSON_END, managerPpgRanking,
  europeByDecade, europeanFinals,
} from "./trails";
import { clubStreaks } from "./streaks";

/**
 * One headline figure per curated question — the single number that *is* the
 * answer, plus a short clause that completes it. The discovery home (`/explore`)
 * leads each question card with this, so the page answers before it asks the
 * reader to browse (PRODUCT.md: "the answer is the front door").
 *
 * Each headline is derived from the same `lib/trails`, `lib/streaks`, and query
 * sources as the full finding paragraphs in `components/QuestionModules.tsx`, so
 * the card and the page it links to never contradict each other. These are light
 * reads on the in-process SQLite db — far cheaper than rendering every module
 * (which `/questions` does), so computing the set for one launcher grid is fine.
 */
export interface QuestionHeadline {
  /** The headline figure, already formatted (e.g. "21%", "0", "2,950 km"). */
  stat: string;
  /** A short clause that completes the answer under the figure. */
  gloss: string;
  /** Result-palette tone for the figure. */
  tone: "devil" | "gold" | "win";
}

export function questionHeadlines(): Record<string, QuestionHeadline> {
  const late = lateGoalShareByDecade().reduce(
    (a, d) => ({ timed: a.timed + d.timed, late: a.late + d.late }),
    { timed: 0, late: 0 },
  );

  const cb = comebacks().summary;

  const longestUnbeaten = clubStreaks(1).unbeaten[0];

  const bounce = managerBounce();
  const bounceUp = bounce.filter((b) => b.first10.w > b.prev10.w).length;

  const fortress = leadHeldAtHome();
  // Honest fortress headline: the unbeaten run since the last lead actually lost,
  // not a flat "0" (minute data has since surfaced old defeats — see FortressModule).
  const fortressLastLoss = fortress.games.map((g) => g.result).lastIndexOf("L");
  const fortressRun = fortress.games.length - 1 - fortressLastLoss;
  const fortressSince = (fortress.games[fortressLastLoss]?.date ?? fortress.from).slice(0, 4);

  const cupBaseline = cupGoalShareBaseline();
  const topCupLean = cupSpecialists(25, 1)[0];
  const cupMultiple =
    cupBaseline.share && topCupLean ? (topCupLean.cup_goals / topCupLean.total) / cupBaseline.share : 0;

  const ferg = eraRecord("1986-11-08", FERGUSON_END);
  const since = eraRecord("2013-05-20", "9999-12-31");

  const managerRanking = managerPpgRanking();
  const fergusonRank = managerRanking.find((m) => m.id === "alex-ferguson");

  const europeTotals = europeByDecade().reduce((a, d) => ({ w: a.w + d.w, d: a.d + d.d, l: a.l + d.l }), { w: 0, d: 0, l: 0 });
  const europeFinals = europeanFinals();
  const europeWon = europeFinals.filter((f) => f.won).length;

  return {
    decline: {
      stat: since.ppg.toFixed(2),
      gloss: `points per game since Ferguson — down from ${ferg.ppg.toFixed(2)} across his ${ferg.p.toLocaleString("en-GB")} matches`,
      tone: "devil",
    },
    ferguson: {
      stat: fergusonRank ? fergusonRank.ppg.toFixed(2) : "—",
      gloss: "points per game under Ferguson — the highest of any United manager over a full reign",
      tone: "gold",
    },
    treble: {
      stat: "3",
      gloss: "trophies in 1998-99 — the first English side to hold the league, FA Cup and European Cup at once",
      tone: "gold",
    },
    europe: {
      stat: String(europeWon),
      gloss: `European trophies won across ${pct(europeTotals.w, europeTotals.w + europeTotals.d + europeTotals.l)} of ${fmtNum(europeTotals.w + europeTotals.d + europeTotals.l)} continental matches`,
      tone: "gold",
    },
    "late-goals": {
      stat: pct(late.late, late.timed),
      gloss: "of timed goals land after the 85th minute — a late-stage edge, scaled by modern stoppage-time extensions",
      tone: "gold",
    },
    comebacks: {
      stat: fmtNum(cb.recovered),
      gloss: `matches salvaged from losing positions, including ${fmtNum(cb.wonFromBehind)} complete turnarounds`,
      tone: "win",
    },
    runs: {
      stat: fmtNum(longestUnbeaten?.length ?? 0),
      gloss: "matches without defeat — the longest unbeaten run in official football",
      tone: "win",
    },
    "manager-bounce": {
      stat: `${bounceUp} of ${bounce.length}`,
      gloss: "managers improved on the inherited form in their first ten matches",
      tone: "devil",
    },
    fortress: {
      stat: fmtNum(fortressRun),
      gloss: `home league fixtures led at the break, unbeaten since ${fortressSince}`,
      tone: "win",
    },
    "cup-specialists": {
      stat: cupMultiple ? `${cupMultiple.toFixed(1)}×` : "—",
      gloss: topCupLean
        ? `${topCupLean.name}’s rate of scoring in cups compared to the squad average — a cup-night specialist`
        : "goalscorers who leaned hardest to the cups",
      tone: "gold",
    },
  };
}
