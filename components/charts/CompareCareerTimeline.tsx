import Link from "next/link";
import { familyName } from "@/lib/names";
import type { CompareSide } from "@/lib/compare";
import { fmtYearRange } from "@/lib/format";

/** United's recorded match history begins in 1886 (Newton Heath). */
const CLUB_AXIS_START = 1886;

const A_COLOR = "var(--color-devil-bright)";
const B_COLOR = "var(--color-europe)";

/** Vertical position (% from top) for each rail and the shared centre axis. */
const A_RAIL = 37;
const AXIS = 50;
const B_RAIL = 63;

type CareerStint = { first: number; last: number };

/** Present-day anchor on the club axis — last full calendar year, not the current
 *  one, so a quarter-century guide (2025) never collides with the terminal label. */
function defaultAxisEnd(): number {
  return new Date().getFullYear() - 1;
}

function axisGuides(axisStart: number, axisEnd: number): number[] {
  const out: number[] = [];
  for (let y = Math.ceil(axisStart / 25) * 25; y < axisEnd; y += 25) {
    if (at(y, axisStart, axisEnd) > 92) continue;
    out.push(y);
  }
  return out;
}

function at(year: number, axisStart: number, axisEnd: number): number {
  const span = Math.max(axisEnd - axisStart, 1);
  return ((Math.min(Math.max(year, axisStart), axisEnd) - axisStart) / span) * 100;
}

function stintsForSide(side: CompareSide): CareerStint[] {
  if (side.careerStints?.length) return side.careerStints;
  if (side.careerFirst != null && side.careerLast != null) {
    return [{ first: side.careerFirst, last: side.careerLast }];
  }
  return [];
}

function overlapCaption(
  aFirst: number,
  aLast: number,
  bFirst: number,
  bLast: number,
  labelA: string,
  labelB: string,
): string {
  const overlapStart = Math.max(aFirst, bFirst);
  const overlapEnd = Math.min(aLast, bLast);
  if (overlapStart <= overlapEnd) {
    const years = overlapEnd - overlapStart + 1;
    return `${labelA} and ${labelB} overlapped at United for ${years} year${years === 1 ? "" : "s"} (${fmtYearRange(overlapStart, overlapEnd)}).`;
  }
  const gapStart = Math.min(aLast, bLast);
  const gapEnd = Math.max(aFirst, bFirst);
  const gap = gapEnd - gapStart - 1;
  if (gap <= 0) return `${labelA} and ${labelB} on the same club timeline — careers just missed each other.`;
  return `${gap} year${gap === 1 ? "" : "s"} between their United careers (${fmtYearRange(gapStart + 1, gapEnd - 1)}).`;
}

function CareerSpan({
  side,
  stints,
  axisStart,
  axisEnd,
  yPct,
  color,
  above,
}: {
  side: CompareSide;
  stints: CareerStint[];
  axisStart: number;
  axisEnd: number;
  yPct: number;
  color: string;
  /** Player A sits above the centre axis; B below — year labels follow each cap. */
  above: boolean;
}) {
  if (stints.length === 0) return null;

  const overallFirst = stints[0].first;
  const overallLast = stints[stints.length - 1].last;
  const xOverall1 = at(overallFirst, axisStart, axisEnd);
  const xOverall2 = at(overallLast, axisStart, axisEnd);
  const surname = familyName(side.label);
  const title = `${side.label} · ${fmtYearRange(overallFirst, overallLast)}`;
  const labelAtLeft = xOverall1 > 55;

  const yearColor = `color-mix(in srgb, ${color} 62%, var(--color-panel))`;
  const yearOffset = above
    ? "-translate-x-1/2 -translate-y-[calc(100%+5px)]"
    : "-translate-x-1/2 translate-y-[calc(100%+5px)]";
  const yearCls = `stat-num pointer-events-none absolute text-[9px] leading-none ${yearOffset}`;

  const yearAt = (year: number, x: number, key: string) => (
    <span key={key} className={yearCls} style={{ top: `${yPct}%`, left: `${x}%`, color: yearColor }} aria-hidden>
      {year}
    </span>
  );

  const cap = (x: number, key: string) => (
    <span
      key={key}
      className="absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_0_0_1px_var(--color-panel)]"
      style={{ top: `${yPct}%`, left: `${x}%`, background: color }}
      aria-hidden
    />
  );

  const labelCls = `absolute max-w-[42%] truncate text-[10px] font-medium leading-none -translate-y-1/2 ${
    labelAtLeft ? "right-full mr-1.5 text-right" : "left-full ml-1.5 text-left"
  }`;

  const label = side.href ? (
    <Link
      href={side.href}
      className={`${labelCls} focus-ring`}
      style={{ top: `${yPct}%`, left: `${labelAtLeft ? xOverall1 : xOverall2}%`, color }}
      title={title}
    >
      {surname}
    </Link>
  ) : (
    <span className={labelCls} style={{ top: `${yPct}%`, left: `${labelAtLeft ? xOverall1 : xOverall2}%`, color }}>
      {surname}
    </span>
  );

  return (
    <>
      {stints.map((stint, i) => {
        const x1 = at(stint.first, axisStart, axisEnd);
        const x2 = at(stint.last, axisStart, axisEnd);
        const width = Math.max(x2 - x1, 0.35);
        return (
          <span key={`stint-${i}`}>
            <div
              className="absolute h-px -translate-y-1/2 opacity-80"
              style={{ top: `${yPct}%`, left: `${x1}%`, width: `${width}%`, background: color }}
              aria-hidden
            />
            {cap(x1, `cap-${i}-start`)}
            {cap(x2, `cap-${i}-end`)}
          </span>
        );
      })}
      {yearAt(overallFirst, xOverall1, "start")}
      {overallFirst !== overallLast && yearAt(overallLast, xOverall2, "end")}
      {label}
    </>
  );
}

