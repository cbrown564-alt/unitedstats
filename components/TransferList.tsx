import Link from "next/link";
import { fmtDate, fmtEur, fmtMonthYear, feeLabel } from "@/lib/format";
import type { TransferRow } from "@/lib/queries";

/** Direction pill: an arrival reads green-in, a departure reads muted-out. */
function DirectionPill({ direction }: { direction: "in" | "out" }) {
  const isIn = direction === "in";
  return (
    <span
      className={`stat-num inline-flex h-5 shrink-0 items-center rounded px-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${
        isIn ? "bg-win/15 text-win" : "bg-ink-faint/15 text-ink-dim"
      }`}
    >
      {isIn ? "In" : "Out"}
    </span>
  );
}

/** Small badge for the non-permanent transfer kinds. */
function TypeBadge({ type }: { type: string }) {
  if (type === "permanent") return null;
  const label =
    type === "loan" ? "Loan" : type === "youth" ? "Academy" : type === "released" ? "Released" : "Retired";
  return (
    <span className="stat-num rounded bg-panel-2 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.1em] text-ink-faint">
      {label}
    </span>
  );
}

/** Best date label for the row's precision — full date, month, or year. */
function transferDate(t: TransferRow): string {
  if (!t.date) return "date unknown";
  if (t.date_precision === "day") return fmtDate(t.date);
  if (t.date_precision === "month") return fmtMonthYear(t.date);
  return t.date.slice(0, 4);
}

/**
 * A scannable list of transfers. On a player page the player is implicit, so the
 * row leads with the club moved from/to; in a cross-player list (recent business)
 * `showPlayer` puts the linked name first.
 */
export function TransferList({
  transfers,
  showPlayer = false,
}: {
  transfers: TransferRow[];
  showPlayer?: boolean;
}) {
  return (
    <ul className="divide-y divide-line/60 overflow-hidden rounded-xl border border-line bg-panel">
      {transfers.map((t) => {
        const fee = feeLabel(t.fee_kind, t.fee_gbp);
        const hasFee = t.fee_kind === "fee" && t.fee_gbp != null;
        const preposition = t.direction === "in" ? "from" : "to";
        return (
          <li key={t.id} className="flex items-center gap-3 px-3.5 py-2.5 sm:px-4">
            <DirectionPill direction={t.direction} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                {showPlayer &&
                  (t.player_id ? (
                    <Link
                      href={`/player/${t.player_id}`}
                      className="truncate text-sm font-medium text-ink hover:text-devil-bright"
                    >
                      {t.player_name}
                    </Link>
                  ) : (
                    <span className="truncate text-sm font-medium text-ink-dim">{t.player_name}</span>
                  ))}
                {!showPlayer && t.club && (
                  <span className="truncate text-sm">
                    <span className="text-ink-faint">{preposition} </span>
                    <span className="font-medium text-ink">{t.club}</span>
                  </span>
                )}
                {!showPlayer && !t.club && (
                  <span className="text-sm text-ink-faint">
                    {t.type === "youth" ? "Academy intake" : t.type === "retired" ? "Retired" : t.type === "released" ? "Released" : "—"}
                  </span>
                )}
                <TypeBadge type={t.type} />
              </div>
              <div className="stat-num mt-0.5 truncate text-[11px] text-ink-faint">
                {showPlayer && t.club ? (
                  <>
                    {preposition} <span className="text-ink-dim">{t.club}</span>
                    <span className="px-1">·</span>
                  </>
                ) : null}
                {transferDate(t)}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div
                className={`stat-num text-sm font-semibold tabular-nums ${
                  hasFee ? (t.direction === "in" ? "text-devil-bright" : "text-gold") : "text-ink-faint"
                }`}
              >
                {fee}
              </div>
              {t.market_value_eur != null && (
                <div className="stat-num text-[10px] leading-tight text-ink-faint" title="Transfermarkt market value at the time">
                  {fmtEur(t.market_value_eur)} val
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
