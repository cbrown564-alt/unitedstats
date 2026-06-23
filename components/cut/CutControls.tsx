import Link from "next/link";
import { fmtNum, COMPETITION_TYPE_LABELS, resultLabel } from "@/lib/format";
import { DIMENSIONS, METRICS, cutHref, type Cut } from "@/lib/cut";

const TYPE_FILTER_KEYS = ["league", "cup", "domestic-cup", "league-cup", "european", "unofficial"];
const RESULT_FILTER_KEYS = ["W", "D", "L"];

// Selected/idle treatment for a dial chip, shared with the /matches filter pills.
const chipTone = (active: boolean) =>
  active
    ? "border-devil/60 bg-devil/15 text-devil-bright"
    : "border-line bg-panel text-ink-dim hover:border-devil/50 hover:bg-panel-2 hover:text-ink";

const fieldLabel = "mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint";

/**
 * The fork controls: re-cut the record without a form. The two parameters that
 * change the *answer* — what to group by (the dimension) and what to rank by (the
 * metric/lens) — are tappable dials, each chip a link to a new Cut URL that keeps
 * the current filters. Changing either is a fork: a new shareable Cut. The narrower
 * filters that change the *slice* stay a demoted GET form beneath, carrying the
 * active dimension and metric so submitting never drops the lens.
 *
 * Dials over inline form fields is the Phase 12 mobile decision: the primary
 * controls are big tap targets a reader picks, not boxes they fill; the sticky
 * mobile bar (on /cut) anchors here so they are one tap away deep in a long ladder.
 */
export function CutControls({
  cut,
  competitions,
  seasons,
}: {
  cut: Cut;
  competitions: { id: string; name: string; n: number }[];
  seasons: string[];
}) {
  const { dimension, metric, filters } = cut;
  return (
    <section
      id="cut-controls"
      aria-label="Re-cut the record"
      className="scroll-mt-20 overflow-hidden rounded-xl border border-line bg-panel"
    >
      <div className="space-y-2.5 p-3.5 sm:p-4">
        <Dial
          legend="Group by"
          options={DIMENSIONS.map((d) => ({
            key: d.key,
            label: d.short,
            href: cutHref({ dimension: d.key, metric, filters }),
            active: d.key === dimension,
          }))}
        />
        <Dial
          legend="Rank by"
          options={METRICS.map((m) => ({
            key: m.key,
            label: m.label,
            href: cutHref({ dimension, metric: m.key, filters }),
            active: m.key === metric,
          }))}
        />
      </div>

      <details className="border-t border-line bg-panel-2/30 px-3.5 py-3 sm:px-4" open={hasRefinement(filters)}>
        <summary className="cursor-pointer select-none list-none text-xs font-semibold uppercase tracking-[0.14em] text-ink-dim transition-colors hover:text-ink focus-ring [&::-webkit-details-marker]:hidden">
          <span className="text-devil-bright" aria-hidden>▸ </span>Narrow the slice
        </summary>
        {/* GET to /cut, carrying the active dimension and metric so a filtered
            submit keeps the same answer shape — only the slice changes. */}
        <form className="mt-3 grid gap-3 md:grid-cols-12" method="get" action="/cut">
          <input type="hidden" name="by" value={dimension} />
          <input type="hidden" name="metric" value={metric} />
          <label className="md:col-span-4">
            <span className={fieldLabel}>Opponent</span>
            <input
              type="search"
              name="q"
              defaultValue={filters.q ?? ""}
              placeholder="Arsenal, Liverpool, Leeds"
              className="control w-full"
            />
          </label>
          <label className="md:col-span-4">
            <span className={fieldLabel}>Competition</span>
            <select name="competition" defaultValue={filters.competition ?? ""} className="control w-full">
              <option value="">All competitions</option>
              {competitions.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({fmtNum(c.n)})</option>
              ))}
            </select>
          </label>
          <label className="md:col-span-2">
            <span className={fieldLabel}>Season</span>
            <select name="season" defaultValue={filters.season ?? ""} className="control w-full">
              <option value="">All seasons</option>
              {seasons.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="md:col-span-2">
            <span className={fieldLabel}>Match type</span>
            <select name="type" defaultValue={filters.type ?? ""} className="control w-full">
              <option value="">Any type</option>
              {TYPE_FILTER_KEYS.map((t) => (
                <option key={t} value={t}>{COMPETITION_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </label>
          <label className="md:col-span-2">
            <span className={fieldLabel}>Venue</span>
            <select name="venue" defaultValue={filters.venue ?? ""} className="control w-full">
              <option value="">Any venue</option>
              <option value="H">Home</option>
              <option value="A">Away</option>
              <option value="N">Neutral</option>
            </select>
          </label>
          <label className="md:col-span-2">
            <span className={fieldLabel}>Result</span>
            <select name="result" defaultValue={filters.result ?? ""} className="control w-full">
              <option value="">Any result</option>
              {RESULT_FILTER_KEYS.map((r) => (
                <option key={r} value={r}>{resultLabel(r)}</option>
              ))}
            </select>
          </label>
          <label className="md:col-span-2">
            <span className={fieldLabel}>From</span>
            <input type="text" name="from" defaultValue={filters.from ?? ""} placeholder="1886" className="control w-full" />
          </label>
          <label className="md:col-span-2">
            <span className={fieldLabel}>To</span>
            <input type="text" name="to" defaultValue={filters.to ?? ""} placeholder="2026" className="control w-full" />
          </label>
          <div className="flex items-end gap-2 md:col-span-2">
            <button className="min-h-[2.375rem] flex-1 rounded-md bg-devil px-4 py-2 font-semibold text-ink transition-colors hover:bg-devil-bright focus-ring">
              Apply
            </button>
          </div>
        </form>
      </details>
    </section>
  );
}

function Dial({
  legend,
  options,
}: {
  legend: string;
  options: { key: string; label: string; href: string; active: boolean }[];
}) {
  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
      <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint sm:w-16">
        {legend}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <Link
            key={o.key}
            href={o.href}
            aria-current={o.active ? "true" : undefined}
            className={`tap-target rounded-full border px-2.5 py-1 text-[13px] transition-colors focus-ring ${chipTone(o.active)}`}
          >
            {o.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function hasRefinement(filters: Cut["filters"]): boolean {
  return Boolean(
    filters.q || filters.competition || filters.season || filters.type ||
    filters.venue || filters.result || filters.from || filters.to || filters.opponent || filters.manager,
  );
}
