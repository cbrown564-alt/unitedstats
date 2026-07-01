"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { EventRow, MatchRow } from "@/lib/queries";
import { fmtDateLong, resultLabel, resultTone, scoreline, scoreNote, venueLabel } from "@/lib/format";
import { opponentNames } from "@/lib/clubNames";
import { MatchFlow } from "@/components/MatchFlow";
import { ShareCite } from "@/components/ShareCite";
import { BottomSheet, BottomSheetBody, BottomSheetHeader } from "@/components/mobile/BottomSheet";
import { CompetitionChip } from "@/components/CompetitionChip";

type PreviewPayload = {
  match: MatchRow;
  events: EventRow[];
};

function parsePreview(json: unknown): PreviewPayload {
  const root = json as { data?: PreviewPayload; error?: string };
  if (root.error || !root.data?.match) {
    throw new Error(root.error ?? "Could not load this match.");
  }
  return {
    match: root.data.match,
    events: root.data.events ?? [],
  };
}

/**
 * Phase B list drill-down — quick match preview in a bottom sheet without route
 * interception. Dismiss returns to the list scroll position; "See full match"
 * navigates to the detail page (MOBILE.md §1.2).
 */
export function MatchPreviewSheet({
  matchId,
  open,
  onClose,
}: {
  matchId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const [data, setData] = useState<PreviewPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (id: string, signal: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/matches/${encodeURIComponent(id)}`, { signal });
      if (!res.ok) throw new Error("Could not load this match.");
      const json = await res.json();
      setData(parsePreview(json));
    } catch (e) {
      if (signal.aborted) return;
      setData(null);
      setError(e instanceof Error ? e.message : "Could not load this match.");
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open || !matchId) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    void load(matchId, controller.signal);
    return () => controller.abort();
  }, [open, matchId, load]);

  const m = data?.match;
  const goals = data?.events.filter((e) => ["goal", "pen-goal", "own-goal-for"].includes(e.type)) ?? [];
  const opponentGoals =
    data?.events.filter((e) => ["opp-goal", "own-goal-against"].includes(e.type)) ?? [];
  const hasTimedGoals = goals.some((g) => g.minute != null) || opponentGoals.some((g) => g.minute != null);

  const titleId = "match-preview-title";

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      ariaLabel="Match preview"
      titleId={titleId}
      panelClassName="mobile-sheet-panel--preview"
    >
      <BottomSheetHeader>
        {m ? (
          <div className="space-y-2 pr-10">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <p id={titleId} className="text-[10px] font-semibold uppercase tracking-[0.2em] text-devil-bright">
                  {fmtDateLong(m.date)}
                </p>
                <p className="text-xs text-ink-dim">
                  <CompetitionChip type={m.competition_type} name={m.competition_name} round={m.round} bare />
                </p>
              </div>
              <ShareCite
                path={`/match/${m.id}`}
                title={`Manchester United v ${m.opponent_name} — ${fmtDateLong(m.date)}`}
              />
            </div>
            <div className="space-y-1 border-t border-line/80 pt-3 text-center">
              <p className={`stat-num text-[11px] font-semibold uppercase tracking-wider ${resultTone(m.outcome)}`}>
                {resultLabel(m.outcome)}
              </p>
              <p className="display text-xl leading-tight">
                <span className="text-ink-dim">United </span>
                <span className={`stat-num ${resultTone(m.outcome)}`}>{scoreline(m.gf, m.ga)}</span>
                <span className="text-ink-dim"> {opponentNames(m.opponent_id, m.opponent_name).short}</span>
              </p>
              {scoreNote(m.pen_gf != null ? [m.pen_gf, m.pen_ga] : null, !!m.aet) && (
                <p className="text-xs text-ink-faint">
                  {m.aet ? "After extra time. " : ""}
                  {scoreNote(m.pen_gf != null ? [m.pen_gf, m.pen_ga] : null, !!m.aet)}
                </p>
              )}
              <p className="text-[11px] text-ink-faint">{venueLabel(m.venue)} · {m.stadium_name ?? m.season}</p>
            </div>
          </div>
        ) : (
          <p id={titleId} className="text-sm font-medium text-ink">
            Match preview
          </p>
        )}
      </BottomSheetHeader>

      <BottomSheetBody className="space-y-4 pb-2">
        {loading && (
          <div className="space-y-3 px-1" aria-busy="true">
            <div className="h-24 animate-pulse rounded-lg bg-panel-2/80" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-panel-2/60" />
          </div>
        )}
        {error && !loading && (
          <p className="px-1 text-sm text-loss">{error}</p>
        )}
        {m && !loading && !error && (
          <>
            {hasTimedGoals ? (
              <MatchFlow unitedGoals={goals} opponentGoals={opponentGoals} aet={!!m.aet} />
            ) : (
              <p className="text-sm text-ink-dim">Goal minutes are not on record for this match.</p>
            )}
            <Link
              href={`/match/${m.id}`}
              className="tap-target flex w-full items-center justify-center gap-2 rounded-full border border-devil/50 bg-devil/10 px-5 py-3 text-sm font-semibold text-devil-bright transition-colors hover:border-devil hover:bg-devil/20 focus-ring"
            >
              See the full match
              <span aria-hidden>→</span>
            </Link>
          </>
        )}
      </BottomSheetBody>
    </BottomSheet>
  );
}
