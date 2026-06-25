"use client";

import { Fragment, useEffect, useRef, useState, useTransition, ViewTransition } from "react";
import { useRouter } from "next/navigation";
import { queryString } from "@/lib/url";
import { FacetCombobox } from "@/components/FacetCombobox";
import { FacetIcon } from "@/components/FacetIcon";
import { SeasonRangeSlider } from "@/components/matches/SeasonRangeSlider";
import { FilterPalette } from "@/components/matches/FilterPalette";
import { usePopoverAlign } from "@/components/usePopoverAlign";
import {
  FACET_BY_KEY, FACET_GROUPS, PRIMARY_FACETS, paramToInputDate,
  type FacetDef, type FacetGroup, type FacetOption, type FacetOptions, type FacetCounts,
} from "@/lib/matchFacets";

// Group accent for facet icons — one muted hue per group (who/what/where/when),
// so colour quietly echoes the spatial grouping. Kept low-key on purpose: the
// tint lives only on the small glyph, never the chip label or border. Tune the
// /60 here to dial the whole accent up or down in one place.
const GROUP_TONE: Record<FacetGroup, string> = {
  who: "text-europe/60",
  what: "text-gold/60",
  where: "text-silver/60",
  when: "text-devil-bright/60",
};

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
  embedded = false,
  params,
  chips,
  chipCounts,
  options,
  counts,
  countsLoading,
  total,
  matchHref,
  seasons,
}: {
  /** Chip row inside MatchControlDeck — no duplicate panel chrome. */
  embedded?: boolean;
  params: Record<string, string | undefined>;
  chips: { key: string; label: string }[];
  /** Size of each chip's filter in isolation, keyed by chip key — the universe it
   *  draws from, shown as a quiet trailing number. */
  chipCounts: Record<string, number>;
  options: FacetOptions;
  counts: FacetCounts;
  /** True while contextual facet counts are loading client-side. */
  countsLoading?: boolean;
  total: number;
  /** Link to the lone match when the slice has narrowed to one — the add-filter
   *  menu offers it as the way forward instead of a wall of dead options. */
  matchHref?: string;
  seasons: string[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  // The currently open popover: "add" for the add-filter menu, a facet key for
  // that facet's editor, or null when nothing is open.
  const [open, setOpen] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const closeMenu = () => setOpen(null);
  const toggleAddMenu = () => setOpen((prev) => (prev === "add" ? null : "add"));

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
  const applyDates = (from: string | undefined, to: string | undefined) => {
    navigate({ ...params, from, to });
  };
  const pick = (facet: FacetDef) => {
    if (facet.kind === "toggle") apply(facet.key, facet.onValue);
    else setOpen(facet.key);
  };

  const activeKeys = new Set(chips.map((c) => c.key));
  const available = PRIMARY_FACETS.filter((f) => !activeKeys.has(f.key));
  // Order active chips by facet group (who → what → where → when) so the bar
  // clusters related filters; the sort is stable, so insertion order holds within
  // a group. A hairline is dropped in wherever the group changes.
  const groupOrder = new Map(FACET_GROUPS.map((g, i) => [g.key, i] as const));
  const orderedChips = [...chips].sort(
    (a, b) =>
      (groupOrder.get(FACET_BY_KEY[a.key]?.group ?? "who") ?? 99) -
      (groupOrder.get(FACET_BY_KEY[b.key]?.group ?? "who") ?? 99),
  );
  // When the open popover is a facet that isn't yet active, its editor anchors to
  // the add-filter button rather than to a chip.
  const newFacet = open && open !== "add" && !activeKeys.has(open) ? FACET_BY_KEY[open] : undefined;

  return (
    <div
      ref={rootRef}
      {...(!embedded ? { id: "match-filters" } : {})}
      className={
        embedded
          ? "border-t border-line/70 pt-4"
          : "scroll-mt-20 rounded-lg border border-line bg-panel p-3 shadow-[0_1px_0_rgb(255_255_255_/_0.025)_inset]"
      }
    >
      <div className="mb-2.5 flex items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">Filters</p>
        {(pending || countsLoading) && (
          <span className="stat-num text-xs text-ink-faint motion-safe:animate-pulse">
            {pending ? "Updating…" : "Loading counts…"}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2">
        {orderedChips.map((chip, i) => {
          const facet = FACET_BY_KEY[chip.key];
          const editable = facet && facet.kind !== "toggle";
          const dateChip = chip.key === "from" || chip.key === "to";
          const prevGroup = i > 0 ? FACET_BY_KEY[orderedChips[i - 1].key]?.group : undefined;
          const groupBreak = i > 0 && facet?.group !== prevGroup;
          const count = chipCounts[chip.key];
          return (
            <Fragment key={chip.key}>
            {groupBreak && <span aria-hidden className="mx-0.5 h-4 w-px self-center bg-line" />}
            <ViewTransition>
            <span className="relative inline-flex items-stretch overflow-hidden rounded-full border border-line bg-panel-2 text-sm text-ink-dim">
              <button
                type="button"
                disabled={!editable}
                onClick={() => editable && setOpen(open === chip.key ? null : chip.key)}
                aria-expanded={open === chip.key}
                className={`inline-flex items-center gap-1.5 py-1 pl-2.5 pr-2 transition-colors focus-ring ${editable ? "hover:text-ink" : "cursor-default"}`}
              >
                {facet && <FacetIcon name={facet.icon} className={`shrink-0 ${facet.group ? GROUP_TONE[facet.group] : "text-ink-faint"}`} />}
                {chip.label}
                {typeof count === "number" && (
                  <span className="stat-num ml-0.5 text-xs text-ink-faint" title={`${count.toLocaleString("en-GB")} matches match this filter`}>
                    {count.toLocaleString("en-GB")}
                  </span>
                )}
                {editable && <span aria-hidden className="ml-0.5 text-ink-faint">▾</span>}
              </button>
              <span aria-hidden className="my-1 w-px self-stretch bg-line" />
              <button
                type="button"
                onClick={() => apply(chip.key, undefined)}
                aria-label={`Remove filter: ${chip.label}`}
                className="flex items-center px-2 text-ink-faint transition-colors hover:bg-devil-bright/10 hover:text-devil-bright focus-ring"
              >
                ×
              </button>
              {open === chip.key && dateChip && (
                <DateRangeFacetEditor params={params} seasons={seasons} onApply={applyDates} />
              )}
              {open === chip.key && facet && !dateChip && (
                <FacetEditor
                  facet={facet}
                  current={params[chip.key] ?? ""}
                  options={facet.optionsKey ? options[facet.optionsKey] ?? [] : []}
                  counts={counts[chip.key]}
                  onApply={(v) => apply(chip.key, v)}
                />
              )}
            </span>
            </ViewTransition>
            </Fragment>
          );
        })}

        {chips.length > 0 && <span aria-hidden className="mx-0.5 h-5 w-px self-center bg-line" />}

        <span className={embedded ? "w-full sm:w-auto" : "relative inline-flex"}>
          <button
            type="button"
            onClick={toggleAddMenu}
            aria-expanded={open === "add"}
            className={`inline-flex w-full items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors focus-ring sm:w-auto ${
              open === "add"
                ? "border-devil/60 bg-devil/15 font-medium text-devil-bright"
                : "border-dashed border-line bg-panel text-ink-dim hover:border-devil/50 hover:text-devil-bright"
            }`}
          >
            <span aria-hidden>＋</span> Add filter
          </button>
          {open === "add" && !embedded && (
            <FilterPalette
              available={available}
              counts={counts}
              total={total}
              matchHref={matchHref}
              params={params}
              seasons={seasons}
              onPick={pick}
              onApplyDates={applyDates}
              onClose={closeMenu}
              variant="popover"
            />
          )}
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
            className="ml-auto rounded-full px-2 py-1 text-sm text-ink-faint underline-offset-2 transition-colors hover:text-ink hover:underline focus-ring"
          >
            Clear all
          </button>
        )}
      </div>

      {open === "add" && embedded && (
        <FilterPalette
          available={available}
          counts={counts}
          total={total}
          matchHref={matchHref}
          params={params}
          seasons={seasons}
          onPick={pick}
          onApplyDates={applyDates}
          onClose={closeMenu}
          variant="inline"
        />
      )}

      {chips.length === 0 && embedded && open !== "add" && (
        <p className="mt-2 text-sm text-ink-faint">
          Add a filter for opponent, manager, player, competition, season, or dates — or use search for result, venue, and more.
        </p>
      )}

      {chips.length === 0 && !embedded && (
        <p className="mt-2 text-sm text-ink-faint">
          Add a filter for opponent, manager, player, competition, season, or dates — or use search for result, venue, and more.
        </p>
      )}
    </div>
  );
}

function DateRangeFacetEditor({
  params,
  seasons,
  onApply,
}: {
  params: Record<string, string | undefined>;
  seasons: string[];
  onApply: (from: string | undefined, to: string | undefined) => void;
}) {
  const { ref, align } = usePopoverAlign();
  return (
    <div
      ref={ref}
      className={`pop-in absolute ${align} top-full z-40 mt-1 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-lg border border-line bg-panel p-3 shadow-xl`}
    >
      <SeasonRangeSlider
        key={`${params.from ?? ""}-${params.to ?? ""}`}
        seasons={seasons}
        fromParam={params.from}
        toParam={params.to}
        onApply={onApply}
        compact
      />
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
  const [val, setVal] = useState(() =>
    facet.kind === "date"
      ? paramToInputDate(current, facet.key === "from" ? "from" : "to")
      : current,
  );
  const { ref, align } = usePopoverAlign<HTMLFormElement>();

  // Every option-backed facet (select + datalist) gets the searchable listbox.
  if (facet.optionsKey) {
    return <FacetCombobox label={facet.label} options={options} current={current} counts={counts} onApply={onApply} />;
  }

  if (facet.kind === "date") {
    return (
      <form
        ref={ref}
        className={`pop-in absolute ${align} top-full z-40 mt-1 flex items-center gap-2 rounded-lg border border-line bg-panel p-2 shadow-xl`}
        onSubmit={(e) => {
          e.preventDefault();
          onApply(val || undefined);
        }}
      >
        <input
          autoFocus
          type="date"
          value={val}
          min="1886-01-01"
          max="2026-12-31"
          onChange={(e) => setVal(e.target.value)}
          aria-label={facet.label}
          className="control w-44"
        />
        <button type="submit" className="min-h-[2.375rem] shrink-0 rounded-md bg-devil px-3 text-xs font-semibold text-ink transition-colors hover:bg-devil-bright focus-ring">
          Apply
        </button>
      </form>
    );
  }

  // Numeric facets (goal minute).
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
