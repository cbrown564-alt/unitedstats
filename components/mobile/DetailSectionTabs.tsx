"use client";

import { useState, type ReactNode } from "react";

export type DetailSectionTab = {
  id: string;
  label: string;
  /** Shorter label on phone — avoids truncation when many tabs share the bar. */
  shortLabel?: string;
  content: React.ReactNode;
  /** Stacks on desktop but gets no mobile tab button — its content is reached
   *  another way on mobile (e.g. the lineup lives in the match-tab scroll). */
  desktopOnly?: boolean;
};

/**
 * Section tabs for entity detail pages. One tab panel visible at a time at every
 * breakpoint; inactive panels stay hidden (no desktop stack). `desktopOnly` tabs
 * are absent from the tab bar and remain visible on `sm+` only — e.g. match lineup
 * reached elsewhere on mobile.
 *
 * Tab chrome is always compact and left-aligned (natural label width, medium
 * active weight, 2px indicator) — not equal-width stretch.
 */
export function DetailSectionTabs({
  tabs,
  defaultTab,
  ariaLabel = "Page sections",
  idPrefix = "detail",
  /** On mobile, pins this block (e.g. match hero) with the tab bar under one sticky
   *  head so the scoreline stays visible while scrolling long tab panels. */
  stickyHead,
  /** On mobile, panel content bleeds to the viewport edges (season detail, etc.). */
  edgeTabs,
}: {
  tabs: DetailSectionTab[];
  defaultTab: string;
  ariaLabel?: string;
  idPrefix?: string;
  stickyHead?: ReactNode;
  edgeTabs?: boolean;
}) {
  const visible = tabs.filter((t) => t.content != null);
  const tabbable = visible.filter((t) => !t.desktopOnly);
  const fallback = tabbable[0]?.id ?? defaultTab;
  const [active, setActive] = useState(
    tabbable.some((t) => t.id === defaultTab) ? defaultTab : fallback,
  );
  const current = tabbable.some((t) => t.id === active) ? active : fallback;

  if (visible.length === 0) return null;

  const tabBarClass = stickyHead
    ? "-mx-4 flex items-stretch gap-1 overflow-x-auto border-b border-line bg-pitch/95 px-4 backdrop-blur-md sm:-mx-6 sm:sticky sm:sticky-subnav sm:top-0 sm:z-30 sm:mt-8 sm:px-6 sm:backdrop-blur-md lg:static lg:mx-0 lg:mt-0 lg:overflow-visible lg:bg-transparent lg:px-0 lg:backdrop-blur-none"
    : "sticky top-0 z-30 -mx-4 flex items-stretch gap-1 overflow-x-auto border-b border-line bg-pitch/95 px-4 backdrop-blur-md sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:overflow-visible lg:bg-transparent lg:px-0 lg:backdrop-blur-none";

  const tabButtonClass =
    "min-h-11 shrink-0 flex-none border-b-2 px-3 py-2.5 text-sm transition-colors focus-ring";

  const tabBar =
    tabbable.length > 1 ? (
      <div className={tabBarClass} role="tablist" aria-label={ariaLabel}>
        {tabbable.map((tab) => (
          <button
            key={tab.id}
            id={`${idPrefix}-tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={current === tab.id}
            aria-controls={`${idPrefix}-panel-${tab.id}`}
            onClick={() => setActive(tab.id)}
            className={`${tabButtonClass} ${
              current === tab.id
                ? "border-devil/55 font-medium text-ink"
                : "border-transparent text-ink-dim hover:text-ink"
            }`}
          >
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.shortLabel ?? tab.label}</span>
          </button>
        ))}
      </div>
    ) : null;

  return (
    <div className="space-y-5 pb-[var(--mobile-nav-clearance)] sm:space-y-8 lg:pb-0">
      {stickyHead ? (
        <div className="match-sticky-head sm:static">
          {stickyHead}
          {tabBar}
        </div>
      ) : (
        tabBar
      )}

      {visible.map((tab) => (
        <section
          key={tab.id}
          id={`${idPrefix}-panel-${tab.id}`}
          role={tab.desktopOnly ? undefined : "tabpanel"}
          aria-labelledby={tab.desktopOnly ? undefined : `${idPrefix}-tab-${tab.id}`}
          className={
            tab.desktopOnly
              ? "hidden sm:block"
              : current === tab.id
                ? "block scroll-mt-14 lg:scroll-mt-24"
                : "hidden"
          }
        >
          {edgeTabs && !tab.desktopOnly ? (
            <div className="-mx-4 sm:mx-0">{tab.content}</div>
          ) : (
            tab.content
          )}
        </section>
      ))}
    </div>
  );
}
