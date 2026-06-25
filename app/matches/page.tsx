import Link from "next/link";
import {
  findMatches, matchesSummary, matchDecades, competitionsList, allSeasons, managerById, managersIndex,
  playerById, playersIndex, stadiumById, stadiumsList, matchCitiesList, matchEventBadges,
  opponentsIndex, matchFacetCounts,
} from "@/lib/queries";
import type { MatchFilter } from "@/lib/queries";
import { matchesSequence } from "@/lib/trails";
import { MatchList } from "@/components/MatchList";
import { MatchGroups } from "@/components/MatchGroups";
import { FacetIcon } from "@/components/FacetIcon";
import { MatchFilterBar } from "@/components/MatchFilterBar";
import type { FacetOptions, FacetCounts } from "@/lib/matchFacets";
import { Pager } from "@/components/Pager";
import { PageHeader } from "@/components/PageHeader";
import { WdlBar } from "@/components/WdlBar";
import { GoalDiff } from "@/components/GoalDiff";
import { ResultSpine } from "@/components/charts/ResultSpine";
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

const SORTS: { key: string; label: string }[] = [
  { key: "recent", label: "Most recent" },
  { key: "oldest", label: "Oldest first" },
  { key: "margin", label: "Biggest win" },
  { key: "defeat", label: "Heaviest defeat" },
  { key: "attendance", label: "Best attended" },
];

