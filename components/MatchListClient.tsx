"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type MouseEvent, type ReactNode } from "react";
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
import { MatchNightCard } from "@/components/matches/MatchNightCard";
import { MatchPreviewSheet } from "@/components/mobile/MatchPreviewSheet";
import { useMobileShellTier } from "@/components/mobile/useMobileShellTier";

const ACCENT: Record<string, string> = {
  W: "border-l-2 border-win/50",
  L: "border-l-2 border-loss/50",
  D: "border-l-2 border-draw/50",
};

function accentClass(result: string): string {
  return ACCENT[result] ?? ACCENT.D;
}

/** Client layer for match lists — mobile cards, sheet preview, narrow-shell row intercept. */
export function MatchListClient<T extends MatchRow>({
  matches,
  showSeason = false,
  showAttendance = false,
  accentResult = false,
  extraById,
  previewOnMobile = true,
}: {
  matches: T[];
  showSeason?: boolean;
  showAttendance?: boolean;
  accentResult?: boolean;
  /** Pre-rendered row extras from the server — avoids passing functions across the RSC boundary. */
  extraById?: Record<string, ReactNode>;
  previewOnMobile?: boolean;
}) {
  const tier = useMobileShellTier();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const usePreview = previewOnMobile && hydrated && tier !== "desktop";
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const hasExtra = extraById != null && Object.keys(extraById).length > 0;

  const openPreview = useCallback(
    (id: string) => {
      if (!usePreview) return;
      setPreviewId(id);
      setSheetOpen(true);
    },
    [usePreview],
  );

  const closePreview = useCallback(() => {
    setSheetOpen(false);
  }, []);

  if (matches.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-sm text-ink-faint sm:rounded-lg sm:border sm:border-line sm:bg-pitch/35">
        No matches found.
      </p>
    );
  }

  return (
    <>
      <ul className="-mx-4 space-y-3 px-4 sm:hidden">
        {matches.map((m) => (
          <li key={m.id} className="match-list-item">
            {usePreview ? (
              <MatchNightCard
                match={m}
                showSeason={showSeason}
                showAttendance={showAttendance}
                accentResult={accentResult}
                extra={extraById?.[m.id]}
                onActivate={() => openPreview(m.id)}
              />
            ) : (
              <Link href={`/match/${m.id}`} className="block focus-ring">
                <MatchNightCard
                  match={m}
                  showSeason={showSeason}
                  showAttendance={showAttendance}
                  accentResult={accentResult}
                  extra={extraById?.[m.id]}
                />
              </Link>
            )}
          </li>
        ))}
      </ul>

      <ul className="hidden divide-y divide-line overflow-hidden rounded-lg border border-line bg-pitch/35 sm:block">
        {matches.map((m) => {
          const note = scoreNote(m.pen_gf != null ? [m.pen_gf, m.pen_ga] : null, !!m.aet);
          const round = parseRound(m.round);
          const opp = opponentNames(m.opponent_id, m.opponent_name);
          const rowHref = `/match/${m.id}`;

          const handleRowClick = (e: MouseEvent<HTMLAnchorElement>) => {
            if (!usePreview) return;
            e.preventDefault();
            openPreview(m.id);
          };

          return (
            <li key={m.id} className="match-list-item">
              <Link
                href={rowHref}
                onClick={usePreview ? handleRowClick : undefined}
                className={`grid min-h-14 ${hasExtra ? "grid-cols-[auto_auto_1fr_auto] sm:grid-cols-[7rem_auto_auto_minmax(7.5rem,1fr)_auto_auto]" : "grid-cols-[auto_auto_1fr] sm:grid-cols-[7rem_auto_auto_minmax(7.5rem,1fr)_auto]"} items-center gap-3 px-3 py-2.5 transition-colors hover:bg-panel focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-devil-bright sm:px-4 ${accentResult ? accentClass(m.result) : ""}`}
              >
                <span className="stat-num hidden text-xs text-ink-dim sm:block">{fmtDate(m.date)}</span>
                <span
                  className={`stat-num min-w-[2.75rem] rounded bg-panel-2 px-2 py-1 text-center text-sm font-semibold whitespace-nowrap ${resultTone(m.outcome ?? m.result)}`}
                >
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
                    {showSeason ? (
                      <>
                        <span className="shrink-0 text-ink-faint"> · </span>
                        <span className="truncate">{m.season}</span>
                      </>
                    ) : null}
                    {showAttendance && m.attendance != null ? (
                      <>
                        <span className="shrink-0 text-ink-faint"> · </span>
                        <span className="shrink-0">{fmtNum(m.attendance)}</span>
                      </>
                    ) : null}
                  </span>
                </span>
                {hasExtra && extraById?.[m.id] != null && (
                  <span className="justify-self-end whitespace-nowrap">{extraById[m.id]}</span>
                )}
                <span
                  className={`hidden items-center gap-x-3 text-xs text-ink-dim sm:grid ${showSeason ? "[grid-template-columns:3.75rem_minmax(0,9rem)_minmax(0,8rem)] xl:[grid-template-columns:3.75rem_minmax(0,11rem)_minmax(0,8rem)]" : "[grid-template-columns:minmax(0,9rem)_minmax(0,8rem)] xl:[grid-template-columns:minmax(0,11rem)_minmax(0,8rem)]"}`}
                >
                  {showSeason && <span className="stat-num whitespace-nowrap text-ink-faint">{m.season}</span>}
                  <span className="flex min-w-0 items-center gap-1.5" title={m.competition_name}>
                    <CompetitionDot type={m.competition_type} />
                    <span className="truncate xl:hidden">{competitionShortName(m.competition_id, m.competition_name)}</span>
                    <span className="hidden truncate xl:inline">{m.competition_name}</span>
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
      </ul>

      {usePreview && (
        <MatchPreviewSheet matchId={previewId} open={sheetOpen} onClose={closePreview} />
      )}
    </>
  );
}
