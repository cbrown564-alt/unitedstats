import Link from "next/link";
import { PlayerPortrait } from "@/components/PlayerPortrait";
import { fmtFee, fmtNum } from "@/lib/format";
import type { NetSpendBucket } from "@/lib/queries";

/**
 * Spend-vs-receipts bars for a set of buckets (managers or decades). Each row
 * pairs a red "spent" bar over a gold "received" bar on one shared scale, so bar
 * length is comparable down the column and across the two; the net figure on the
 * right is the story. Known fees only — see the page's coverage note.
 */
export function SpendBars({
  buckets,
  hrefFor,
  portraitFor,
}: {
  buckets: NetSpendBucket[];
  /** Optional link target per bucket (managers link to their page; decades don't). */
  hrefFor?: (b: NetSpendBucket) => string;
  /** Optional portrait per bucket (manager avatars on the transfers page). */
  portraitFor?: (b: NetSpendBucket) => { name: string; src?: string | null } | null;
}) {
  const scale = Math.max(1, ...buckets.map((b) => Math.max(b.spend, b.received)));
  const width = (value: number) => `${Math.max(value > 0 ? 1.5 : 0, (value / scale) * 100)}%`;

  return (
    <div className="divide-y divide-line/60 overflow-hidden rounded-xl border border-line bg-panel">
      {buckets.map((b) => {
        const href = hrefFor?.(b);
        const portrait = portraitFor?.(b);
        const label = href ? (
          <Link href={href} className="font-medium text-ink hover:text-devil-bright">
            {b.bucket}
          </Link>
        ) : (
          <span className="font-medium text-ink">{b.bucket}</span>
        );
        return (
          <div
            key={b.bucket_id}
            className="grid grid-cols-[auto_minmax(0,8.5rem)_1fr_auto] items-center gap-3 px-3.5 py-2.5 sm:grid-cols-[auto_minmax(0,11rem)_1fr_auto] sm:px-4"
          >
            {portrait ? (
              <PlayerPortrait name={portrait.name} src={portrait.src} size="xs" />
            ) : (
              <span className="hidden w-7 sm:block" aria-hidden />
            )}
            <div className="min-w-0">
              <div className="truncate text-sm leading-tight">{label}</div>
              <div className="stat-num mt-0.5 text-[11px] text-ink-faint">
                {fmtNum(b.signings)} in · {fmtNum(b.departures)} out
              </div>
            </div>

            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <div className="h-2.5 flex-1 overflow-hidden rounded-sm bg-pitch">
                  <div className="h-full rounded-sm bg-devil" style={{ width: width(b.spend) }} />
                </div>
                <span className="stat-num w-14 shrink-0 text-right text-[11px] text-ink-dim">{fmtFee(b.spend)}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2.5 flex-1 overflow-hidden rounded-sm bg-pitch">
                  <div className="h-full rounded-sm bg-gold" style={{ width: width(b.received) }} />
                </div>
                <span className="stat-num w-14 shrink-0 text-right text-[11px] text-ink-faint">{fmtFee(b.received)}</span>
              </div>
            </div>

            <div className="shrink-0 text-right">
              <div className={`stat-num text-sm font-semibold tabular-nums ${b.net >= 0 ? "text-devil-bright" : "text-win"}`}>
                {b.net >= 0 ? fmtFee(b.net) : `+${fmtFee(-b.net)}`}
              </div>
              <div className="text-[10px] uppercase tracking-[0.12em] text-ink-faint">{b.net >= 0 ? "net spend" : "net gain"}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
