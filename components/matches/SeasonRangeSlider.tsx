"use client";

import { useCallback, useMemo, useState } from "react";
import {
  decadeMarkers,
  seasonBounds,
  seasonIndicesForDecade,
  seasonIndicesFromParams,
  seasonsAscending,
} from "@/lib/seasonBounds";

function decadeShortLabel(decade: number): string {
  return `${String(decade).slice(-2)}s`;
}

function showDecadeLabel(decade: number, index: number, total: number, compact: boolean): boolean {
  if (!compact) return true;
  if (index === 0 || index === total - 1) return true;
  return decade % 20 === 0;
}

/**
 * Dual-thumb era control that snaps to whole seasons. Drag the handles or tap a
 * decade marker to jump; releases write Jul–Jun bounds into `from`/`to`.
 */
export function SeasonRangeSlider({
  seasons,
  fromParam,
  toParam,
  onApply,
  compact = false,
}: {
  /** Newest-first season list from `allSeasons()`. */
  seasons: string[];
  fromParam?: string;
  toParam?: string;
  onApply: (from: string | undefined, to: string | undefined) => void;
  compact?: boolean;
}) {
  const asc = useMemo(() => seasonsAscending(seasons), [seasons]);
  const maxIdx = Math.max(0, asc.length - 1);
  const markers = useMemo(() => decadeMarkers(asc), [asc]);

  const [lo, setLo] = useState(() => seasonIndicesFromParams(asc, fromParam, toParam)[0]);
  const [hi, setHi] = useState(() => seasonIndicesFromParams(asc, fromParam, toParam)[1]);

  const active = lo > 0 || hi < maxIdx;
  const pct = (i: number) => (maxIdx === 0 ? 0 : (i / maxIdx) * 100);

  const commit = useCallback(
    (nextLo: number, nextHi: number) => {
      if (nextLo <= 0 && nextHi >= maxIdx) onApply(undefined, undefined);
      else onApply(seasonBounds(asc[nextLo]).from, seasonBounds(asc[nextHi]).to);
    },
    [asc, maxIdx, onApply],
  );

  const onLoChange = (v: number) => {
    const next = Math.min(v, hi);
    setLo(next);
  };
  const onHiChange = (v: number) => {
    const next = Math.max(v, lo);
    setHi(next);
  };

  const onLoCommit = () => commit(lo, hi);
  const onHiCommit = () => commit(lo, hi);

  const jumpDecade = (decade: number) => {
    const [dLo, dHi] = seasonIndicesForDecade(asc, decade);
    setLo(dLo);
    setHi(dHi);
    commit(dLo, dHi);
  };

  const clear = () => {
    setLo(0);
    setHi(maxIdx);
    onApply(undefined, undefined);
  };

  if (asc.length === 0) return null;

  const seasonCount = hi - lo + 1;

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="text-[13px] text-ink-dim">
          <span className="text-ink-faint">From </span>
          <span className="font-medium text-ink">{asc[lo]}</span>
          <span className="mx-1.5 text-ink-faint/70">→</span>
          <span className="font-medium text-ink">{asc[hi]}</span>
        </p>
        <p className="stat-num text-[11px] text-ink-dim">
          {seasonCount} {seasonCount === 1 ? "season" : "seasons"}
        </p>
      </div>

      <div className={compact ? "space-y-2.5" : "space-y-3"}>
        <div className={`season-range relative mx-3 ${compact ? "h-8" : "h-9"}`}>
          {/* Visual track — same width and vertical center as the native thumbs */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 overflow-hidden rounded-full bg-line/25"
          >
            <div
              className="absolute inset-y-0 rounded-full bg-devil/50"
              style={{ left: `${pct(lo)}%`, width: `${pct(hi) - pct(lo)}%` }}
            />
            {markers.map(({ decade, index }) => (
              <div
                key={decade}
                className="absolute top-0 h-full w-px -translate-x-1/2 bg-line/50"
                style={{ left: `${pct(index)}%` }}
              />
            ))}
          </div>

          <input
            type="range"
            min={0}
            max={maxIdx}
            step={1}
            value={lo}
            aria-label="Era start season"
            onChange={(e) => onLoChange(Number(e.target.value))}
            onMouseUp={onLoCommit}
            onTouchEnd={onLoCommit}
            onKeyUp={onLoCommit}
            className="season-range__thumb season-range__thumb--lo pointer-events-auto absolute inset-0 z-[1]"
          />
          <input
            type="range"
            min={0}
            max={maxIdx}
            step={1}
            value={hi}
            aria-label="Era end season"
            onChange={(e) => onHiChange(Number(e.target.value))}
            onMouseUp={onHiCommit}
            onTouchEnd={onHiCommit}
            onKeyUp={onHiCommit}
            className="season-range__thumb season-range__thumb--hi pointer-events-auto absolute inset-0 z-[2]"
          />
        </div>

        {/* Decade jump targets — share the track's horizontal inset */}
        <div className={`relative mx-3 ${compact ? "h-4" : "h-5"}`}>
          {markers.map(({ decade, index }, i) => {
            if (!showDecadeLabel(decade, i, markers.length, compact)) return null;
            return (
              <button
                key={decade}
                type="button"
                onClick={() => jumpDecade(decade)}
                className="tap-target absolute top-0 -translate-x-1/2 text-[10px] font-medium text-ink-dim transition-colors hover:text-devil-bright focus-ring"
                style={{ left: `${pct(index)}%` }}
                title={`${decade}s`}
              >
                {compact ? decadeShortLabel(decade) : decade}
              </button>
            );
          })}
        </div>
      </div>

      {active && (
        <button
          type="button"
          onClick={clear}
          className="text-[11px] text-ink-dim underline-offset-2 transition-colors hover:text-ink-faint hover:underline focus-ring"
        >
          Clear era
        </button>
      )}
    </div>
  );
}
