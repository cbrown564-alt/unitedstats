import type { ReactNode } from "react";
import type { MatchRow } from "@/lib/queries";
import {
  competitionShortName,
  fmtDateCompact,
  parseRound,
  resultTone,
  scoreline,
  scoreNote,
  venuePrefix,
} from "@/lib/format";
import { opponentNames } from "@/lib/clubNames";
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
 * Mobile match ledger row — score + opponent first (beside the result strip),
 * date right on row 1; competition on row 2.
 */
export function MatchNightCard<T extends MatchRow>({
  match: m,
  accentResult = true,
  extra,
}: {
  match: T;
  accentResult?: boolean;
  extra?: ReactNode;
}) {
  const note = scoreNote(m.pen_gf != null ? [m.pen_gf, m.pen_ga] : null, !!m.aet);
  const round = parseRound(m.round);
  const roundText = roundLabel(m, round);
  const opp = opponentNames(m.opponent_id, m.opponent_name);
  const tone = resultTone(m.outcome ?? m.result);
  const comp = competitionShortName(m.competition_id, m.competition_name);

  return (
    <div className={`px-3 py-2.5 ${accentResult ? accentClass(m.result) : ""}`}>
      <div className="flex min-w-0 items-baseline gap-2.5">
        <span className={`stat-num shrink-0 text-base font-bold tabular-nums leading-none ${tone}`}>
          {scoreline(m.gf, m.ga)}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium leading-snug" title={m.opponent_name}>
          <span className="text-ink-faint">{venuePrefix(m.venue)} </span>
          {opp.short}
          {note && <span className="ml-1.5 text-xs font-normal text-ink-dim">{note}</span>}
        </span>
        <span className="stat-num shrink-0 text-[11px] text-ink-faint">{fmtDateCompact(m.date)}</span>
      </div>

      <p className="mt-1 flex min-w-0 items-center gap-1.5 text-[11px] leading-tight text-ink-dim">
        <span className="min-w-0 truncate">
          {comp}
          {roundText && (
            <>
              <span className="text-ink-faint" aria-hidden>
                {" "}
                ·{" "}
              </span>
              {roundText}
            </>
          )}
        </span>
        <RoundMark leg={round.leg} replay={round.replay} />
      </p>

      {extra != null && <div className="mt-1.5">{extra}</div>}
    </div>
  );
}
