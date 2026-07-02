import { GoalDiff } from "@/components/GoalDiff";
import { WdlBar } from "@/components/WdlBar";
import { ResultSpine } from "@/components/charts/ResultSpine";
import { fmtDate } from "@/lib/format";
import type { SequenceMatch } from "@/lib/trails";

/**
 * Answer-first hero for the Matches page: the slice headline, goals ribbon, and
 * result shape (spine on desktop for the full archive; compact W/D/L bar on mobile
 * and on filtered slices).
 */
export function MatchSliceHero({
  summary,
  sequence,
  hasFilters,
  pinnedResult,
  heroValue,
  heroLabel,
  heroTone,
  heroSub,
}: {
  summary: { p: number; w: number; d: number; l: number; gf: number; ga: number; first: string | null; last: string | null };
  sequence: SequenceMatch[];
  hasFilters: boolean;
  pinnedResult?: string;
  heroValue: string;
  heroLabel: string;
  heroTone: string;
  heroSub: string | null;
}) {
  const showSpine = !hasFilters && sequence.length >= 24 && !pinnedResult;

  return (
    <section className="rounded-xl border border-line bg-panel p-3 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.04)] sm:p-5">
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
          <div className="mt-3 flex flex-wrap items-end gap-x-5 gap-y-3 sm:mt-4 sm:gap-x-7 sm:gap-y-4">
            <div className="leading-none">
              <div className="flex items-baseline gap-2">
                <span className={`stat-num text-4xl font-semibold sm:text-6xl ${heroTone}`}>{heroValue}</span>
                <span className="text-sm uppercase tracking-[0.16em] text-ink-faint">{heroLabel}</span>
              </div>
              {heroSub && <p className="stat-num mt-1.5 text-xs text-ink-faint sm:mt-2">{heroSub}</p>}
            </div>
            <GoalDiff
              gf={summary.gf}
              ga={summary.ga}
              played={summary.p}
              size="lg"
              className="w-full border-t border-line pt-3 sm:w-auto sm:border-l sm:border-t-0 sm:pl-7 sm:pt-0"
            />
          </div>

          {showSpine ? (
            <>
              <div className="mt-3 hidden border-t border-line/70 pt-3 sm:mt-4 sm:block">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
                  Result by match over time
                </p>
                <ResultSpine matches={sequence} showRecord={!pinnedResult} />
              </div>
              <div className="mt-3 border-t border-line/70 pt-3 sm:hidden">
                <WdlBar w={summary.w} d={summary.d} l={summary.l} size="md" variant="stacked" showLabels />
              </div>
            </>
          ) : (
            !pinnedResult && (
              <div className="mt-3 border-t border-line/70 pt-3 sm:mt-4">
                <WdlBar w={summary.w} d={summary.d} l={summary.l} size="md" variant="stacked" showLabels />
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
