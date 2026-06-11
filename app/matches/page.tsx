import Link from "next/link";
import { findMatches, competitionsList, allSeasons } from "@/lib/queries";
import { MatchList } from "@/components/MatchList";
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
  const filter = {
    competition: sp.competition || undefined,
    season: sp.season || undefined,
    venue: sp.venue || undefined,
    result: sp.result || undefined,
    q: sp.q || undefined,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  };
  const { rows, total } = findMatches(filter);
  const comps = competitionsList();
  const seasons = allSeasons();
  const pages = Math.ceil(total / PAGE_SIZE);

  const qs = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...sp, ...overrides })) {
      if (v) params.set(k, v);
    }
    const s = params.toString();
    return s ? `?${s}` : "";
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="display text-3xl">Matches</h1>
        <p className="text-sm text-ink-dim mt-1">
          <span className="stat-num">{fmtNum(total)}</span> matches
          {sp.q || sp.competition || sp.season || sp.venue || sp.result ? " matching filters" : " on record"}
        </p>
      </header>

      <form className="flex flex-wrap gap-2 text-sm" method="get" action="/matches">
        <input
          type="search"
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Search opponent…"
          className="bg-panel border border-line rounded px-3 py-1.5 w-48 placeholder:text-ink-faint focus:outline-none focus:border-devil"
        />
        <select name="competition" defaultValue={sp.competition ?? ""} className="bg-panel border border-line rounded px-2 py-1.5">
          <option value="">All competitions</option>
          {comps.map((c) => (
            <option key={c.id} value={c.id}>{c.name} ({fmtNum(c.n)})</option>
          ))}
        </select>
        <select name="season" defaultValue={sp.season ?? ""} className="bg-panel border border-line rounded px-2 py-1.5">
          <option value="">All seasons</option>
          {seasons.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select name="venue" defaultValue={sp.venue ?? ""} className="bg-panel border border-line rounded px-2 py-1.5">
          <option value="">Any venue</option>
          <option value="H">Home</option>
          <option value="A">Away</option>
          <option value="N">Neutral</option>
        </select>
        <select name="result" defaultValue={sp.result ?? ""} className="bg-panel border border-line rounded px-2 py-1.5">
          <option value="">Any result</option>
          <option value="W">Won</option>
          <option value="D">Drawn</option>
          <option value="L">Lost</option>
        </select>
        <button className="bg-devil hover:bg-devil-bright text-white rounded px-4 py-1.5 font-medium transition-colors">
          Filter
        </button>
      </form>

      <MatchList matches={rows} showSeason />

      {pages > 1 && (
        <nav className="flex items-center gap-3 text-sm">
          {page > 1 && (
            <Link href={`/matches${qs({ page: String(page - 1) })}`} className="text-devil-bright hover:underline">
              ← Newer
            </Link>
          )}
          <span className="text-ink-faint stat-num">
            page {page} / {fmtNum(pages)}
          </span>
          {page < pages && (
            <Link href={`/matches${qs({ page: String(page + 1) })}`} className="text-devil-bright hover:underline">
              Older →
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
