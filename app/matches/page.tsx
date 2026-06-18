import Link from "next/link";
import { findMatches, matchesSummary, matchDecades, competitionsList, allSeasons, managerById } from "@/lib/queries";
import { matchesSequence } from "@/lib/trails";
import { MatchList } from "@/components/MatchList";
import { MatchGroups } from "@/components/MatchGroups";
import { Pager } from "@/components/Pager";
import { PageHeader } from "@/components/PageHeader";
import { WdlBar, WdlColumns } from "@/components/WdlBar";
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
  const filter = {
    competition: sp.competition || undefined,
    opponent: sp.opponent || undefined,
    manager: sp.manager || undefined,
    season: sp.season || undefined,
    venue: sp.venue || undefined,
    result: sp.result || undefined,
    type: sp.type || undefined,
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
  const decades = matchDecades();
  const pages = Math.ceil(total / PAGE_SIZE);
  const hasFilters = Boolean(
    sp.q || sp.competition || sp.opponent || sp.manager || sp.season || sp.venue || sp.result || sp.type || sp.from || sp.to,
  );
  const refineActive = Boolean(sp.venue || sp.result || sp.type || sp.from || sp.to);

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
  const heroTone = pinnedResult ? resultTone(pinnedResult) : "text-devil-bright";
  // The count is its own "from N matches", so the subline only adds something when open.
  const heroSub = pinnedResult ? null : `from ${fmtNum(summary.p)} ${summary.p === 1 ? "match" : "matches"}`;

  // Active filters, rendered as individually removable chips.
  const chips: { key: string; label: string }[] = [];
  if (sp.q) chips.push({ key: "q", label: `Opponent: ${sp.q}` });
  if (sp.competition)
    chips.push({ key: "competition", label: comps.find((c) => c.id === sp.competition)?.name ?? sp.competition });
  if (sp.manager) chips.push({ key: "manager", label: managerById(sp.manager)?.name ?? "Manager" });
  if (sp.season) chips.push({ key: "season", label: `Season ${sp.season}` });
  if (sp.venue) chips.push({ key: "venue", label: venueLabel(sp.venue) });
  if (sp.result) chips.push({ key: "result", label: resultLabel(sp.result) });
  if (sp.type) chips.push({ key: "type", label: COMPETITION_TYPE_LABELS[sp.type] ?? sp.type });
  if (sp.from) chips.push({ key: "from", label: `From ${sp.from}` });
  if (sp.to) chips.push({ key: "to", label: `To ${sp.to}` });

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
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors focus-ring ${pillTone(active)}`}
              >
                {v.label}
              </Link>
            );
          })}
        </div>
      </div>

      <form className="rounded-lg border border-line bg-panel p-3 text-sm shadow-[0_1px_0_rgb(255_255_255_/_0.025)_inset]" method="get" action="/matches">
        {sort !== "recent" && <input type="hidden" name="sort" value={sort} />}
        <div className="grid gap-3 md:grid-cols-12">
          <label className="md:col-span-4">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">Opponent</span>
            <input
              type="search"
              name="q"
              defaultValue={sp.q ?? ""}
              placeholder="Arsenal, Liverpool, Leeds"
              className="control w-full"
            />
          </label>
          <label className="md:col-span-4">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">Competition</span>
            <select name="competition" defaultValue={sp.competition ?? ""} className="control w-full">
              <option value="">All competitions</option>
              {comps.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({fmtNum(c.n)})</option>
              ))}
            </select>
          </label>
          <label className="md:col-span-2">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">Season</span>
            <select name="season" defaultValue={sp.season ?? ""} className="control w-full">
              <option value="">All seasons</option>
              {seasons.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
          <div className="flex items-end gap-2 md:col-span-2">
            <button className="min-h-[2.375rem] flex-1 rounded-md bg-devil px-4 py-2 font-semibold text-ink transition-colors hover:bg-devil-bright focus-ring">
              Filter
            </button>
          </div>
        </div>

        <details className="mt-3 border-t border-line/70 pt-3" open={refineActive}>
          <summary className="cursor-pointer select-none list-none text-xs font-semibold uppercase tracking-[0.14em] text-ink-dim transition-colors hover:text-ink focus-ring [&::-webkit-details-marker]:hidden">
            <span className="text-devil-bright" aria-hidden>▸ </span>More filters
          </summary>
          <div className="mt-3 grid gap-3 md:grid-cols-12">
            <label className="md:col-span-2">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">Venue</span>
              <select name="venue" defaultValue={sp.venue ?? ""} className="control w-full">
                <option value="">Any venue</option>
                <option value="H">Home</option>
                <option value="A">Away</option>
                <option value="N">Neutral</option>
              </select>
            </label>
            <label className="md:col-span-2">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">Result</span>
              <select name="result" defaultValue={sp.result ?? ""} className="control w-full">
                <option value="">Any result</option>
                {RESULT_FILTER_KEYS.map((r) => (
                  <option key={r} value={r}>{resultLabel(r)}</option>
                ))}
              </select>
            </label>
            <label className="md:col-span-3">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">Match type</span>
              <select name="type" defaultValue={sp.type ?? ""} className="control w-full">
                <option value="">Any type</option>
                {TYPE_FILTER_KEYS.map((t) => (
                  <option key={t} value={t}>{COMPETITION_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </label>
            <label className="md:col-span-2">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">From</span>
              <input type="text" name="from" defaultValue={sp.from ?? ""} placeholder="1886" className="control w-full" />
            </label>
            <label className="md:col-span-2">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">To</span>
              <input type="text" name="to" defaultValue={sp.to ?? ""} placeholder="2026" className="control w-full" />
            </label>
          </div>
        </details>
      </form>

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
          {chips.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {chips.map((c) => (
                <Link
                  key={c.key}
                  href={`/matches${qs({ [c.key]: undefined, page: undefined })}`}
                  className="group inline-flex items-center gap-1 rounded-full border border-line bg-panel-2 py-0.5 pl-2.5 pr-1.5 text-xs text-ink-dim transition-colors hover:border-devil/50 hover:text-ink focus-ring"
                >
                  {c.label}
                  <span className="text-ink-faint group-hover:text-devil-bright" aria-label="remove filter">×</span>
                </Link>
              ))}
              <Link
                href="/matches"
                className="rounded-full px-2 py-0.5 text-xs text-ink-faint underline-offset-2 hover:text-ink hover:underline focus-ring"
              >
                Clear all
              </Link>
            </div>
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
                <div className="mt-4 space-y-2 border-t border-line/70 pt-3">
                  <WdlColumns w={summary.w} d={summary.d} l={summary.l} />
                  <WdlBar w={summary.w} d={summary.d} l={summary.l} size="md" />
                </div>
              )
            )}
          </>
        ) : (
          <p className="mt-2 text-sm text-ink-dim">No matches fit this filter. Loosen a control or clear the slice.</p>
        )}
      </section>

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
                className={`shrink-0 rounded-md border px-2.5 py-1 text-center transition-colors focus-ring ${pillTone(active)}`}
              >
                <span className="stat-num block text-xs font-semibold leading-tight">{dec.decade}</span>
                <span className="stat-num block text-[10px] leading-tight text-ink-faint">{fmtNum(dec.n)}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">Sort</span>
        {SORTS.map((s) => {
          const active = sort === s.key;
          return (
            <Link
              key={s.key}
              href={`/matches${qs({ sort: s.key === "recent" ? undefined : s.key, page: undefined })}`}
              aria-current={active ? "true" : undefined}
              className={`rounded-md px-2 py-1 transition-colors focus-ring ${
                active ? "bg-devil/15 font-semibold text-devil-bright" : "text-ink-dim hover:bg-panel-2 hover:text-ink"
              }`}
            >
              {s.label}
            </Link>
          );
        })}
      </div>

      {chronological ? (
        <MatchGroups matches={rows} showAttendance accentResult />
      ) : (
        <MatchList matches={rows} showSeason showAttendance accentResult />
      )}

      <Pager page={page} pages={pages} hrefFor={(p) => `/matches${qs({ page: String(p) })}`} />
    </div>
  );
}
