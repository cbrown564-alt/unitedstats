import type { ReactNode } from "react";
import type { MatchRow } from "@/lib/queries";
import {
  competitionShortName,
  fmtDate,
  fmtNum,
  parseRound,
  resultTone,
  scoreline,
  scoreNote,
  venuePrefix,
} from "@/lib/format";
import { opponentNames } from "@/lib/clubNames";
import { CompetitionDot } from "@/components/CompetitionChip";
import { RoundMark } from "@/components/RoundMark";

const ACCENT: Record<string, string> = {
  W: "border-l-2 border-win/50",
  L: "border-l-2 border-loss/50",
  D: "border-l-2 border-draw/50",
};

function accentClass(result: string): string {
  return ACCENT[result] ?? ACCENT.D;
}

/** League matchday rounds ("Game 38") add noise on mobile — comp name is enough. */
function roundLabel(m: MatchRow, round: ReturnType<typeof parseRound>): string {
  if (m.competition_type === "league") return "";
  return round.label;
}

/**
 * Mobile match ledger row — thin card, one result at a time. Result reads from
 * colour + left strip, not a W/D/L badge. Season lives in section headers on
 * `/matches`, not on home recency lists.
 */
export function MatchNightCard<T extends MatchRow>({
  match: m,
  showAttendance = false,
  accentResult = true,
  extra,
}: {
  match: T;
  showAttendance?: boolean;
  accentResult?: boolean;
  extra?: ReactNode;
}) {
  const note = scoreNote(m.pen_gf != null ? [m.pen_gf, m.pen_ga] : null, !!m.aet);
  const round = parseRound(m.round);
  const roundText = roundLabel(m, round);
  const opp = opponentNames(m.opponent_id, m.opponent_name);
  const tone = resultTone(m.outcome ?? m.result);

  return (
    <div className={`px-3 py-2.5 ${accentResult ? accentClass(m.result) : ""}`}>
      <div className="flex min-w-0 items-baseline gap-2.5">
        <span className="stat-num shrink-0 text-[11px] text-ink-faint">{fmtDate(m.date)}</span>
        <span className={`stat-num shrink-0 text-sm font-bold tabular-nums ${tone}`}>
          {scoreline(m.gf, m.ga)}
        </span>
        <span className="min-w-0 truncate text-sm font-medium">
          <span className="text-ink-faint">{venuePrefix(m.venue)}</span>
          {opp.short}
          {note && <span className="ml-1.5 text-xs font-normal text-ink-dim">{note}</span>}
        </span>
      </div>

      <p className="mt-1 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-ink-dim">
        <span className="inline-flex min-w-0 items-center gap-1">
          <CompetitionDot type={m.competition_type} />
          <span className="truncate">{competitionShortName(m.competition_id, m.competition_name)}</span>
        </span>
        {roundText && (
          <>
            <span className="text-ink-faint" aria-hidden>
              ·
            </span>
            <span className="inline-flex items-center gap-1">
              <span>{roundText}</span>
              <RoundMark leg={round.leg} replay={round.replay} />
            </span>
          </>
        )}
        {showAttendance && m.attendance != null && (
          <>
            <span className="text-ink-faint" aria-hidden>
              ·
            </span>
            <span className="stat-num">{fmtNum(m.attendance)}</span>
          </>
        )}
      </p>

      {extra != null && <div className="mt-1.5">{extra}</div>}
    </div>
  );
}
