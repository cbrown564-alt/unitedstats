"use client";

import Link from "next/link";
import { RESHAPE_PROMPTS } from "@/lib/search/examples";

/**
 * The never-blank recovery (DISCOVERY §6): when a query resolves to nothing, the
 * box still offers a way forward — a clutch of shaped questions the parser does
 * answer, each one filling the field rather than navigating, plus a link into the
 * full archive. Shared by the header dropdown and the ⌘K palette so a dead end
 * looks the same everywhere.
 */
export function SearchReshape({
  query,
  seeAllHref,
  onPick,
  onSeeAll,
}: {
  query: string;
  seeAllHref: string;
  /** Fill the input with a reshape, keeping the user in the flow of refining. */
  onPick: (q: string) => void;
  /** Navigate to the full results page (so the click is logged like any other). */
  onSeeAll: () => void;
}) {
  const trimmed = query.trim();
  return (
    <div className="p-3 text-sm">
      <p className="px-1 text-ink-dim">
        No exact match{trimmed ? <> for &ldquo;<span className="text-ink">{trimmed}</span>&rdquo;</> : ""}. Try a shaped question:
      </p>
      <div className="mt-2 space-y-0.5">
        {RESHAPE_PROMPTS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPick(p)}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-ink-dim hover:bg-panel-2 hover:text-ink focus-ring"
          >
            <span aria-hidden className="text-ink-faint">↳</span>
            <span className="truncate">{p}</span>
          </button>
        ))}
      </div>
      <Link
        href={seeAllHref}
        onClick={onSeeAll}
        className="mt-1 block border-t border-line px-2 pt-2 text-xs font-medium text-devil-bright hover:underline"
      >
        Search the full archive →
      </Link>
    </div>
  );
}
