import type { TransferRow } from "@/lib/queries";
import { fmtDate, fmtFee, fmtMonthYear, feeLabel } from "@/lib/format";

function transferDate(t: TransferRow): string {
  if (!t.date) return "—";
  if (t.date_precision === "day") return fmtDate(t.date);
  if (t.date_precision === "month") return fmtMonthYear(t.date);
  return t.date.slice(0, 4);
}

function chronological(transfers: TransferRow[]): TransferRow[] {
  return [...transfers].sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return a.date.localeCompare(b.date);
  });
}

function feeAmount(t: TransferRow): number | null {
  return t.fee_kind === "fee" && t.fee_gbp != null ? Math.abs(t.fee_gbp) : null;
}

function feeIntensity(t: TransferRow, maxFee: number): number {
  const amount = feeAmount(t);
  if (amount == null || maxFee <= 0) return 0;
  return amount / maxFee;
}

function circleFeeLabel(t: TransferRow): string {
  const amount = feeAmount(t);
  if (amount != null) {
    const label = fmtFee(amount);
    return label.length <= 6 ? label : label.replace(/\.0(?=[mkb])/i, "");
  }
  if (t.fee_kind === "free") return "Free";
  if (t.fee_kind === "undisclosed") return "?";
  return "—";
}

function typeNote(t: TransferRow): string | null {
  if (t.type === "permanent") return null;
  if (t.type === "loan") return "Loan";
  if (t.type === "youth") return "Academy";
  if (t.type === "released") return "Released";
  if (t.type === "retired") return "Retired";
  return t.type;
}

function TransferCallout({
  t,
  align,
}: {
  t: TransferRow;
  align: "left" | "right";
}) {
  const isIn = t.direction === "in";
  const note = typeNote(t);
  const club = t.club ?? (t.type === "youth" ? "Academy" : t.type === "retired" ? "Retired" : t.type === "released" ? "Released" : "—");

  return (
    <div
      className={`max-w-[11rem] text-[11px] leading-snug sm:max-w-[15.5rem] ${
        align === "right" ? "text-left" : "text-right"
      }`}
    >
      <span className={`block truncate font-medium ${isIn ? "text-ink-dim" : "text-ink-faint"}`}>
        {isIn ? "from" : "to"} {club}
      </span>
      <span className="stat-num mt-0.5 block truncate text-[10px] text-ink-faint">
        {transferDate(t)}
        {note && <span className="text-ink-dim"> · {note}</span>}
      </span>
    </div>
  );
}

function FeeCircle({ t, intensity }: { t: TransferRow; intensity: number }) {
  const isIn = t.direction === "in";
  const label = circleFeeLabel(t);
  const hasFee = intensity > 0;
  const size =
    intensity >= 0.66 ? "h-[3.25rem] w-[3.25rem] text-[11px]"
    : intensity >= 0.33 ? "h-[2.75rem] w-[2.75rem] text-[10px]"
    : hasFee ? "h-10 w-10 text-[10px]"
    : "h-7 w-7 text-[9px]";
  const tone = isIn ? "var(--color-devil)" : "var(--color-gold)";
  const mix = hasFee ? Math.round(14 + intensity * 38) : 0;
  const title = `${isIn ? "Signed" : "Departed"} · ${feeLabel(t.fee_kind, t.fee_gbp)} · ${transferDate(t)}`;

  return (
    <span
      className={`relative z-10 flex shrink-0 items-center justify-center rounded-full font-semibold tabular-nums leading-none shadow-[0_0_0_2px_var(--color-pitch)] ring-1 ${size} ${
        hasFee
          ? isIn
            ? "text-devil-bright ring-devil/35"
            : "text-gold ring-gold/35"
          : "bg-ink-faint/10 text-ink-faint ring-line/70"
      }`}
      style={
        hasFee
          ? { background: `color-mix(in oklab, var(--color-panel-2), ${tone} ${mix}%)` }
          : undefined
      }
      title={title}
    >
      {label}
    </span>
  );
}

/**
 * A player's transfer record as a vertical spine — signings branch left,
 * departures branch right, fee in a value-scaled circle on the axis. Same
 * spatial grammar as {@link EuropeFinalsTimeline}.
 */
function TransferFeeTimeline({
  transfers,
  careerYears,
}: {
  transfers: TransferRow[];
  careerYears?: string | null;
}) {
  const sorted = chronological(transfers);
  const maxFee = Math.max(0, ...sorted.map((t) => feeAmount(t) ?? 0));
  const n = sorted.length;

  return (
    <figure className="m-0 rounded-xl border border-line bg-panel p-4 sm:p-5">
      <ol className="relative m-0 list-none p-0">
        {sorted.map((t, i) => {
          const isIn = t.direction === "in";
          const isFirst = i === 0;
          const isLast = i === n - 1;
          const intensity = feeIntensity(t, maxFee);

          return (
            <li
              key={t.id}
              className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-2 sm:gap-x-4"
              style={{ minHeight: isLast ? undefined : "4.25rem" }}
            >
              <div className="flex items-center justify-end gap-2">
                {isIn && (
                  <>
                    <TransferCallout t={t} align="left" />
                    <span className="hidden h-px w-4 shrink-0 bg-line/50 sm:block" aria-hidden />
                  </>
                )}
              </div>

              <div className="flex flex-col items-center self-stretch py-0.5">
                <span
                  className={`w-px flex-1 min-h-2 ${isFirst ? "bg-transparent" : "bg-line/55"}`}
                  aria-hidden
                />
                <FeeCircle t={t} intensity={intensity} />
                <span
                  className={`w-px flex-1 min-h-2 ${isLast ? "bg-transparent" : "bg-line/55"}`}
                  aria-hidden
                />
              </div>

              <div className="flex items-center gap-2">
                {!isIn && (
                  <>
                    <span className="hidden h-px w-4 shrink-0 bg-line/50 sm:block" aria-hidden />
                    <TransferCallout t={t} align="right" />
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <figcaption className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line/50 pt-3 text-[11px] text-ink-faint">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-devil/25 ring-1 ring-devil/40" aria-hidden />
          Signed
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-gold/25 ring-1 ring-gold/40" aria-hidden />
          Departed
        </span>
        <span className="text-ink-dim">
          Signings to the left, sales to the right · circle size and colour reflect the fee
          {careerYears ? ` · United ${careerYears}` : ""}
        </span>
      </figcaption>
    </figure>
  );
}

export function PlayerTransferRecord({
  transfers,
  careerYears,
}: {
  transfers: TransferRow[];
  careerYears?: string | null;
}) {
  if (transfers.length === 0) return null;
  return <TransferFeeTimeline transfers={transfers} careerYears={careerYears} />;
}
