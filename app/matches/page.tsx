import Link from "next/link";
import {
  findMatches, matchesSummary, matchDecades, competitionsList, allSeasons, managerById, managersIndex,
  playerById, playersIndex, stadiumById, stadiumsList, matchCitiesList, matchEventBadges,
  opponentsIndex,
} from "@/lib/queries";
import type { MatchFilter } from "@/lib/queries";
import { matchesSequence } from "@/lib/trails";
import { MatchList } from "@/components/MatchList";
import { MatchGroups } from "@/components/MatchGroups";
import { FacetIcon } from "@/components/FacetIcon";
import type { FacetOptions } from "@/lib/matchFacets";
import { MatchControlDeck } from "@/components/matches/MatchControlDeck";
import { MatchListToolbar } from "@/components/matches/MatchListToolbar";
import { MatchSliceHero } from "@/components/matches/MatchSliceHero";
import { Pager } from "@/components/Pager";
import { PageHeader } from "@/components/PageHeader";
import { fmtNum, fmtDate, pct, venueLabel, resultLabel, resultTone, COMPETITION_TYPE_LABELS } from "@/lib/format";
import { queryString } from "@/lib/url";

export const dynamic = "force-dynamic";
export const metadata = { title: "Matches" };

const PAGE_SIZE = 50;

// Curated subset of competition types offered in the filter, in display order.
const TYPE_FILTER_KEYS = ["league", "cup", "domestic-cup", "league-cup", "european", "unofficial"];
const RESULT_FILTER_KEYS = ["W", "D", "L"];
const GOAL_WINDOW_FILTERS = [
  { key: "firstHalf", label: "First half" },
  { key: "secondHalf", label: "Second half" },
  { key: "late", label: "Late" },
  { key: "stoppage", label: "Stoppage time" },
  { key: "extraTime", label: "Extra time" },
] as const;
const GOAL_WINDOW_LABELS: Record<string, string> = Object.fromEntries(GOAL_WINDOW_FILTERS.map((w) => [w.key, w.label]));

