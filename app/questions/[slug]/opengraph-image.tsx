import { questionBySlug } from "@/lib/questions";
import { immutableDataHeaders } from "@/lib/cache";
import {
  bogeyOpponents,
  cupGoalShareBaseline,
  cupSpecialists,
  lateGoalShareByDecade,
  leadHeldAtHome,
} from "@/lib/trails";
import { clubStreaks } from "@/lib/streaks";
import { ownGoalSummary, topScorers } from "@/lib/queries";
import { fmtNum, pct } from "@/lib/format";
import {
  OG_CONTENT_TYPE,
  OG_SIZE,
  type QuestionVisual,
  evidenceCard,
  questionCard,
  trustStrip,
} from "@/lib/og-card";

// On-demand + CDN-cached: the cards carry live counts read from the DB, so they
// can't be baked at build time the way the evergreen text card was.
export const dynamic = "force-dynamic";
export const alt = "UnitedStats question — a sourced answer about Manchester United history";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

type Answer = { figure: string; gloss: string; visual: QuestionVisual; accent?: "gold" | "devil" };

/** The data card for the six questions whose finding fits a single chart. The
 *  other three (comebacks, manager-bounce, away-days) fall back to the text card. */
function questionAnswer(slug: string): Answer | null {
  switch (slug) {
    case "late-goals": {
      const data = lateGoalShareByDecade();
      if (data.length === 0) return null;
      const tot = data.reduce((a, d) => ({ timed: a.timed + d.timed, late: a.late + d.late }), { timed: 0, late: 0 });
      const peak = Math.max(...data.map((d) => d.late / d.timed));
      return {
        figure: pct(tot.late, tot.timed),
        gloss: "of timed goals land after the 85th minute — about double an even spread",
        visual: {
          kind: "columns",
          bars: data.map((d) => ({ label: d.decade.slice(2), value: (d.late / d.timed) * 100, highlight: d.late / d.timed === peak })),
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
        figure: String(rows[0].value),
        gloss: "matches unbeaten — United's longest run in official football",
        visual: { kind: "rows", bars: rows.map((r, i) => ({ ...r, valueText: String(r.value), highlight: i === 0 })) },
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
      return {
        figure: pct(lh.w + lh.d, lh.games.length),
        gloss: `of home league games led at half-time end without defeat — ${fmtNum(lh.w)} won, ${fmtNum(lh.d)} drawn`,
        visual: { kind: "wdl", w: lh.w, d: lh.d, l: lh.l },
      };
    }
    default:
      return null;
  }
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const q = questionBySlug(slug);
  const answer = q ? questionAnswer(slug) : null;

  if (q && answer) {
    return questionCard(
      { question: q.question, figure: answer.figure, gloss: answer.gloss, visual: answer.visual, accent: answer.accent, strip: trustStrip() },
      immutableDataHeaders,
    );
  }

  // Deferred questions and unknown slugs keep the evergreen text card.
  return evidenceCard(
    {
      question: q?.question ?? "Manchester United history, answered.",
      summary: q?.summary ?? "Ask a question, get a sourced answer, and every match behind it.",
      strip: trustStrip(),
    },
    immutableDataHeaders,
  );
}
