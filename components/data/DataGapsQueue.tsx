"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { gapTypeMeta, type DataGapRow } from "@/lib/dataGaps";
import { fmtNum } from "@/lib/format";

export function DataGapsQueue({
  gaps,
  gapCounts,
}: {
  gaps: DataGapRow[];
  gapCounts: { gap: string; count: number }[];
}) {
  const categories = useMemo(
    () =>
      gapCounts.map(({ gap, count }) => ({
        gap,
        count,
        ...gapTypeMeta(gap),
      })),
    [gapCounts],
  );

  const [activeGap, setActiveGap] = useState(categories[0]?.gap ?? "");
  const active = categories.find((c) => c.gap === activeGap) ?? categories[0];
  const visible = gaps.filter((g) => g.gap === active?.gap);

  if (categories.length === 0) {
    return <p className="text-sm text-ink-dim">No high-value gaps in the queue right now.</p>;
  }

  return (
    <div className="space-y-4">
      {categories.length === 1 ? (
        <div className="rounded-lg border border-line bg-panel px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">{active.label}</p>
          <p className="mt-1 text-sm text-ink-dim">{active.description}</p>
          <p className="mt-2 stat-num text-xs text-ink-faint">
            {fmtNum(active.count)} match{active.count === 1 ? "" : "es"} in this queue
          </p>
        </div>
      ) : (
        <>
          <div
            className="flex flex-wrap gap-2"
            role="tablist"
            aria-label="Gap categories"
          >
            {categories.map((c) => {
              const selected = c.gap === active?.gap;
              return (
                <button
                  key={c.gap}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActiveGap(c.gap)}
                  className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors focus-ring ${
                    selected
                      ? "border-devil/60 bg-panel text-ink"
                      : "border-line bg-panel/40 text-ink-dim hover:border-line/80 hover:text-ink"
                  }`}
                >
                  <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-gold">{c.label}</span>
                  <span className="stat-num mt-0.5 block text-xs text-ink-faint">{fmtNum(c.count)}</span>
                </button>
              );
            })}
          </div>
          {active && (
            <p className="text-sm text-ink-dim" role="tabpanel">
              {active.description}
            </p>
          )}
        </>
      )}

      <div className="overflow-hidden rounded-lg border border-line">
        <ul className="divide-y divide-line">
          {visible.map((g) => (
            <li key={g.id} className="bg-panel px-4 py-3 text-sm">
              <div className="grid gap-2 sm:grid-cols-[7rem_1fr_auto] sm:items-center">
                <Link href={`/match/${g.id}`} className="stat-num text-ink-dim hover:text-devil-bright">
                  {g.date}
                </Link>
                <Link href={`/match/${g.id}`} className="min-w-0 font-medium hover:text-devil-bright">
                  {g.opponent_name}{" "}
                  <span className="stat-num text-devil-bright">
                    {g.gf}-{g.ga}
                  </span>
                  <span className="mt-0.5 block text-xs font-normal text-ink-faint">{g.competition_name}</span>
                </Link>
                <Link
                  href={g.contributeHref}
                  className="text-xs font-semibold text-devil-bright hover:underline sm:text-right"
                >
                  Contribute →
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {active && active.count > visible.length && (
        <p className="text-xs text-ink-faint">
          Showing {fmtNum(visible.length)} of {fmtNum(active.count)} — the queue prioritises recent post-war work first.
        </p>
      )}
    </div>
  );
}
