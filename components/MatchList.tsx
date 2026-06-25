import Link from "next/link";
import type { ReactNode } from "react";
import type { MatchRow } from "@/lib/queries";
import { fmtDate, fmtNum, parseRound, resultTone, scoreline, scoreNote, venuePrefix, competitionShortName } from "@/lib/format";
import { opponentNames } from "@/lib/clubNames";
import { ResultBadge } from "./ResultBadge";
import { CompetitionDot } from "./CompetitionChip";
import { RoundMark } from "./RoundMark";

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
  // Reading order across a row: date · score · result · opponent, then the meta
  // rail (competition + crowd) pinned to the right edge. Score leads the result
  // so each row reads "2–0 W v Aston Villa"; the fixed date column keeps every
  // scoreline left-aligned in a clean vertical rail. When a scorer filter is on,
  // the goals/minutes badge sits just left of the meta rail, content-sized and
  // right-aligned — it grows leftward into the opponent slack, never colliding.
  const cols = renderExtra
    ? "grid-cols-[auto_auto_1fr_auto] sm:grid-cols-[7rem_auto_auto_1fr_auto_auto]"
    : "grid-cols-[auto_auto_1fr] sm:grid-cols-[7rem_auto_auto_1fr_auto]";
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-pitch/35">
      {matches.map((m) => {
        const note = scoreNote(m.pen_gf != null ? [m.pen_gf, m.pen_ga] : null, !!m.aet);
        const round = parseRound(m.round);
        const opp = opponentNames(m.opponent_id, m.opponent_name);
        return (
        <li key={m.id} className="match-list-item">
          <Link
            href={`/match/${m.id}`}
            className={`grid min-h-14 ${cols} items-center gap-3 px-3 py-2.5 transition-colors hover:bg-panel focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-devil-bright sm:px-4 ${accentResult ? accentClass(m.result) : ""}`}
          >
            <span className="stat-num hidden text-xs text-ink-dim sm:block">{fmtDate(m.date)}</span>
            <span className={`stat-num min-w-[2.75rem] rounded bg-panel-2 px-2 py-1 text-center text-sm font-semibold whitespace-nowrap ${resultTone(m.outcome ?? m.result)}`}>
              {scoreline(m.gf, m.ga)}
            </span>
            <ResultBadge result={m.result} outcome={m.outcome} />
            <span className="min-w-0">
              <span className="flex items-baseline gap-2">
                <span className="min-w-0 text-sm font-medium sm:truncate" title={m.opponent_name}>
                  <span className="mr-1.5 text-ink-faint">{venuePrefix(m.venue)}</span>
                  <span className="sm:hidden">{opp.short}</span>
                  <span className="hidden sm:inline xl:hidden">{opp.short}</span>
                  <span className="hidden xl:inline">{m.opponent_name}</span>
                </span>
                {note && <span className="shrink-0 text-xs text-ink-dim">{note}</span>}
              </span>
              <span className="flex min-w-0 items-center gap-1.5 text-xs text-ink-dim sm:hidden">
                <CompetitionDot type={m.competition_type} />
                <span className="truncate">{competitionShortName(m.competition_id, m.competition_name)}</span>
                <span className="shrink-0 text-ink-faint">·</span>
                <span className="shrink-0">{fmtDate(m.date)}</span>
                {showSeason ? <><span className="shrink-0 text-ink-faint"> · </span><span className="truncate">{m.season}</span></> : null}
                {showAttendance && m.attendance != null ? <><span className="shrink-0 text-ink-faint"> · </span><span className="shrink-0">{fmtNum(m.attendance)}</span></> : null}
              </span>
            </span>
            {renderExtra && (
              <span className="justify-self-end whitespace-nowrap">{renderExtra(m)}</span>
            )}
            {/* Fixed-width sub-columns so season / competition / round line up
                vertically down the list and stay scannable row to row. */}
            <span
              className={`hidden items-center gap-x-3 text-xs text-ink-dim sm:grid ${
                showSeason
                  ? "[grid-template-columns:3.75rem_minmax(0,12rem)_minmax(0,8rem)]"
                  : "[grid-template-columns:minmax(0,12rem)_minmax(0,8rem)]"
              }`}
            >
              {showSeason && <span className="stat-num whitespace-nowrap text-ink-faint">{m.season}</span>}
              <span className="flex min-w-0 items-center gap-1.5" title={m.competition_name}>
                <CompetitionDot type={m.competition_type} />
                <span className="truncate">{competitionShortName(m.competition_id, m.competition_name)}</span>
              </span>
              <span className="min-w-0">
                <span className="flex min-w-0 items-center gap-1.5 text-ink-dim" title={m.round ?? undefined}>
                  <span className="truncate">{round.label}</span>
                  <RoundMark leg={round.leg} replay={round.replay} />
                </span>
                {showAttendance && m.attendance != null && (
                  <span className="stat-num block text-[11px] text-ink-faint">{fmtNum(m.attendance)}</span>
                )}
              </span>
            </span>
          </Link>
        </li>
        );
      })}
      {matches.length === 0 && (
        <li className="px-4 py-8 text-center text-sm text-ink-faint">No matches found.</li>
      )}
    </ul>
  );
}
