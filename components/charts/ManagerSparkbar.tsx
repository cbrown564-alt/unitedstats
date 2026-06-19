/**
 * One manager's tenure as a small multiple on a timeline *shared* by every row of
 * the index — so scanning the column shows the whole succession slide through
 * history (the secretaries bunched left, Busby mid-track, Ferguson far right), each
 * man's block as wide as his tenure was long. Within his window, one thin bar per
 * season: height is matches played that year on one global scale (a full modern
 * campaign towers over a wartime sliver), stacked won → drawn → lost up from the
 * baseline — the same green-foundation / red-roof encoding as the {@link
 * ManagerTimeline} hero. Each row is that hero zoomed to a single man and re-pinned
 * from match-proportional width to real calendar time.
 *
 * Pure positioned HTML on the row's shared grid column (percentage axis + bar
 * widths), so the timeline lines up exactly down the page with no SVG scaling.
 */
export interface ManagerSparkSeason {
  season: string; // "1965-66"
  w: number;
  d: number;
  l: number;
}

const startYear = (season: string) => Number(season.slice(0, 4));

export function ManagerSparkbar({
  seasons,
  axisStart,
  axisEnd,
  maxScale,
  trophySeasons,
}: {
  seasons: ManagerSparkSeason[];
  /** First year on the shared axis (same for every row). */
  axisStart: number;
  /** Last year on the shared axis (same for every row). */
  axisEnd: number;
  /** Global max of matches-in-a-season across all rows — the height scale. */
  maxScale: number;
  /** Seasons (start-year "1998-99" form) this manager won a trophy — gold pips
   *  over those bars, so the timeline shows *when* the silverware came. */
  trophySeasons?: Set<string>;
}) {
  const rows = seasons.filter((s) => s.w + s.d + s.l > 0);
  if (rows.length === 0) return null;

  const span = Math.max(axisEnd - axisStart, 1);
  // Bar a touch wider than a year's slice so consecutive seasons fuse into one
  // continuous block — a tenure reads as a solid silhouette, a gap year as a gap.
  const barW = Math.max((1.5 / span) * 100, 0.5);

  // Quarter-century guides, shared and aligned down every row, so the empty track
  // reads as one timeline grid rather than rows of clusters floating in voids —
  // the same anchor CareerSparkline uses on the players index.
  const guides: number[] = [];
  for (let y = Math.ceil(axisStart / 25) * 25; y < axisEnd; y += 25) guides.push(y);

  const games = rows.reduce((n, s) => n + s.w + s.d + s.l, 0);
  const wins = rows.reduce((n, s) => n + s.w, 0);
  const years = rows.map((s) => startYear(s.season));
  const label =
    `${Math.min(...years)}–${Math.max(...years)}: ${games} matches, ${Math.round((100 * wins) / games)}% won, ` +
    `across ${rows.length} season${rows.length === 1 ? "" : "s"}.`;

  return (
    <div className="relative h-9 w-full" role="img" aria-label={label}>
      {guides.map((y) => (
        <div
          key={y}
          className="absolute bottom-0 top-0.5 w-px bg-line/40"
          style={{ left: `${((y - axisStart) / span) * 100}%` }}
          aria-hidden
        />
      ))}
      {/* the shared axis the bars stand on */}
      <div className="absolute inset-x-0 bottom-0 border-t border-line/60" aria-hidden />
      {rows.map((s) => {
        const g = s.w + s.d + s.l;
        const left = ((startYear(s.season) - axisStart) / span) * 100;
        const heightPct = Math.max((g / maxScale) * 100, 12); // floor so a short season still ticks
        const title = `${s.season}: ${g} played · ${s.w}W ${s.d}D ${s.l}L`;
        return (
          <div
            key={s.season}
            title={title}
            className="absolute bottom-0 flex -translate-x-1/2 flex-col-reverse overflow-hidden rounded-t-[1px]"
            style={{ left: `${left}%`, width: `${barW}%`, height: `${heightPct}%` }}
          >
            <div className="bg-win/85" style={{ height: `${(s.w / g) * 100}%` }} />
            <div className="bg-draw/55" style={{ height: `${(s.d / g) * 100}%` }} />
            <div className="bg-loss/80" style={{ height: `${(s.l / g) * 100}%` }} />
          </div>
        );
      })}

      {/* gold trophy pips — a dot riding just above each trophy-winning season's
          bar, so a decorated reign glows gold along its top edge while the barren
          tenures stay dark. The gold-marks-the-peak idiom (CareerSparkline, the
          season heroes), here marking silverware. */}
      {trophySeasons &&
        rows
          .filter((s) => trophySeasons.has(s.season))
          .map((s) => {
            const g = s.w + s.d + s.l;
            const left = ((startYear(s.season) - axisStart) / span) * 100;
            const heightPct = Math.max((g / maxScale) * 100, 12);
            return (
              <span
                key={s.season}
                className="absolute z-10 h-1 w-1 -translate-x-1/2 translate-y-1/2 rounded-full bg-gold shadow-[0_0_0_1px_var(--color-panel)]"
                style={{ left: `${left}%`, bottom: `${heightPct}%` }}
                aria-hidden
              />
            );
          })}
    </div>
  );
}
