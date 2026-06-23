import type { ReactNode } from "react";
import Link from "next/link";
import { fmtNum, COMPETITION_TYPE_LABELS, resultLabel } from "@/lib/format";
import { SUBJECTS, dimensionsFor, metricsFor, cutHref, type Cut, type CutSubject } from "@/lib/cut";

const TYPE_FILTER_KEYS = ["league", "cup", "domestic-cup", "league-cup", "european", "unofficial"];
const RESULT_FILTER_KEYS = ["W", "D", "L"];

// Pill treatment: a solid, filled active state (tactile, reads as "pressed") over a
// quiet ghost idle — a clear lift from the old translucent-border selection.
const chipTone = (active: boolean) =>
  active
    ? "border-devil bg-devil font-semibold text-ink shadow-[0_1px_2px_rgb(0_0_0_/_0.4)]"
    : "border-line bg-panel-2/40 text-ink-dim hover:border-ink-faint/60 hover:bg-panel-2 hover:text-ink";

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
  const { subject, dimension, metric, filters } = cut;

  // The player subject has no Group-by control — you always rank players — so it
  // locks the dimension to "player". Team keeps the current dimension when it is
  // shared, else drops to its default. The metric always resets (the two sets are
  // disjoint); filters carry across, narrowing the matches either way.
  const subjectHref = (s: CutSubject) => {
    const dims = dimensionsFor(s);
    const nextDim =
      s === "player" ? "player" : dims.some((d) => d.key === dimension) ? dimension : dims[0].key;
    return cutHref({ subject: s, dimension: nextDim, metric: metricsFor(s)[0].key, filters });
  };

  const subjectOptions = SUBJECTS.map((s) => ({
    key: s.key,
    label: s.label,
    href: subjectHref(s.key),
    active: s.key === subject,
  }));

  return (
    <section
      id="cut-controls"
      aria-label="Re-cut the record"
      className="scroll-mt-20 overflow-hidden rounded-xl border border-line bg-panel shadow-[inset_0_1px_0_rgb(255_255_255_/_0.045),0_18px_36px_-20px_rgb(0_0_0_/_0.7)]"
    >
      <div className="space-y-3.5 p-4 sm:p-5">
        <Rail legend="Subject">
          <SubjectToggle options={subjectOptions} />
        </Rail>
        {subject === "team" && (
          <Rail legend="Group by">
            <Pills
              options={dimensionsFor(subject).map((d) => ({
                key: d.key,
                label: d.short,
                href: cutHref({ subject, dimension: d.key, metric, filters }),
                active: d.key === dimension,
              }))}
            />
          </Rail>
        )}
        <Rail legend="Rank by">
          <Pills
            options={metricsFor(subject).map((m) => ({
              key: m.key,
              label: m.label,
              href: cutHref({ subject, dimension, metric: m.key, filters }),
              active: m.key === metric,
            }))}
          />
        </Rail>
      </div>

      <details className="border-t border-line bg-panel-2/30 px-3.5 py-3 sm:px-4" open={hasRefinement(filters)}>
        <summary className="cursor-pointer select-none list-none text-xs font-semibold uppercase tracking-[0.14em] text-ink-dim transition-colors hover:text-ink focus-ring [&::-webkit-details-marker]:hidden">
          <span className="text-devil-bright" aria-hidden>▸ </span>Narrow the slice
        </summary>
        {/* GET to /cut, carrying the active dimension and metric so a filtered
            submit keeps the same answer shape — only the slice changes. */}
        <form className="mt-3 grid gap-3 md:grid-cols-12" method="get" action="/cut">
          {subject === "player" && <input type="hidden" name="subject" value="player" />}
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

interface Option { key: string; label: string; href: string; active: boolean }

const legendCls =
  "shrink-0 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faint sm:w-[3.75rem] sm:pt-1.5";

/** A labelled control row in the deck: small-caps legend, control to its right. */
function Rail({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-3.5">
      <span className={legendCls}>{legend}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

/** Pill group for the Group-by / Rank-by rails. */
function Pills({ options }: { options: Option[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <Link
          key={o.key}
          href={o.href}
          aria-current={o.active ? "true" : undefined}
          className={`tap-target rounded-full border px-3 py-1.5 text-[13px] transition-all focus-ring ${chipTone(o.active)}`}
        >
          {o.label}
        </Link>
      ))}
    </div>
  );
}

/** The Team/Players switch: a true segmented control with a filled active segment. */
function SubjectToggle({ options }: { options: Option[] }) {
  return (
    <div className="inline-flex rounded-lg bg-pitch/60 p-0.5 ring-1 ring-line">
      {options.map((o) => (
        <Link
          key={o.key}
          href={o.href}
          aria-current={o.active ? "true" : undefined}
          className={`tap-target rounded-[0.4rem] px-4 py-1.5 text-sm font-semibold transition-colors focus-ring ${
            o.active
              ? "bg-devil text-ink shadow-[0_1px_2px_rgb(0_0_0_/_0.45)]"
              : "text-ink-dim hover:text-ink"
          }`}
        >
          {o.label}
        </Link>
      ))}
    </div>
  );
}

function hasRefinement(filters: Cut["filters"]): boolean {
  return Boolean(
    filters.q || filters.competition || filters.season || filters.type ||
    filters.venue || filters.result || filters.from || filters.to || filters.opponent || filters.manager,
  );
}
