"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSiteSearch } from "./useSiteSearch";
import { SearchResults } from "./SearchResults";
import { SearchEmptyState } from "./SearchEmptyState";
import { pushRecent } from "@/lib/search/recents";
import { logSearchClick } from "@/lib/search/clientLog";

export function SearchCommand({
  autoFocusKey = true,
  autoFocusOnMount = false,
  compact = false,
  placeholder,
  onNavigate,
}: {
  autoFocusKey?: boolean;
  /** Focus the input as soon as it mounts (used by the mobile header panel). */
  autoFocusOnMount?: boolean;
  /** Slimmer styling and shorter placeholder for the persistent header search. */
  compact?: boolean;
  placeholder?: string;
  /** Fired when a result is chosen, so a wrapping panel can close itself. */
  onNavigate?: () => void;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const baseId = useId();
  const listId = `${baseId}-list`;
  const optionId = (i: number) => `${baseId}-opt-${i}`;

  const { shaped, entities, total } = useSiteSearch(q);
  const ready = q.trim().length >= 2;
  const rows: { href: string }[] = [...shaped, ...entities];
  const hasResults = rows.length > 0;
  const seeAllHref = `/search?q=${encodeURIComponent(q.trim())}`;

  const onChange = (value: string) => {
    setQ(value);
    setActive(-1);
    setOpen(true);
  };

  const select = (href: string) => {
    pushRecent(q);
    logSearchClick(q, href, total);
    setOpen(false);
    onNavigate?.();
    router.push(href);
  };

  useEffect(() => {
    if (autoFocusOnMount) inputRef.current?.focus();
  }, [autoFocusOnMount]);

  useEffect(() => {
    if (!autoFocusKey) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName;
      if (e.key === "/" && tag !== "INPUT" && tag !== "SELECT" && tag !== "TEXTAREA") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [autoFocusKey]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, rows.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, -1));
    } else if (e.key === "Enter") {
      // a highlighted row wins; otherwise Enter opens the full results page
      if (active >= 0 && rows[active]) select(rows[active].href);
      else if (ready) select(seeAllHref);
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div ref={boxRef} className={`relative ${compact ? "w-full" : "max-w-xl"}`}>
      <input
        ref={inputRef}
        type="search"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? optionId(active) : undefined}
        value={q}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={
          placeholder ??
          (compact
            ? "Search…"
            : 'Search — try "record away at Arsenal", "biggest win in the 90s", or a name…')
        }
        aria-label="Search players, opponents, seasons, managers, stadiums, and shaped questions"
        className={
          compact
            ? "w-full rounded-md border border-line bg-panel px-3 py-1.5 text-sm placeholder:text-ink-faint focus:border-devil focus:outline-none"
            : "w-full bg-panel border border-line rounded-lg px-4 py-2.5 text-sm placeholder:text-ink-faint focus:outline-none focus:border-devil"
        }
      />
      {open && (
        <div
          className={`absolute right-0 z-40 mt-1 w-full overflow-hidden rounded-lg border border-line bg-panel shadow-xl ${
            compact ? "sm:w-96" : ""
          }`}
        >
          {ready && hasResults ? (
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
                  className="block border-t border-line px-4 py-2 text-xs font-medium text-devil-bright hover:bg-panel-2"
                >
                  {total > 0 ? `See all ${total} result${total === 1 ? "" : "s"} →` : "Open the results page →"}
                </Link>
              }
            />
          ) : ready ? (
            <div className="px-4 py-3 text-sm text-ink-dim">
              No matches. <Link href={seeAllHref} className="text-devil-bright hover:underline">Search the archive →</Link>
            </div>
          ) : (
            <SearchEmptyState onPick={(query) => setQ(query)} />
          )}
        </div>
      )}
    </div>
  );
}
