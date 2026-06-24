import {
  bogeyOpponents, comebacks, cupGoalShareBaseline, cupSpecialists,
  goalMinuteRidge, leadHeldAtHome, managerBounce,
} from "@/lib/trails";
import { clubStreaks } from "@/lib/streaks";
import { ownGoalScorers, ownGoalSummary, topScorers } from "@/lib/queries";
import { awayFootprint, MANCHESTER } from "@/lib/spatial";
import { EUROPE_LAND } from "@/lib/geo/land";
import { fmtNum, pct } from "@/lib/format";
import { MinuteRidge } from "@/components/charts/MinuteRidge";
import { GeoScatter } from "@/components/GeoScatter";
import { WdlBar } from "@/components/WdlBar";
import { ClubBadge } from "@/components/ClubBadge";
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

const EUROPE: [number, number, number, number] = [34, 61.5, -11, 36];

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
    case "late-goals":
      return <MinuteRidge bins={goalMinuteRidge()} lateFrom={85} height={190} />;

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

    case "bogey-sides": {
      const bogeys = bogeyOpponents(20, 3);
      return (
        <div className="space-y-2.5">
          {bogeys.map((o) => (
            <div key={o.id} className="grid grid-cols-[2.6rem_minmax(0,1fr)] items-center gap-3">
              <div className="stat-num text-right text-base font-semibold text-devil-bright">
                {pct(o.w, o.p)}
              </div>
              <div className="min-w-0">
                <div className="mb-1 flex items-center gap-2 text-sm">
                  <ClubBadge id={o.id} name={o.name} />
                  <span className="truncate">{o.name}</span>
                  <span className="stat-num ml-auto whitespace-nowrap text-[11px] text-ink-faint">
                    {o.p} met
                  </span>
                </div>
                <WdlBar w={o.w} d={o.d} l={o.l} />
              </div>
            </div>
          ))}
        </div>
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

    case "own-goals": {
      const og = ownGoalSummary();
      const rank = topScorers(12).findIndex((p) => p.player_id === "own-goal") + 1;
      const repeatMax = Math.max(1, ...ownGoalScorers().map((s) => s.n));
      return (
        <Figures
          items={[
            { value: fmtNum(og.total), label: rank ? `own goals · #${rank} all-time` : "own goals", tone: "devil" },
            { value: fmtNum(og.scorers), label: "different benefactors", tone: "ink" },
            { value: `${repeatMax}×`, label: "most by any one player", tone: "ink" },
          ]}
        />
      );
    }

    case "away-days": {
      const european = awayFootprint().filter((v) => v.european > 0);
      return (
        <div className="mx-auto w-full max-w-[24rem]">
          <GeoScatter
            points={european.map((v) => ({ lat: v.lat, lng: v.lng, label: v.name, value: v.p }))}
            origin={{ ...MANCHESTER, label: "Manchester" }}
            bounds={EUROPE}
            land={EUROPE_LAND}
            labelTop={6}
            dotColor="var(--color-gold)"
          />
        </div>
      );
    }

    default:
      return null;
  }
}
