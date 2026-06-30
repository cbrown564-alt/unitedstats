"use client";

import { requestMobileSearch } from "@/lib/mobileSearch";

/** Search-first home entry on phone widths — opens the pill search overlay. Hidden
 *  from sm up (pill search is enough; narrow-shell uses the same pill). */
export function MobileSearchPrompt() {
  return (
    <div className="mt-6 max-w-2xl sm:hidden">
      <button
        type="button"
        onClick={requestMobileSearch}
        className="tap-target flex w-full items-center gap-3 rounded-lg border border-line bg-panel-2/80 px-4 py-3 text-left transition-colors hover:border-devil/50 focus-ring"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-ink-faint" aria-hidden>
          <circle cx="11" cy="11" r="7" />
          <line x1="16.5" y1="16.5" x2="21" y2="21" />
        </svg>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-ink">Settle it — search the archive</span>
          <span className="mt-0.5 block text-xs text-ink-faint">Players, records, head-to-heads, shaped questions</span>
        </span>
      </button>
      <p className="mt-2 text-xs text-ink-faint">Or tap Search in the bar below from anywhere on the site.</p>
    </div>
  );
}
