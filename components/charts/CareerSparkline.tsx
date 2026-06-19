/**
 * A player's whole career as one small multiple, drawn on a timeline *shared* by
 * every row — so scanning the column shows careers slide through history: the
 * Victorian pros bunched left, the Busby Babes mid-track, the modern lot far right,
 * each cluster's width its longevity. Within a player's window, one thin bar per
 * season: height is appearances that year (one global scale, so a regular's career
 * is a solid wall and a cup cameo a faint blip), with the scoring share burning
 * devil-red up from the baseline (a striker glows red, a defender stays grey).
 *
 * Pure positioned HTML, server-rendered: bars sit by calendar year on the shared
 * axis (consecutive seasons overlap into a continuous silhouette, gaps show as
 * gaps), so it stays crisp at any column width with no SVG scaling. The precise
 * span rides beneath as a caption, carrying the exact years the old text column did.
 */
export interface CareerSparkSeason {
  season: string; // "1965-66"
  apps: number;
  goals: number;
}

const startYear = (season: string) => Number(season.slice(0, 4));

export function CareerSparkline({
  seasons,
  axisStart,
  axisEnd,
  maxScale,
  fallback,
}: {
  seasons: CareerSparkSeason[];
  /** First year on the shared axis (same for every row). */
  axisStart: number;
  /** Last year on the shared axis (same for every row). */
  axisEnd: number;
  /** Global max of max(apps, goals) across all season-rows — the height scale. */
  maxScale: number;
  /** Rendered when the player has no match-attributed seasons (e.g. early pros). */
  fallback: React.ReactNode;
}) {
  const rows = seasons.filter((s) => s.apps > 0 || s.goals > 0);
  if (rows.length === 0) return <>{fallback}</>;

  const span = Math.max(axisEnd - axisStart, 1);
  const years = rows.map((s) => startYear(s.season));
  const firstYear = Math.min(...years);
  const lastYear = Math.max(...years);
  const totalGoals = rows.reduce((n, s) => n + s.goals, 0);
  const peak = rows.reduce((best, s) => (s.apps > best.apps ? s : best), rows[0]);

  // Quarter-century guides, shared and aligned down every row, so the empty space
  // reads as one timeline grid rather than 50 clusters floating in voids — this is
  // what makes "scan the column and watch the eras line up" actually land.
  const guides: number[] = [];
  for (let y = Math.ceil(axisStart / 25) * 25; y < axisEnd; y += 25) guides.push(y);

  const label =
    `Career ${firstYear}–${lastYear}: ${totalGoals} goal${totalGoals === 1 ? "" : "s"} across ` +
    `${rows.length} season${rows.length === 1 ? "" : "s"}; busiest ${peak.season} (${peak.apps} apps).`;

  return (
    <figure className="m-0 w-[132px] max-w-full" aria-label={label}>
      <div className="relative h-8" role="img">
        {/* quarter-century guides — the shared backdrop that anchors every cluster
            to the same timeline (faint enough to read as structure, not graph paper) */}
        {guides.map((y) => (
          <div
            key={y}
            className="absolute bottom-0 top-1 w-px bg-line/45"
            style={{ left: `${((y - axisStart) / span) * 100}%` }}
            aria-hidden
          />
        ))}
        {/* the shared axis the bars stand on */}
        <div className="absolute inset-x-0 bottom-0 border-t border-line/70" aria-hidden />
        {rows.map((s) => {
          const year = startYear(s.season);
          const left = ((year - axisStart) / span) * 100;
          const total = Math.max(s.apps, s.goals);
          const heightPct = Math.max((total / maxScale) * 100, 8); // floor so a cameo still ticks
          // goals burn up from the base; the rest is appearances without a goal
          const goalPct = total > 0 ? (s.goals / total) * 100 : 0;
          const title = `${s.season}: ${s.apps} app${s.apps === 1 ? "" : "s"}${s.goals ? `, ${s.goals} goal${s.goals === 1 ? "" : "s"}` : ""}`;
          return (
            <div
              key={s.season}
              title={title}
              className="absolute bottom-0 flex w-[3px] -translate-x-1/2 flex-col-reverse overflow-hidden rounded-t-[1px]"
              style={{ left: `${left}%`, height: `${heightPct}%` }}
            >
              <div className="bg-devil-bright" style={{ height: `${goalPct}%` }} />
              <div className="bg-ink-dim/30" style={{ height: `${100 - goalPct}%` }} />
            </div>
          );
        })}

        {/* peak-season accent — a single gold pip over the busiest season, the
            gold-marks-the-peak idiom already used in PlayerPlate's CareerArc. Only
            for real careers (≥5 seasons), so a cameo's lone bar never wears it. */}
        {rows.length >= 5 && (
          <span
            className="absolute z-10 h-1 w-1 -translate-x-1/2 rounded-full bg-gold shadow-[0_0_0_1px_var(--color-panel)]"
            style={{
              left: `${((startYear(peak.season) - axisStart) / span) * 100}%`,
              bottom: `${Math.max((Math.max(peak.apps, peak.goals) / maxScale) * 100, 8)}%`,
            }}
            aria-hidden
          />
        )}
      </div>
      <figcaption className="stat-num mt-0.5 text-[10px] leading-none text-ink-faint">
        {firstYear === lastYear
          ? firstYear
          : `${firstYear}–${Math.floor(firstYear / 100) === Math.floor(lastYear / 100) ? String(lastYear).slice(2) : lastYear}`}
      </figcaption>
    </figure>
  );
}
