"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { queryString } from "@/lib/url";
import { FacetCombobox } from "@/components/FacetCombobox";
import { FacetIcon } from "@/components/FacetIcon";
import { usePopoverAlign } from "@/components/usePopoverAlign";
import {
  MATCH_FACETS, FACET_BY_KEY, FACET_GROUPS,
  type FacetDef, type FacetGroup, type FacetOption, type FacetOptions, type FacetCounts,
} from "@/lib/matchFacets";

/**
 * Live facet-chip filter bar for the Matches page. The URL stays the single
 * source of truth: each chip is a searchParam, and every edit pushes a new
 * `/matches?…` so the server component re-renders the slice. The page's results,
 * summary and spine are unchanged — this island only owns the controls.
 *
 * `params` is the raw searchParams; `chips` are the active filters with
 * server-resolved labels; `options` holds select/datalist choices keyed by
 * facet `optionsKey`.
 */
export function MatchFilterBar({
  params,
  chips,
  options,
  counts,
  total,
}: {
  params: Record<string, string | undefined>;
  chips: { key: string; label: string }[];
  options: FacetOptions;
  counts: FacetCounts;
  total: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  // The currently open popover: "add" for the add-filter menu, a facet key for
  // that facet's editor, or null when nothing is open.
  const [open, setOpen] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Dismiss any open popover on an outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(null); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const navigate = (next: Record<string, string | undefined>) => {
    setOpen(null);
    // A filter change always returns to page 1; the slice it describes has moved.
    startTransition(() => {
      router.push(`/matches${queryString({ ...next, page: undefined })}`, { scroll: false });
    });
  };
  const apply = (key: string, value: string | undefined) => {
    const v = value?.trim();
    navigate({ ...params, [key]: v || undefined });
  };
  const pick = (facet: FacetDef) => {
    if (facet.kind === "toggle") apply(facet.key, facet.onValue);
    else setOpen(facet.key);
  };

  const activeKeys = new Set(chips.map((c) => c.key));
  const available = MATCH_FACETS.filter((f) => !activeKeys.has(f.key));
  // When the open popover is a facet that isn't yet active, its editor anchors to
  // the add-filter button rather than to a chip.
  const newFacet = open && open !== "add" && !activeKeys.has(open) ? FACET_BY_KEY[open] : undefined;

  return (
    <div ref={rootRef} id="match-filters" className="scroll-mt-20 rounded-lg border border-line bg-panel p-3 shadow-[0_1px_0_rgb(255_255_255_/_0.025)_inset]">
      <div className="mb-2 flex items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">Filters</p>
        {pending && <span className="stat-num text-xs text-ink-faint motion-safe:animate-pulse">updating…</span>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {chips.map((chip) => {
          const facet = FACET_BY_KEY[chip.key];
          const editable = facet && facet.kind !== "toggle";
          return (
            <span key={chip.key} className="relative inline-flex items-center rounded-full border border-line bg-panel-2 text-sm text-ink-dim">
              <button
                type="button"
                disabled={!editable}
                onClick={() => editable && setOpen(open === chip.key ? null : chip.key)}
                aria-expanded={open === chip.key}
                className={`inline-flex items-center gap-1.5 rounded-l-full py-1 pl-2.5 pr-2 transition-colors focus-ring ${editable ? "hover:text-ink" : "cursor-default"}`}
              >
                {facet && <FacetIcon name={facet.icon} className="shrink-0 text-ink-faint" />}
                {chip.label}
                {editable && <span aria-hidden className="ml-0.5 text-ink-faint">▾</span>}
              </button>
              <button
                type="button"
                onClick={() => apply(chip.key, undefined)}
                aria-label={`Remove filter: ${chip.label}`}
                className="rounded-r-full py-1 pl-1 pr-2.5 text-ink-faint transition-colors hover:text-devil-bright focus-ring"
              >
                ×
              </button>
              {open === chip.key && facet && (
                <FacetEditor
                  facet={facet}
                  current={params[chip.key] ?? ""}
                  options={facet.optionsKey ? options[facet.optionsKey] ?? [] : []}
                  counts={counts[chip.key]}
                  onApply={(v) => apply(chip.key, v)}
                />
              )}
            </span>
          );
        })}

        <span className="relative inline-flex">
          <button
            type="button"
            onClick={() => setOpen(open === "add" ? null : "add")}
            aria-expanded={open === "add"}
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-line bg-panel px-3 py-1 text-sm text-ink-dim transition-colors hover:border-devil/50 hover:text-devil-bright focus-ring"
          >
            <span aria-hidden>＋</span> Add filter
          </button>
          {open === "add" && <AddMenu available={available} counts={counts} total={total} onPick={pick} />}
          {newFacet && (
            <FacetEditor
              facet={newFacet}
              current=""
              options={newFacet.optionsKey ? options[newFacet.optionsKey] ?? [] : []}
              counts={counts[newFacet.key]}
              onApply={(v) => apply(newFacet.key, v)}
            />
          )}
        </span>

        {chips.length > 0 && (
          <button
            type="button"
            onClick={() => navigate({})}
            className="rounded-full px-2 py-1 text-sm text-ink-faint underline-offset-2 transition-colors hover:text-ink hover:underline focus-ring"
          >
            Clear all
          </button>
        )}
      </div>

      {chips.length === 0 && (
        <p className="mt-2 text-sm text-ink-faint">
          Add a filter to narrow the archive — opponent, era, competition, result, ground, scorer and more.
        </p>
      )}
    </div>
  );
}

// Left column carries Who + What, right column Where + When — roughly balancing
// the two halves so the menu is short and scannable rather than one tall list.
const MENU_COLUMNS: FacetGroup[][] = [
  ["who", "what"],
  ["where", "when"],
];

function AddMenu({
  available,
  counts,
  total,
  onPick,
}: {
  available: FacetDef[];
  counts: FacetCounts;
  total: number;
  onPick: (f: FacetDef) => void;
}) {
  const { ref, align } = usePopoverAlign();
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const matches = needle ? available.filter((f) => f.label.toLowerCase().includes(needle)) : null;

  // A counted facet is "exhausted" when every match in the slice shares one value
  // for it — picking it can't narrow further, so it's dimmed. We require the
  // counted options to cover the whole slice: a column that's merely sparse (few
  // matches carry a ground/city) collapses to one value too, but isn't a real
  // narrowing and shouldn't be dimmed.
  const exhausted = (f: FacetDef) => {
    const c = counts[f.key];
    if (!c || total === 0) return false;
    const vals = Object.values(c);
    const coverage = vals.reduce((sum, n) => sum + n, 0);
    return coverage >= total && vals.filter((n) => n > 0).length <= 1;
  };

  const item = (f: FacetDef) => {
    const dim = exhausted(f);
    return (
      <button
        key={f.key}
        type="button"
        role="menuitem"
        onClick={() => onPick(f)}
        title={dim ? "Only one option in this slice" : undefined}
        className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors focus-ring ${
          dim ? "text-ink-faint hover:bg-panel-2" : "text-ink-dim hover:bg-panel-2 hover:text-ink"
        }`}
      >
        <FacetIcon name={f.icon} className="shrink-0 text-ink-faint" />
        <span className="truncate">{f.label}</span>
      </button>
    );
  };

  return (
    <div ref={ref} role="menu" className={`pop-in absolute ${align} top-full z-40 mt-1 w-[30rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-line bg-panel shadow-xl`}>
      <div className="border-b border-line p-2">
        <input
          autoFocus
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find a filter…"
          aria-label="Find a filter"
          className="control w-full"
        />
      </div>

      {matches ? (
        <div className="max-h-80 overflow-y-auto p-1.5">
          {matches.length > 0 ? matches.map(item) : (
            <p className="px-2 py-2 text-sm text-ink-faint">No filter matches “{query}”.</p>
          )}
        </div>
      ) : available.length === 0 ? (
        <p className="px-3 py-3 text-sm text-ink-faint">Every filter is already in play.</p>
      ) : (
        <div className="grid grid-cols-2 gap-x-2 p-1.5">
          {MENU_COLUMNS.map((groups, col) => (
            <div key={col} className="min-w-0">
              {groups.map((g) => {
                const items = available.filter((f) => f.group === g);
                if (items.length === 0) return null;
                const label = FACET_GROUPS.find((x) => x.key === g)?.label ?? g;
                return (
                  <div key={g} className="px-0.5 py-1 first:pt-0.5">
                    <p className="px-1.5 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">{label}</p>
                    {items.map(item)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FacetEditor({
  facet,
  current,
  options,
  counts,
  onApply,
}: {
  facet: FacetDef;
  current: string;
  options: FacetOption[];
  counts?: Record<string, number>;
  onApply: (value: string | undefined) => void;
}) {
  const [val, setVal] = useState(current);
  const { ref, align } = usePopoverAlign<HTMLFormElement>();

  // Every option-backed facet (select + datalist) gets the searchable listbox.
  if (facet.optionsKey) {
    return <FacetCombobox label={facet.label} options={options} current={current} counts={counts} onApply={onApply} />;
  }

  // What remains is the numeric facets (year / minute): a small typed input.
  return (
    <form
      ref={ref}
      className={`pop-in absolute ${align} top-full z-40 mt-1 flex items-center gap-2 rounded-lg border border-line bg-panel p-2 shadow-xl`}
      onSubmit={(e) => { e.preventDefault(); onApply(val || undefined); }}
    >
      <input
        autoFocus
        type="text"
        inputMode="numeric"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder={facet.placeholder}
        aria-label={facet.label}
        className="control w-44"
      />
      <button type="submit" className="min-h-[2.375rem] shrink-0 rounded-md bg-devil px-3 text-xs font-semibold text-ink transition-colors hover:bg-devil-bright focus-ring">
        Apply
      </button>
    </form>
  );
}
