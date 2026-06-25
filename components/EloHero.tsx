import Link from "next/link";
import { EloRatingChart } from "@/components/charts/EloRatingChart";
import { fmtMonthYear } from "@/lib/format";

/**
 * The page's hero: the closed-universe Elo as a floodlit plate, sharing the
 * `IdentityPlate` atmosphere (pitch-line texture, a single red wash, deep
 * shadow). The current rating is promoted to a real headline figure with peak
 * and low as a hairline ribbon beside it, then the full-width era-shaded
 * timeline below. This is the analytics equivalent of the seasons `FinishTimeline`
 * opening — the strength signal as the thing you see before you read.
 */
export function EloHero({
  points, eras, trophyMarkers, current, peak, trough, firstYear,
}: {
  points: { date: string; elo: number }[];
  eras: { from: string; to: string; label?: string }[];
  trophyMarkers?: { date: string; season: string }[];
  current: number;
  peak: { elo: number; date: string };
  trough: { elo: number; date: string };
  firstYear?: string;
}) {
  return (
    <section className="relative overflow-hidden rounded-xl border border-line bg-panel shadow-[0_22px_44px_rgb(0_0_0_/0.22)]">
      <div className="hero-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div
        className="pointer-events-none absolute -right-24 -top-28 h-72 w-2/3 rounded-full opacity-[0.12] blur-3xl"
        style={{ backgroundColor: "var(--color-devil)" }}
        aria-hidden
      />

      <div className="relative p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-devil-bright">Rating signal</p>
            <h2 className="display mt-1 text-2xl sm:text-3xl">Elo rating, {firstYear}–today</h2>
          </div>
          <Link href="/matches" className="text-sm text-devil-bright hover:underline">Open match browser →</Link>
        </div>

        {/* The current rating is the answer; peak and low ride beside it as a ribbon. */}
        <div className="mt-5 flex flex-wrap items-end gap-x-8 gap-y-4">
          <div className="leading-none">
            <div className="flex items-baseline gap-2">
              <span className="stat-num text-5xl font-semibold text-devil-bright sm:text-6xl">{current}</span>
              <span className="text-sm uppercase tracking-[0.16em] text-ink-faint">now</span>
            </div>
            <p className="stat-num mt-2 text-xs text-ink-faint">1500 is an average side</p>
          </div>
          <dl className="flex flex-wrap items-end gap-x-8 gap-y-3.5 border-l border-line pl-6">
            <div className="leading-none">
              <dd className="stat-num text-xl font-semibold text-win">{Math.round(peak.elo)}</dd>
              <dt className="mt-1.5 text-[11px] uppercase tracking-[0.13em] text-ink-faint">
                Peak <span className="ml-1 normal-case tracking-normal text-ink-dim">{fmtMonthYear(peak.date.slice(0, 10))}</span>
              </dt>
            </div>
            <div className="leading-none">
              <dd className="stat-num text-xl font-semibold text-loss">{Math.round(trough.elo)}</dd>
              <dt className="mt-1.5 text-[11px] uppercase tracking-[0.13em] text-ink-faint">
                Low <span className="ml-1 normal-case tracking-normal text-ink-dim">{fmtMonthYear(trough.date.slice(0, 10))}</span>
              </dt>
            </div>
          </dl>
        </div>

        <div className="mt-6">
          <EloRatingChart points={points} height={300} eras={eras} trophyMarkers={trophyMarkers} />
        </div>

        <p className="mt-3 max-w-2xl text-xs text-ink-faint">
          <span className="text-ink-dim">Slice:</span> every competitive match, closed-universe Elo — opponents are
          rated only on their matches against United, K varies by competition and goal margin, home advantage worth
          60 points. Shaded bands mark managerial eras, the longest-serving labelled; gold dots mark trophy-winning
          seasons. This rating drives the favourites line on every match page.
        </p>
      </div>
    </section>
  );
}
