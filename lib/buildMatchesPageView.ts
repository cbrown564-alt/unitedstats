import { fmtDate, fmtNum, pct, resultLabel, resultTone, venueLabel, COMPETITION_TYPE_LABELS } from "@/lib/format";
import { isRoundFilterKey, roundFilterLabel } from "@/lib/matchRounds";
import { matchFilterFromSearchParams, parseMatchSort } from "@/lib/matchFilterFromUrl";
import {
  MATCHES_PAGE_SIZE,
  hasActiveMatchFilters,
  type MatchPageChip,
  type MatchPageView,
} from "@/lib/matchPageView";
import {
  allSeasons,
  competitionNameById,
  findMatches,
  managerById,
  matchDecades,
  matchEventBadges,
  matchesSummary,
  opponentById,
  playerById,
  stadiumById,
} from "@/lib/queries";
import { matchesSequence } from "@/lib/trails";

const GOAL_WINDOW_LABELS: Record<string, string> = {
  firstHalf: "First half",
  secondHalf: "Second half",
  late: "Late",
  stoppage: "Stoppage time",
  extraTime: "Extra time",
};

const RESULT_NOUN: Record<string, string> = { W: "wins", D: "draws", L: "defeats" };

function buildMatchChips(sp: Record<string, string | undefined>): MatchPageChip[] {
  const round = isRoundFilterKey(sp.round) ? sp.round : undefined;
  const stadium = sp.stadium ? stadiumById(sp.stadium) : undefined;
  const chips: MatchPageChip[] = [];
  if (sp.opponent) chips.push({ key: "opponent", label: opponentById(sp.opponent)?.name ?? "Opponent" });
  if (sp.q) chips.push({ key: "q", label: `Opponent: ${sp.q}` });
  if (sp.competition) {
    chips.push({ key: "competition", label: competitionNameById(sp.competition) ?? sp.competition });
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

export function buildMatchesPageView(sp: Record<string, string | undefined>): MatchPageView {
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const sort = parseMatchSort(sp);
  const chronological = sort === "date-desc" || sort === "date-asc";
  const dateSort = sort === "date-asc" || sort === "date-desc" ? sort : "date-desc";
  const goalDiffSort = sort === "gd-asc" || sort === "gd-desc" ? sort : "gd-desc";
  const filter = matchFilterFromSearchParams(sp, {
    limit: MATCHES_PAGE_SIZE,
    offset: (page - 1) * MATCHES_PAGE_SIZE,
  });
  const { rows, total } = findMatches(filter);
  const summary = matchesSummary(filter);
  const sequence = summary.p >= 24 ? matchesSequence(filter) : [];
  const hasFilters = hasActiveMatchFilters(sp);
  const pinnedResult = sp.result && RESULT_NOUN[sp.result] ? sp.result : undefined;
  const heroValue = pinnedResult ? fmtNum(summary.p) : pct(summary.w, summary.p);
  const heroLabel = pinnedResult ? RESULT_NOUN[pinnedResult] : "won";
  const heroTone = pinnedResult ? resultTone(pinnedResult) : "text-win";
  const heroSub = pinnedResult ? null : `from ${fmtNum(summary.p)} ${summary.p === 1 ? "match" : "matches"}`;
  const badgeMap = matchEventBadges(
    rows.map((m) => m.id),
    filter,
  );

  return {
    params: sp,
    page,
    pages: Math.ceil(total / MATCHES_PAGE_SIZE),
    sort,
    chronological,
    dateSort,
    goalDiffSort,
    rows,
    total,
    summary,
    sequence,
    seasons: allSeasons(),
    decades: matchDecades({ ...filter, from: undefined, to: undefined }),
    hasFilters,
    chips: buildMatchChips(sp),
    eventBadges: Object.fromEntries(badgeMap.entries()),
    pinnedResult,
    heroValue,
    heroLabel,
    heroTone,
    heroSub,
    matchHref: total === 1 && rows[0] ? `/match/${rows[0].id}` : undefined,
  };
}
