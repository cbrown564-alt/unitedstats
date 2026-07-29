import type { TransferRow } from "./queries";

/**
 * The authored entry points into the transfer record.
 *
 * These live here rather than inside `TransfersLedger` so the ledger stays a
 * generic renderer: the season we choose to feature is an editorial decision,
 * and it is asserted against the canonical data by `tests/transfer-history.test.ts`
 * rather than left to break silently. The hub link, the `ItemList` entry in
 * `lib/structuredData.ts`, and the ledger cutoff all read from here, so the
 * page can never advertise a window it does not actually render.
 */

/** Seasons at or after this are rendered as their own opened-out row in the archive. */
export const TRANSFER_LEDGER_SINCE = 1980;

export interface FeaturedTransferWindow {
  /** Canonical season key — also the anchor target. */
  season: string;
  /** Display form of the season, en dash. */
  label: string;
  title: string;
  blurb: string;
  cta: string;
  /** Name used for this window in structured data. */
  structuredDataName: string;
}

export const FEATURED_TRANSFER_WINDOW: FeaturedTransferWindow = {
  season: "1998-99",
  label: "1998–99",
  title: "Yorke, Stam, Blomqvist — and the window before the Treble",
  blurb: "Follow three arrivals from the ledger into the season that ended in Barcelona.",
  cta: "Open the Treble window",
  structuredDataName: "The 1998–99 Treble window",
};

/** The archive's per-season anchor. One helper so links and targets cannot drift. */
export function seasonAnchorId(season: string): string {
  return `txseason-${season}`;
}

/**
 * Whether the featured window will actually render an anchor target.
 *
 * `TransferArchive` only gives a season its own `id` when the season sits at or
 * after the cutoff — earlier seasons are folded into the collapsed "Before {since}"
 * summary, which has no per-season anchor. So a featured season that predates the
 * cutoff, or that no longer appears in canonical data, produces a dead link and a
 * structured-data entry for something the page never shows.
 */
export function featuredWindowResolves(
  transfers: Pick<TransferRow, "season">[],
  featured: FeaturedTransferWindow = FEATURED_TRANSFER_WINDOW,
  since: number = TRANSFER_LEDGER_SINCE,
): boolean {
  const startYear = Number.parseInt(featured.season.slice(0, 4), 10);
  if (!Number.isFinite(startYear) || startYear < since) return false;
  return transfers.some((transfer) => transfer.season === featured.season);
}