/**
 * Two United careers pinned to the club's full timeline — player A above the axis,
 * player B below. Overlapping spans read as parallel rails; distant ones show the
 * gap between eras at a glance. Returners get a broken rail between spells.
 */
export function CompareCareerTimeline({
  a,
  b,
  axisEnd = defaultAxisEnd(),
}: {
  a: CompareSide;
  b: CompareSide;
  /** Last year on the shared club axis; defaults to the last full calendar year. */
  axisEnd?: number;
}) {
  const aStints = stintsForSide(a);
  const bStints = stintsForSide(b);
  if (aStints.length === 0 || bStints.length === 0) return null;

  const aFirst = aStints[0].first;
  const aLast = aStints[aStints.length - 1].last;
  const bFirst = bStints[0].first;
  const bLast = bStints[bStints.length - 1].last;

  const axisStart = CLUB_AXIS_START;
  const guides = axisGuides(axisStart, axisEnd);

  const overlapStart = Math.max(aFirst, bFirst);
  const overlapEnd = Math.min(aLast, bLast);
  const hasOverlap = overlapStart <= overlapEnd;
  const overlapLeft = hasOverlap ? at(overlapStart, axisStart, axisEnd) : 0;
  const overlapWidth = hasOverlap ? at(overlapEnd, axisStart, axisEnd) - overlapLeft : 0;

  const caption = overlapCaption(aFirst, aLast, bFirst, bLast, a.label, b.label);
  const stintNote = (side: CompareSide, stints: CareerStint[]) =>
    stints.length > 1 ? `${side.label}, ${stints.length} spells` : null;
  const ariaStints = [stintNote(a, aStints), stintNote(b, bStints)].filter(Boolean).join("; ");
  const ariaLabel = `${a.label} (${fmtYearRange(aFirst, aLast)}) vs ${b.label} (${fmtYearRange(bFirst, bLast)}) on United's timeline since ${axisStart}${ariaStints ? ` — ${ariaStints}` : ""}`;

  return (
    <figure className="mb-5">
      <div className="relative mb-2 h-3">
        <span className="stat-num absolute left-0 text-[10px] text-ink-faint/70">{axisStart}</span>
        {guides.map((y) => (
          <span
            key={y}
            className="stat-num absolute hidden -translate-x-1/2 text-[10px] text-ink-faint/60 sm:inline"
            style={{ left: `${at(y, axisStart, axisEnd)}%` }}
          >
            {y}
          </span>
        ))}
        <span className="stat-num absolute right-0 text-[10px] text-ink-faint/70">{axisEnd}</span>
      </div>

      <div className="relative h-[4.5rem] overflow-visible px-px py-1.5" role="img" aria-label={ariaLabel}>
        {guides.map((y) => (
          <div
            key={y}
            className="pointer-events-none absolute inset-y-0 w-px bg-line/25"
            style={{ left: `${at(y, axisStart, axisEnd)}%` }}
            aria-hidden
          />
        ))}

        {/* centre axis — the club timeline every career hangs off */}
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-line/70" aria-hidden>
          {hasOverlap && (
            <div
              className="absolute inset-y-0 bg-gold/30"
              style={{ left: `${overlapLeft}%`, width: `${overlapWidth}%` }}
            />
          )}
        </div>

        <CareerSpan side={a} stints={aStints} axisStart={axisStart} axisEnd={axisEnd} yPct={A_RAIL} color={A_COLOR} above />
        <CareerSpan side={b} stints={bStints} axisStart={axisStart} axisEnd={axisEnd} yPct={B_RAIL} color={B_COLOR} above={false} />
      </div>

      <figcaption className="mt-2 text-[11px] leading-snug text-ink-faint">{caption}</figcaption>
    </figure>
  );
}
