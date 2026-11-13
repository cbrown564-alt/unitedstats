import { liveList } from "./editorial";
import { fmtMonthYear } from "./format";
import type { TransferRow } from "./queries";

/** Curated one-liners for record deals — the hybrid override when we have a line. */
/** Edited in EmDash (`transfer_notes`). */
export const TRANSFER_NOTES: readonly { transferId: string; line: string }[] = liveList("transfer_notes", (e) => ({
  transferId: e.data.transfer_id,
  line: e.data.line,
}));

/** One editorial line for a featured deal: curated when we have it, otherwise from transfer fields. */
export function transferEditorialLine(t: TransferRow): string {
  const curated = TRANSFER_NOTES.find((n) => n.transferId === t.id)?.line;
  if (curated) return curated;

  const when =
    t.date == null
      ? "—"
      : t.date_precision === "day"
        ? fmtMonthYear(t.date)
        : t.date.slice(0, 4);
  const club = t.club ?? "an unknown club";

  if (t.direction === "in") {
    return t.market_value_eur != null
      ? `Signed from ${club} in ${when} — market value €${Math.round(t.market_value_eur / 1e6)}m at the time.`
      : `Signed from ${club} in ${when}.`;
  }

  return t.market_value_eur != null
    ? `Sold to ${club} in ${when} — valued at €${Math.round(t.market_value_eur / 1e6)}m on departure.`
    : `Sold to ${club} in ${when}.`;
}
