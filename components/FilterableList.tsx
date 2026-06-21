"use client";

import { useEffect, useState } from "react";

export interface FilterItem {
  key: string;
  /** Lowercased haystack the query is matched against. */
  text: string;
  /** Server-rendered row, passed through so its components stay off the client bundle. */
  node: React.ReactNode;
}

/**
 * Client-side text filter over a server-rendered list. The rows themselves are
 * built on the server and handed in as `node`s (pass-through), so this island
 * ships only the filter logic — not the row components. The page is statically
 * prerendered; deep links (`?<paramKey>=`) hydrate the input without a server
 * round-trip, and typing reflects to the URL via `history.replaceState` so the
 * slice stays shareable without re-navigating.
 */
export function FilterableList({
  items,
  paramKey = "q",
  label,
  placeholder,
  emptyText = "No matches.",
}: {
  items: FilterItem[];
  paramKey?: string;
  label: string;
  placeholder?: string;
  emptyText?: string;
}) {
  const [q, setQ] = useState("");

  useEffect(() => {
    const initial = new URLSearchParams(window.location.search).get(paramKey) ?? "";
    if (initial) setQ(initial);
  }, [paramKey]);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (q) url.searchParams.set(paramKey, q);
    else url.searchParams.delete(paramKey);
    window.history.replaceState(null, "", url);
  }, [q, paramKey]);

  const needle = q.trim().toLowerCase();
  const shown = needle ? items.filter((i) => i.text.includes(needle)) : items;

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-line bg-panel p-3">
        <label>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
            {label}
          </span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={placeholder}
            className="control w-full"
          />
        </label>
      </div>

      {shown.length > 0 ? (
        <ul className="overflow-hidden rounded-lg border border-line bg-pitch/35">
          {shown.map((i) => (
            <li key={i.key} className="border-b border-line last:border-b-0">
              {i.node}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink-dim">{emptyText}</p>
      )}
    </div>
  );
}
