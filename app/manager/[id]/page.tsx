import Link from "next/link";
import { notFound } from "next/navigation";
import { managerById, managerTenures, findMatches } from "@/lib/queries";
import { MatchList } from "@/components/MatchList";
import { WdlBar } from "@/components/WdlBar";
import { fmtDate, fmtNum, pct } from "@/lib/format";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ManagerPage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  const { page: pageStr } = await searchParams;
  const m = managerById(id);
  if (!m) notFound();
  const tenures = managerTenures(id);
  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);
  const PAGE = 50;

  const total = m.p;
  const rows = getDb()
    .prepare(
      `SELECT m.*, c.name AS competition_name, NULL AS stadium_name, NULL AS manager_name
       FROM matches m JOIN competitions c ON c.id = m.competition_id
       WHERE m.manager_id = ? ORDER BY m.date DESC LIMIT ? OFFSET ?`,
    )
    .all(id, PAGE, (page - 1) * PAGE) as Parameters<typeof MatchList>[0]["matches"];

  const comps = getDb()
    .prepare(
      `SELECT c.name, COUNT(*) p, SUM(m.result='W') w, SUM(m.result='D') d, SUM(m.result='L') l
       FROM matches m JOIN competitions c ON c.id = m.competition_id
       WHERE m.manager_id = ? GROUP BY c.id ORDER BY p DESC`,
    )
    .all(id) as { name: string; p: number; w: number; d: number; l: number }[];

  const pages = Math.ceil(total / PAGE);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.25em] text-devil-bright font-semibold mb-2">{m.role}</p>
        <h1 className="display text-4xl">{m.name}</h1>
        <p className="text-sm text-ink-dim mt-2">{m.nationality}</p>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-px bg-line border border-line rounded-lg overflow-hidden max-w-2xl">
          {[
            ["Matches", fmtNum(m.p)],
            ["Record", `${m.w}–${m.d}–${m.l}`],
            ["Win rate", pct(m.w, m.p)],
            ["Goals", `${fmtNum(m.gf)}–${fmtNum(m.ga)}`],
          ].map(([k, v]) => (
            <div key={k} className="bg-panel px-4 py-3">
              <div className="stat-num text-xl font-semibold">{v}</div>
              <div className="text-xs text-ink-faint uppercase tracking-wider mt-0.5">{k}</div>
            </div>
          ))}
        </div>
        <WdlBar w={m.w} d={m.d} l={m.l} className="max-w-2xl mt-3" />
        <ul className="mt-4 space-y-1 text-sm text-ink-dim">
          {tenures.map((t) => (
            <li key={t.date_from}>
              {fmtDate(t.date_from)} — {t.date_to ? fmtDate(t.date_to) : "present"}
              {t.note ? ` · ${t.note}` : ""}
            </li>
          ))}
        </ul>
      </header>

      <section>
        <h2 className="display text-xl mb-3">By competition</h2>
        <div className="grid sm:grid-cols-2 gap-2 max-w-3xl text-sm">
          {comps.map((c) => (
            <div key={c.name} className="border border-line rounded-lg bg-panel px-4 py-2.5 flex justify-between items-center gap-3">
              <span className="truncate">{c.name}</span>
              <span className="stat-num text-xs text-ink-faint whitespace-nowrap">
                {c.w}–{c.d}–{c.l} ({pct(c.w, c.p)})
              </span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="display text-xl mb-3">Matches</h2>
        <MatchList matches={rows} showSeason />
        {pages > 1 && (
          <nav className="flex items-center gap-3 text-sm mt-3">
            {page > 1 && (
              <Link href={`/manager/${id}?page=${page - 1}`} className="text-devil-bright hover:underline">← Newer</Link>
            )}
            <span className="text-ink-faint stat-num">page {page} / {pages}</span>
            {page < pages && (
              <Link href={`/manager/${id}?page=${page + 1}`} className="text-devil-bright hover:underline">Older →</Link>
            )}
          </nav>
        )}
      </section>
    </div>
  );
}
