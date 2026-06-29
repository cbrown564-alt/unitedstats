import { fmtNum, pct } from "@/lib/format";

/**
 * The whole trust story as one object: every detail layer (rows) against every
 * decade United have played (columns), each cell shaded by how much of that
 * decade carries that layer. The result spine is a solid red foundation across
 * the top — every match has a known result — and the richer facets fade into the
 * Victorian past, so "the record is complete; the detail fills in toward the
 * present" reads off the gradient before a single number is parsed.
 *
 * Pure positioned HTML/CSS, server-rendered (the `HistorySkyline`/`CareerSparkline`
 * lineage): background intensity carries the at-a-glance magnitude, the mono
 * percent in each cell carries the exact value — both, because this is the trust
 * surface where the shape *and* the number have to be legible. Each cell's title
 * holds the raw covered/total for inspection.
 */

interface DecadeRow {
  decade: string; // "1900s"
  matches: number;
  completeScorers: number;
  withOppositionGoals: number;
  withAssists: number;
  withStartingLineups: number;
  withCards: number;
  withAttendance: number;
}

interface Totals {
  matches: number;
  completeScorers: number;
  withOppositionGoals: number;
  withAssists: number;
  withStartingLineups: number;
  withCards: number;
  withAttendance: number;
}

type FacetKey = keyof Omit<DecadeRow, "decade" | "matches">;

const FACETS: { key: FacetKey | "result"; label: string; note: string }[] = [
  { key: "result", label: "Result", note: "the spine — every match" },
  { key: "completeScorers", label: "United scorers", note: "complete goal list" },
  { key: "withOppositionGoals", label: "Opposition goals", note: "who scored against" },
  { key: "withStartingLineups", label: "Starting XI", note: "the eleven named" },
  { key: "withCards", label: "Cards", note: "bookings recorded" },
  { key: "withAttendance", label: "Attendance", note: "crowd recorded" },
  { key: "withAssists", label: "Assists", note: "source-limited to recent eras" },
];

/** Background red ramp; a >0 cell keeps a floor so it never reads as truly empty. */
function fill(frac: number): string {
  if (frac <= 0) return "transparent";
  return `rgb(216 33 13 / ${(0.12 + 0.88 * frac).toFixed(3)})`;
}

/** Keep the number legible on every cell, but dim the faint ones so the gradient still leads. */
function inkFor(frac: number): string {
  if (frac >= 0.45) return "text-ink";
  if (frac > 0) return "text-ink-dim";
  return "text-ink-faint";
}

export function CoverageMatrix({ rows, totals }: { rows: DecadeRow[]; totals: Totals }) {
  // Columns are decades + a bold all-time summary column on the right.
  const cols = `minmax(8.5rem,auto) repeat(${rows.length}, minmax(2.5rem, 1fr)) minmax(4rem,auto)`;

  return (
    <figure className="m-0">
      <div className="overflow-x-auto">
        <div className="grid min-w-[44rem] gap-px" style={{ gridTemplateColumns: cols }} role="table">
          {/* ── header: decade start years + per-decade match counts ── */}
          <div role="columnheader" className="sticky left-0 z-10 flex items-end bg-panel pb-1.5 pr-3 text-[10px] uppercase tracking-[0.14em] text-ink-faint">
            Layer
          </div>
          {rows.map((r) => (
            <div key={r.decade} role="columnheader" className="flex flex-col items-center justify-end pb-1.5 leading-none">
              <span className="stat-num text-[11px] text-ink-dim">{r.decade.slice(0, 4)}</span>
              <span className="stat-num mt-1 text-[9px] text-ink-faint">{fmtNum(r.matches)}</span>
            </div>
          ))}
          <div role="columnheader" className="flex items-end justify-end pb-1.5 pl-2 text-[10px] uppercase tracking-[0.14em] text-ink-faint">
            All-time
          </div>

          {/* ── one row per facet ── */}
          {FACETS.map((facet) => {
            const isSpine = facet.key === "result";
            const key = facet.key as FacetKey;
            const totalFrac = isSpine ? 1 : (totals[key] || 0) / (totals.matches || 1);
            return (
              <div key={facet.key} role="row" className="contents">
                <div role="rowheader" className="sticky left-0 z-10 flex flex-col justify-center bg-panel py-1 pr-3 leading-tight">
                  <span className="text-[13px] font-medium text-ink">{facet.label}</span>
                  <span className="text-[10px] text-ink-dim">{facet.note}</span>
                </div>
                {rows.map((r) => {
                  const covered = isSpine ? r.matches : r[key];
                  const frac = r.matches ? covered / r.matches : 0;
                  return (
                    <div
                      key={r.decade}
                      role="cell"
                      title={`${facet.label}, ${r.decade}: ${fmtNum(covered)} of ${fmtNum(r.matches)} matches (${pct(covered, r.matches)})`}
                      className={`flex min-h-[2.1rem] items-center justify-center rounded-[2px] ${inkFor(frac)}`}
                      style={{ backgroundColor: fill(frac) }}
                    >
                      <span className="stat-num text-[11px]">{Math.round(frac * 100)}</span>
                    </div>
                  );
                })}
                <div
                  role="cell"
                  className="flex items-center justify-end rounded-[2px] pl-2 pr-1.5"
                  style={{ backgroundColor: fill(totalFrac) }}
                >
                  <span className={`stat-num text-sm font-semibold ${totalFrac >= 0.45 ? "text-ink" : "text-ink-dim"}`}>
                    {Math.round(totalFrac * 100)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* legend ramp — intensity = share of that decade's matches carrying the layer */}
      <figcaption className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-ink-dim">
        <span>Cell value is the percent of that decade’s matches carrying the layer.</span>
        <span className="flex items-center gap-1.5">
          <span className="text-ink-faint">0%</span>
          <span className="flex h-2.5 w-24 overflow-hidden rounded-full ring-1 ring-inset ring-line">
            {[0.05, 0.25, 0.5, 0.75, 1].map((f) => (
              <span key={f} className="h-full flex-1" style={{ backgroundColor: fill(f) }} />
            ))}
          </span>
          <span className="text-ink">100%</span>
        </span>
      </figcaption>
    </figure>
  );
}
