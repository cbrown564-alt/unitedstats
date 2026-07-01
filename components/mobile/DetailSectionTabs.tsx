"use client";

import { useState } from "react";

export type DetailSectionTab = {
  id: string;
  label: string;
  content: React.ReactNode;
  /** Stacks on desktop but gets no mobile tab button — its content is reached
   *  another way on mobile (e.g. the lineup lives in the match-tab scroll). */
  desktopOnly?: boolean;
};

/**
 * Mobile-only section tabs for entity detail pages. Below `sm`, one panel at a
 * time; at `sm+` every panel stacks in document order (desktop narrative
 * unchanged). `desktopOnly` tabs stack on desktop but are absent from the mobile
 * tab bar.
 */
export function DetailSectionTabs({
  tabs,
  defaultTab,
  ariaLabel = "Page sections",
  idPrefix = "detail",
}: {
  tabs: DetailSectionTab[];
  defaultTab: string;
  ariaLabel?: string;
  idPrefix?: string;
}) {
  const visible = tabs.filter((t) => t.content != null);
  const tabbable = visible.filter((t) => !t.desktopOnly);
  const fallback = tabbable[0]?.id ?? defaultTab;
  const [active, setActive] = useState(
    tabbable.some((t) => t.id === defaultTab) ? defaultTab : fallback,
  );
  const current = tabbable.some((t) => t.id === active) ? active : fallback;

  if (visible.length === 0) return null;

  return (
    <div className="space-y-5 sm:space-y-8">
      {tabbable.length > 1 && (
        <div
          className="flex items-stretch border-b border-line sm:hidden"
          role="tablist"
          aria-label={ariaLabel}
        >
          {tabbable.map((tab) => (
            <button
              key={tab.id}
              id={`${idPrefix}-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={current === tab.id}
              aria-controls={`${idPrefix}-panel-${tab.id}`}
              onClick={() => setActive(tab.id)}
              className={`flex-1 border-b px-3 py-2.5 text-center text-sm transition-colors focus-ring ${
                current === tab.id
                  ? "border-devil/45 text-ink"
                  : "border-transparent text-ink-dim hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {visible.map((tab) => (
        <section
          key={tab.id}
          id={`${idPrefix}-panel-${tab.id}`}
          role={tab.desktopOnly ? undefined : "tabpanel"}
          aria-labelledby={tab.desktopOnly ? undefined : `${idPrefix}-tab-${tab.id}`}
          className={!tab.desktopOnly && current === tab.id ? "block" : "hidden sm:block"}
        >
          {tab.content}
        </section>
      ))}
    </div>
  );
}
