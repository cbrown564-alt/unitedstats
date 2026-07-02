import {
  cupGoalShareBaseline,
  cupSpecialists,
  lateGoalManagerEras,
  leadHeldAtHome,
  trebleSummary,
  trebleGloss,
  trebleRunLabel,
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
      const eras = lateGoalManagerEras();
      if (eras.length === 0) return null;
      const ferg = eras.find((e) => e.label === "Ferguson");
      const since = eras.find((e) => e.label === "Since Ferguson");
      const fergLate = ferg ? pct(ferg.reg + ferg.stoppage, ferg.timed) : "—";
      const sinceLate = since ? pct(since.reg + since.stoppage, since.timed) : fergLate;
      return {
        figure: `${fergLate} → ${sinceLate}`,
        gloss: "of timed goals after the 85th minute under Ferguson and since — the jump arrived with him but did not leave with him",
        visual: {
          kind: "columns",
          bars: eras.map((e) => ({
            label: e.label === "Since Ferguson" ? "Since" : e.label,
            value: ((e.reg + e.stoppage) / e.timed) * 100,
            base: (e.reg / e.timed) * 100,
            highlight: e.label === "Since Ferguson",
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
        gloss: "matches without defeat — the longest unbeaten run in official football",
        visual: { kind: "rows", bars: rows.map((r, i) => ({ ...r, valueText: fmtNum(r.value), highlight: i === 0 })) },
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
        gloss: `${top.name} leaned hardest to the cups — compared to a squad baseline of just ${pct(base.cup, base.total)}`,
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
        gloss: `“Own Goal” accounts for ${fmtNum(og.total)} goals — ranking among the club’s leading scorers, attributed to no player`,
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
    case "treble": {
      const t = trebleSummary();
      return {
        figure: String(t.trophies),
        gloss: trebleGloss(t),
        accent: "gold",
        visual: {
          kind: "rows",
          bars: t.wonRuns.map((r) => ({
            label: trebleRunLabel(r),
            value: r.p,
            valueText: `${r.w}-${r.d}-${r.l}`,
            highlight: r.type === "european",
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
        gloss: `home games led at half-time, unbeaten since ${(lh.games[lastLoss]?.date ?? lh.from).slice(0, 4)}`,
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
