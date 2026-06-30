"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSiteSearch } from "./useSiteSearch";
import { SearchResults } from "./SearchResults";
import { SearchEmptyState } from "./SearchEmptyState";
import { SearchReshape } from "./SearchReshape";
import { pushRecent } from "@/lib/search/recents";
import { logSearchClick } from "@/lib/search/clientLog";
import { SEARCH_PLACEHOLDER } from "@/lib/search/examples";

/**
 * The ⌘K / Ctrl-K command palette: a centred overlay over the same engine the
 * header dropdown uses, so power users get a focus-trapping, full-keyboard search
 * from anywhere. Mounted once in the root layout.
 */
export function CommandPalette({ initialOpen = false }: { initialOpen?: boolean }) {
  const [open, setOpen] = useState(initialOpen);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const baseId = useId();
  const listId = `${baseId}-list`;
  const optionId = (i: number) => `${baseId}-opt-${i}`;

  const { shaped, entities, total, displayTotal } = useSiteSearch(q);
  const ready = q.trim().length >= 2;
  const rows: { href: string }[] = [...shaped, ...entities];
  const seeAllHref = `/search?q=${encodeURIComponent(q.trim())}`;

  const close = useCallback(() => {
    setOpen(false);
    setQ("");
    setActive(-1);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  const onChange = (value: string) => {
    setQ(value);
    setActive(-1);
  };

  const select = (href: string) => {
    pushRecent(q);
    logSearchClick(q, href, total);
    close();
    router.push(href);
  };

  if (!open) return null;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, rows.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, -1));
    } else if (e.key === "Enter") {
      if (active >= 0 && rows[active]) select(rows[active].href);
      else if (ready) select(seeAllHref);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 px-4 pt-[12vh] backdrop-blur-sm"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        className="w-full max-w-xl overflow-hidden rounded-xl border border-line bg-panel shadow-2xl"
      >
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? optionId(active) : undefined}
          value={q}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={SEARCH_PLACEHOLDER}
          aria-label="Search"
          className="w-full border-b border-line bg-transparent px-4 py-3.5 text-base placeholder:text-ink-faint focus:outline-none"
        />
        {ready && rows.length > 0 ? (
          <SearchResults
            shaped={shaped}
            entities={entities}
            query={q}
            active={active}
            listId={listId}
            optionId={optionId}
            onSelect={select}
            onHover={setActive}
            footer={
              <Link
                href={seeAllHref}
                onClick={() => select(seeAllHref)}
                className="block border-t border-line px-4 py-2.5 text-sm font-medium text-devil-bright hover:bg-panel-2"
              >
                {displayTotal > 0
                  ? `See all ${displayTotal} result${displayTotal === 1 ? "" : "s"} →`
                  : "Open the results page →"}
              </Link>
            }
          />
        ) : ready ? (
          <SearchReshape
            query={q}
            seeAllHref={seeAllHref}
            onPick={(query) => {
              setQ(query);
              setActive(-1);
              inputRef.current?.focus();
            }}
            onSeeAll={() => select(seeAllHref)}
          />
        ) : (
          <SearchEmptyState onPick={setQ} />
        )}
        <div className="flex items-center gap-3 border-t border-line px-4 py-1.5 text-[10px] uppercase tracking-wider text-ink-faint">
          <span><kbd className="stat-num">↑↓</kbd> navigate</span>
          <span><kbd className="stat-num">↵</kbd> open</span>
          <span><kbd className="stat-num">esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
