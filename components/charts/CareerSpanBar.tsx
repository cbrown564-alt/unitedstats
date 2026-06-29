import type { ReactNode } from "react";

/**
 * A career (or reign) as a span on a timeline *shared* by every row — first year
 * to last, drawn as a barbell pinned to real calendar time, so scanning the column
 * shows the eras slide through history: the Victorians bunched left, the Busby
 * lot mid-track, the modern names far right, each bar as wide as the career was
 * long. Gold pips mark the peaks — a player's busiest season, a manager's
 * silverware — the gold-marks-the-peak idiom used across the site.
 *
 * This replaces the per-season micro-bar sparklines (`CareerSparkline`,
 * `ManagerSparkbar`): at a register row's height those resolved to noise. The
 * span is the one thing that *does* read at this size — position and length —
 * and the exact years ride beneath as a caption. Pure positioned HTML, so it
 * stays crisp at any column width with no SVG scaling.
 */
export function CareerSpanBar({
  first,
  last,
  axisStart,
  axisEnd,
  peaks = [],
  label,
  caption,
}: {
  first: number;
  last: number;
  /** First year on the shared axis (same for every row). */
  axisStart: number;
  /** Last year on the shared axis (same for every row). */
  axisEnd: number;
  /** Years to gold-pip on the span (busiest season / trophy seasons). */
  peaks?: number[];
  /** Accessible description of the span. */
  label: string;
  /** Exact-years text shown beneath — carries the precise span as a figure. */
  caption?: ReactNode;
}) {
  const span = Math.max(axisEnd - axisStart, 1);
  const at = (year: number) => ((Math.min(Math.max(year, axisStart), axisEnd) - axisStart) / span) * 100;
  const x1 = at(first);
  const x2 = at(last);

  // Quarter-century guides, shared and aligned down every row, so the empty track
  // reads as one timeline grid rather than rows of bars floating in voids — the
  // anchor that makes "scan the column and watch the eras line up" actually land.
  const guides: number[] = [];
  for (let y = Math.ceil(axisStart / 25) * 25; y < axisEnd; y += 25) guides.push(y);

  return (
    <figure className="m-0 w-full" aria-label={label}>
      <div className="relative h-5" role="img">
        {guides.map((y) => (
          <div
            key={y}
            className="absolute inset-y-0 w-px bg-line/40"
            style={{ left: `${at(y)}%` }}
            aria-hidden
          />
        ))}
        {/* the span — a thin rail from first year to last, the career's length */}
        <div
          className="absolute top-1/2 h-px -translate-y-1/2 bg-ink-dim/55"
          style={{ left: `${x1}%`, width: `${Math.max(x2 - x1, 0)}%` }}
          aria-hidden
        />
        {/* end caps — the entry and exit years */}
        {[x1, x2].map((x, i) => (
          <span
            key={i}
            className="absolute top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink-dim"
            style={{ left: `${x}%` }}
            aria-hidden
          />
        ))}
        {/* gold peaks — busiest season / silverware, riding on the rail */}
        {peaks.map((y) => (
          <span
            key={y}
            className="absolute top-1/2 z-10 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold shadow-[0_0_0_1px_var(--color-panel)]"
            style={{ left: `${at(y)}%` }}
            aria-hidden
          />
        ))}
      </div>
      {caption != null && (
        <figcaption className="stat-num mt-0.5 text-[10px] leading-none text-ink-faint">{caption}</figcaption>
      )}
    </figure>
  );
}