type MatchSort = "date-desc" | "date-asc" | "gd-desc" | "gd-asc";

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const sort = (
    sp.sort === "date-desc" || sp.sort === "date-asc" || sp.sort === "gd-desc" || sp.sort === "gd-asc"
      ? sp.sort
      : sp.sort === "oldest"
        ? "date-asc"
        : sp.sort === "margin"
          ? "gd-desc"
          : sp.sort === "defeat"
            ? "gd-asc"
            : "date-desc"
  ) as MatchSort;
  const chronological = sort === "date-desc" || sort === "date-asc";
  const dateSort = sort === "date-asc" || sort === "date-desc" ? sort : "date-desc";
  const goalDiffSort = sort === "gd-asc" || sort === "gd-desc" ? sort : "gd-desc";
  // `from`/`to` accept a bare year (evidence links from decade/era modules) or a full ISO date
  const year = (v: string | undefined, edge: "from" | "to") =>
    v ? (/^\d{4}$/.test(v) ? `${v}-${edge === "from" ? "01-01" : "12-31"}` : v) : undefined;
  const minute = (v: string | undefined) => (v && /^\d{1,3}$/.test(v) ? Number(v) : undefined);
  const goalWindow = GOAL_WINDOW_FILTERS.some((w) => w.key === sp.goalWindow)
    ? sp.goalWindow as (typeof GOAL_WINDOW_FILTERS)[number]["key"]
    : undefined;
  const filter = {
    competition: sp.competition || undefined,
    opponent: sp.opponent || undefined,
    manager: sp.manager || undefined,
    season: sp.season || undefined,
    venue: sp.venue || undefined,
    result: sp.result || undefined,
    type: sp.type || undefined,
    stadium: sp.stadium || undefined,
    city: sp.city || undefined,
    scorer: sp.scorer || undefined,
    assister: sp.assister || undefined,
    player: sp.player || undefined,
    aet: sp.aet === "1",
    goalWindow,
    goalFrom: minute(sp.goalFrom),
    goalTo: minute(sp.goalTo),
    from: year(sp.from, "from"),
    to: year(sp.to, "to"),
    q: sp.q || undefined,
    sort,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  };
  const { rows, total } = findMatches(filter);
  const summary = matchesSummary(filter);
  // The spine reads the whole slice (never paginated) and only earns its space once
  // there are enough matches for a shape to emerge; below that the list shows them all.
  const sequence = summary.p >= 24 ? matchesSequence(filter) : [];
  const comps = competitionsList();
  const seasons = allSeasons();
  const managers = managersIndex();
  const players = [...playersIndex()].sort((a, b) => a.name.localeCompare(b.name));
  const stadiums = stadiumsList();
  const cities = matchCitiesList();
  const opponents = opponentsIndex();
  // Decade chips count within the current slice, but ignore the active decade
  // range so the navigator stays a way to jump between decades, not a single chip.
  const decades = matchDecades({ ...filter, from: undefined, to: undefined });
  const pages = Math.ceil(total / PAGE_SIZE);
  // Option lists for the facet bar, keyed by facet `optionsKey`. Reuses the same
  // data the classic form below renders from — no extra queries. Labels stay clean
  // (no "(123)"): the combobox shows live, contextual counts from `facetCounts`.
  const facetOptions: FacetOptions = {
    opponent: opponents.map((o) => ({ value: o.id, label: o.name })),
    competition: comps.map((c) => ({ value: c.id, label: c.name })),
    season: seasons.map((s) => ({ value: s, label: s })),
    venue: [
      { value: "H", label: "Home" },
      { value: "A", label: "Away" },
      { value: "N", label: "Neutral" },
    ],
    result: RESULT_FILTER_KEYS.map((r) => ({ value: r, label: resultLabel(r) })),
    type: TYPE_FILTER_KEYS.map((t) => ({ value: t, label: COMPETITION_TYPE_LABELS[t] })),
    manager: managers.map((m) => ({ value: m.id, label: m.name })),
    stadium: stadiums.map((s) => ({ value: s.id, label: `${s.name}${s.city ? `, ${s.city}` : ""}` })),
    city: cities.map((c) => ({ value: c.city, label: c.city })),
    goalWindow: GOAL_WINDOW_FILTERS.map((w) => ({ value: w.key, label: w.label })),
    player: players.map((p) => ({ value: p.player_id, label: p.name })),
  };
  const hasFilters = Boolean(
    sp.q || sp.competition || sp.opponent || sp.manager || sp.season || sp.venue || sp.result || sp.type ||
    sp.stadium || sp.city || sp.scorer || sp.assister || sp.player || sp.aet || sp.goalWindow ||
    sp.goalFrom || sp.goalTo || sp.from || sp.to,
  );
  const stadium = sp.stadium ? stadiumById(sp.stadium) : undefined;
  const eventBadges = matchEventBadges(rows.map((m) => m.id), filter);
  const renderEventBadge = (m: (typeof rows)[number]) => {
    const label = eventBadges.get(m.id);
    if (!label) return null;
    // Reads on every row of a scorer/timing slice, so it's reference data, not an
    // alarm: a quiet stopwatch glyph with the goal minutes stacked vertically, so a
    // hat-trick costs row height rather than a wide red ribbon clashing with the
    // loss rows. Full count + noun stays on hover.
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

  // The summary band leads with the answer to the slice the reader chose. When a result
  // is pinned, the count of that result *is* the answer (win-rate would just read 100/0);
  // otherwise the win rate is the headline and the W–D–L breakdown is the sentence.
  const RESULT_NOUN: Record<string, string> = { W: "wins", D: "draws", L: "defeats" };
  const pinnedResult = sp.result && RESULT_NOUN[sp.result] ? sp.result : undefined;
  const heroValue = pinnedResult ? fmtNum(summary.p) : pct(summary.w, summary.p);
  const heroLabel = pinnedResult ? RESULT_NOUN[pinnedResult] : "won";
  // Default headline is the win rate, so it wears the win colour — never brand red,
  // which now reads as the loss pole. A pinned result uses its own result tone.
  const heroTone = pinnedResult ? resultTone(pinnedResult) : "text-win";
  // The count is its own "from N matches", so the subline only adds something when open.
  const heroSub = pinnedResult ? null : `from ${fmtNum(summary.p)} ${summary.p === 1 ? "match" : "matches"}`;

  // Active filters, rendered as individually removable chips.
  const chips: { key: string; label: string }[] = [];
  if (sp.opponent) chips.push({ key: "opponent", label: opponents.find((o) => o.id === sp.opponent)?.name ?? "Opponent" });
  if (sp.q) chips.push({ key: "q", label: `Opponent: ${sp.q}` });
  if (sp.competition)
    chips.push({ key: "competition", label: comps.find((c) => c.id === sp.competition)?.name ?? sp.competition });
  if (sp.manager) chips.push({ key: "manager", label: managerById(sp.manager)?.name ?? "Manager" });
  if (sp.season) chips.push({ key: "season", label: `Season ${sp.season}` });
  if (sp.venue) chips.push({ key: "venue", label: venueLabel(sp.venue) });
  if (sp.result) chips.push({ key: "result", label: resultLabel(sp.result) });
  if (sp.type) chips.push({ key: "type", label: COMPETITION_TYPE_LABELS[sp.type] ?? sp.type });
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

  // Each chip carries the size of its own filter in isolation — the universe it
  // draws from, not the current (multi-filter) slice. It turns a chip from a bare
  // control into a small piece of evidence ("Liverpool · 230"). Only the chip's own
  // constraint is applied; `q` is the free-text opponent match, which `findMatches`
  // resolves the same way the chip does.
  const chipCounts: Record<string, number> = {};
  for (const chip of chips) {
    const value = (filter as Record<string, unknown>)[chip.key];
    if (value === undefined || value === false) continue;
    chipCounts[chip.key] = findMatches({ [chip.key]: value, sort, limit: 1, offset: 0 } as MatchFilter).total;
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
        decades={decades}
        hasFilters={hasFilters}
        pinnedResult={pinnedResult}
        heroValue={heroValue}
        heroLabel={heroLabel}
        heroTone={heroTone}
        heroSub={heroSub}
        activeResult={sp.result}
        activeFrom={sp.from}
        activeTo={sp.to}
        params={sp}
      />

      <MatchControlDeck
        params={sp}
        chips={chips}
        chipCounts={chipCounts}
        options={facetOptions}
        total={total}
        matchHref={total === 1 && rows[0] ? `/match/${rows[0].id}` : undefined}
        seasons={seasons}
      />

      <MatchListToolbar total={total} sort={sort} dateSort={dateSort} goalDiffSort={goalDiffSort} qs={qs} />

      {/* Mobile: a slim bar that pins under the header once the list starts to
          scroll, so the filter is one tap away deep in a 50-row page instead of
          a long scroll back to the form. Pure sticky — no JS, no extra fetch. */}
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
