"use client";

import { useCallback, useMemo, useState } from "react";
import {
  decadeMarkers,
  seasonBounds,
  seasonIndicesForDecade,
  seasonIndicesFromParams,
  seasonsAscending,
} from "@/lib/seasonBounds";

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
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-faint">Era</p>
          <p className="stat-num mt-0.5 text-sm font-medium text-ink">
            {asc[lo]}
            <span className="mx-1.5 text-ink-faint">→</span>
            {asc[hi]}
          </p>
        </div>
        <p className="stat-num text-xs text-ink-faint">
          {seasonCount} {seasonCount === 1 ? "season" : "seasons"}
        </p>
      </div>

      <div className={`season-range relative ${compact ? "px-0.5 pt-1" : "px-1 pt-2"}`}>
        {/* Track + fill */}
        <div className="relative mx-2 h-1.5 rounded-full bg-panel-2">
          <div
            className="absolute inset-y-0 rounded-full bg-devil/55"
            style={{ left: `${pct(lo)}%`, width: `${pct(hi) - pct(lo)}%` }}
          />
        </div>

        {/* Decade affordances */}
        <div className="relative mx-2 mt-2 h-5">
          {markers.map(({ decade, index }) => (
            <button
              key={decade}
              type="button"
              onClick={() => jumpDecade(decade)}
              className="tap-target absolute top-0 -translate-x-1/2 text-[9px] font-medium text-ink-faint transition-colors hover:text-devil-bright focus-ring"
              style={{ left: `${pct(index)}%` }}
              title={`${decade}s`}
            >
              {decade}
            </button>
          ))}
        </div>

        {/* Dual thumbs — transparent tracks, styled in globals via .season-range */}
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
          className="season-range__thumb season-range__thumb--lo pointer-events-auto absolute left-0 right-0 top-0 mx-0 w-full"
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
          className="season-range__thumb season-range__thumb--hi pointer-events-auto absolute left-0 right-0 top-0 mx-0 w-full"
        />
      </div>

      {active && (
        <button
          type="button"
          onClick={clear}
          className="text-xs text-ink-faint underline-offset-2 transition-colors hover:text-ink hover:underline focus-ring"
        >
          Clear era
        </button>
      )}
    </div>
  );
}
