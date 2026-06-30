import Link from "next/link";
import { MatchList } from "@/components/MatchList";
import { MatchGroups } from "@/components/MatchGroups";
import { FacetIcon } from "@/components/FacetIcon";
import { MatchControlDeck } from "@/components/matches/MatchControlDeck";
import { MatchListToolbar } from "@/components/matches/MatchListToolbar";
import { MatchSliceHero } from "@/components/matches/MatchSliceHero";
import { Pager } from "@/components/Pager";
import { fmtNum } from "@/lib/format";
import type { MatchPageView } from "@/lib/matchPageView";
import type { MatchRow } from "@/lib/queries";
import { queryString } from "@/lib/url";

export function MatchesPageBody({ view }: { view: MatchPageView }) {
  const {
    params: sp,
    page,
    pages,
    sort,
    chronological,
    dateSort,
    goalDiffSort,
    rows,
    total,
    summary,
    sequence,
    seasons,
    decades,
    hasFilters,
    chips,
    eventBadges,
    pinnedResult,
    heroValue,
    heroLabel,
    heroTone,
    heroSub,
    matchHref,
  } = view;

  const qs = (overrides: Record<string, string | undefined>) => queryString({ ...sp, ...overrides });

  const renderEventBadge = (m: MatchRow) => {
    const label = eventBadges[m.id];
    if (!label) return null;
    const full = `${label.count} ${label.count === 1 ? label.noun : `${label.noun}s`} · ${label.minutes.join(", ")}`;
    return (
      <span className="inline-flex items-start gap-1 text-[11px] text-ink-dim" title={full}>
        <FacetIcon name="stopwatch" className="mt-px h-3.5 w-3.5 shrink-0 text-ink-faint" />
        <span className="stat-num flex flex-col items-end leading-tight">
          {label.minutes.map((mn, i) => (
            <span key={i}>{mn}</span>
          ))}
        </span>
      </span>
    );
  };
  const eventBadgeRenderer = Object.keys(eventBadges).length > 0 ? renderEventBadge : undefined;

  return (
    <>
      <MatchSliceHero
        summary={summary}
        sequence={sequence}
        hasFilters={hasFilters}
        pinnedResult={pinnedResult}
        heroValue={heroValue}
        heroLabel={heroLabel}
        heroTone={heroTone}
        heroSub={heroSub}
      />

      <MatchControlDeck
        params={sp}
        chips={chips}
        total={total}
        matchHref={matchHref}
        seasons={seasons}
        decadeBuckets={decades}
        defaultFiltersOpen={hasFilters}
      />

      <MatchListToolbar total={total} sort={sort} dateSort={dateSort} goalDiffSort={goalDiffSort} qs={qs} />

      <div className="sticky-subnav sticky z-30 -mx-4 border-y border-line bg-pitch/95 px-4 py-2 backdrop-blur sm:hidden">
        <div className="flex items-center justify-between gap-3">
          <span className="stat-num text-xs text-ink-dim">
            {hasFilters
              ? `${chips.length} filter${chips.length === 1 ? "" : "s"} · ${fmtNum(total)} match${total === 1 ? "" : "es"}`
              : `${fmtNum(total)} matches`}
          </span>
          <div className="flex items-center gap-1">
            {hasFilters && (
              <Link
                href="/matches"
                className="tap-target px-2 py-1 text-xs text-ink-faint underline-offset-2 hover:text-ink hover:underline focus-ring"
              >
                Clear
              </Link>
            )}
            <a
              href="#match-filters"
              className="tap-target rounded-md border border-line bg-panel px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-devil/50 hover:text-devil-bright focus-ring"
            >
              Filters
            </a>
          </div>
        </div>
      </div>

      {chronological ? (
        <MatchGroups matches={rows} showAttendance accentResult renderExtra={eventBadgeRenderer} />
      ) : (
        <MatchList matches={rows} showSeason showAttendance accentResult renderExtra={eventBadgeRenderer} />
      )}

      <Pager page={page} pages={pages} hrefFor={(p) => `/matches${qs({ page: String(p) })}`} />
    </>
  );
}
