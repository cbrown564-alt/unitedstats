import {
  comebacks, cupGoalShareBaseline, cupSpecialists,
  goalMinuteRidge, leadHeldAtHome, managerBounce,
  eraRecord, FERGUSON_END, managerPpgRanking, europeByDecade, europeanFinals,
} from "@/lib/trails";
import { clubStreaks } from "@/lib/streaks";
import { fmtNum, pct } from "@/lib/format";
import { MinuteColumns } from "@/components/charts/MinuteColumns";
import { WdlBar } from "@/components/WdlBar";
import { SlopeCompare } from "@/components/charts/SlopeCompare";
import { CupLeanBar } from "@/components/charts/CupLeanBar";
import { LeadHeldDotplot, type LeadDot } from "@/components/charts/LeadHeldDotplot";

/**
 * The one signature visual that fills each question's full-view slide in the
 * Explore Answering strip. A *preview* of the answer, not its depth: one chart or
 * one figure cluster per question, deliberately lighter than the full module on
 * `/questions/[slug]` (the jump target), so the strip invites rather than repeats.
 *
 * Each case reuses the same `lib/trails`, `lib/streaks`, and query sources — and,
 * where one exists, the same chart component — as the full finding in
 * `components/QuestionModules.tsx`, which stays the source of truth. The headline
 * figure itself lives in `lib/questionHeadlines.ts`; the figure clusters here show
 * the *other* facets so the slide doesn't just restate its own headline.
 */

const FIGURE_TONE: Record<"devil" | "gold" | "win" | "ink", string> = {
  devil: "text-devil-bright",
  gold: "text-gold",
  win: "text-win",
  ink: "text-ink",
};

interface Figure {
  value: string;
  label: string;
  tone: keyof typeof FIGURE_TONE;
}

/** A row of bold stat tiles — the signature for questions whose answer is a set
 *  of counts rather than a shape. */
function Figures({ items }: { items: Figure[] }) {
  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      {items.map((it) => (
        <div key={it.label} className="rounded-lg border border-line bg-panel-2 px-3 py-4 text-center">
          <div className={`stat-num text-3xl font-semibold leading-none ${FIGURE_TONE[it.tone]}`}>
            {it.value}
          </div>
          <div className="mx-auto mt-1.5 max-w-[7.5rem] text-[11px] uppercase tracking-wider text-ink-faint">
            {it.label}
          </div>
        </div>
      ))}
    </div>
  );
}

