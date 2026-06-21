"use client";

import { useEffect, useState } from "react";
import { CoverageNote } from "@/components/CoverageNote";
import { fmtNum, venueLabel } from "@/lib/format";
import type { Odds } from "@/lib/predict";

type Venue = "H" | "A" | "N";

/**
 * The match-forecast widget. The page is statically prerendered, so odds for
 * every rated opponent at each venue are precomputed at build (the W/D/L split
 * is data-driven off historical expectancy bands, not a closed-form formula, so
 * it can't be recomputed cheaply in the browser) and handed in here. Selecting
 * an opponent/venue is then an instant client-side lookup; the choice reflects
 * to the URL (`?opponent`/`?venue`) so a forecast stays shareable.
 */
export function OddsPredictor({
  opponents,
  oddsByOpponent,
  defaultOpponent,
  homeAdvantage,
}: {
  opponents: { id: string; name: string }[];
  oddsByOpponent: Record<string, Partial<Record<Venue, Odds>>>;
  defaultOpponent: string;
  homeAdvantage: number;
}) {
  const [opponentId, setOpponentId] = useState(defaultOpponent);
  const [venue, setVenue] = useState<Venue>("H");

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const o = sp.get("opponent");
    const v = sp.get("venue");
    const nextOpponent = o && oddsByOpponent[o] ? o : null;
    const nextVenue = v === "A" || v === "N" || v === "H" ? v : null;
    if (!nextOpponent && !nextVenue) return;
    const frame = window.requestAnimationFrame(() => {
      if (nextOpponent) setOpponentId(nextOpponent);
      if (nextVenue) setVenue(nextVenue);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [oddsByOpponent]);

  function sync(nextOpp: string, nextVenue: Venue) {
    const url = new URL(window.location.href);
    url.searchParams.set("opponent", nextOpp);
    url.searchParams.set("venue", nextVenue);
    window.history.replaceState(null, "", url);
  }

  const odds = oddsByOpponent[opponentId]?.[venue];

  return (
    <div className="rounded-lg border border-line bg-panel p-4 shadow-[0_1px_0_rgb(255_255_255_/_0.025)_inset]">
      <div className="flex flex-wrap items-end gap-3 text-sm">
        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wider text-ink-faint">Opponent</span>
          <select
            value={opponentId}
            onChange={(e) => {
              setOpponentId(e.target.value);
              sync(e.target.value, venue);
            }}
            className="control"
          >
            {opponents.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wider text-ink-faint">Venue</span>
          <select
            value={venue}
            onChange={(e) => {
              const v = e.target.value as Venue;
              setVenue(v);
              sync(opponentId, v);
            }}
            className="control"
          >
            <option value="H">Home</option>
            <option value="A">Away</option>
            <option value="N">Neutral</option>
          </select>
        </label>
      </div>

      {odds && (
        <div className="mt-5">
          <p className="mb-3 text-sm text-ink-dim">
            United v <span className="font-medium text-ink">{odds.opponentName}</span>,{" "}
            {venueLabel(venue).toLowerCase()}, at today&apos;s ratings:
          </p>
          <div className="grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-line bg-line text-center">
            <div className="bg-panel-2 px-3 py-3">
              <div className="stat-num text-2xl font-semibold text-win">{(100 * odds.pW).toFixed(0)}%</div>
              <div className="text-[11px] uppercase tracking-wider text-ink-faint">United win</div>
            </div>
            <div className="bg-panel-2 px-3 py-3">
              <div className="stat-num text-2xl font-semibold text-draw">{(100 * odds.pD).toFixed(0)}%</div>
              <div className="text-[11px] uppercase tracking-wider text-ink-faint">Draw</div>
            </div>
            <div className="bg-panel-2 px-3 py-3">
              <div className="stat-num text-2xl font-semibold text-loss">{(100 * odds.pL).toFixed(0)}%</div>
              <div className="text-[11px] uppercase tracking-wider text-ink-faint">{odds.opponentName} win</div>
            </div>
          </div>
          <CoverageNote
            slice={`United ${Math.round(odds.unitedElo)} v ${odds.opponentName} ${Math.round(odds.opponentElo)} (closed-universe Elo, ${venueLabel(venue).toLowerCase()} worth ${venue === "N" ? 0 : homeAdvantage} points), expectancy ${(100 * odds.expected).toFixed(0)}%, split using the ${fmtNum(odds.sample)} historical matches in that expectancy band.`}
            evidenceHref={`/matches?opponent=${opponentId}`}
            evidenceLabel={`All ${fmtNum(odds.meetings)} rated meetings →`}
          >
            {odds.opponentName}&apos;s rating moves only when they play United; it was last
            updated {odds.lastMet}. Treat long-dormant opponents accordingly.
          </CoverageNote>
        </div>
      )}
    </div>
  );
}
