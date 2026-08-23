import { fmtDate, fmtNum, pct, resultLabel, resultTone, homeAwayLabel, COMPETITION_TYPE_LABELS } from "@/lib/format";
import { isRoundFilterKey, roundFilterLabel } from "@/lib/matchRounds";
import { matchFilterFromSearchParams, parseMatchSort } from "@/lib/matchFilterFromUrl";
import {
  MATCHES_PAGE_SIZE,
  SEASON_SLICE_ONE_PAGE_MAX,
  hasActiveMatchFilters,
  isSeasonOnlyFilter,
  type MatchPageChip,
  type MatchPageView,
} from "@/lib/matchPageView";
import type { MatchesCatalog } from "@/lib/matches/catalogTypes";
import {
  catalogDecades,
  catalogEventBadges,
  catalogSummary,
  filterCatalogMatches,
  toMatchRow,
} from "@/lib/matches/filterCatalog";

const GOAL_WINDOW_LABELS: Record<string, string> = {
  firstHalf: "First half",
  secondHalf: "Second half",
  late: "Late",
  stoppage: "Stoppage time",
  extraTime: "Extra time",
};

const RESULT_NOUN: Record<string, string> = { W: "wins", D: "draws", L: "defeats" };

function buildMatchChips(sp: Record<string, string | undefined>, catalog: MatchesCatalog): MatchPageChip[] {
  const round = isRoundFilterKey(sp.round) ? sp.round : undefined;
  const playerName = (id: string | undefined) => (id ? (catalog.playerNames[id] ?? id) : undefined);
  const opponentName = catalog.matches.find((row) => row.opponent_id === sp.opponent)?.opponent_name;
  const competitionName = catalog.matches.find((row) => row.competition_id === sp.competition)?.competition_name;
  const managerName = catalog.matches.find((row) => row.manager_id === sp.manager)?.manager_name;
  const stadiumName = catalog.matches.find((row) => row.stadium_id === sp.stadium)?.stadium_name;

  const chips: MatchPageChip[] = [];
  if (sp.opponent) chips.push({ key: "opponent", label: opponentName ?? "Opponent" });
  if (sp.q) chips.push({ key: "q", label: `Opponent: ${sp.q}` });
  if (sp.competition) chips.push({ key: "competition", label: competitionName ?? sp.competition });
  if (sp.manager) chips.push({ key: "manager", label: managerName ?? "Manager" });
  if (sp.season) chips.push({ key: "season", label: `Season ${sp.season}` });
  if (sp.venue) chips.push({ key: "venue", label: homeAwayLabel(sp.venue) });
  if (sp.result) chips.push({ key: "result", label: resultLabel(sp.result) });
  if (sp.type) chips.push({ key: "type", label: COMPETITION_TYPE_LABELS[sp.type] ?? sp.type });
  if (round) chips.push({ key: "round", label: roundFilterLabel(round) });
  if (sp.stadium) chips.push({ key: "stadium", label: stadiumName ?? "Ground" });
  if (sp.city) chips.push({ key: "city", label: sp.city });
  if (sp.scorer) chips.push({ key: "scorer", label: `Goalscorer: ${playerName(sp.scorer) ?? sp.scorer}` });
  if (sp.assister) chips.push({ key: "assister", label: `Assister: ${playerName(sp.assister) ?? sp.assister}` });
  if (sp.player) chips.push({ key: "player", label: `Player: ${playerName(sp.player) ?? sp.player}` });
  if (sp.aet) chips.push({ key: "aet", label: "Went to extra time" });
  if (sp.goalWindow) {
    chips.push({ key: "goalWindow", label: `Goal timing: ${GOAL_WINDOW_LABELS[sp.goalWindow] ?? sp.goalWindow}` });
  }
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
  return chips;
}

export function buildMatchesPageViewFromCatalog(
  sp: Record<string, string | undefined>,
  catalog: MatchesCatalog,
): MatchPageView {
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const sort = parseMatchSort(sp);
  const chronological = sort === "date-desc" || sort === "date-asc";
  const dateSort = sort === "date-asc" || sort === "date-desc" ? sort : "date-desc";
  const goalDiffSort = sort === "gd-asc" || sort === "gd-desc" ? sort : "gd-desc";
  const seasonOnePage = isSeasonOnlyFilter(sp) && page === 1;
  const pageLimit = seasonOnePage ? SEASON_SLICE_ONE_PAGE_MAX : MATCHES_PAGE_SIZE;
  const offset = seasonOnePage ? 0 : (page - 1) * MATCHES_PAGE_SIZE;
  const filter = matchFilterFromSearchParams(sp, { limit: pageLimit, offset });
  const filtered = filterCatalogMatches(catalog.matches, filter);
  const total = filtered.length;
  const pageRows = filtered.slice(offset, offset + pageLimit);
  const summary = catalogSummary(filtered);
  const hasFilters = hasActiveMatchFilters(sp);
  const pinnedResult = sp.result && RESULT_NOUN[sp.result] ? sp.result : undefined;

  return {
    params: sp,
    page,
    pages:
      seasonOnePage && total <= SEASON_SLICE_ONE_PAGE_MAX
        ? 1
        : Math.ceil(total / MATCHES_PAGE_SIZE),
    sort,
    chronological,
    dateSort,
    goalDiffSort,
    rows: pageRows.map(toMatchRow),
    total,
    summary,
    sequence:
      !hasFilters && total >= 24
        ? [...filtered]
            .reverse()
            .map((row) => ({
              id: row.id,
              date: row.date,
              season: row.season,
              venue: row.venue,
              result: row.result,
              gf: row.gf,
              ga: row.ga,
              aet: row.aet,
              pen_gf: row.pen_gf,
              pen_ga: row.pen_ga,
              opponent_name: row.opponent_name,
              competition_name: row.competition_name,
            }))
        : [],
    seasons: catalog.seasons,
    decades: catalogDecades(
      filterCatalogMatches(catalog.matches, { ...filter, from: undefined, to: undefined, sort: undefined }),
    ),
    hasFilters,
    chips: buildMatchChips(sp, catalog),
    eventBadges: catalogEventBadges(pageRows, filter),
    pinnedResult,
    heroValue: pinnedResult ? fmtNum(summary.p) : pct(summary.w, summary.p),
    heroLabel: pinnedResult ? RESULT_NOUN[pinnedResult] : "won",
    heroTone: pinnedResult ? resultTone(pinnedResult) : "text-win",
    heroSub: pinnedResult ? null : `from ${fmtNum(summary.p)} ${summary.p === 1 ? "match" : "matches"}`,
    matchHref: total === 1 && pageRows[0] ? `/match/${pageRows[0].id}` : undefined,
    seasonTotals: catalog.seasonTotals,
  };
}
