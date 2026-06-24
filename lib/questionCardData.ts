import {
  bogeyOpponents,
  cupGoalShareBaseline,
  cupSpecialists,
  lateGoalShareByDecade,
  leadHeldAtHome,
} from "./trails";
import { clubStreaks } from "./streaks";
import { ownGoalSummary, topScorers } from "./queries";
import { fmtNum, pct } from "./format";
import type { QuestionVisual } from "./og-card";

export type QuestionAnswer = { figure: string; gloss: string; visual: QuestionVisual; accent?: "gold" | "devil" };

/**
 * The data for a tested-question OG card: a one-figure verdict and the chart that
 * shows it, for the six questions whose finding fits a single visual. The other
 * three (comebacks, manager-bounce, away-days) return null and fall back to the
 * text card. Lives in lib (not the route) so it is a single source of truth the
 * tests can pin against /explore's `questionHeadlines()`, and so neither surface
 * can drift from the data the way the fortress "0" did.
 */
export function questionAnswer(slug: string): QuestionAnswer | null {
  switch (slug) {
    case "late-goals": {
      const data = lateGoalShareByDecade();
      if (data.length === 0) return null;
      const tot = data.reduce((a, d) => ({ timed: a.timed + d.timed, late: a.late + d.late }), { timed: 0, late: 0 });
      // Highlight the era with the most stoppage-time goals — the cap that grew —
      // not the highest total, which is the same decade for the right reason.
      const peakStoppage = Math.max(...data.map((d) => d.stoppage / d.timed));
      return {
        figure: pct(tot.late, tot.timed),
        gloss: "of timed goals land after the 85th — a real edge in the last five minutes, plus a growing stoppage-time window",
        visual: {
          kind: "columns",
          bars: data.map((d) => ({
            label: d.decade.slice(2),
            value: (d.late / d.timed) * 100,
            base: (d.reg / d.timed) * 100,
            highlight: d.stoppage / d.timed === peakStoppage,
          })),
        },
      };
    }
    case "runs": {
      const s = clubStreaks(1);
      const rows = [
        { label: "Unbeaten", value: s.unbeaten[0]?.length ?? 0 },
        { label: "Winning", value: s.winning[0]?.length ?? 0 },
        { label: "Scoring", value: s.scoring[0]?.length ?? 0 },
        { label: "Clean sheets", value: s.cleansheet[0]?.length ?? 0 },
      ];
      return {
        figure: fmtNum(rows[0].value),
        gloss: "matches unbeaten — United's longest run in official football",
        visual: { kind: "rows", bars: rows.map((r, i) => ({ ...r, valueText: fmtNum(r.value), highlight: i === 0 })) },
      };
    }
    case "bogey-sides": {
      const b = bogeyOpponents(20, 5);
      if (b.length === 0) return null;
      const worst = b[0];
      return {
        figure: pct(worst.w, worst.p),
        gloss: `win rate v ${worst.name} — United's worst against a side met 20+ times`,
        accent: "devil",
        visual: {
          kind: "rows",
          bars: b.map((o, i) => ({ label: o.name, value: o.p ? (o.w / o.p) * 100 : 0, valueText: pct(o.w, o.p), highlight: i === 0 })),
        },
      };
    }
    case "cup-specialists": {
      const sp = cupSpecialists(25, 5);
      const base = cupGoalShareBaseline();
      if (sp.length === 0) return null;
      const top = sp[0];
      const mult = base.share ? (top.cup_goals / top.total) / base.share : 0;
      return {
        figure: `${mult.toFixed(1)}×`,
        gloss: `${top.name} leaned hardest to the cups — the club scores just ${pct(base.cup, base.total)} of its goals there`,
        visual: {
          kind: "rows",
          bars: sp.map((p, i) => ({
            label: p.name,
            value: p.total ? (p.cup_goals / p.total) * 100 : 0,
            valueText: `${(base.share ? (p.cup_goals / p.total) / base.share : 0).toFixed(1)}×`,
            highlight: i === 0,
          })),
        },
      };
    }
    case "own-goals": {
      const og = ownGoalSummary();
      const top = topScorers(8);
      const idx = top.findIndex((p) => p.player_id === "own-goal");
      const board = (idx >= 0 && idx < 6 ? top.slice(0, 6) : [...top.slice(0, 5), top[idx]]).filter(Boolean);
      return {
        figure: idx >= 0 ? `#${idx + 1}` : fmtNum(og.total),
        gloss: `“Own Goal” has ${fmtNum(og.total)} for United — among the club's leading scorers, belonging to no one`,
        visual: {
          kind: "rows",
          bars: board.map((p) => ({
            label: p.player_id === "own-goal" ? "Own Goal" : p.name,
            value: p.goals,
            valueText: fmtNum(p.goals),
            highlight: p.player_id === "own-goal",
          })),
        },
      };
    }
    case "fortress": {
      const lh = leadHeldAtHome();
      // The unbeaten run since the last lead actually lost — the page's headline.
      const lastLoss = lh.games.map((g) => g.result).lastIndexOf("L");
      const since = lh.games.slice(lastLoss + 1);
      return {
        figure: fmtNum(since.length),
        gloss: `home league games led at half-time, unbeaten since ${(lh.games[lastLoss]?.date ?? lh.from).slice(0, 4)}`,
        visual: {
          kind: "wdl",
          w: since.filter((g) => g.result === "W").length,
          d: since.filter((g) => g.result === "D").length,
          l: 0,
        },
      };
    }
    default:
      return null;
  }
}
