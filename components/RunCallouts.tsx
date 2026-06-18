import { fmtDate } from "@/lib/format";

export interface Run {
  /** The streak length — the dominant figure on the card. */
  n: number;
  /** What the figure counts, e.g. "unbeaten" or "wins in a row". */
  label: string;
  /** Tailwind text-colour class tinting the figure (win / loss tone). */
  tone: string;
  from: string;
  to: string;
}

/**
 * Streak callouts as stat-hero cards: a big tinted figure, what it counts, and
 * the span it covered. Shared by `/opponent/[id]` (unbeaten / winless in this
 * fixture) and `/manager/[id]` (wins-in-a-row / unbeaten under the manager).
 *
 * The component owns only the cards; the parent supplies the container via
 * `className`, so the same object stacks down a narrow column on one page and
 * lays across a band under the plate on the other. A run-callout exists only
 * when the run does — the empty state is a single honest line, not a blank card.
 */
export function RunCallouts({
  runs,
  empty,
  className = "space-y-2.5",
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
        <div key={r.label} className="rounded-xl border border-line bg-panel px-4 py-3">
          <span className={`stat-num text-2xl font-semibold ${r.tone}`}>{r.n}</span>
          <span className="ml-1.5 text-sm text-ink-dim">{r.label}</span>
          <div className="stat-num mt-0.5 text-xs text-ink-faint">
            {fmtDate(r.from)} – {fmtDate(r.to)}
          </div>
        </div>
      ))}
    </div>
  );
}