// Selected/idle treatment for the bordered filter pills (quick views, decade jumps).
const pillTone = (active: boolean) =>
  active
    ? "border-devil/60 bg-devil/15 text-devil-bright"
    : "border-line bg-panel text-ink-dim hover:border-devil/50 hover:bg-panel-2 hover:text-ink";

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const sort = (["oldest", "margin", "defeat", "attendance"].includes(sp.sort ?? "") ? sp.sort : "recent") as
    | "recent"
    | "oldest"
    | "margin"
    | "defeat"
    | "attendance";
  const chronological = sort === "recent" || sort === "oldest";
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
  // Contextual option counts — each facet counted with its own constraint dropped,
  // so the bar can narrow options to the current slice (Bayern → no Premier League).
  const facetCounts: FacetCounts = matchFacetCounts(filter);
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

  // Quick views are fresh slices, not refinements of the current filter.
  const presetHref = (params: Record<string, string>) => `/matches${queryString(params)}`;
  const quickViews: { label: string; params: Record<string, string> }[] = [
    ...(seasons[0] ? [{ label: "This season", params: { season: seasons[0] } }] : []),
    { label: "Home wins", params: { venue: "H", result: "W" } },
    { label: "Away days", params: { venue: "A" } },
    { label: "European nights", params: { type: "european" } },
    { label: "FA Cup ties", params: { type: "domestic-cup" } },
    { label: "Defeats", params: { result: "L" } },
  ];
  const presetActive = (params: Record<string, string>) =>
    Object.entries(params).every(([k, v]) => sp[k] === v) &&
    // exact match: no other filters layered on top (sort/page are not filters)
    Object.keys(params).length ===
      Object.keys(sp).filter((k) => k !== "page" && k !== "sort" && sp[k]).length;

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
  if (sp.scorer) chips.push({ key: "scorer", label: `Scorer: ${playerById(sp.scorer)?.name ?? sp.scorer}` });
  if (sp.assister) chips.push({ key: "assister", label: `Assister: ${playerById(sp.assister)?.name ?? sp.assister}` });
  if (sp.player) chips.push({ key: "player", label: `Player: ${playerById(sp.player)?.name ?? sp.player}` });
  if (sp.aet) chips.push({ key: "aet", label: "Went to extra time" });
  if (sp.goalWindow) chips.push({ key: "goalWindow", label: `Goal timing: ${GOAL_WINDOW_LABELS[sp.goalWindow] ?? sp.goalWindow}` });
  if (sp.goalFrom) chips.push({ key: "goalFrom", label: `Goals from ${sp.goalFrom}'` });
  if (sp.goalTo) chips.push({ key: "goalTo", label: `Goals to ${sp.goalTo}'` });
  if (sp.from) chips.push({ key: "from", label: `From ${sp.from}` });
  if (sp.to) chips.push({ key: "to", label: `To ${sp.to}` });

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

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">Quick views</p>
        <div className="flex flex-wrap gap-2">
          {quickViews.map((v) => {
            const active = presetActive(v.params);
            return (
              <Link
                key={v.label}
                href={presetHref(v.params)}
                aria-current={active ? "true" : undefined}
                className={`tap-target rounded-full border px-3 py-1.5 text-sm transition-colors focus-ring ${pillTone(active)}`}
              >
                {v.label}
              </Link>
            );
          })}
        </div>
      </div>

      <MatchFilterBar
        params={sp}
        chips={chips}
        chipCounts={chipCounts}
        options={facetOptions}
        counts={facetCounts}
        total={total}
        matchHref={total === 1 && rows[0] ? `/match/${rows[0].id}` : undefined}
      />

      <section className="rounded-lg border border-line bg-panel p-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
            {hasFilters ? "This slice" : "All matches"}
          </h2>
          {summary.first && (
            <span className="stat-num text-xs text-ink-faint">
              {fmtDate(summary.first)}
              {summary.last && summary.last !== summary.first ? ` → ${fmtDate(summary.last)}` : ""}
            </span>
          )}
        </div>

        {summary.p > 0 ? (
          <>
            {/* The answer to this slice: the win rate (or pinned-result count) writ large,
                with goals for/against beside it as a ribbon — echoing the detail-page plate. */}
            <div className="mt-4 flex flex-wrap items-end gap-x-7 gap-y-4">
              <div className="leading-none">
                <div className="flex items-baseline gap-2">
                  <span className={`stat-num text-5xl font-semibold sm:text-6xl ${heroTone}`}>{heroValue}</span>
                  <span className="text-sm uppercase tracking-[0.16em] text-ink-faint">{heroLabel}</span>
                </div>
                {heroSub && <p className="stat-num mt-2 text-xs text-ink-faint">{heroSub}</p>}
              </div>
              <GoalDiff gf={summary.gf} ga={summary.ga} played={summary.p} size="lg" className="border-l border-line pl-6 sm:pl-7" />
            </div>

            {/* The record — W-D-L columns over the diverging bar — then its shape over time.
                The spine carries the columns+bar header when it draws; below the spine
                threshold a non-pinned slice still gets the record header on its own. */}
            {sequence.length >= 24 ? (
              <div className="mt-4 border-t border-line/70 pt-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
                  Result by match over time
                </p>
                <ResultSpine matches={sequence} showRecord={!pinnedResult} />
              </div>
            ) : (
              !pinnedResult && (
                <div className="mt-4 border-t border-line/70 pt-3">
                  <WdlBar w={summary.w} d={summary.d} l={summary.l} size="md" variant="stacked" showLabels />
                </div>
              )
            )}
          </>
        ) : (
          <p className="mt-2 text-sm text-ink-dim">No matches fit this filter. Loosen a control or clear the slice.</p>
        )}
      </section>

      {decades.length > 1 && (
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">Jump to a decade</p>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {decades.map((dec) => {
            const active = sp.from === String(dec.from) && sp.to === String(dec.to);
            return (
              <Link
                key={dec.decade}
                href={`/matches${qs({ from: String(dec.from), to: String(dec.to), page: undefined })}`}
                aria-current={active ? "true" : undefined}
                className={`tap-target shrink-0 rounded-md border px-2.5 py-1 text-center transition-colors focus-ring ${pillTone(active)}`}
              >
                <span className="stat-num block text-xs font-semibold leading-tight">{dec.decade}</span>
                <span className="stat-num block text-[10px] leading-tight text-ink-faint">{fmtNum(dec.n)}</span>
              </Link>
            );
          })}
        </div>
      </div>
      )}

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">Sort</span>
        {SORTS.map((s) => {
          const active = sort === s.key;
          return (
            <Link
              key={s.key}
              href={`/matches${qs({ sort: s.key === "recent" ? undefined : s.key, page: undefined })}`}
              aria-current={active ? "true" : undefined}
              className={`tap-target rounded-md px-2 py-1 transition-colors focus-ring ${
                active ? "bg-devil/15 font-semibold text-devil-bright" : "text-ink-dim hover:bg-panel-2 hover:text-ink"
              }`}
            >
              {s.label}
            </Link>
          );
        })}
      </div>

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
