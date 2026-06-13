import Link from "next/link";
import type { MatchRow } from "@/lib/queries";
import { fmtDate, fmtNum, scoreline } from "@/lib/format";
import { ResultBadge } from "./ResultBadge";
import { CompetitionDot } from "./CompetitionChip";

// Supplementary result spine. Pairs with the textual ResultBadge, so colour is
// never the only cue; speeds up W/D/L scanning down a long list.
function accentClass(result: string): string {
  return result === "W"
    ? "border-l-2 border-win/50"
    : result === "L"
      ? "border-l-2 border-loss/50"
      : "border-l-2 border-draw/40";
}

export function MatchList({
  matches,
  showSeason = false,
  showAttendance = false,
  accentResult = false,
}: {
  matches: MatchRow[];
  showSeason?: boolean;
  /** Append the recorded crowd to the right-hand meta column where present. */
  showAttendance?: boolean;
  /** Add a result-coloured left edge to each row. */
  accentResult?: boolean;
}) {
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-pitch/35">
      {matches.map((m) => (
        <li key={m.id}>
          <Link
            href={`/match/${m.id}`}
            className={`grid min-h-14 grid-cols-[auto_1fr_auto] items-center gap-3 px-3 py-2.5 transition-colors hover:bg-panel focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-devil-bright sm:grid-cols-[7rem_auto_1fr_auto_auto] sm:px-4 ${accentResult ? accentClass(m.result) : ""}`}
          >
            <span className="stat-num hidden text-xs text-ink-dim sm:block">{fmtDate(m.date)}</span>
            <ResultBadge result={m.result} outcome={m.outcome} />
            <span className="min-w-0">
              <span className="text-sm font-medium truncate block">
                <span className="mr-1.5 text-ink-faint">{m.venue === "H" ? "v" : m.venue === "A" ? "@" : "n"}</span>
                {m.opponent_name}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-ink-dim sm:hidden">
                <CompetitionDot type={m.competition_type} />
                {fmtDate(m.date)}
                {showSeason ? ` · ${m.season}` : ""}
                {showAttendance && m.attendance != null ? ` · ${fmtNum(m.attendance)}` : ""}
              </span>
            </span>
            <span className="stat-num rounded bg-panel-2 px-2 py-1 text-sm font-semibold whitespace-nowrap">
              {scoreline(m.gf, m.ga, m.pen_gf != null ? [m.pen_gf, m.pen_ga] : null, !!m.aet)}
            </span>
            <span className="hidden w-40 items-center justify-end gap-1.5 text-xs text-ink-dim sm:flex">
              <CompetitionDot type={m.competition_type} />
              <span className="min-w-0">
                <span className="block truncate">
                  {showSeason ? `${m.season} · ` : ""}
                  {m.competition_name}
                  {m.round ? ` · ${m.round}` : ""}
                </span>
                {showAttendance && m.attendance != null && (
                  <span className="stat-num block text-right text-[11px] text-ink-faint">{fmtNum(m.attendance)}</span>
                )}
              </span>
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
