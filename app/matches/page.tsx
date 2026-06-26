import type { Metadata } from "next";
import Link from "next/link";
import {
  findMatches, matchesSummary, matchDecades, allSeasons, managerById,
  playerById, stadiumById, matchEventBadges, opponentById, competitionNameById,
} from "@/lib/queries";
import { isRoundFilterKey, roundFilterLabel } from "@/lib/matchRounds";
import { matchesSequence } from "@/lib/trails";
import { MatchList } from "@/components/MatchList";
import { MatchGroups } from "@/components/MatchGroups";
import { FacetIcon } from "@/components/FacetIcon";
import { MatchControlDeck } from "@/components/matches/MatchControlDeck";
import { MatchListToolbar } from "@/components/matches/MatchListToolbar";
import { MatchSliceHero } from "@/components/matches/MatchSliceHero";
import { Pager } from "@/components/Pager";
import { PageHeader } from "@/components/PageHeader";
import { fmtNum, fmtDate, pct, venueLabel, resultLabel, resultTone, COMPETITION_TYPE_LABELS } from "@/lib/format";
import { matchFilterFromSearchParams, parseMatchSort, type MatchSort } from "@/lib/matchFilterFromUrl";
import { queryString } from "@/lib/url";

export const revalidate = 86400;

const PAGE_SIZE = 50;

const GOAL_WINDOW_LABELS: Record<string, string> = {
  firstHalf: "First half",
  secondHalf: "Second half",
  late: "Late",
  stoppage: "Stoppage time",
  extraTime: "Extra time",
};

const MATCHES_METADATA: Metadata = {
  title: "Matches",
  description:
    "Browse and filter the complete Manchester United match record since 1886 — filter by opponent, manager, season, venue, and result.",
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  if (page <= 1) return MATCHES_METADATA;
  return {
    ...MATCHES_METADATA,
    robots: { index: false, follow: true },
  };
}

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const sort = parseMatchSort(sp) as MatchSort;
  const chronological = sort === "date-desc" || sort === "date-asc";
  const dateSort = sort === "date-asc" || sort === "date-desc" ? sort : "date-desc";
  const goalDiffSort = sort === "gd-asc" || sort === "gd-desc" ? sort : "gd-desc";
  const round = isRoundFilterKey(sp.round) ? sp.round : undefined;
  const filter = matchFilterFromSearchParams(sp, {
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });
  const { rows, total } = findMatches(filter);
  const summary = matchesSummary(filter);
  const sequence = summary.p >= 24 ? matchesSequence(filter) : [];
  const seasons = allSeasons();
  const decades = matchDecades({ ...filter, from: undefined, to: undefined });
  const pages = Math.ceil(total / PAGE_SIZE);
  const hasFilters = Boolean(
    sp.q || sp.competition || sp.opponent || sp.manager || sp.season || sp.venue || sp.result || sp.type ||
    sp.round || sp.stadium || sp.city || sp.scorer || sp.assister || sp.player || sp.aet || sp.goalWindow ||
    sp.goalFrom || sp.goalTo || sp.from || sp.to,
  );
  const stadium = sp.stadium ? stadiumById(sp.stadium) : undefined;
  const eventBadges = matchEventBadges(rows.map((m) => m.id), filter);
  const renderEventBadge = (m: (typeof rows)[number]) => {
    const label = eventBadges.get(m.id);
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
  const eventBadgeRenderer = eventBadges.size > 0 ? renderEventBadge : undefined;

  const qs = (overrides: Record<string, string | undefined>) => queryString({ ...sp, ...overrides });

  const RESULT_NOUN: Record<string, string> = { W: "wins", D: "draws", L: "defeats" };
  const pinnedResult = sp.result && RESULT_NOUN[sp.result] ? sp.result : undefined;
  const heroValue = pinnedResult ? fmtNum(summary.p) : pct(summary.w, summary.p);
  const heroLabel = pinnedResult ? RESULT_NOUN[pinnedResult] : "won";
  const heroTone = pinnedResult ? resultTone(pinnedResult) : "text-win";
  const heroSub = pinnedResult ? null : `from ${fmtNum(summary.p)} ${summary.p === 1 ? "match" : "matches"}`;

  const chips: { key: string; label: string }[] = [];
  if (sp.opponent) chips.push({ key: "opponent", label: opponentById(sp.opponent)?.name ?? "Opponent" });
  if (sp.q) chips.push({ key: "q", label: `Opponent: ${sp.q}` });
  if (sp.competition) {
    chips.push({
      key: "competition",
      label: competitionNameById(sp.competition) ?? sp.competition,
    });
  }
  if (sp.manager) chips.push({ key: "manager", label: managerById(sp.manager)?.name ?? "Manager" });
  if (sp.season) chips.push({ key: "season", label: `Season ${sp.season}` });
  if (sp.venue) chips.push({ key: "venue", label: venueLabel(sp.venue) });
  if (sp.result) chips.push({ key: "result", label: resultLabel(sp.result) });
  if (sp.type) chips.push({ key: "type", label: COMPETITION_TYPE_LABELS[sp.type] ?? sp.type });
  if (round) chips.push({ key: "round", label: roundFilterLabel(round) });
  if (sp.stadium) chips.push({ key: "stadium", label: stadium?.name ?? "Ground" });
  if (sp.city) chips.push({ key: "city", label: sp.city });
  if (sp.scorer) chips.push({ key: "scorer", label: `Goalscorer: ${playerById(sp.scorer)?.name ?? sp.scorer}` });
  if (sp.assister) chips.push({ key: "assister", label: `Assister: ${playerById(sp.assister)?.name ?? sp.assister}` });
  if (sp.player) chips.push({ key: "player", label: `Player: ${playerById(sp.player)?.name ?? sp.player}` });
  if (sp.aet) chips.push({ key: "aet", label: "Went to extra time" });
  if (sp.goalWindow) chips.push({ key: "goalWindow", label: `Goal timing: ${GOAL_WINDOW_LABELS[sp.goalWindow] ?? sp.goalWindow}` });
  if (sp.goalFrom) chips.push({ key: "goalFrom", label: `Goals from ${sp.goalFrom}'` });
  if (sp.goalTo) chips.push({ key: "goalTo", label: `Goals to ${sp.goalTo}'` });
  if (sp.from) {
    chips.push({
      key: "from",
      label: /^\d{4}$/.test(sp.from) ? `From ${sp.from}` : `From ${fmtDate(sp.from.slice(0, 10))}`,
    });
  }
  if (sp.to) {
    chips.push({
      key: "to",
      label: /^\d{4}$/.test(sp.to) ? `To ${sp.to}` : `To ${fmtDate(sp.to.slice(0, 10))}`,
    });
  }

  return (
    <div className="space-y-7">
      <PageHeader eyebrow="Fixture record" title="Matches">
        The match browser is the archive spine: every aggregate should be able to come back here as evidence.
        Filter by era, competition, venue, result, or opponent trail.
      </PageHeader>

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
        matchHref={total === 1 && rows[0] ? `/match/${rows[0].id}` : undefined}
        seasons={seasons}
        decadeBuckets={decades}
        defaultFiltersOpen={hasFilters}
      />

      <MatchListToolbar total={total} sort={sort} dateSort={dateSort} goalDiffSort={goalDiffSort} qs={qs} />

      <div className="sticky top-14 z-30 -mx-4 border-y border-line bg-pitch/95 px-4 py-2 backdrop-blur sm:hidden">
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
    </div>
  );
}
