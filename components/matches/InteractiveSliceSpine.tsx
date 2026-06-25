"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ResultSpine } from "@/components/charts/ResultSpine";
import { fmtNum } from "@/lib/format";
import { queryString } from "@/lib/url";
import type { SequenceMatch } from "@/lib/trails";
import { WdlBarFilter } from "@/components/matches/WdlBarFilter";

type Decade = { decade: string; from: number; to: number; n: number };

function decadeCenters(matches: SequenceMatch[], decades: Decade[]) {
  const n = matches.length;
  if (n === 0) return [];

  return decades.map((dec) => {
    let first = -1;
    let last = -1;
    for (let i = 0; i < n; i++) {
      const year = parseInt(matches[i].date.slice(0, 4), 10);
      if (year >= dec.from && year <= dec.to) {
        if (first < 0) first = i;
        last = i;
      }
    }
    if (first < 0) return { ...dec, centerPct: 0, hidden: true };
    const center = (first + last) / 2;
    return { ...dec, centerPct: ((center + 0.5) / n) * 100, hidden: false };
  }).filter((d) => !d.hidden);
}

/**
 * ResultSpine with a clickable W/D/L header and decade axis — era jumps and
 * result pins live on the shape object instead of separate control bands.
 */
export function InteractiveSliceSpine({
  matches,
  decades,
  w,
  d,
  l,
  showRecord,
  activeResult,
  activeFrom,
  activeTo,
  params,
}: {
  matches: SequenceMatch[];
  decades: Decade[];
  w: number;
  d: number;
  l: number;
  showRecord: boolean;
  activeResult?: string;
  activeFrom?: string;
  activeTo?: string;
  params: Record<string, string | undefined>;
}) {
  const positioned = useMemo(() => decadeCenters(matches, decades), [matches, decades]);

  const qs = (overrides: Record<string, string | undefined>) =>
    queryString({ ...params, ...overrides });

  const decadeActive = (from: number, to: number) =>
    activeFrom === String(from) && activeTo === String(to);

  return (
    <div className="mt-4 border-t border-line/70 pt-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
        Result by match over time
      </p>

      {showRecord ? (
        <div className="mb-3">
          <WdlBarFilter params={params} w={w} d={d} l={l} activeResult={activeResult} />
        </div>
      ) : null}

      <ResultSpine matches={matches} showRecord={false} />

      {positioned.length > 1 && (
        <div className="relative mt-2 h-9">
          {positioned.map((dec, i) => {
            const active = decadeActive(dec.from, dec.to);
            const first = i === 0;
            const last = i === positioned.length - 1;
            return (
              <Link
                key={dec.decade}
                href={`/matches${qs({ from: String(dec.from), to: String(dec.to), page: undefined })}`}
                aria-current={active ? "true" : undefined}
                className={`tap-target absolute top-0 flex min-w-[2.75rem] flex-col items-center rounded-md border px-1.5 py-0.5 text-center transition-colors focus-ring ${
                  active
                    ? "border-devil/60 bg-devil/15 text-devil-bright"
                    : "border-line/80 bg-panel text-ink-dim hover:border-devil/50 hover:bg-panel-2 hover:text-ink"
                } ${first ? "left-0 -translate-x-0" : last ? "right-0 translate-x-0" : "-translate-x-1/2"}`}
                style={first || last ? undefined : { left: `${dec.centerPct}%` }}
                title={`${dec.decade}: ${fmtNum(dec.n)} matches`}
              >
                <span className="stat-num text-[10px] font-semibold leading-tight">{dec.decade}</span>
                <span className="stat-num text-[9px] leading-tight text-ink-faint">{fmtNum(dec.n)}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
