"use client";

import { Fragment, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { queryString } from "@/lib/url";
import { FacetCombobox } from "@/components/FacetCombobox";
import { FacetIcon } from "@/components/FacetIcon";
import { FilterZones, type DecadeBucket } from "@/components/matches/FilterZones";
import { usePopoverAlign } from "@/components/usePopoverAlign";
import {
  FACET_BY_KEY,
  type FacetDef,
  type FacetGroup,
  type FacetOption,
  type FacetOptions,
  type FacetCounts,
} from "@/lib/matchFacets";

/** Params handled by FilterZones — not shown as chips in the bottom row. */
const ZONE_KEYS = new Set([
  "opponent",
  "manager",
  "player",
  "scorer",
  "assister",
  "competition",
  "season",
  "from",
  "to",
]);

const GROUP_TONE: Record<FacetGroup, string> = {
  who: "text-europe/60",
  what: "text-gold/60",
  where: "text-silver/60",
  when: "text-devil-bright/60",
};

/**
 * Filter bar for the Matches page. The URL is the single source of truth.
 *
 * Renders FilterZones (people / competition / time panel) and, below it, any
 * chips for search-applied filters (result, venue, etc.) that live outside the
 * zone panel. A "Clear all" button appears whenever any filter is active.
 */
export function MatchFilterBar({
  embedded = false,
  params,
  chips,
  chipCounts,
  options,
  counts,
  countsLoading,
  seasons,
  decadeBuckets,
}: {
  /** Chip row inside MatchControlDeck — no duplicate panel chrome. */
  embedded?: boolean;
  params: Record<string, string | undefined>;
  chips: { key: string; label: string }[];
  chipCounts: Record<string, number>;
  options: FacetOptions;
  counts: FacetCounts;
  /** True while contextual facet counts are loading client-side. */
  countsLoading?: boolean;
  /** Accepted for interface compatibility; owned by FilterZones. */
  total: number;
  /** Accepted for interface compatibility; owned by FilterZones. */
  matchHref?: string;
  seasons: string[];
  decadeBuckets?: DecadeBucket[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  // open: key of the non-zone chip whose editor popover is currently visible
  const [open, setOpen] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Dismiss chip editors on outside click or Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const navigate = (next: Record<string, string | undefined>) => {
    setOpen(null);
    startTransition(() => {
      router.push(`/matches${queryString({ ...next, page: undefined })}`, { scroll: false });
    });
  };

  const apply = (key: string, value: string | undefined) => {
    const v = value?.trim();
    navigate({ ...params, [key]: v || undefined });
  };

  // Only chips for non-zone params (zone filters live inline in FilterZones)
  const nonZoneChips = chips.filter((c) => !ZONE_KEYS.has(c.key));
  const hasAnyFilter = chips.length > 0;

  return (
    <div
      ref={rootRef}
      {...(!embedded ? { id: "match-filters" } : {})}
      className={
        embedded
          ? ""
          : "scroll-mt-20 rounded-lg border border-line bg-panel p-3 shadow-[0_1px_0_rgb(255_255_255_/_0.025)_inset]"
      }
    >
      {(pending || countsLoading) && (
        <p className="mb-2.5 text-xs text-ink-faint motion-safe:animate-pulse">
          {pending ? "Updating…" : "Loading…"}
        </p>
      )}

      {/* Always-visible zone panel */}
      <FilterZones
        params={params}
        options={options}
        counts={counts}
        seasons={seasons}
        decadeBuckets={decadeBuckets}
        navigate={navigate}
      />

      {/* Non-zone chips (search-applied: result, venue, type, goal window…) + clear all */}
      {hasAnyFilter && (
        <div className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-2 border-t border-line/50 pt-3">
          {nonZoneChips.map((chip) => {
            const facet = FACET_BY_KEY[chip.key];
            const editable = Boolean(facet && facet.kind !== "toggle");
            const count = chipCounts[chip.key];
            return (
              <Fragment key={chip.key}>
                <span className="relative inline-flex items-stretch overflow-hidden rounded-full border border-line bg-panel-2 text-sm text-ink-dim">
                  <button
                    type="button"
                    disabled={!editable}
                    onClick={() => editable && setOpen(open === chip.key ? null : chip.key)}
                    aria-expanded={editable ? open === chip.key : undefined}
                    className={`inline-flex items-center gap-1.5 py-1 pl-2.5 pr-2 transition-colors focus-ring ${
                      editable ? "hover:text-ink" : "cursor-default"
                    }`}
                  >
                    {facet && (
                      <FacetIcon
                        name={facet.icon}
                        className={`shrink-0 ${facet.group ? GROUP_TONE[facet.group] : "text-ink-faint"}`}
                      />
                    )}
                    {chip.label}
                    {typeof count === "number" && (
                      <span
                        className="stat-num ml-0.5 text-xs text-ink-faint"
                        title={`${count.toLocaleString("en-GB")} matches match this filter`}
                      >
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
                  {open === chip.key && facet && (
                    <FacetEditor
                      facet={facet}
                      current={params[chip.key] ?? ""}
                      options={facet.optionsKey ? (options[facet.optionsKey] ?? []) : []}
                      counts={counts[chip.key]}
                      onApply={(v) => apply(chip.key, v)}
                    />
                  )}
                </span>
              </Fragment>
            );
          })}
          <button
            type="button"
            onClick={() => navigate({})}
            className="ml-auto rounded-full px-2 py-1 text-sm text-ink-faint underline-offset-2 transition-colors hover:text-ink hover:underline focus-ring"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// FacetEditor — popover editor for non-zone chips (minute inputs + comboboxes)
// ─────────────────────────────────────────────────────────
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

  if (facet.optionsKey) {
    return (
      <FacetCombobox
        label={facet.label}
        options={options}
        current={current}
        counts={counts}
        onApply={onApply}
      />
    );
  }

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
        type="text"
        inputMode="numeric"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder={facet.placeholder}
        aria-label={facet.label}
        className="control w-44"
      />
      <button
        type="submit"
        className="min-h-[2.375rem] shrink-0 rounded-md bg-devil px-3 text-xs font-semibold text-ink transition-colors hover:bg-devil-bright focus-ring"
      >
        Apply
      </button>
    </form>
  );
}
