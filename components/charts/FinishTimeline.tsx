import Link from "next/link";

/**
 * Where United finished, season by season, across the club's whole league
 * history — the *shape of the eras* an alphabetised decade list can never show.
 *
 * The vertical axis is league standing as a continuous "pyramid depth": a
 * top-flight finish sits in the upper band (champions hard against the top, the
 * relegation zone sinking toward the divider) and a second-tier finish drops into
 * the lower band. So the two exiles to the Second Division read as literal
 * valleys, and a promotion as the climb back — honest about the fact that winning
 * the Second Division (a hollow-gold ring) is *not* winning the league (solid gold).
 *
 * Built like {@link ResultSpine}: the connecting line lives in a stretch-to-fit
 * SVG (percentage space, non-scaling stroke) while the dots and labels ride an
 * HTML overlay positioned in percentages, so the dots stay round and the text
 * crisp at any width. Every season is a link to its detail page.
 */

export interface FinishPoint {
  season: string; // "1998-99"
  year: number; // start year, 1998
  competition: string; // "Premier League"
  tier: "top" | "second";
  position: number;
  size: number; // final-table size that season
}

// Vertical layout, in depth units. The top band spans depth 0..1 (champions to
// the foot of the top flight); the second tier opens at SECOND_TOP and runs a
// further 1 unit, so a Second Division champion sits just below a relegated side.
const SECOND_TOP = 1.28;
const MAX_DEPTH = SECOND_TOP + 1;
const Y_TOP = 9; // % headroom above the champions line
const Y_BOT = 90; // % floor below the second tier
const X_PAD = 2.2; // % inset so the first and last seasons clear the edges

