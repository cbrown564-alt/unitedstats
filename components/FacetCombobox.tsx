"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePopoverAlign } from "@/components/usePopoverAlign";
import type { FacetOption } from "@/lib/matchFacets";

/**
 * On-brand searchable listbox that replaces native <select>/datalist for every
 * option-backed facet. Three jobs: autocomplete (type to narrow), contextual
 * filtering (when `counts` is supplied, options that yield no matches in the rest
 * of the slice are dropped — so picking Bayern hides Premier League), and a
 * count beside each option so the reader can see where the matches are. Long
 * lists (players) wait for a query before listing.
 */
export function FacetCombobox({
  label,
  options,
  current,
  counts,
  onApply,
}: {
  label: string;
  options: FacetOption[];
  current: string;
  counts?: Record<string, number>;
  onApply: (value: string | undefined) => void;
}) {
  const { ref: rootRef, align } = usePopoverAlign();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const activeRef = useRef<HTMLButtonElement>(null);

  const searchable = options.length > 8;
  const huge = options.length > 200; // players: too many to dump unfiltered

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    let opts = options;
    // Contextual narrowing: keep only reachable options, but never drop the
    // current selection so it stays visible and changeable.
    if (counts) opts = opts.filter((o) => o.value === current || (counts[o.value] ?? 0) > 0);
    if (q) opts = opts.filter((o) => o.label.toLowerCase().includes(q));
    else if (huge) opts = [];
    return opts.slice(0, 100);
  }, [options, counts, current, query, huge]);

  const activeIdx = Math.min(active, Math.max(0, shown.length - 1));
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, shown.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); if (shown[activeIdx]) onApply(shown[activeIdx].value); }
  };

  return (
    <div ref={rootRef} className={`pop-in absolute ${align} top-full z-40 mt-1 w-72 overflow-hidden rounded-lg border border-line bg-panel shadow-xl`}>
      {searchable && (
        <div className="border-b border-line p-2">
          <input
            autoFocus
            type="search"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActive(0); }}
            onKeyDown={onKeyDown}
            placeholder={`Search ${label.toLowerCase()}…`}
            aria-label={`Search ${label}`}
            className="control w-full"
          />
        </div>
      )}
      <ul role="listbox" aria-label={label} className="max-h-64 overflow-y-auto p-1">
        <li>
          <button
            type="button"
            onClick={() => onApply(undefined)}
            className="block w-full rounded px-2 py-1.5 text-left text-sm text-ink-faint transition-colors hover:bg-panel-2 hover:text-ink focus-ring"
          >
            Any {label.toLowerCase()}
          </button>
        </li>
        {shown.map((o, i) => {
          const selected = o.value === current;
          const n = counts?.[o.value];
          return (
            <li key={o.value}>
              <button
                ref={i === activeIdx ? activeRef : undefined}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => onApply(o.value)}
                onMouseMove={() => setActive(i)}
                className={`flex w-full items-center justify-between gap-3 rounded px-2 py-1.5 text-left text-sm transition-colors focus-ring ${
                  i === activeIdx ? "bg-panel-2" : ""
                } ${selected ? "text-devil-bright" : "text-ink-dim hover:text-ink"}`}
              >
                <span className="truncate">{o.label}</span>
                {n != null && <span className="stat-num shrink-0 text-xs text-ink-faint">{n.toLocaleString()}</span>}
              </button>
            </li>
          );
        })}
        {shown.length === 0 && (
          <li className="px-2 py-2 text-sm text-ink-faint">
            {huge && !query.trim() ? `Type to search ${label.toLowerCase()}…` : "Nothing in this slice."}
          </li>
        )}
      </ul>
    </div>
  );
}
