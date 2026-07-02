import type { CSSProperties } from "react";
import { fmtDate } from "@/lib/format";
import type { LongestStreakKind } from "@/lib/trails";

export type RunKind = LongestStreakKind;

export interface Run {
  /** The streak length — the dominant figure on the card. */
  n: number;
  /** What the figure counts, e.g. "unbeaten" or "wins in a row". */
  label: string;
  /** Tailwind text-colour class tinting the figure (win / loss tone). */
  tone: string;
  from: string;
  to: string;
  kind: RunKind;
  /** Ordered W/D/L in the streak — drives the heatstrip / span fill. */
  results: ("W" | "D" | "L")[];
}

const RESULT_CELL: Record<"W" | "D" | "L", string> = {
  W: "bg-win",
  D: "bg-ink-dim/55",
  L: "bg-loss",
};

function Heatstrip({
  results,
  ariaLabel,
  className = "",
  style,
}: {
  results: ("W" | "D" | "L")[];
  ariaLabel: string;
  className?: string;
  style?: CSSProperties;
}) {
  if (results.length === 0) return null;
  return (
    <div
      className={`flex h-3 gap-px overflow-hidden rounded-sm ${className}`}
      role="img"
      aria-label={ariaLabel}
      style={style}
    >
      {results.map((r, i) => (
        <span key={i} className={`min-w-[2px] flex-1 ${RESULT_CELL[r]}`} />
      ))}
    </div>
  );
}

function WinningRunCard({ run }: { run: Run }) {
  return (
    <article className="flex min-w-[14rem] flex-1 flex-col rounded-xl border border-line bg-panel px-4 py-3.5">
      <div className="flex items-baseline gap-2">
        <span className={`stat-num text-3xl font-semibold leading-none ${run.tone}`}>{run.n}</span>
        <span className="text-sm text-ink-dim">{run.label}</span>
      </div>
      <Heatstrip
        results={run.results}
        ariaLabel={`${run.n} consecutive wins`}
        className="mt-3 border border-win/20"
      />
      <p className="stat-num mt-2 text-[10px] leading-none text-ink-faint">
        {fmtDate(run.from)}–{fmtDate(run.to)}
      </p>
    </article>
  );
}

function SpanRunCard({ run }: { run: Run }) {
  const wins = run.results.filter((r) => r === "W").length;
  const draws = run.results.length - wins;

  return (
    <article className="flex min-w-[14rem] flex-1 flex-col rounded-xl border border-line bg-panel px-4 py-3.5">
      <div className="flex items-baseline gap-2">
        <span className={`stat-num text-3xl font-semibold leading-none ${run.tone}`}>{run.n}</span>
        <span className="text-sm text-ink-dim">{run.label}</span>
      </div>

      <figure className="mt-3 w-full" aria-label={`${run.n} matches unbeaten from ${fmtDate(run.from)} to ${fmtDate(run.to)}`}>
        <div className="relative h-6" role="img" aria-hidden>
          <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-line/55" />
          <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-win/35" />
          <span className="absolute left-0 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-panel bg-win shadow-[0_0_0_1px_rgb(34_197_94/0.35)]" />
          <span className="absolute right-0 top-1/2 h-2 w-2 translate-x-1/2 -translate-y-1/2 rounded-full border border-panel bg-win shadow-[0_0_0_1px_rgb(34_197_94/0.35)]" />
        </div>
        <Heatstrip
          results={run.results}
          ariaLabel={`${wins} wins and ${draws} draws in the run`}
          className="mt-1.5 border border-line/40"
        />
        <figcaption className="stat-num mt-2 space-y-1 text-[10px] leading-none text-ink-faint">
          <div className="flex items-baseline justify-between gap-3">
            <span>{fmtDate(run.from)}</span>
            <span>{fmtDate(run.to)}</span>
          </div>
          {draws > 0 && (
            <p className="text-center text-ink-faint/80">
              {wins}W · {draws}D
            </p>
          )}
        </figcaption>
      </figure>
    </article>
  );
}

function RunCard({ run }: { run: Run }) {
  switch (run.kind) {
    case "winning":
      return <WinningRunCard run={run} />;
    case "unbeaten":
      return <SpanRunCard run={run} />;
    case "winless":
      return (
        <article className="flex min-w-[14rem] flex-1 flex-col rounded-xl border border-line bg-panel px-4 py-3.5">
          <div className="flex items-baseline gap-2">
            <span className={`stat-num text-3xl font-semibold leading-none ${run.tone}`}>{run.n}</span>
            <span className="text-sm text-ink-dim">{run.label}</span>
          </div>
          <Heatstrip
            results={run.results}
            ariaLabel={`${run.n} matches without a win`}
            className="mt-3 border border-loss/20"
          />
          <p className="stat-num mt-2 text-[10px] leading-none text-ink-faint">
            {fmtDate(run.from)}–{fmtDate(run.to)}
          </p>
        </article>
      );
    default: {
      const _exhaustive: never = run.kind;
      return _exhaustive;
    }
  }
}

/**
 * Streak callouts with purpose-built visuals: winning runs as a heatstrip of
 * consecutive wins; unbeaten runs as a tenure-span barbell with the run's W/D
 * mix embedded on the highlighted segment. Shared by `/opponent/[id]` and
 * `/manager/[id]`.
 */
export function RunCallouts({
  runs,
  empty,
  className = "grid gap-3 sm:grid-cols-2",
}: {
  runs: Run[];
  empty: string;
  className?: string;
}) {
  if (runs.length === 0) {
    return (
      <p className="rounded-xl border border-line bg-panel px-4 py-5 text-sm text-ink-faint">
        {empty}
      </p>
    );
  }
  return (
    <div className={className}>
      {runs.map((r) => (
        <RunCard key={`${r.kind}-${r.from}`} run={r} />
      ))}
    </div>
  );
}