function ord(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

function depthOf(p: FinishPoint): number {
  const within = p.size > 1 ? (p.position - 1) / (p.size - 1) : 0;
  return p.tier === "top" ? within : SECOND_TOP + within;
}

export function FinishTimeline({ points }: { points: FinishPoint[] }) {
  if (points.length === 0) return null;
  const pts = [...points].sort((a, b) => a.year - b.year);
  const yMin = pts[0].year;
  const yMax = pts[pts.length - 1].year;
  const span = Math.max(1, yMax - yMin);

  const x = (year: number) => X_PAD + ((year - yMin) / span) * (100 - 2 * X_PAD);
  const y = (depth: number) => Y_TOP + (depth / MAX_DEPTH) * (Y_BOT - Y_TOP);

  // Neighbour-aware state: relegation is "top flight, then second tier next year".
  const decorated = pts.map((p, i) => {
    const next = pts[i + 1];
    const relegated = p.tier === "top" && !!next && next.tier === "second" && next.year === p.year + 1;
    const topChamp = p.tier === "top" && p.position === 1;
    const secondChamp = p.tier === "second" && p.position === 1;
    return { p, relegated, topChamp, secondChamp, cx: x(p.year), cy: y(depthOf(p)) };
  });

  // Connecting line, broken wherever a season is missing (a war, the pre-league
  // years) so we never draw a finish across a gap we don't hold.
  let path = "";
  decorated.forEach((d, i) => {
    const prev = pts[i - 1];
    const broken = !prev || pts[i].year - prev.year !== 1;
    path += `${broken ? "M" : "L"}${d.cx.toFixed(2)} ${d.cy.toFixed(2)} `;
  });

  // Multi-year gaps — the World Wars — shaded so the break reads as "no league
  // that season", not missing data. Labelled where the gap straddles a war.
  const gaps: { from: number; to: number; label: string | null }[] = [];
  for (let i = 1; i < pts.length; i++) {
    const d = pts[i].year - pts[i - 1].year;
    if (d > 2) {
      const from = pts[i - 1].year + 1;
      const to = pts[i].year;
      const label = from <= 1918 && to >= 1915 ? "WWI" : from <= 1945 && to >= 1939 ? "WWII" : null;
      gaps.push({ from, to, label });
    }
  }

  const dividerY = y((1 + SECOND_TOP) / 2);
  const decades: number[] = [];
  for (let dYear = Math.ceil(yMin / 20) * 20; dYear <= yMax; dYear += 20) decades.push(dYear);

  return (
    <figure className="m-0">
      <div className="relative h-64 w-full sm:h-72">
        {/* tier bands behind everything — a faint warm lift for the top flight, a
            deeper shadow for the second tier, so the drop reads as altitude */}
        <div className="absolute inset-x-0 rounded-sm bg-ink/[0.025]" style={{ top: `${Y_TOP}%`, height: `${dividerY - Y_TOP}%` }} aria-hidden />
        <div className="absolute inset-x-0 rounded-sm bg-pitch/50" style={{ top: `${dividerY}%`, height: `${Y_BOT - dividerY}%` }} aria-hidden />

        {/* decade gridlines */}
        {decades.map((dYear) => (
          <div key={dYear} className="absolute top-0 bottom-5 w-px bg-line/45" style={{ left: `${x(dYear)}%` }} aria-hidden />
        ))}

        {/* war-gap shading + labels */}
        {gaps.map((g) => (
          <div
            key={g.from}
            className="absolute top-0 bottom-5 flex items-start justify-center bg-[repeating-linear-gradient(135deg,rgb(255_255_255/0.035)_0,rgb(255_255_255/0.035)_2px,transparent_2px,transparent_6px)]"
            style={{ left: `${x(g.from - 0.5)}%`, width: `${x(g.to - 0.5) - x(g.from - 0.5)}%` }}
            aria-hidden
          >
            {g.label && (
              <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-ink-faint">{g.label}</span>
            )}
          </div>
        ))}

        {/* champions guide + tier divider */}
        <div className="absolute inset-x-0 border-t border-dashed border-gold/35" style={{ top: `${Y_TOP}%` }} aria-hidden />
        <span className="absolute left-0 -translate-y-1/2 text-[10px] font-semibold uppercase tracking-[0.14em] text-gold/70" style={{ top: `${Y_TOP}%` }}>
          Champions
        </span>
        <div className="absolute inset-x-0 border-t border-dotted border-line" style={{ top: `${dividerY}%` }} aria-hidden />
        <span className="absolute right-0 -translate-y-[140%] text-[10px] uppercase tracking-[0.14em] text-ink-faint" style={{ top: `${dividerY}%` }}>
          Second tier
        </span>

        {/* connecting line: stretch-to-fit, 1px regardless of scale */}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
          <path d={path} fill="none" stroke="var(--color-ink-faint)" strokeWidth={1} strokeOpacity={0.5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        </svg>

        {/* dots — one link per season */}
        {decorated.map((d) => {
          const title = `${d.p.season} · ${d.p.competition} · ${ord(d.p.position)} of ${d.p.size}${
            d.topChamp ? " · Champions" : d.secondChamp ? " · Second Division winners" : d.relegated ? " · relegated" : ""
          }`;
          const dot = d.topChamp
            ? "h-2.5 w-2.5 bg-gold ring-2 ring-gold/30"
            : d.secondChamp
              ? "h-2.5 w-2.5 bg-pitch ring-2 ring-gold/80"
              : d.relegated
                ? "h-2 w-2 bg-loss"
                : d.p.tier === "top"
                  ? "h-1.5 w-1.5 bg-ink-dim"
                  : "h-1.5 w-1.5 bg-ink-faint/70";
          return (
            <Link
              key={d.p.season}
              href={`/seasons/${d.p.season}`}
              title={title}
              className="group absolute z-10 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full p-1.5 focus-ring"
              style={{ left: `${d.cx}%`, top: `${d.cy}%` }}
            >
              <span
                className={`block rounded-full shadow-[0_0_0_2px_var(--color-pitch)] transition-transform duration-150 group-hover:scale-150 ${dot}`}
              />
            </Link>
          );
        })}
      </div>

      {/* decade axis */}
      <div className="relative mt-0.5 h-3.5">
        {decades.map((dYear) => (
          <span key={dYear} className="stat-num absolute -translate-x-1/2 text-[10px] text-ink-faint" style={{ left: `${x(dYear)}%` }}>
            {dYear % 100 === 0 ? dYear : `'${String(dYear).slice(2)}`}
          </span>
        ))}
      </div>

      {/* legend — one quiet line, encoding stated where colour carries meaning */}
      <figcaption className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line/70 pt-3 text-[11px] text-ink-faint">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-gold ring-2 ring-gold/30" />
          League champions
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-pitch ring-2 ring-gold/80" />
          Won the Second Division
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-loss" />
          Relegated
        </span>
        <span className="text-ink-dim">Lower band is the second tier · every point opens its season</span>
      </figcaption>
    </figure>
  );
}