export function QuestionSignature({ slug }: { slug: string }) {
  switch (slug) {
    case "late-goals": {
      const ridge = goalMinuteRidge();
      return <MinuteColumns bins={ridge.bins} stoppage={ridge.stoppage} height={190} />;
    }

    case "comebacks": {
      const s = comebacks().summary;
      return (
        <Figures
          items={[
            { value: fmtNum(s.fellBehind), label: "times fell behind", tone: "ink" },
            { value: fmtNum(s.wonFromBehind), label: "turned into wins", tone: "gold" },
            { value: fmtNum(s.twoPlusRecovered), label: "saved from two+ down", tone: "devil" },
          ]}
        />
      );
    }

    case "runs": {
      const st = clubStreaks(1);
      return (
        <Figures
          items={[
            { value: fmtNum(st.winning[0]?.length ?? 0), label: "straight wins", tone: "gold" },
            { value: fmtNum(st.scoring[0]?.length ?? 0), label: "matches scoring", tone: "win" },
            { value: fmtNum(st.cleansheet[0]?.length ?? 0), label: "clean sheets", tone: "win" },
          ]}
        />
      );
    }

    case "decline": {
      const ferg = eraRecord("1986-11-08", FERGUSON_END);
      const since = eraRecord("2013-05-20", "9999-12-31");
      return (
        <Figures
          items={[
            { value: ferg.ppg.toFixed(2), label: "ppg under Ferguson", tone: "gold" },
            { value: since.ppg.toFixed(2), label: "ppg since", tone: "devil" },
            { value: "0", label: "titles since 2013", tone: "devil" },
          ]}
        />
      );
    }

    case "rivalries": {
      const ledgers: { id: string; w: number; d: number; l: number }[] = [
        { id: "liverpool", w: 85, d: 61, l: 72 },
        { id: "manchester-city", w: 80, d: 55, l: 62 },
        { id: "leeds-united", w: 50, d: 38, l: 27 },
        { id: "arsenal", w: 100, d: 55, l: 90 },
      ];
      return (
        <div className="space-y-2">
          {ledgers.map((r) => (
            <div key={r.id} className="grid grid-cols-[5.5rem_1fr_4.5rem] items-center gap-3 text-sm">
              <span className="truncate">{r.id === "leeds-united" ? "Leeds" : r.id === "manchester-city" ? "Man City" : r.id.charAt(0).toUpperCase() + r.id.slice(1)}</span>
              <WdlBar w={r.w} d={r.d} l={r.l} />
              <span className="stat-num text-right text-[11px] text-ink-faint">{r.w}–{r.d}–{r.l}</span>
            </div>
          ))}
        </div>
      );
    }

    case "ferguson": {
      const ranking = managerPpgRanking().slice(0, 4);
      return (
        <Figures
          items={[
            { value: "2.01", label: "Ferguson ppg", tone: "gold" },
            { value: "38", label: "trophies", tone: "gold" },
            { value: `${ranking[1]?.ppg.toFixed(2) ?? "—"}`, label: "next-best manager", tone: "ink" },
          ]}
        />
      );
    }

    case "treble": {
      return (
        <Figures
          items={[
            { value: "3", label: "trophies, 1998-99", tone: "gold" },
            { value: "5", label: "losses all season", tone: "win" },
            { value: "128", label: "goals scored", tone: "ink" },
          ]}
        />
      );
    }

    case "europe": {
      const totals = europeByDecade().reduce((a, d) => ({ w: a.w + d.w, d: a.d + d.d, l: a.l + d.l }), { w: 0, d: 0, l: 0 });
      const finals = europeanFinals();
      return (
        <Figures
          items={[
            { value: String(finals.filter((f) => f.won).length), label: "trophies won", tone: "gold" },
            { value: String(finals.length), label: "finals reached", tone: "ink" },
            { value: pct(totals.w, totals.w + totals.d + totals.l), label: "win rate in Europe", tone: "win" },
          ]}
        />
      );
    }

    case "manager-bounce": {
      const bounce = [...managerBounce()]
        .sort((a, b) => b.first10.w - b.prev10.w - (a.first10.w - a.prev10.w))
        .slice(0, 4);
      return (
        <div className="space-y-2">
          {bounce.map((b) => {
            const swing = b.first10.w - b.prev10.w;
            return (
              <div key={b.id} className="grid grid-cols-[7.5rem_1fr_2rem] items-center gap-3 text-sm">
                <span className="truncate" title={b.name}>{b.name}</span>
                <SlopeCompare compact from={{ value: b.prev10.w }} to={{ value: b.first10.w }} min={0} max={10} />
                <span
                  className={`stat-num text-right font-semibold ${
                    swing > 0 ? "text-win" : swing < 0 ? "text-loss" : "text-ink-faint"
                  }`}
                >
                  {swing > 0 ? `+${swing}` : swing}
                </span>
              </div>
            );
          })}
        </div>
      );
    }

    case "fortress": {
      const lh = leadHeldAtHome();
      const dots: LeadDot[] = lh.games.map((g) => {
        const outcome = g.result === "W" ? `won ${g.gf}–${g.ga}` : g.result === "L" ? `lost ${g.gf}–${g.ga}` : `drew ${g.gf}–${g.ga}`;
        return {
          result: g.result as LeadDot["result"],
          surrendered: g.result === "D",
          title: `${outcome} v ${g.opponent_name}`,
        };
      });
      return <LeadHeldDotplot dots={dots} fromLabel={lh.from.slice(0, 4)} toLabel={lh.to.slice(0, 4)} />;
    }

    case "cup-specialists": {
      const base = cupGoalShareBaseline();
      return <CupLeanBar rows={cupSpecialists(25, 6)} baseline={base.share} />;
    }

    default:
      return null;
  }
}
