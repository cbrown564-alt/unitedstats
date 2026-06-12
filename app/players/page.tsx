import Link from "next/link";
import { playersIndex, getMeta } from "@/lib/queries";
import { fmtNum } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Players" };

export default function PlayersPage() {
  const players = playersIndex();
  const meta = getMeta();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="display text-3xl">Players</h1>
        <p className="text-sm text-ink-dim mt-1 max-w-2xl">
          {fmtNum(players.length)} players with recorded appearances or goal contributions.
          Goal data currently covers <span className="stat-num">{fmtNum(Number(meta.events))}</span> events;
          lineup data covers <span className="stat-num">{fmtNum(Number(meta.matches_with_lineups ?? 0))}</span> matches.
        </p>
      </header>
      <table className="w-full text-sm border border-line rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-panel-2 text-left text-xs uppercase tracking-wider text-ink-faint">
            <th className="px-3 py-2 w-10">#</th>
            <th className="px-3 py-2">Player</th>
            <th className="px-3 py-2 text-right">Apps</th>
            <th className="px-3 py-2 text-right hidden sm:table-cell">Starts</th>
            <th className="px-3 py-2 text-right">Goals</th>
            <th className="px-3 py-2 text-right hidden sm:table-cell">Assists</th>
            <th className="px-3 py-2 text-right hidden lg:table-cell">Span</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {players.map((p, i) => (
            <tr key={p.player_id} className="hover:bg-panel transition-colors">
              <td className="px-3 py-2 stat-num text-ink-faint">{i + 1}</td>
              <td className="px-3 py-2">
                <Link href={`/player/${p.player_id}`} className="font-medium hover:text-devil-bright">
                  {p.name}
                </Link>
              </td>
              <td className="px-3 py-2 text-right stat-num">{p.apps || "—"}</td>
              <td className="px-3 py-2 text-right stat-num hidden sm:table-cell">{p.starts || "—"}</td>
              <td className="px-3 py-2 text-right stat-num font-semibold text-devil-bright">{p.goals}</td>
              <td className="px-3 py-2 text-right stat-num hidden sm:table-cell">{p.assists || "—"}</td>
              <td className="px-3 py-2 text-right stat-num text-ink-faint hidden lg:table-cell">
                {p.first_date ? `${p.first_date.slice(0, 4)}–${p.last_date?.slice(0, 4)}` : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
