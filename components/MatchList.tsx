import Link from "next/link";
import type { ReactNode } from "react";
import type { MatchRow } from "@/lib/queries";
import { fmtDate, fmtNum, fmtRound, scoreline, venuePrefix } from "@/lib/format";
import { ResultBadge } from "./ResultBadge";
import { CompetitionDot } from "./CompetitionChip";

// Supplementary result spine. Pairs with the textual ResultBadge, so colour is
// never the only cue; speeds up W/D/L scanning down a long list.
const ACCENT: Record<string, string> = {
  W: "border-l-2 border-win/50",
  L: "border-l-2 border-loss/50",
  D: "border-l-2 border-draw/50",
};

function accentClass(result: string): string {
  return ACCENT[result] ?? ACCENT.D;
}

export function MatchList<T extends MatchRow>({
  matches,
  showSeason = false,
  showAttendance = false,
  accentResult = false,
  renderExtra,
}: {
  matches: T[];
  showSeason?: boolean;
  /** Append the recorded crowd to the right-hand meta column where present. */
  showAttendance?: boolean;
  /** Add a result-coloured left edge to each row. */
  accentResult?: boolean;
  /** Render an extra trailing cell per row (e.g. a goals/minutes annotation). */
  renderExtra?: (m: T) => ReactNode;
}) {
  const cols = renderExtra
    ? "grid-cols-[auto_1fr_auto_auto] sm:grid-cols-[7rem_auto_1fr_auto_auto_auto]"
    : "grid-cols-[auto_1fr_auto] sm:grid-cols-[7rem_auto_1fr_auto_auto]";
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-pitch/35">
      {matches.map((m) => (
        <li key={m.id}>
          <Link
            href={`/match/${m.id}`}
            className={`grid min-h-14 ${cols} items-center gap-3 px-3 py-2.5 transition-colors hover:bg-panel focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-devil-bright sm:px-4 ${accentResult ? accentClass(m.result) : ""}`}
          >
            <span className="stat-num hidden text-xs text-ink-dim sm:block">{fmtDate(m.date)}</span>
            <ResultBadge result={m.result} outcome={m.outcome} />
            <span className="min-w-0">
              <span className="text-sm font-medium truncate block">
                <span className="mr-1.5 text-ink-faint">{venuePrefix(m.venue)}</span>
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
            {/* Fixed-width sub-columns so season / competition / round line up
                vertically down the list and stay scannable row to row. */}
            <span
              className={`hidden items-center gap-x-3 text-xs text-ink-dim sm:grid ${
                showSeason
                  ? "[grid-template-columns:3.75rem_8rem_4.5rem]"
                  : "[grid-template-columns:8rem_4.5rem]"
              }`}
            >
              {showSeason && <span className="stat-num whitespace-nowrap text-ink-faint">{m.season}</span>}
              <span className="flex min-w-0 items-center gap-1.5">
                <CompetitionDot type={m.competition_type} />
                <span className="truncate">{m.competition_name}</span>
              </span>
              <span className="min-w-0">
                <span className="block truncate text-ink-faint" title={m.round ?? undefined}>
                  {m.round ? fmtRound(m.round) : ""}
                </span>
                {showAttendance && m.attendance != null && (
                  <span className="stat-num block text-[11px] text-ink-faint">{fmtNum(m.attendance)}</span>
                )}
              </span>
            </span>
            {renderExtra && <span className="justify-self-end">{renderExtra(m)}</span>}
          </Link>
        </li>
      ))}
      {matches.length === 0 && (
        <li className="px-4 py-8 text-center text-sm text-ink-faint">No matches found.</li>
      )}
    </ul>
  );
}
