"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { queryString } from "@/lib/url";
import { FacetCombobox } from "@/components/FacetCombobox";
import {
  MATCH_FACETS, FACET_BY_KEY, FACET_GROUPS,
  type FacetDef, type FacetOption, type FacetOptions, type FacetCounts,
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
}: {
  params: Record<string, string | undefined>;
  chips: { key: string; label: string }[];
  options: FacetOptions;
  counts: FacetCounts;
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
                className={`rounded-l-full py-1 pl-3 pr-2 transition-colors focus-ring ${editable ? "hover:text-ink" : "cursor-default"}`}
              >
                {chip.label}
                {editable && <span aria-hidden className="ml-1 text-ink-faint">▾</span>}
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
          {open === "add" && <AddMenu available={available} onPick={pick} />}
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

function AddMenu({ available, onPick }: { available: FacetDef[]; onPick: (f: FacetDef) => void }) {
  return (
    <div role="menu" className="absolute left-0 top-full z-40 mt-1 w-64 rounded-lg border border-line bg-panel p-1.5 shadow-xl">
      {available.length === 0 ? (
        <p className="px-2 py-1.5 text-sm text-ink-faint">Every filter is already in play.</p>
      ) : (
        FACET_GROUPS.map((g) => {
          const items = available.filter((f) => f.group === g.key);
          if (items.length === 0) return null;
          return (
            <div key={g.key} className="px-0.5 py-1 first:pt-0.5">
              <p className="px-1.5 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">{g.label}</p>
              {items.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  role="menuitem"
                  onClick={() => onPick(f)}
                  className="block w-full rounded px-1.5 py-1 text-left text-sm text-ink-dim transition-colors hover:bg-panel-2 hover:text-ink focus-ring"
                >
                  {f.label}
                </button>
              ))}
            </div>
          );
        })
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

  // Every option-backed facet (select + datalist) gets the searchable listbox.
  if (facet.optionsKey) {
    return <FacetCombobox label={facet.label} options={options} current={current} counts={counts} onApply={onApply} />;
  }

  // What remains is the numeric facets (year / minute): a small typed input.
  return (
    <form
      className="absolute left-0 top-full z-40 mt-1 flex items-center gap-2 rounded-lg border border-line bg-panel p-2 shadow-xl"
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
