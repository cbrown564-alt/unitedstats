"use client";

import Link from "next/link";
import { FacetIcon } from "@/components/FacetIcon";
import { SeasonRangeSlider } from "@/components/matches/SeasonRangeSlider";
import { usePopoverAlign } from "@/components/usePopoverAlign";
import {
  PRIMARY_FACETS,
  SEARCH_ONLY_FACETS,
  type FacetDef,
  type FacetCounts,
  type FacetGroup,
} from "@/lib/matchFacets";

const GROUP_TONE: Record<FacetGroup, string> = {
  who: "text-europe/70",
  what: "text-gold/70",
  where: "text-silver/70",
  when: "text-devil-bright/70",
};

const PEOPLE_PRIMARY: { key: string; hint?: string }[] = [
  { key: "opponent", hint: "Head-to-head" },
  { key: "manager", hint: "Under a manager" },
  { key: "player", hint: "In the lineup" },
  { key: "scorer", hint: "Scored" },
  { key: "assister", hint: "Assisted" },
];

/**
 * Curated add-filter board: primary facets as tactile cards, date range inline,
 * and search-only dimensions as quiet hints (not clickable — search applies them).
 */
export function FilterPalette({
  available,
  counts,
  total,
  matchHref,
  params,
  seasons,
  onPick,
  onApplyDates,
  onClose,
  variant,
}: {
  available: FacetDef[];
  counts: FacetCounts;
  total: number;
  matchHref?: string;
  params: Record<string, string | undefined>;
  seasons: string[];
  onPick: (f: FacetDef) => void;
  onApplyDates: (from: string | undefined, to: string | undefined) => void;
  onClose: () => void;
  variant: "inline" | "popover";
}) {
  const { ref, align } = usePopoverAlign();
  const inline = variant === "inline";
  const availableKeys = new Set(available.map((f) => f.key));

  const exhausted = (f: FacetDef) => {
    const c = counts[f.key];
    if (!c || total === 0) return false;
    const vals = Object.values(c);
    const coverage = vals.reduce((sum, n) => sum + n, 0);
    return coverage >= total && vals.filter((n) => n > 0).length <= 1;
  };

  const facetCard = (f: FacetDef, hint?: string) => {
    if (!availableKeys.has(f.key)) return null;
    const dim = exhausted(f);
    return (
      <button
        key={f.key}
        type="button"
        role="menuitem"
        disabled={dim}
        onClick={() => onPick(f)}
        title={dim ? "Only one option in this slice" : undefined}
        className={`flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors focus-ring ${
          dim
            ? "cursor-not-allowed border-line/50 bg-panel/30 text-ink-faint"
            : "border-line/80 bg-panel/80 text-ink-dim hover:border-devil/35 hover:bg-panel hover:text-ink"
        }`}
      >
        <FacetIcon
          name={f.icon}
          className={`mt-0.5 h-4 w-4 shrink-0 ${f.group ? GROUP_TONE[f.group] : "text-ink-faint"}`}
        />
        <span className="min-w-0">
          <span className="block text-sm font-medium leading-tight">{f.label}</span>
          {hint && <span className="mt-0.5 block text-[11px] leading-tight text-ink-faint">{hint}</span>}
        </span>
      </button>
    );
  };

  const people = PEOPLE_PRIMARY.map(({ key, hint }) => {
    const f = PRIMARY_FACETS.find((x) => x.key === key);
    return f ? facetCard(f, hint) : null;
  }).filter(Boolean);

  const competition = PRIMARY_FACETS.filter((f) => f.key === "competition").map((f) =>
    facetCard(f, "League, cup, or friendly"),
  );
  const season = PRIMARY_FACETS.filter((f) => f.key === "season").map((f) =>
    facetCard(f, "e.g. 1998-99"),
  );

  const primaryAvailable = PRIMARY_FACETS.filter((f) => availableKeys.has(f.key));
  const allExhausted = primaryAvailable.length > 0 && primaryAvailable.every(exhausted);
  const stuck = total <= 1 || allExhausted;

  const shellClass = inline
    ? "mt-3 w-full overflow-hidden rounded-xl border border-line bg-pitch/50 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.03)]"
    : `pop-in absolute ${align} top-full z-50 mt-1.5 w-[min(100vw-2rem,42rem)] overflow-hidden rounded-xl border border-line bg-panel shadow-xl`;

  return (
    <div ref={ref} role="menu" aria-label="Choose a filter" className={shellClass}>
      <div className={`flex items-center justify-between gap-3 border-b border-line ${inline ? "bg-panel/50 px-4 py-2.5" : "px-3 py-2"}`}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faint">Add a filter</p>
        {inline && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-xs text-ink-faint transition-colors hover:bg-panel-2 hover:text-ink focus-ring"
          >
            Done
          </button>
        )}
      </div>

      {stuck ? (
        <div className="p-4">
          {matchHref ? (
            <>
              <p className="text-sm text-ink-dim">You&rsquo;re down to a single match — nothing left to filter.</p>
              <Link
                href={matchHref}
                className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-devil-bright underline-offset-2 transition-colors hover:underline focus-ring"
              >
                View match <span aria-hidden>→</span>
              </Link>
            </>
          ) : (
            <p className="text-sm text-ink-faint">
              {total === 0
                ? "No matches in this slice — remove a filter to broaden."
                : "Every remaining filter has one value across these matches — remove a filter to broaden."}
            </p>
          )}
        </div>
      ) : (
        <div className="p-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <section className="min-w-0 space-y-2">
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-faint">People</h3>
              <div className="space-y-1.5">{people}</div>
            </section>

            <section className="min-w-0 space-y-2">
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-faint">Competition</h3>
              <div className="space-y-1.5">{competition}</div>
            </section>

            <section className="min-w-0 space-y-2">
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-faint">When</h3>
              <div className="space-y-1.5">{season}</div>
            </section>
          </div>

          <div className="mt-4 rounded-lg border border-line/80 bg-panel/80 p-4">
            <SeasonRangeSlider
              key={`${params.from ?? ""}-${params.to ?? ""}`}
              seasons={seasons}
              fromParam={params.from}
              toParam={params.to}
              onApply={onApplyDates}
            />
          </div>

          <p className="mt-4 border-t border-line/70 pt-3 text-[11px] leading-relaxed text-ink-faint">
            <span className="font-semibold uppercase tracking-[0.12em]">Also via search</span>
            <span className="mx-1.5 text-line">·</span>
            {SEARCH_ONLY_FACETS.map((f, i) => (
              <span key={f.key}>
                {i > 0 && <span className="text-line"> · </span>}
                <span>{f.label}</span>
              </span>
            ))}
          </p>
        </div>
      )}
    </div>
  );
}
