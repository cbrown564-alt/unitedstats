"use client";

import Link from "next/link";
import { resultLabel } from "@/lib/format";
import { queryString } from "@/lib/url";

/**
 * Stacked W/D/L bar whose segments link into result filters. Clicking the active
 * segment clears the pin — same toggle behaviour as the Result pill rail.
 */
export function WdlBarFilter({
  params,
  w,
  d,
  l,
  activeResult,
}: {
  params: Record<string, string | undefined>;
  w: number;
  d: number;
  l: number;
  activeResult?: string;
}) {
  const total = w + d + l || 1;
  const wPct = (100 * w) / total;
  const dPct = (100 * d) / total;
  const lPct = (100 * l) / total;

  const hrefFor = (result: "W" | "D" | "L") => {
    const next = activeResult === result ? undefined : result;
    return `/matches${queryString({ ...params, result: next, page: undefined })}`;
  };

  const segment = (result: "W" | "D" | "L", pct: number, count: number, color: string, text: string) => {
    if (pct <= 0) return null;
    const active = activeResult === result;
    const href = hrefFor(result);
    return (
      <Link
        key={result}
        href={href}
        aria-current={active ? "true" : undefined}
        title={`Filter ${resultLabel(result)}${active ? " (click to clear)" : ""}`}
        className={`relative h-full overflow-hidden transition-opacity focus-ring ${color} ${active ? "ring-2 ring-inset ring-ink/40" : "hover:opacity-90"}`}
        style={{ width: `${pct}%` }}
      >
        <span
          className={`absolute inset-0 flex items-center justify-center gap-0.5 text-[10px] font-semibold leading-none tabular-nums ${text}`}
        >
          {count}
          <span className="text-[9px] font-bold opacity-75">{result}</span>
        </span>
      </Link>
    );
  };

  return (
    <div
      className="relative h-4 w-full overflow-hidden rounded-[3px] bg-panel-2"
      role="group"
      aria-label="Filter by result — wins, draws, or losses"
    >
      <div className="absolute inset-0 flex gap-px">
        {segment("W", wPct, w, "bg-win", "text-pitch/85")}
        {segment("D", dPct, d, "bg-draw/60", "text-pitch/85")}
        {segment("L", lPct, l, "bg-loss", "text-ink")}
      </div>
    </div>
  );
}
