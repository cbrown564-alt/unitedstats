"use client";

import { useState } from "react";
import { MatchFilterBarWithCounts } from "@/components/MatchFilterBarWithCounts";
import { FacetIcon } from "@/components/FacetIcon";
import type { DecadeBucket } from "@/components/matches/FilterZones";
import { FACET_BY_KEY, type FacetGroup } from "@/lib/matchFacets";

const GROUP_TONE: Record<FacetGroup, string> = {
  who: "text-europe/60",
  what: "text-gold/60",
  where: "text-silver/60",
  when: "text-devil-bright/60",
};

type FilterCollapseProps = {
  filterCount: number;
  params: Record<string, string | undefined>;
  chips: { key: string; label: string }[];
  total: number;
  matchHref?: string;
  seasons: string[];
  decadeBuckets?: DecadeBucket[];
};

function Chevron({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" aria-hidden className={className}>
      <path
        d="m2.5 4.5 3.5 3.5 3.5-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Short label for the collapsed strip — drop redundant role prefixes. */
function collapsedFilterLabel(chip: { key: string; label: string }): string {
  if (chip.key === "player" || chip.key === "scorer" || chip.key === "assister") {
    const i = chip.label.indexOf(": ");
    return i >= 0 ? chip.label.slice(i + 2) : chip.label;
  }
  if (chip.key === "season") {
    return chip.label.replace(/^Season /, "");
  }
  return chip.label;
}

function ActiveFilterStrip({
  chips,
  onEdit,
}: {
  chips: { key: string; label: string }[];
  onEdit: () => void;
}) {
  return (
    <div
      className="flex flex-wrap items-center gap-x-1 gap-y-1.5 pb-3 text-[13px] leading-snug"
      aria-label="Active filters"
    >
      {chips.map((chip, i) => {
        const facet = FACET_BY_KEY[chip.key];
        const icon = facet?.icon ?? (chip.key === "q" ? "shield" : chip.key === "round" ? "tag" : undefined);
        return (
          <span key={chip.key} className="inline-flex items-center">
            {i > 0 && <span aria-hidden className="mx-1.5 text-ink-faint/50">·</span>}
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 text-ink-dim underline decoration-devil-bright/75 underline-offset-[3px] transition-colors hover:text-devil-bright hover:decoration-devil-bright focus-ring"
            >
              {icon && (
                <FacetIcon
                  name={icon}
                  className={`h-3.5 w-3.5 shrink-0 ${facet?.group ? GROUP_TONE[facet.group] : "text-ink-faint"}`}
                />
              )}
              {collapsedFilterLabel(chip)}
            </button>
          </span>
        );
      })}
    </div>
  );
}

/**
 * Desktop-only inline filter collapse under the matches search bar. On mobile the
 * pill carries search + filters instead (see MobileMatchFilterControls).
 */
export function MatchFilterCollapse(props: FilterCollapseProps) {
  const { filterCount, chips } = props;
  const [inlineOpen, setInlineOpen] = useState(false);

  return (
    <div className="mt-4 border-t border-line/70">
      <button
        type="button"
        onClick={() => setInlineOpen((v) => !v)}
        aria-expanded={inlineOpen}
        className="flex w-full cursor-pointer select-none items-center gap-2 py-3 text-left text-[13px] text-ink-dim transition-colors hover:text-ink-faint focus-ring"
      >
        <Chevron
          className={`h-3 w-3 shrink-0 text-devil-bright/80 transition-transform duration-200 ${inlineOpen ? "rotate-0" : "-rotate-90"}`}
        />
        <span>Refine</span>
        {filterCount > 0 && (
          <span className="stat-num ml-auto text-[11px] text-ink-faint">
            {filterCount} active
          </span>
        )}
      </button>

      {!inlineOpen && filterCount > 0 && (
        <ActiveFilterStrip chips={chips} onEdit={() => setInlineOpen(true)} />
      )}

      {inlineOpen && (
        <div className="pb-1 pt-1">
          <MatchFilterBarWithCounts
            embedded
            params={props.params}
            chips={props.chips}
            total={props.total}
            matchHref={props.matchHref}
            seasons={props.seasons}
            decadeBuckets={props.decadeBuckets}
          />
        </div>
      )}
    </div>
  );
}
