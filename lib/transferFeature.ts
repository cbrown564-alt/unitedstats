import type { TransferRow } from "./queries";
import { seasonDashLabel } from "./transferTaxonomy";

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

/**
 * A window page proves that the season grammar survives a particular data shape.
 * Rec 2 asks for three deliberately different cases before the route spreads
 * across every season, so `/transfers/[season]` generates for these and nothing
 * else: a season with one recorded deal has no contextual job to do, and a
 * thousand thin windows is exactly the SEO failure the plan rules out.
 */
export interface TransferWindowExemplar {
  season: string;
  label: string;
  /** Why this window is one of the proving cases. */
  frame: string;
  title: string;
  blurb: string;
}

const AUTHORED_WINDOW_EXEMPLARS: readonly TransferWindowExemplar[] = [
  {
    season: FEATURED_TRANSFER_WINDOW.season,
    label: FEATURED_TRANSFER_WINDOW.label,
    frame: "A coherent squad addition",
    title: FEATURED_TRANSFER_WINDOW.title,
    blurb:
      "Permanent arrivals into a settled side, and the campaign that followed them — the window where the record is at its most complete.",
  },
  {
    season: "2013-14",
    label: "2013–14",
    frame: "A managerial transition",
    title: "Fellaini, Mata, and the first window after Ferguson",
    blurb:
      "The first window of a new manager's reign, followed by the hardest post-title campaign in the Premier League record.",
  },
] as const;

/** The active window as its own exemplar: confirmed business, campaign unwritten. */
function liveWindowExemplar(season: string): TransferWindowExemplar {
  const label = seasonDashLabel(season);
  return {
    season,
    label,
    frame: "An open window",
    title: `The ${label} window as it stands`,
    blurb:
      "Confirmed business only, with the season it precedes still unplayed — the right-censored case the grammar has to survive.",
  };
}

/**
 * Exemplars that canonical data actually supports, newest first. An authored
 * season that no longer appears in the record drops out rather than generating
 * an empty page.
 */
export function transferWindowExemplars(
  transfers: Pick<TransferRow, "season">[],
  authored: readonly TransferWindowExemplar[] = AUTHORED_WINDOW_EXEMPLARS,
): TransferWindowExemplar[] {
  const seasons = new Set(
    transfers.map((transfer) => transfer.season).filter((season): season is string => !!season),
  );
  const exemplars = authored.filter((exemplar) => seasons.has(exemplar.season));
  const latest = [...seasons].sort().at(-1);
  if (latest && !exemplars.some((exemplar) => exemplar.season === latest)) {
    exemplars.push(liveWindowExemplar(latest));
  }
  return exemplars.sort((a, b) => b.season.localeCompare(a.season));
}

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
