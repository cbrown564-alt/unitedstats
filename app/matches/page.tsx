import Link from "next/link";
import { findMatches, matchesSummary, matchDecades, competitionsList, allSeasons } from "@/lib/queries";
import { MatchList } from "@/components/MatchList";
import { MatchGroups } from "@/components/MatchGroups";
import { PageHeader, StatTile } from "@/components/PageHeader";
import { WdlBar } from "@/components/WdlBar";
import { fmtNum, fmtDate, pct, venueLabel } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Matches" };

const PAGE_SIZE = 50;

const TYPE_LABELS: Record<string, string> = {
  league: "League",
  cup: "All cups",
  "domestic-cup": "FA Cup",
  "league-cup": "League Cup",
  european: "Europe",
  unofficial: "Wartime and friendlies",
};

const RESULT_LABELS: Record<string, string> = { W: "Won", D: "Drawn", L: "Lost" };

const SORTS: { key: string; label: string }[] = [
  { key: "recent", label: "Most recent" },
  { key: "oldest", label: "Oldest first" },
  { key: "margin", label: "Biggest win" },
  { key: "attendance", label: "Best attended" },
];

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const sort = (["oldest", "margin", "attendance"].includes(sp.sort ?? "") ? sp.sort : "recent") as
    | "recent"
    | "oldest"
    | "margin"
    | "attendance";
  const chronological = sort === "recent" || sort === "oldest";
  // `from`/`to` accept a bare year (evidence links from decade/era modules) or a full ISO date
  const year = (v: string | undefined, edge: "from" | "to") =>
    v ? (/^\d{4}$/.test(v) ? `${v}-${edge === "from" ? "01-01" : "12-31"}` : v) : undefined;
  const filter = {
    competition: sp.competition || undefined,
    opponent: sp.opponent || undefined,
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
  const comps = competitionsList();
  const seasons = allSeasons();
  const decades = matchDecades();
  const pages = Math.ceil(total / PAGE_SIZE);
  const hasFilters = Boolean(
    sp.q || sp.competition || sp.opponent || sp.season || sp.venue || sp.result || sp.type || sp.from || sp.to,
  );
  const refineActive = Boolean(sp.venue || sp.result || sp.type || sp.from || sp.to);

  const qs = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...sp, ...overrides })) {
      if (v) params.set(k, v);
    }
    const s = params.toString();
    return s ? `?${s}` : "";
  };

  // Quick views are fresh slices, not refinements of the current filter.
  const presetHref = (params: Record<string, string>) => {
    const u = new URLSearchParams(params);
    const s = u.toString();
    return s ? `/matches?${s}` : "/matches";
  };
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

  // Active filters, rendered as individually removable chips.
  const chips: { key: string; label: string }[] = [];
  if (sp.q) chips.push({ key: "q", label: `Opponent: ${sp.q}` });
  if (sp.competition)
    chips.push({ key: "competition", label: comps.find((c) => c.id === sp.competition)?.name ?? sp.competition });
  if (sp.season) chips.push({ key: "season", label: `Season ${sp.season}` });
  if (sp.venue) chips.push({ key: "venue", label: venueLabel(sp.venue) });
  if (sp.result) chips.push({ key: "result", label: RESULT_LABELS[sp.result] ?? sp.result });
  if (sp.type) chips.push({ key: "type", label: TYPE_LABELS[sp.type] ?? sp.type });
  if (sp.from) chips.push({ key: "from", label: `From ${sp.from}` });
  if (sp.to) chips.push({ key: "to", label: `To ${sp.to}` });

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Fixture record"
        title="Matches"
        aside={
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:min-w-72">
            <StatTile label={hasFilters ? "Filtered" : "On record"} value={fmtNum(total)} tone="red" />
            <StatTile label="Page size" value={PAGE_SIZE} />
          </div>
        }
      >
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
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-devil-bright ${
                  active
                    ? "border-devil/60 bg-devil/15 text-devil-bright"
                    : "border-line bg-panel text-ink-dim hover:border-devil/50 hover:bg-panel-2 hover:text-ink"
                }`}
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
            <button className="min-h-[2.375rem] flex-1 rounded-md bg-devil px-4 py-2 font-semibold text-ink transition-colors hover:bg-devil-bright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-devil-bright">
              Filter
            </button>
          </div>
        </div>

        <details className="mt-3 border-t border-line/70 pt-3" open={refineActive}>
          <summary className="cursor-pointer select-none list-none text-xs font-semibold uppercase tracking-[0.14em] text-ink-dim transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-devil-bright [&::-webkit-details-marker]:hidden">
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
                <option value="W">Won</option>
                <option value="D">Drawn</option>
                <option value="L">Lost</option>
              </select>
            </label>
            <label className="md:col-span-3">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">Match type</span>
              <select name="type" defaultValue={sp.type ?? ""} className="control w-full">
                <option value="">Any type</option>
                <option value="league">League</option>
                <option value="cup">All cups</option>
                <option value="domestic-cup">FA Cup</option>
                <option value="league-cup">League Cup</option>
                <option value="european">Europe</option>
                <option value="unofficial">Wartime and friendlies</option>
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
                  className="group inline-flex items-center gap-1 rounded-full border border-line bg-panel-2 py-0.5 pl-2.5 pr-1.5 text-xs text-ink-dim transition-colors hover:border-devil/50 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-devil-bright"
                >
                  {c.label}
                  <span className="text-ink-faint group-hover:text-devil-bright" aria-label="remove filter">×</span>
                </Link>
              ))}
              <Link
                href="/matches"
                className="rounded-full px-2 py-0.5 text-xs text-ink-faint underline-offset-2 hover:text-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-devil-bright"
              >
                Clear all
              </Link>
            </div>
          )}
        </div>

        {summary.p > 0 ? (
          <>
            <div className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-5">
              {[
                ["Played", fmtNum(summary.p)],
                ["W–D–L", `${summary.w}–${summary.d}–${summary.l}`],
                ["Goals", `${fmtNum(summary.gf)}–${fmtNum(summary.ga)}`],
                ["Win rate", pct(summary.w, summary.p)],
                ["Avg home crowd", summary.avg_home_att ? fmtNum(summary.avg_home_att) : "—"],
              ].map(([label, value]) => (
                <div key={label} className="bg-panel px-3 py-2">
                  <div className="stat-num text-base font-semibold">{value}</div>
                  <div className="mt-0.5 text-[11px] uppercase tracking-[0.12em] text-ink-faint">{label}</div>
                </div>
              ))}
            </div>
            <WdlBar w={summary.w} d={summary.d} l={summary.l} size="md" showLabels className="mt-3" />
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
                className={`shrink-0 rounded-md border px-2.5 py-1 text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-devil-bright ${
                  active
                    ? "border-devil/60 bg-devil/15 text-devil-bright"
                    : "border-line bg-panel text-ink-dim hover:border-devil/50 hover:bg-panel-2 hover:text-ink"
                }`}
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
              className={`rounded-md px-2 py-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-devil-bright ${
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

      {pages > 1 && (
        <nav className="flex items-center justify-between gap-3 rounded-lg border border-line bg-panel px-3 py-2 text-sm">
          {page > 1 && (
            <Link href={`/matches${qs({ page: String(page - 1) })}`} className="rounded px-2 py-1 text-devil-bright hover:bg-panel-2 focus-visible:outline-2 focus-visible:outline-devil-bright">
              Newer
            </Link>
          )}
          {page <= 1 && <span />}
          <span className="text-ink-faint stat-num">
            page {page} / {fmtNum(pages)}
          </span>
          {page < pages && (
            <Link href={`/matches${qs({ page: String(page + 1) })}`} className="rounded px-2 py-1 text-devil-bright hover:bg-panel-2 focus-visible:outline-2 focus-visible:outline-devil-bright">
              Older
            </Link>
          )}
          {page >= pages && <span />}
        </nav>
      )}
    </div>
  );
}
