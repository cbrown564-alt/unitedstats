import Link from "next/link";
import type { MatchRow } from "@/lib/queries";
import { fmtDate, scoreline } from "@/lib/format";
import { ResultBadge } from "./ResultBadge";

export function MatchList({ matches, showSeason = false }: { matches: MatchRow[]; showSeason?: boolean }) {
  return (
    <ul className="divide-y divide-line border border-line rounded-lg overflow-hidden">
      {matches.map((m) => (
        <li key={m.id}>
          <Link
            href={`/match/${m.id}`}
            className="grid grid-cols-[auto_1fr_auto] sm:grid-cols-[7rem_auto_1fr_auto_auto] items-center gap-3 px-3 sm:px-4 py-2.5 hover:bg-panel transition-colors"
          >
            <span className="stat-num text-xs text-ink-faint hidden sm:block">{fmtDate(m.date)}</span>
            <ResultBadge result={m.result} outcome={m.outcome} />
            <span className="min-w-0">
              <span className="text-sm font-medium truncate block">
                <span className="text-ink-faint mr-1.5">{m.venue === "H" ? "v" : m.venue === "A" ? "@" : "n"}</span>
                {m.opponent_name}
              </span>
              <span className="text-xs text-ink-faint sm:hidden">{fmtDate(m.date)}</span>
            </span>
            <span className="stat-num text-sm font-semibold whitespace-nowrap">
              {scoreline(m.gf, m.ga, m.pen_gf != null ? [m.pen_gf, m.pen_ga] : null, !!m.aet)}
            </span>
            <span className="text-xs text-ink-faint text-right hidden sm:block w-36 truncate">
              {showSeason ? `${m.season} · ` : ""}
              {m.competition_name}
              {m.round ? ` · ${m.round}` : ""}
            </span>
          </Link>
        </li>
      ))}
      {matches.length === 0 && (
        <li className="px-4 py-8 text-center text-sm text-ink-faint">No matches found.</li>
      )}
    </ul>
  );
}
