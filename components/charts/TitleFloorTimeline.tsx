import Link from "next/link";
import type { FloorTimelinePoint } from "@/lib/trails";

/**
 * Where the championship floor held — and where it dropped. One continuous
 * timeline from Ferguson's arrival to now: league position on the vertical axis
 * (champions at the top), calendar time on the horizontal. A vertical hinge at
 * May 2013 splits the warm Ferguson band from the cooler years since; a dashed
 * top-four line marks the floor United used to stand on. Built like
 * {@link FinishTimeline}: stretch-to-fit SVG line, crisp HTML dots, every season
 * a link.
 */
export function TitleFloorTimeline({
  points,
  fergTitles,
  sinceTitles,
  fergAvg,
  sinceAvg,
  compact = false,
}: {
  points: FloorTimelinePoint[];
  fergTitles: number;
  sinceTitles: number;
  fergAvg: number;
  sinceAvg: number;
  compact?: boolean;
}) {
  if (points.length === 0) return null;
  const pts = [...points].sort((a, b) => a.year - b.year);
  const yMin = pts[0].year;
  const yMax = pts[pts.length - 1].year;
  const span = Math.max(1, yMax - yMin);
  const hingeYear = 2013;
  const maxSize = Math.max(20, ...pts.map((p) => p.leagueSize));

  const X_PAD = 4;
  const x = (year: number) => X_PAD + ((year - yMin) / span) * (100 - 2 * X_PAD);
  const hingeX = x(hingeYear + 0.35);

  // Depth 0 = champions, 1 = foot of the table — same pyramid read as FinishTimeline.
  const Y_TOP = compact ? 14 : 10;
  const Y_BOT = compact ? 88 : 84;
  const y = (position: number, size: number) => {
    const within = size > 1 ? (position - 1) / (size - 1) : 0;
    return Y_TOP + within * (Y_BOT - Y_TOP);
  };
  const topFourY = y(4, maxSize);

  const decorated = pts.map((p) => ({
    p,
    cx: x(p.year),
    cy: y(p.position, p.leagueSize),
    worst: p.postFerguson && p.position === Math.max(...pts.filter((q) => q.postFerguson).map((q) => q.position)),
  }));

  const pre = decorated.filter((d) => !d.p.postFerguson);
  const post = decorated.filter((d) => d.p.postFerguson);

  const pathBefore = pre
    .map((d, i) => `${i === 0 ? "M" : "L"}${d.cx.toFixed(2)} ${d.cy.toFixed(2)}`)
    .join(" ");

  let pathAfter = "";
  if (post.length) {
    const bridge = pre.length ? `M${pre[pre.length - 1].cx.toFixed(2)} ${pre[pre.length - 1].cy.toFixed(2)} ` : "";
    pathAfter =
      bridge
      + post.map((d, i) => `${!pre.length && i === 0 ? "M" : "L"}${d.cx.toFixed(2)} ${d.cy.toFixed(2)}`).join(" ");
  }

  const decades: number[] = [];
  for (let dYear = Math.ceil(yMin / 10) * 10; dYear <= yMax; dYear += 10) decades.push(dYear);

  const heightClass = compact ? "h-44 sm:h-48" : "h-56 sm:h-72";

  return (
    <figure className="m-0">
      <div className={`relative w-full overflow-visible ${heightClass}`}>
        {/* Era bands — warm left, cool right, meeting at the hinge */}
        <div
          className="absolute inset-y-0 left-0 rounded-l-md bg-devil/[0.04]"
          style={{ width: `${hingeX}%` }}
          aria-hidden
        />
        <div
          className="absolute inset-y-0 rounded-r-md bg-europe/[0.05]"
          style={{ left: `${hingeX}%`, right: 0 }}
          aria-hidden
        />

        {/* Decade guides */}
        {decades.map((dYear) => (
          <div key={dYear} className="absolute top-0 bottom-6 w-px bg-line/40" style={{ left: `${x(dYear)}%` }} aria-hidden />
        ))}

        {/* The hinge */}
        <div
          className="absolute top-0 bottom-6 w-px bg-ink-faint/80"
          style={{ left: `${hingeX}%` }}
          aria-hidden
        />
        {!compact && (
          <span
            className="absolute -translate-x-1/2 text-[10px] font-medium uppercase tracking-[0.12em] text-ink-dim"
            style={{ left: `${hingeX}%`, top: "2%" }}
          >
            Ferguson left · May 2013
          </span>
        )}

        {/* Champions + top-four floor guides */}
        <div className="absolute inset-x-0 border-t border-dashed border-gold/40" style={{ top: `${Y_TOP}%` }} aria-hidden />
        {!compact && (
          <span className="absolute left-0 -translate-y-1/2 text-[10px] font-semibold uppercase tracking-[0.14em] text-gold/75" style={{ top: `${Y_TOP}%` }}>
            Champions
          </span>
        )}
        <div className="absolute inset-x-0 border-t border-dashed border-win/25" style={{ top: `${topFourY}%` }} aria-hidden />
        {!compact && (
          <span className="absolute right-0 -translate-y-1/2 text-[10px] uppercase tracking-[0.12em] text-win/60" style={{ top: `${topFourY}%` }}>
            Top four
          </span>
        )}

        {/* Era callouts — titles + average, anchored in each band */}
        {!compact && (
          <>
            <div className="absolute left-[8%] top-[18%] max-w-[9rem] text-center" style={{ width: `${Math.max(18, hingeX - 10)}%` }}>
              <div className="stat-num text-3xl font-semibold leading-none text-gold sm:text-4xl">{fergTitles}</div>
              <div className="mt-1 text-[10px] uppercase tracking-wider text-ink-faint">titles · avg {fergAvg.toFixed(1)}</div>
            </div>
            <div className="absolute right-[4%] top-[38%] max-w-[9rem] text-center" style={{ width: `${Math.max(18, 100 - hingeX - 8)}%` }}>
              <div className="stat-num text-3xl font-semibold leading-none text-ink-dim sm:text-4xl">{sinceTitles}</div>
              <div className="mt-1 text-[10px] uppercase tracking-wider text-ink-faint">titles since · avg {sinceAvg.toFixed(1)}</div>
            </div>
          </>
        )}

        {/* Trajectory — two strokes meeting at the hinge */}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
          {pathBefore && (
            <path
              d={pathBefore}
              fill="none"
              stroke="var(--color-devil-bright)"
              strokeWidth={compact ? 1.2 : 1.6}
              strokeOpacity={0.55}
              vectorEffect="non-scaling-stroke"
              strokeLinejoin="round"
            />
          )}
          {pathAfter && (
            <path
              d={pathAfter}
              fill="none"
              stroke="var(--color-europe)"
              strokeWidth={compact ? 1.2 : 1.6}
              strokeOpacity={0.7}
              vectorEffect="non-scaling-stroke"
              strokeLinejoin="round"
            />
          )}
        </svg>

        {/* Season dots */}
        {decorated.map((d) => {
          const title = `${d.p.season} · ${d.p.champion ? "Champions" : `${d.p.position}${ordSuffix(d.p.position)}`}${d.worst ? " · lowest since Ferguson" : ""}`;
          const dot = d.p.champion
            ? "h-2.5 w-2.5 bg-gold ring-2 ring-gold/35"
            : d.worst
              ? "h-3 w-3 bg-loss ring-2 ring-loss/40"
              : d.p.postFerguson
                ? "h-2 w-2 bg-europe/90"
                : "h-2 w-2 bg-devil-bright/85";
          return (
            <Link
              key={d.p.season}
              href={`/matches?season=${d.p.season}&sort=oldest`}
              title={title}
              className="group absolute z-10 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full p-1 focus-ring"
              style={{ left: `${d.cx}%`, top: `${d.cy}%` }}
            >
              <span
                className={`block rounded-full shadow-[0_0_0_2px_var(--color-pitch)] transition-transform duration-150 group-hover:scale-150 ${dot}`}
              />
            </Link>
          );
        })}
      </div>

      {/* Time axis */}
      <div className="relative mt-0.5 h-3.5">
        {decades.map((dYear) => (
          <span key={dYear} className="stat-num absolute -translate-x-1/2 text-[10px] text-ink-faint" style={{ left: `${x(dYear)}%` }}>
            {dYear % 100 === 0 ? `'${String(dYear).slice(2)}` : `'${String(dYear).slice(2)}`}
          </span>
        ))}
        <span className="stat-num absolute left-0 text-[10px] text-ink-faint">{yMin}</span>
        <span className="stat-num absolute right-0 text-[10px] text-ink-faint">{yMax + 1}</span>
      </div>

      {!compact && (
        <figcaption className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line/70 pt-3 text-[11px] text-ink-faint">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-gold ring-2 ring-gold/35" />
            Title
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-devil-bright/85" />
            Ferguson era
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-europe/90" />
            Since Ferguson
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-loss ring-2 ring-loss/40" />
            Lowest finish
          </span>
          <span className="text-ink-dim">Higher is better · every point opens that season</span>
        </figcaption>
      )}
    </figure>
  );
}

function ordSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] ?? s[v] ?? s[0];
}
