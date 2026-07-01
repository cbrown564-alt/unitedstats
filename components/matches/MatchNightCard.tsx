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
import { ResultBadge } from "@/components/ResultBadge";
import { CompetitionDot } from "@/components/CompetitionChip";
import { RoundMark } from "@/components/RoundMark";

const ACCENT: Record<string, string> = {
  W: "border-l-[3px] border-win/60",
  L: "border-l-[3px] border-loss/60",
  D: "border-l-[3px] border-draw/60",
};

function accentClass(result: string): string {
  return ACCENT[result] ?? ACCENT.D;
}

/**
 * Mobile match list row — edge-to-edge floodlit plate (MOBILE.md Wave 2). Reads
 * as a match-night card, not a dense ledger row; desktop keeps `MatchList` rows.
 */
export function MatchNightCard<T extends MatchRow>({
  match: m,
  showSeason = false,
  showAttendance = false,
  accentResult = false,
  extra,
  onActivate,
}: {
  match: T;
  showSeason?: boolean;
  showAttendance?: boolean;
  accentResult?: boolean;
  extra?: ReactNode;
  /** When set, renders a button (sheet preview); otherwise the card is inert markup for a wrapping link. */
  onActivate?: () => void;
}) {
  const note = scoreNote(m.pen_gf != null ? [m.pen_gf, m.pen_ga] : null, !!m.aet);
  const round = parseRound(m.round);
  const opp = opponentNames(m.opponent_id, m.opponent_name);
  const tone = resultTone(m.outcome ?? m.result);

  const inner = (
    <>
      <div
        className="pointer-events-none absolute -left-16 -top-16 h-40 w-1/2 rounded-full opacity-[0.14] blur-2xl"
        style={{ backgroundColor: "var(--color-devil)" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 -top-12 h-36 w-1/2 rounded-full opacity-[0.10] blur-2xl"
        style={{ backgroundColor: "var(--color-devil)" }}
        aria-hidden
      />
      <div className="hero-grid pointer-events-none absolute inset-0 opacity-35" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(125%_120%_at_45%_45%,transparent_42%,rgba(0,0,0,0.55))]" aria-hidden />

      <div className={`relative px-4 py-3.5 ${accentResult ? accentClass(m.result) : ""}`}>
        <div className="flex items-start justify-between gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-devil-bright/90">
            {fmtDate(m.date)}
            {showSeason && (
              <>
                <span className="mx-1.5 text-ink-faint" aria-hidden>
                  ·
                </span>
                <span className="stat-num text-ink-faint">{m.season}</span>
              </>
            )}
          </p>
          <ResultBadge result={m.result} outcome={m.outcome} />
        </div>

        <div className="mt-2.5 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
          <span className={`stat-num text-2xl font-bold leading-none ${tone}`}>
            {scoreline(m.gf, m.ga)}
          </span>
          {note && <span className="text-xs text-ink-dim">{note}</span>}
        </div>

        <p className="mt-1.5 text-base font-medium leading-snug">
          <span className="text-ink-faint">{venuePrefix(m.venue)}</span>
          {opp.short}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-ink-dim">
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <CompetitionDot type={m.competition_type} />
            <span className="truncate">{competitionShortName(m.competition_id, m.competition_name)}</span>
          </span>
          {round.label && (
            <>
              <span className="text-ink-faint" aria-hidden>
                ·
              </span>
              <span className="inline-flex items-center gap-1">
                <span>{round.label}</span>
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
        </div>

        {extra != null && <div className="mt-2">{extra}</div>}
      </div>
    </>
  );

  const shellClass =
    "match-night-card relative block w-full overflow-hidden rounded-xl border border-line/70 bg-pitch text-left shadow-[0_12px_28px_rgb(0_0_0_/0.28)] transition-colors hover:border-devil/40 focus-ring";

  if (onActivate) {
    return (
      <button type="button" onClick={onActivate} className={shellClass}>
        {inner}
      </button>
    );
  }

  return <div className={shellClass}>{inner}</div>;
}
