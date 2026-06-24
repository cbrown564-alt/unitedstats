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
      gloss: "of timed goals come after the 85th minute — about double an even spread",
      tone: "gold",
    },
    comebacks: {
      stat: fmtNum(cb.recovered),
      gloss: `matches rescued after falling behind, ${fmtNum(cb.wonFromBehind)} turned all the way into wins`,
      tone: "win",
    },
    runs: {
      stat: fmtNum(longestUnbeaten?.length ?? 0),
      gloss: "matches unbeaten — the club's longest run in official football",
      tone: "win",
    },
    "bogey-sides": {
      stat: topBogey ? pct(topBogey.w, topBogey.p) : "—",
      gloss: topBogey
        ? `win rate against ${topBogey.name}, the hardest side United meet often`
        : "the sides United beat least often",
      tone: "devil",
    },
    "manager-bounce": {
      stat: `${bounceUp} of ${bounce.length}`,
      gloss: "managers started better than the form the club handed them",
      tone: "devil",
    },
    fortress: {
      stat: fmtNum(fortressRun),
      gloss: `home league games led at half-time, unbeaten since ${fortressSince}`,
      tone: "win",
    },
    "cup-specialists": {
      stat: cupMultiple ? `${cupMultiple.toFixed(1)}×` : "—",
      gloss: topCupLean
        ? `${topCupLean.name}'s cup-goal rate over the club's — the most cup-loaded scorer`
        : "scorers who leaned hardest to the cups",
      tone: "gold",
    },
    "own-goals": {
      stat: fmtNum(og.total),
      gloss: `own goals for United${ogRank ? ` — #${ogRank} on the all-time scoring chart` : ""}`,
      tone: "devil",
    },
    "away-days": {
      stat: farthest ? `${fmtNum(Math.round(farthest.km))} km` : "—",
      gloss: farthest ? `the longest away day, to ${farthest.name}` : "how far away days carry United",
      tone: "gold",
    },
  };
}
