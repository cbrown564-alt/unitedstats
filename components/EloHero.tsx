import Link from "next/link";
import { EloRatingChart } from "@/components/charts/EloRatingChart";
import { TrophyMarkerStrip } from "@/components/charts/TrophyMarkerStrip";
import { CoverageNote } from "@/components/CoverageNote";
import { fmtMonthYear } from "@/lib/format";

const ELO_SLICE =
  "every competitive match, closed-universe Elo — opponents are rated only on their matches against United, K varies by competition and goal margin, home advantage worth 60 points. Shaded bands mark managerial eras, the longest-serving labelled. This rating drives the favourites line on every match page.";

/**
 * The page's hero: the closed-universe Elo as a floodlit plate, sharing the
 * `IdentityPlate` atmosphere (pitch-line texture, a single red wash, deep
 * shadow). The current rating is promoted to a real headline figure with peak
 * and low as a hairline ribbon beside it, then the full-width era-shaded
 * timeline below. This is the analytics equivalent of the seasons `FinishTimeline`
 * opening — the strength signal as the thing you see before you read.
 *
 * `compact` drops the in-plate title (chapter pager carries it) and tightens
 * the chart for a single mobile viewport.
 */
export function EloHero({
  points, eras, trophyMarkers, current, peak, trough, firstYear, compact = false,
}: {
  points: { date: string; elo: number }[];
  eras: { from: string; to: string; label?: string }[];
  trophyMarkers?: { date: string; season: string; count: number }[];
  current: number;
  peak: { elo: number; date: string };
  trough: { elo: number; date: string };
  firstYear?: string;
  compact?: boolean;
}) {
  const xMin = points.length ? Date.parse(points[0].date) : 0;
  const xMax = points.length ? Date.parse(points[points.length - 1].date) : xMin;

  return (
    <section className="relative overflow-hidden rounded-xl border border-line bg-panel shadow-[0_22px_44px_rgb(0_0_0_/0.22)]">
      <div className="hero-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div
        className="pointer-events-none absolute -right-24 -top-28 h-72 w-2/3 rounded-full opacity-[0.12] blur-3xl"
        style={{ backgroundColor: "var(--color-devil)" }}
        aria-hidden
      />

      <div className={`relative ${compact ? "p-4" : "p-5 sm:p-6"}`}>
        {!compact && (
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-devil-bright">Rating signal</p>
              <h2 className="display mt-1 text-2xl sm:text-3xl">Elo rating, {firstYear}–today</h2>
            </div>
            <Link href="/matches" className="text-sm text-devil-bright hover:underline">Open match browser →</Link>
          </div>
        )}

        {/* Current rating with peak/low on one row — critical on narrow chapter slides. */}
        <div className={`flex items-end justify-between gap-3 ${compact ? "" : "mt-5 sm:flex-wrap sm:gap-x-8 sm:gap-y-4"}`}>
          <div className="min-w-0 shrink-0 leading-none">
            <div className="flex items-baseline gap-1.5 sm:gap-2">
              <span className={`stat-num font-semibold text-devil-bright ${compact ? "text-4xl" : "text-5xl sm:text-6xl"}`}>
                {current}
              </span>
              <span className="text-[10px] uppercase tracking-[0.16em] text-ink-faint sm:text-sm">now</span>
            </div>
            {!compact && (
              <p className="stat-num mt-2 hidden text-xs text-ink-faint sm:block">1500 is an average side</p>
            )}
          </div>
          <dl className="flex shrink-0 items-end gap-4 sm:gap-x-8 sm:border-l sm:border-line sm:pl-6">
            <div className="leading-none">
              <dd className={`stat-num font-semibold text-win ${compact ? "text-base" : "text-xl"}`}>
                {Math.round(peak.elo)}
              </dd>
              <dt className="mt-1 text-[10px] uppercase tracking-[0.13em] text-ink-faint sm:mt-1.5 sm:text-[11px]">
                Peak{" "}
                <span className="ml-0.5 normal-case tracking-normal text-ink-dim sm:ml-1">
                  {fmtMonthYear(peak.date.slice(0, 10))}
                </span>
              </dt>
            </div>
            <div className="leading-none">
              <dd className={`stat-num font-semibold text-loss ${compact ? "text-base" : "text-xl"}`}>
                {Math.round(trough.elo)}
              </dd>
              <dt className="mt-1 text-[10px] uppercase tracking-[0.13em] text-ink-faint sm:mt-1.5 sm:text-[11px]">
                Low{" "}
                <span className="ml-0.5 normal-case tracking-normal text-ink-dim sm:ml-1">
                  {fmtMonthYear(trough.date.slice(0, 10))}
                </span>
              </dt>
            </div>
          </dl>
        </div>
        <p className="stat-num mt-1.5 text-[10px] text-ink-faint sm:hidden">1500 is an average side</p>

        <div className={compact ? "mt-3" : "mt-6"}>
          <EloRatingChart points={points} height={compact ? 210 : 300} eras={eras} />
          {trophyMarkers && trophyMarkers.length > 0 && (
            <TrophyMarkerStrip markers={trophyMarkers} xMin={xMin} xMax={xMax} />
          )}
        </div>

        <CoverageNote slice={ELO_SLICE} collapsible summary="Slice & methodology" className={compact ? "mt-2" : "mt-3"} />
      </div>
    </section>
  );
}
