"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Standalone searchable listbox for form fields — same keyboard and filter
 * behaviour as {@link FacetCombobox}, but with an inline trigger instead of a
 * filter-slot popover.
 */
export function SelectCombobox({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const activeRef = useRef<HTMLButtonElement>(null);

  const searchable = options.length > 8;
  const huge = options.length > 200;
  const currentLabel = options.find((o) => o.value === value)?.label ?? value;

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    let opts = options;
    if (q) opts = opts.filter((o) => o.label.toLowerCase().includes(q));
    else if (huge) opts = [];
    return opts.slice(0, 100);
  }, [options, query, huge]);

  const activeIdx = Math.min(active, Math.max(0, shown.length - 1));

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  const pick = (next: string) => {
    onChange(next);
    setOpen(false);
    setQuery("");
    setActive(0);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, shown.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (shown[activeIdx]) pick(shown[activeIdx].value);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  const listId = `${label.replace(/\s+/g, "-").toLowerCase()}-listbox`;

  return (
    <div ref={rootRef} className="relative min-w-0">
      <span className="mb-1 block text-xs uppercase tracking-wider text-ink-faint">{label}</span>
      <button
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => setOpen((o) => !o)}
        className="control flex w-full min-w-[10rem] items-center justify-between gap-2 text-left sm:min-w-[12rem]"
      >
        <span className="truncate font-medium">{currentLabel}</span>
        <span aria-hidden className="shrink-0 text-[11px] text-ink-faint">▾</span>
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-40 mt-1 overflow-hidden rounded-lg border border-line bg-panel shadow-xl sm:right-auto sm:min-w-full">
          {searchable && (
            <div className="border-b border-line p-2">
              <input
                autoFocus
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                onKeyDown={onKeyDown}
                placeholder={`Search ${label.toLowerCase()}…`}
                aria-label={`Search ${label}`}
                className="control w-full"
              />
            </div>
          )}
          <ul id={listId} role="listbox" aria-label={label} className="max-h-64 overflow-y-auto p-1">
            {shown.map((o, i) => {
              const selected = o.value === value;
              return (
                <li key={o.value}>
                  <button
                    ref={i === activeIdx ? activeRef : undefined}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => pick(o.value)}
                    onMouseMove={() => setActive(i)}
                    className={`block w-full truncate rounded px-2 py-1.5 text-left text-sm transition-colors focus-ring ${
                      i === activeIdx ? "bg-panel-2" : ""
                    } ${selected ? "text-devil-bright" : "text-ink-dim hover:text-ink"}`}
                  >
                    {o.label}
                  </button>
                </li>
              );
            })}
            {shown.length === 0 && (
              <li className="px-2 py-2 text-sm text-ink-faint">
                {huge && !query.trim() ? `Type to search ${label.toLowerCase()}…` : "No matches."}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
