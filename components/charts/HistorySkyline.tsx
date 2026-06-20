import Link from "next/link";

/**
 * The club's entire life as one object: every season a vertical bar whose height
 * is the matches played that year, stacked won (red, the foundation) → drawn
 * (neutral) → lost (slate-blue, the roofline). So the wall *breathes* — short bars in the
 * Victorian league, the post-war swell, the modern era thick with European nights —
 * and its total inked area is, literally, every match United have played. The red
 * lower band rising and falling traces the eras; a relegation year wears a heavy slate
 * roofline. Championship seasons carry a gold marker, the one sparing accent.
 *
 * Pure CSS/flex, server-rendered: each season is a flex column growing from the
 * baseline, so the bars stay crisp at any width with no SVG scaling. Every bar is a
 * link into its season.
 */
export interface SkylineSeason {
  season: string; // "1998-99"
  p: number; // matches played
  w: number;
  d: number;
  l: number;
}

export function HistorySkyline({
  seasons,
  champions,
}: {
  seasons: SkylineSeason[];
  champions: Set<string>;
}) {
  if (seasons.length === 0) return null;
  const rows = [...seasons].sort((a, b) => a.season.localeCompare(b.season));
  const maxP = Math.max(...rows.map((s) => s.p), 1);

  const firstYear = Number(rows[0].season.slice(0, 4));
  const lastYear = Number(rows[rows.length - 1].season.slice(0, 4));
  // 20-year ticks, like the seasons FinishTimeline, so the axis stays uncrowded
  // under ~135 bars. Index-positioned (not year-positioned) to line up with the
  // flex bars, which are evenly spaced by season, not by calendar year.
  // 20-year ticks, but skipped within a decade of either endpoint so they never
  // collide with the explicit first/last-year labels at the axis edges.
  const ticks: { year: number; label: string; left: number }[] = [];
  rows.forEach((s, i) => {
    const year = Number(s.season.slice(0, 4));
    if (year % 20 === 0 && year - firstYear >= 10 && lastYear - year >= 10) {
      ticks.push({
        year,
        label: year % 100 === 0 ? String(year) : `’${String(year).slice(2)}`,
        left: ((i + 0.5) / rows.length) * 100,
      });
    }
  });

  return (
    <figure className="m-0">
      <div className="relative h-44 w-full sm:h-52">
        {/* baseline the bars stand on */}
        <div className="absolute inset-x-0 bottom-0 border-t border-line/70" aria-hidden />
        {/* 20-year guides */}
        {ticks.map((t) => (
          <div key={t.year} className="absolute bottom-0 top-0 w-px bg-line/30" style={{ left: `${t.left}%` }} aria-hidden />
        ))}

        <div className="absolute inset-0 flex items-stretch">
          {rows.map((s) => {
            const barH = (s.p / maxP) * 100;
            const champ = champions.has(s.season);
            const title = `${s.season} · ${s.p} matches · ${s.w}W ${s.d}D ${s.l}L${champ ? " · champions" : ""}`;
            return (
              <Link
                key={s.season}
                href={`/seasons/${s.season}`}
                title={title}
                aria-label={title}
                className="group relative min-w-0 flex-1 focus-ring"
              >
                <div
                  className={`absolute inset-x-0 bottom-0 flex flex-col-reverse overflow-hidden rounded-t-[1.5px] transition-[filter] duration-150 group-hover:brightness-125 ${
                    champ ? "shadow-[inset_0_2px_0_var(--color-gold)]" : ""
                  }`}
                  style={{ height: `${barH}%` }}
                >
                  <div className="bg-win/75" style={{ height: `${(s.w / s.p) * 100}%` }} />
                  <div className="bg-draw/55" style={{ height: `${(s.d / s.p) * 100}%` }} />
                  <div className="bg-loss/70" style={{ height: `${(s.l / s.p) * 100}%` }} />
                </div>
                {champ && (
                  <span
                    className="absolute left-1/2 z-10 mb-[3px] h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-gold shadow-[0_0_0_1.5px_var(--color-panel)]"
                    style={{ bottom: `${barH}%` }}
                    aria-hidden
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* decade axis */}
      <div className="relative mt-1 h-3.5">
        {ticks.map((t) => (
          <span key={t.year} className="stat-num absolute -translate-x-1/2 text-[10px] text-ink-faint" style={{ left: `${t.left}%` }}>
            {t.label}
          </span>
        ))}
        <span className="stat-num absolute right-0 text-[10px] text-ink-faint">{lastYear}</span>
        <span className="stat-num absolute left-0 text-[10px] text-ink-faint">{firstYear}</span>
      </div>

      {/* legend — encoding stated once, where colour and the gold accent carry meaning */}
      <figcaption className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line/70 pt-3 text-[11px] text-ink-faint">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-win/75" />Won</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-draw/45" />Drawn</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-loss/70" />Lost</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-gold" />League champions</span>
        <span className="text-ink-dim">Bar height is matches played that season · every bar opens its season</span>
      </figcaption>
    </figure>
  );
}
