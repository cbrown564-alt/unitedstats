"use client";

import { ResultSpine } from "@/components/charts/ResultSpine";
import type { SequenceMatch } from "@/lib/trails";
import { WdlBarFilter } from "@/components/matches/WdlBarFilter";

/**
 * ResultSpine with a clickable W/D/L header — result pins live on the shape
 * object instead of separate control bands.
 */
export function InteractiveSliceSpine({
  matches,
  w,
  d,
  l,
  showRecord,
  activeResult,
  params,
}: {
  matches: SequenceMatch[];
  w: number;
  d: number;
  l: number;
  showRecord: boolean;
  activeResult?: string;
  params: Record<string, string | undefined>;
}) {
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
    </div>
  );
}
