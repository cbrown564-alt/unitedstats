import type { ReactNode } from "react";
import Link from "next/link";
import { fmtNum, COMPETITION_TYPE_LABELS, resultLabel } from "@/lib/format";
import { SUBJECTS, dimensionsFor, metricsFor, cutHref, type Cut, type CutSubject } from "@/lib/cut";

const TYPE_FILTER_KEYS = ["league", "cup", "domestic-cup", "league-cup", "european", "unofficial"];
const RESULT_FILTER_KEYS = ["W", "D", "L"];

// A pill: solid filled active (reads as "pressed"), quiet idle. Both states carry a
// border so the box never shifts size between them — the source of the old jitter.
const PILL_BASE =
  "tap-target inline-flex h-9 items-center rounded-full border px-3.5 text-[13px] leading-none transition-colors focus-ring";
const pillTone = (active: boolean) =>
  active
    ? "border-devil bg-devil font-semibold text-ink shadow-[0_1px_2px_rgb(0_0_0_/_0.4)]"
    : "border-line bg-panel-2/40 text-ink-dim hover:border-ink-faint/60 hover:bg-panel-2 hover:text-ink";

const legendCls =
  "shrink-0 whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faint sm:w-[4.5rem]";
const fieldLabel = "mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-faint";

/**
 * The fork controls as one tactile deck. The parameters that change the *answer* —
 * the subject (team or players), what to group by, and what to rank by — are pill
 * rails, each chip a link to a new Cut URL that keeps the current filters. The
 * narrower filters that change the *slice* stay a demoted GET form beneath, carrying
 * the active subject/dimension/metric so submitting never drops the lens.
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
      className="scroll-mt-20 overflow-hidden rounded-xl border border-line bg-panel shadow-[inset_0_1px_0_rgb(255_255_255_/_0.04),0_18px_36px_-22px_rgb(0_0_0_/_0.75)]"
    >
      <div className="space-y-3 p-4 sm:p-5">
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

      <details className="group/slice border-t border-line bg-panel-2/25 px-4 py-3.5 sm:px-5" open={hasRefinement(filters)}>
        <summary className="flex cursor-pointer select-none list-none items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-dim transition-colors hover:text-ink focus-ring [&::-webkit-details-marker]:hidden">
          <Chevron className="h-3 w-3 -rotate-90 text-devil-bright transition-transform duration-200 group-open/slice:rotate-0" />
          Refine the slice
        </summary>
        {/* GET to /cut, carrying the active subject/dimension/metric so a filtered
            submit keeps the same answer shape — only the slice changes. */}
        <form className="mt-4 grid gap-x-3 gap-y-3.5 md:grid-cols-12" method="get" action="/cut">
          {subject === "player" && <input type="hidden" name="subject" value="player" />}
          <input type="hidden" name="by" value={dimension} />
          <input type="hidden" name="metric" value={metric} />

          <TextField
            className="md:col-span-4"
            label="Opponent"
            name="q"
            type="search"
            defaultValue={filters.q ?? ""}
            placeholder="Arsenal, Liverpool, Leeds"
          />
          <SelectField className="md:col-span-4" label="Competition" name="competition" defaultValue={filters.competition ?? ""}>
            <option value="">All competitions</option>
            {competitions.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({fmtNum(c.n)})</option>
            ))}
          </SelectField>
          <SelectField className="md:col-span-2" label="Season" name="season" defaultValue={filters.season ?? ""}>
            <option value="">All seasons</option>
            {seasons.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </SelectField>
          <SelectField className="md:col-span-2" label="Match type" name="type" defaultValue={filters.type ?? ""}>
            <option value="">Any type</option>
            {TYPE_FILTER_KEYS.map((t) => (
              <option key={t} value={t}>{COMPETITION_TYPE_LABELS[t]}</option>
            ))}
          </SelectField>
          <SelectField className="md:col-span-2" label="Venue" name="venue" defaultValue={filters.venue ?? ""}>
            <option value="">Any venue</option>
            <option value="H">Home</option>
            <option value="A">Away</option>
            <option value="N">Neutral</option>
          </SelectField>
          <SelectField className="md:col-span-2" label="Result" name="result" defaultValue={filters.result ?? ""}>
            <option value="">Any result</option>
            {RESULT_FILTER_KEYS.map((r) => (
              <option key={r} value={r}>{resultLabel(r)}</option>
            ))}
          </SelectField>
          <TextField className="md:col-span-2" label="From" name="from" defaultValue={filters.from ?? ""} placeholder="1886" />
          <TextField className="md:col-span-2" label="To" name="to" defaultValue={filters.to ?? ""} placeholder="2026" />
          <div className="flex items-end md:col-span-2">
            <button className="h-[2.375rem] w-full rounded-md bg-devil px-4 text-sm font-semibold text-ink transition-colors hover:bg-devil-bright focus-ring">
              Apply filters
            </button>
          </div>
        </form>
      </details>
    </section>
  );
}

interface Option { key: string; label: string; href: string; active: boolean }

/** A labelled control row in the deck: small-caps legend, control centred beside it. */
function Rail({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
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
          className={`${PILL_BASE} ${pillTone(o.active)}`}
        >
          {o.label}
        </Link>
      ))}
    </div>
  );
}

/** The Team/Players switch: a segmented control sharing the pills' height and radius,
 *  the active segment filled — one cohesive family with the rails below. */
function SubjectToggle({ options }: { options: Option[] }) {
  return (
    <div className="inline-flex h-9 items-center gap-0.5 rounded-full bg-pitch/70 p-1 ring-1 ring-inset ring-line">
      {options.map((o) => (
        <Link
          key={o.key}
          href={o.href}
          aria-current={o.active ? "true" : undefined}
          className={`tap-target inline-flex h-7 items-center rounded-full px-4 text-[13px] font-semibold leading-none transition-colors focus-ring ${
            o.active ? "bg-devil text-ink shadow-[0_1px_2px_rgb(0_0_0_/_0.45)]" : "text-ink-dim hover:text-ink"
          }`}
        >
          {o.label}
        </Link>
      ))}
    </div>
  );
}

/** A labelled text/search input in the slice form. */
function TextField({
  className,
  label,
  name,
  defaultValue,
  placeholder,
  type = "text",
}: {
  className?: string;
  label: string;
  name: string;
  defaultValue: string;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className={className}>
      <span className={fieldLabel}>{label}</span>
      <input type={type} name={name} defaultValue={defaultValue} placeholder={placeholder} className="control w-full" />
    </label>
  );
}

/** A labelled select with a custom chevron (the native one reads cheap on dark). */
function SelectField({
  className,
  label,
  name,
  defaultValue,
  children,
}: {
  className?: string;
  label: string;
  name: string;
  defaultValue: string;
  children: ReactNode;
}) {
  return (
    <label className={className}>
      <span className={fieldLabel}>{label}</span>
      <div className="relative">
        <select name={name} defaultValue={defaultValue} className="control w-full appearance-none pr-9">
          {children}
        </select>
        <Chevron className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-ink-faint" />
      </div>
    </label>
  );
}

/** A down chevron ("v"); callers rotate it for the disclosure caret. */
function Chevron({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" aria-hidden className={className}>
      <path d="m2.5 4.5 3.5 3.5 3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function hasRefinement(filters: Cut["filters"]): boolean {
  return Boolean(
    filters.q || filters.competition || filters.season || filters.type ||
    filters.venue || filters.result || filters.from || filters.to || filters.opponent || filters.manager,
  );
}
