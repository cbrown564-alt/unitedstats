import { fmtMonthYear } from "./format";
import type { TransferRow } from "./queries";

/** Curated one-liners for record deals — the hybrid override when we have a line. */
const CURATED: Record<string, string> = {
  "2016-08-09-paul-pogba-in":
    "The world-record return — sold for £30m in 2012, bought back for triple four years later.",
  "2009-07-01-cristiano-ronaldo-out":
    "The record sale that bankrolled a generation — £80m to Real Madrid after six seasons at Old Trafford.",
};

/** One editorial line for a featured deal: curated when we have it, otherwise from transfer fields. */
export function transferEditorialLine(t: TransferRow): string {
  const curated = CURATED[t.id];
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
