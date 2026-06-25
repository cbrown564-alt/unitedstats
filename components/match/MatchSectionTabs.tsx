"use client";

import { useState } from "react";

export type MatchSectionTab = {
  id: string;
  label: string;
  content: React.ReactNode;
};

/**
 * Mobile-only section tabs for `/match/[id]`. Below `sm`, one panel at a time;
 * at `sm+` every panel stacks in document order (desktop narrative unchanged).
 */
export function MatchSectionTabs({
  tabs,
  defaultTab,
}: {
  tabs: MatchSectionTab[];
  defaultTab: string;
}) {
  const visible = tabs.filter((t) => t.content != null);
  const fallback = visible[0]?.id ?? defaultTab;
  const [active, setActive] = useState(
    visible.some((t) => t.id === defaultTab) ? defaultTab : fallback,
  );
  const current = visible.some((t) => t.id === active) ? active : fallback;

  if (visible.length === 0) return null;

  return (
    <div className="space-y-5 sm:space-y-8">
      {visible.length > 1 && (
        <div
          className="flex items-center gap-0.5 overflow-x-auto border-b border-line sm:hidden"
          role="tablist"
          aria-label="Match sections"
        >
          {visible.map((tab) => (
            <button
              key={tab.id}
              id={`match-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={current === tab.id}
              aria-controls={`match-panel-${tab.id}`}
              onClick={() => setActive(tab.id)}
              className={`shrink-0 border-b px-3 py-2 text-sm transition-colors focus-ring ${
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
          id={`match-panel-${tab.id}`}
          role="tabpanel"
          aria-labelledby={`match-tab-${tab.id}`}
          className={current === tab.id ? "block" : "hidden sm:block"}
        >
          {tab.content}
        </section>
      ))}
    </div>
  );
}
