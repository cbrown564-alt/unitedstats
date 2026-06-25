import { fmtNum, pct } from "./format";
import {
  bogeyOpponents, comebacks, cupGoalShareBaseline, cupSpecialists,
  lateGoalShareByDecade, leadHeldAtHome, managerBounce,
} from "./trails";
import { clubStreaks } from "./streaks";
import { ownGoalSummary, topScorers } from "./queries";
import { awayFootprint } from "./spatial";

/**
 * One headline figure per curated question — the single number that *is* the
 * answer, plus a short clause that completes it. The discovery home (`/explore`)
 * leads each question card with this, so the page answers before it asks the
 * reader to browse (PRODUCT.md: "the answer is the front door").
 *
 * Each headline is derived from the same `lib/trails`, `lib/streaks`, and query
 * sources as the full finding paragraphs in `components/QuestionModules.tsx`, so
 * the card and the page it links to never contradict each other. These are light
 * reads on the in-process SQLite db — far cheaper than rendering all nine modules
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

  const topBogey = bogeyOpponents(20, 1)[0];

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

  const og = ownGoalSummary();
  const ogRank = topScorers(12).findIndex((p) => p.player_id === "own-goal") + 1;

  const farthest = [...awayFootprint()].sort((a, b) => b.km - a.km)[0];

  return {
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
    "bogey-sides": {
      stat: topBogey ? pct(topBogey.w, topBogey.p) : "—",
      gloss: topBogey
        ? `win rate against ${topBogey.name}, the most persistent obstacle in our history (min. 20 meetings)`
        : "the sides United beat least often",
      tone: "devil",
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
    "own-goals": {
      stat: fmtNum(og.total),
      gloss: `own goals gifted to United — ranking #${ogRank} among our all-time top scorers`,
      tone: "devil",
    },
    "away-days": {
      stat: farthest ? `${fmtNum(Math.round(farthest.km))} km` : "—",
      gloss: farthest ? `for the longest away trip in the record, visiting ${farthest.name}` : "how far away days carry United",
      tone: "gold",
    },
  };
}
