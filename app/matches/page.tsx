import Link from "next/link";
import { findMatches, competitionsList, allSeasons } from "@/lib/queries";
import { MatchList } from "@/components/MatchList";
import { PageHeader, StatTile } from "@/components/PageHeader";
import { fmtNum } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Matches" };

const PAGE_SIZE = 50;

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
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
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  };
  const { rows, total } = findMatches(filter);
  const comps = competitionsList();
  const seasons = allSeasons();
  const pages = Math.ceil(total / PAGE_SIZE);
  const hasFilters = Boolean(
    sp.q || sp.competition || sp.opponent || sp.season || sp.venue || sp.result || sp.type || sp.from || sp.to,
  );

  const qs = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...sp, ...overrides })) {
      if (v) params.set(k, v);
    }
    const s = params.toString();
    return s ? `?${s}` : "";
  };

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

      <form className="rounded-lg border border-line bg-panel p-3 text-sm shadow-[0_1px_0_rgb(255_255_255_/_0.025)_inset]" method="get" action="/matches">
        <div className="grid gap-3 md:grid-cols-12">
          <label className="md:col-span-3">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">Opponent</span>
            <input
              type="search"
              name="q"
              defaultValue={sp.q ?? ""}
              placeholder="Arsenal, Liverpool, Leeds"
              className="control w-full"
            />
          </label>
          <label className="md:col-span-3">
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
          <div className="flex items-end gap-2 md:col-span-5">
            <button className="min-h-[2.375rem] rounded-md bg-devil px-4 py-2 font-semibold text-ink transition-colors hover:bg-devil-bright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-devil-bright">
              Filter
            </button>
            {hasFilters && (
              <Link
                href="/matches"
                className="rounded-md px-3 py-2 text-ink-dim transition-colors hover:bg-panel-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-devil-bright"
              >
                Reset
              </Link>
            )}
          </div>
        </div>
      </form>

      <MatchList matches={rows} showSeason />

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
