import Link from "next/link";
import { notFound } from "next/navigation";
import { opponentById, findMatches } from "@/lib/queries";
import { MatchList } from "@/components/MatchList";
import { WdlBar } from "@/components/WdlBar";
import { fmtNum, pct } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function OpponentPage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  const { page: pageStr } = await searchParams;
  const o = opponentById(id);
  if (!o) notFound();
  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);
  const PAGE = 50;
  const { rows, total } = findMatches({ opponent: id, limit: PAGE, offset: (page - 1) * PAGE });
  const pages = Math.ceil(total / PAGE);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.25em] text-devil-bright font-semibold mb-2">Head to head</p>
        <h1 className="display text-4xl">United v {o.name}</h1>
        <p className="text-sm text-ink-dim mt-2 stat-num">
          First met {o.first} · last met {o.last}
        </p>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-px bg-line border border-line rounded-lg overflow-hidden max-w-2xl">
          {[
            ["Played", fmtNum(o.p)],
            ["Record", `${o.w}–${o.d}–${o.l}`],
            ["Win rate", pct(o.w, o.p)],
            ["Goals", `${fmtNum(o.gf)}–${fmtNum(o.ga)}`],
          ].map(([k, v]) => (
            <div key={k} className="bg-panel px-4 py-3">
              <div className="stat-num text-xl font-semibold">{v}</div>
              <div className="text-xs text-ink-faint uppercase tracking-wider mt-0.5">{k}</div>
            </div>
          ))}
        </div>
        <WdlBar w={o.w} d={o.d} l={o.l} className="max-w-2xl mt-3" />
      </header>

      <section>
        <h2 className="display text-xl mb-3">All meetings</h2>
        <MatchList matches={rows} showSeason />
        {pages > 1 && (
          <nav className="flex items-center gap-3 text-sm mt-3">
            {page > 1 && (
              <Link href={`/opponent/${id}?page=${page - 1}`} className="text-devil-bright hover:underline">← Newer</Link>
            )}
            <span className="text-ink-faint stat-num">page {page} / {pages}</span>
            {page < pages && (
              <Link href={`/opponent/${id}?page=${page + 1}`} className="text-devil-bright hover:underline">Older →</Link>
            )}
          </nav>
        )}
      </section>
    </div>
  );
}
