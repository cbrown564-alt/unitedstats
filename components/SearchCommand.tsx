"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSiteSearch } from "./useSiteSearch";
import { SearchResults } from "./SearchResults";
import { SearchEmptyState } from "./SearchEmptyState";
import { SearchReshape } from "./SearchReshape";
import { pushRecent } from "@/lib/search/recents";
import { logSearchClick } from "@/lib/search/clientLog";
import { useRotatingPlaceholder } from "./useRotatingPlaceholder";
import { SEARCH_PLACEHOLDER } from "@/lib/search/examples";
import type { SearchEntity } from "@/lib/search";
import { entityMatchesHref } from "@/lib/search/matchesHref";
import { queryString } from "@/lib/url";

export function SearchCommand({
  autoFocusKey = true,
  autoFocusOnMount = false,
  compact = false,
  fullWidth = false,
  forMatches = false,
  placeholder,
  onNavigate,
  onDismiss,
  inputClassName,
  dropdownClassName,
}: {
  autoFocusKey?: boolean;
  /** Focus the input as soon as it mounts (used by the mobile header panel). */
  autoFocusOnMount?: boolean;
  /** Slimmer styling and shorter placeholder for the persistent header search. */
  compact?: boolean;
  /** Span the full container width (hero / Matches page). */
  fullWidth?: boolean;
  /** On `/matches`, route picks into filter chips instead of entity pages or `/search`. */
  forMatches?: boolean;
  placeholder?: string;
  /** Fired when a result is chosen, so a wrapping panel can close itself. */
  onNavigate?: () => void;
  /** Fired when the field loses focus and nothing inside the command took it. */
  onDismiss?: () => void;
  /** Extra classes merged onto the input element. */
  inputClassName?: string;
  /** Override the results panel positioning/sizing (e.g. sidebar search). */
  dropdownClassName?: string;
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
  const rows: { href: string; entity?: SearchEntity }[] = [
    ...shaped.map((s) => ({ href: s.href })),
    ...entities.map((e) => ({ href: e.href, entity: e })),
  ];
  const hasResults = rows.length > 0;
  const seeAllHref = `/search?q=${encodeURIComponent(q.trim())}`;

  // The big hero/discover field teaches itself with a rotating example; the compact
  // header search and any caller-supplied placeholder stay fixed.
  const exampleQ = useRotatingPlaceholder(!placeholder && !compact && q === "");
  const computedPlaceholder =
    placeholder ?? (compact ? SEARCH_PLACEHOLDER : `Try “${exampleQ}”`);

  const resolveHref = (href: string, entity?: SearchEntity) => {
    if (!forMatches) return href;
    if (href.startsWith("/matches") || href.startsWith("/match/")) return href;
    if (entity) return entityMatchesHref(entity);
    return href;
  };

  const defaultMatchesHref = () => {
    if (shaped[0]) return shaped[0].href;
    if (entities[0]) return entityMatchesHref(entities[0]);
    return `/matches${queryString({ q: q.trim() })}`;
  };

  const onChange = (value: string) => {
    setQ(value);
    setActive(-1);
    setOpen(true);
  };

  const select = (href: string, entity?: SearchEntity) => {
    const destination = resolveHref(href, entity);
    pushRecent(q);
    logSearchClick(q, destination, total);
    setOpen(false);
    onNavigate?.();
    router.push(destination);
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
      if (active >= 0 && rows[active]) select(rows[active].href, rows[active].entity);
      else if (ready) select(forMatches ? defaultMatchesHref() : seeAllHref);
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  const onInputBlur = () => {
    window.setTimeout(() => {
      if (!boxRef.current?.contains(document.activeElement)) {
        setOpen(false);
        onDismiss?.();
      }
    }, 0);
  };

  const compactInputClass =
    "w-full rounded-md border border-line bg-panel px-3 py-1.5 text-sm placeholder:text-ink-dim focus:border-devil focus:outline-none";

  const compactDropdownClass =
    "absolute right-0 z-40 mt-1 w-full overflow-hidden rounded-lg border border-line bg-panel shadow-xl sm:w-96";
  const defaultDropdownClass = compact ? compactDropdownClass : compactDropdownClass.replace(" sm:w-96", "");

  return (
    <div ref={boxRef} className={`relative ${compact || fullWidth ? "w-full" : "max-w-xl"}`}>
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
        onBlur={onInputBlur}
        onKeyDown={onKeyDown}
        placeholder={computedPlaceholder}
        aria-label="Search players, opponents, seasons, managers, stadiums, and shaped questions"
        className={
          compact
            ? (inputClassName ?? compactInputClass)
            : forMatches
              ? "w-full rounded-lg border border-line bg-panel px-4 py-2.5 text-sm placeholder:text-ink-dim focus:border-devil focus:outline-none"
              : "w-full bg-panel border border-line rounded-lg px-4 py-2.5 text-sm placeholder:text-ink-faint focus:outline-none focus:border-devil"
        }
      />
      {open && (
        <div className={dropdownClassName ?? defaultDropdownClass}>
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
                forMatches ? undefined : (
                  <Link
                    href={seeAllHref}
                    onClick={() => select(seeAllHref)}
                    className="block border-t border-line px-4 py-2 text-xs font-medium text-devil-bright hover:bg-panel-2"
                  >
                    {total > 0 ? `See all ${total} result${total === 1 ? "" : "s"} →` : "Open the results page →"}
                  </Link>
                )
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
              onSeeAll={() => select(forMatches ? defaultMatchesHref() : seeAllHref)}
            />
          ) : (
            <SearchEmptyState onPick={(query) => setQ(query)} />
          )}
        </div>
      )}
    </div>
  );
}
