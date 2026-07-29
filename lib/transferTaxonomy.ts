import { transferSeason, type InflationIndices } from "./inflation";
import type { TransferRow } from "./queries";

/**
 * One owner for the vocabulary every transfer surface shares: what counts as a
 * market move, how a fee is placed against its season, and what the resulting
 * cost band is called. These were previously reimplemented per surface, which
 * let the same deal carry three different band labels and let the squad-build
 * view silently disagree about which types are market business.
 */

/** Types that are not a transfer between clubs. */
const OFF_MARKET_TYPES = new Set(["youth", "released", "retired"]);

/** Types that end a spell without a counterparty club. */
const EXIT_ONLY_TYPES = new Set(["released", "retired"]);

/** Permanent and loan business with a counterparty club. */
export function isMarketTransfer(t: Pick<TransferRow, "type">): boolean {
  return !OFF_MARKET_TYPES.has(t.type);
}

/**
 * Squad-build deliberately keeps academy promotions: bringing a youth player
 * into the first team is squad building even though no fee or club is involved.
 * Releases and retirements still drop out — they have no counterparty thread.
 */
export function isSquadBuildMove(t: Pick<TransferRow, "type">): boolean {
  return !EXIT_ONLY_TYPES.has(t.type);
}

/** Canonical season key rendered for a reader — en dash, never a hyphen. */
export function seasonDashLabel(season: string): string {
  return season.replace("-", "–");
}

export type TransferLaneKind = "permanent" | "loan" | "academy" | "released" | "retired";

export function transferLaneKind(row: Pick<TransferRow, "type">): TransferLaneKind {
  if (row.type === "youth") return "academy";
  if (row.type === "released") return "released";
  if (row.type === "retired") return "retired";
  if (row.type === "loan") return "loan";
  return "permanent";
}

const MOVE_LABELS: Record<TransferLaneKind, { in: string; out: string }> = {
  permanent: { in: "Signing", out: "Sale" },
  loan: { in: "Loan in", out: "Loan out" },
  academy: { in: "Academy promotion", out: "Academy departure" },
  released: { in: "Released", out: "Release" },
  retired: { in: "Retired", out: "Retirement" },
};

/**
 * What a single move is called. Direction alone is not enough: a loan out is not
 * a sale, and an academy promotion is not a signing, so any surface that labels
 * a deal has to read the type as well.
 */
export function transferMoveLabel(row: Pick<TransferRow, "type">, direction: "in" | "out"): string {
  return MOVE_LABELS[transferLaneKind(row)][direction];
}

/** A published fee we can put a number on — not free, undisclosed, or unknown. */
export function isKnownFee(t: Pick<TransferRow, "fee_kind" | "fee_gbp">): boolean {
  return t.fee_kind === "fee" && t.fee_gbp != null;
}

/**
 * A fee as a multiple of the mean Premier League fee in its season. A0 closed
 * percentile ranking for want of corpus coverage, so the mean multiple is the
 * cross-era axis every surface uses. Returns null whenever the fee or the
 * season benchmark is missing — never a fabricated zero.
 */
export function feePlMeanMultiple(
  feeGbp: number | null,
  feeKind: string,
  date: string | null,
  season: string | null,
  indices: InflationIndices,
): number | null {
  if (feeKind !== "fee" || feeGbp == null) return null;
  const resolvedSeason = transferSeason(date, season);
  const benchmark = resolvedSeason ? indices.football.seasons[resolvedSeason] : undefined;
  if (!benchmark?.meanGbp) return null;
  const multiple = feeGbp / benchmark.meanGbp;
  return Number.isFinite(multiple) ? multiple : null;
}

export type CostBandId = "low" | "lower-middle" | "upper-middle" | "high" | "extreme";

/**
 * Thresholds are fixed multiples of the season mean, declared here once and
 * chosen before any outcome was inspected. They are a presentation band, not
 * the analytical axis — A2 must derive its own cut points from the observed
 * benchmark distribution rather than reusing these round numbers.
 */
const COST_BAND_TABLE: Array<{ id: CostBandId; min: number; label: string; short: string }> = [
  { id: "low", min: 0, label: "Below typical PL fee", short: "Low" },
  { id: "lower-middle", min: 0.5, label: "Lower-middle PL fee", short: "Lower-middle" },
  { id: "upper-middle", min: 1, label: "Upper-middle PL fee", short: "Upper-middle" },
  { id: "high", min: 2, label: "High PL fee", short: "High" },
  { id: "extreme", min: 4, label: "Record-level PL fee", short: "Record-level" },
];

export function costBandForMeanMultiple(multiple: number | null | undefined): CostBandId | null {
  if (multiple == null || !Number.isFinite(multiple)) return null;
  let match: CostBandId = "low";
  for (const band of COST_BAND_TABLE) {
    if (multiple >= band.min) match = band.id;
  }
  return match;
}

/** Sentence-register label — use where the band stands on its own. */
export function costBandLabel(band: CostBandId): string {
  return COST_BAND_TABLE.find((entry) => entry.id === band)!.label;
}

/** Aggregation bucket that keeps unknown-fee deals visible instead of dropping them. */
export type CostBucketId = CostBandId | "unknown";

export const COST_BUCKET_ORDER: Array<{ id: CostBucketId; label: string }> = [
  ...COST_BAND_TABLE.map((band) => ({ id: band.id as CostBucketId, label: band.short })),
  { id: "unknown", label: "Unknown fee" },
];

export function costBucketForMeanMultiple(multiple: number | null | undefined): CostBucketId {
  return costBandForMeanMultiple(multiple) ?? "unknown";
}
