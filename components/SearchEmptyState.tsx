"use client";

import { useSyncExternalStore } from "react";
import { MOBILE_SEARCH_SUGGESTIONS, POPULAR_SEARCHES, SEARCH_HINTS } from "@/lib/search/examples";
import { getRecentsSnapshot, getRecentsServerSnapshot, subscribeRecents } from "@/lib/search/recents";

/**
 * What the box shows before you type: your recent searches (when any), a few
 * worked examples that prove what the parser can do, and the scoping-operator
 * syntax. Picking any of them fills the input rather than navigating, so the user
 * stays in the flow of refining a query.
 *
 * Mobile variant strips operators and caps suggestions — the keyboard already
 * eats half the screen; pre-search chrome should be almost nothing.
 */
export function SearchEmptyState({
  onPick,
  variant = "default",
}: {
  onPick: (q: string) => void;
  variant?: "default" | "mobile";
}) {
  const recents = useSyncExternalStore(subscribeRecents, getRecentsSnapshot, getRecentsServerSnapshot);

  if (variant === "mobile") {
    return (
      <div className="mobile-search-suggestions">
        {recents[0] && (
          <>
            <p className="mobile-search-suggestions-label">Recent</p>
            <button type="button" onClick={() => onPick(recents[0])} className="mobile-search-suggestion focus-ring">
              {recents[0]}
            </button>
          </>
        )}
        <p className="mobile-search-suggestions-label">Try something like…</p>
        {MOBILE_SEARCH_SUGGESTIONS.map(({ q, label }) => (
          <button key={q} type="button" onClick={() => onPick(q)} className="mobile-search-suggestion focus-ring">
            {label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="p-2 text-sm">
      {recents.length > 0 && (
        <Section title="Recent">
          {recents.map((r) => (
            <button key={r} type="button" onClick={() => onPick(r)} className={ROW}>
              <span className="text-ink-faint" aria-hidden>↻</span>
              <span className="truncate">{r}</span>
            </button>
          ))}
        </Section>
      )}
      <Section title="Try a question">
        {POPULAR_SEARCHES.map((p) => (
          <button key={p.q} type="button" onClick={() => onPick(p.q)} className={ROW}>
            <span className="truncate">{p.q}</span>
            <span className="ml-auto shrink-0 text-[10px] uppercase tracking-wider text-ink-faint">{p.hint}</span>
          </button>
        ))}
      </Section>
      <div className="border-t border-line px-2 pt-2">
        <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Operators</p>
        <ul className="space-y-0.5 px-1 pb-1">
          {SEARCH_HINTS.map((h) => (
            <li key={h} className="stat-num text-xs text-ink-dim">{h}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const ROW =
  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-ink-dim hover:bg-panel-2 hover:text-ink focus-ring";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-1">
      <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">{title}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}
