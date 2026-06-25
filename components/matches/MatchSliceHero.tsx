import { GoalDiff } from "@/components/GoalDiff";
import { InteractiveSliceSpine } from "@/components/matches/InteractiveSliceSpine";
import { WdlBarFilter } from "@/components/matches/WdlBarFilter";
import { fmtDate } from "@/lib/format";
import type { SequenceMatch } from "@/lib/trails";

type Decade = { decade: string; from: number; to: number; n: number };

/**
 * Answer-first hero for the Matches page: the slice headline, goals ribbon, and
 * interactive shape (spine + decade axis, or a clickable W/D/L bar below the gate).
 */
export function MatchSliceHero({
  summary,
  sequence,
  decades,
  hasFilters,
  pinnedResult,
  heroValue,
  heroLabel,
  heroTone,
  heroSub,
  activeResult,
  activeFrom,
  activeTo,
  params,
}: {
  summary: { p: number; w: number; d: number; l: number; gf: number; ga: number; first: string | null; last: string | null };
  sequence: SequenceMatch[];
  decades: Decade[];
  hasFilters: boolean;
  pinnedResult?: string;
  heroValue: string;
  heroLabel: string;
  heroTone: string;
  heroSub: string | null;
  activeResult?: string;
  activeFrom?: string;
  activeTo?: string;
  params: Record<string, string | undefined>;
}) {
  return (
    <section className="rounded-xl border border-line bg-panel p-4 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.04)] sm:p-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
          {hasFilters ? "This slice" : "All matches"}
        </h2>
        {summary.first && (
          <span className="stat-num text-xs text-ink-faint">
            {fmtDate(summary.first)}
            {summary.last && summary.last !== summary.first ? ` → ${fmtDate(summary.last)}` : ""}
          </span>
        )}
      </div>

      {summary.p > 0 ? (
        <>
          <div className="mt-4 flex flex-wrap items-end gap-x-7 gap-y-4">
            <div className="leading-none">
              <div className="flex items-baseline gap-2">
                <span className={`stat-num text-5xl font-semibold sm:text-6xl ${heroTone}`}>{heroValue}</span>
                <span className="text-sm uppercase tracking-[0.16em] text-ink-faint">{heroLabel}</span>
              </div>
              {heroSub && <p className="stat-num mt-2 text-xs text-ink-faint">{heroSub}</p>}
            </div>
            <GoalDiff gf={summary.gf} ga={summary.ga} played={summary.p} size="lg" className="border-l border-line pl-6 sm:pl-7" />
          </div>

          {sequence.length >= 24 ? (
            <InteractiveSliceSpine
              matches={sequence}
              decades={decades}
              w={summary.w}
              d={summary.d}
              l={summary.l}
              showRecord={!pinnedResult}
              activeResult={activeResult}
              activeFrom={activeFrom}
              activeTo={activeTo}
              params={params}
            />
          ) : (
            !pinnedResult && (
              <div className="mt-4 border-t border-line/70 pt-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">Record</p>
                <WdlBarFilter
                  params={params}
                  w={summary.w}
                  d={summary.d}
                  l={summary.l}
                  activeResult={activeResult}
                />
              </div>
            )
          )}
        </>
      ) : (
        <p className="mt-2 text-sm text-ink-dim">No matches fit this filter. Loosen a control or clear the slice.</p>
      )}
    </section>
  );
}
