import { adjustFeeGbp, type InflationIndices, type MoneyMode } from "./inflation";
import type { NetSpendBucket, SpendYear, TransferRow, TransferTotals } from "./queries";

export interface TransferRecordSummary {
  total: number;
  knownFees: number;
  knownFeePercent: number;
  firstYear: number;
  lastYear: number;
}

export interface TransferSeasonSummary {
  season: string;
  arrivals: number;
  departures: number;
  knownFees: number;
  spend: number;
  received: number;
  lastVerifiedDate: string | null;
}

function effectiveFee(
  t: Pick<TransferRow, "fee_gbp" | "fee_kind" | "date" | "season">,
  mode: MoneyMode,
  indices: InflationIndices,
): number | null {
  return adjustFeeGbp(t.fee_gbp, t.fee_kind, t.date, t.season, mode, indices);
}

function isFeeRow(t: Pick<TransferRow, "fee_kind" | "fee_gbp">): boolean {
  return t.fee_kind === "fee" && t.fee_gbp != null;
}

export function transferRecordSummary(transfers: TransferRow[]): TransferRecordSummary {
  const years = transfers
    .map((transfer) => Number.parseInt((transfer.date ?? transfer.season ?? "").slice(0, 4), 10))
    .filter(Number.isFinite);
  const knownFees = transfers.filter(isFeeRow).length;
  return {
    total: transfers.length,
    knownFees,
    knownFeePercent: transfers.length === 0 ? 0 : Math.round((knownFees / transfers.length) * 100),
    firstYear: years.length > 0 ? Math.min(...years) : 0,
    lastYear: years.length > 0 ? Math.max(...years) : 0,
  };
}

export function latestTransferSeasonSummary(transfers: TransferRow[]): TransferSeasonSummary | null {
  const season = transfers.reduce<string | null>((latest, transfer) => {
    if (!transfer.season) return latest;
    return latest == null || transfer.season > latest ? transfer.season : latest;
  }, null);
  if (!season) return null;

  const rows = transfers.filter((transfer) => transfer.season === season);
  return {
    season,
    arrivals: rows.filter((transfer) => transfer.direction === "in").length,
    departures: rows.filter((transfer) => transfer.direction === "out").length,
    knownFees: rows.filter(isFeeRow).length,
    spend: rows
      .filter((transfer) => transfer.direction === "in" && isFeeRow(transfer))
      .reduce((sum, transfer) => sum + transfer.fee_gbp!, 0),
    received: rows
      .filter((transfer) => transfer.direction === "out" && isFeeRow(transfer))
      .reduce((sum, transfer) => sum + transfer.fee_gbp!, 0),
    lastVerifiedDate: rows.reduce<string | null>(
      (latest, transfer) => (!transfer.date || (latest && transfer.date <= latest) ? latest : transfer.date),
      null,
    ),
  };
}

export function transferTotalsForMode(
  transfers: TransferRow[],
  mode: MoneyMode,
  indices: InflationIndices,
): TransferTotals {
  let gross_spend = 0;
  let gross_received = 0;
  let spend_rows = 0;
  let received_rows = 0;
  let signings = 0;
  let departures = 0;
  let free_in = 0;
  let youth = 0;

  for (const t of transfers) {
    if (t.direction === "in") signings++;
    else departures++;
    if (t.direction === "in" && t.fee_kind === "free") free_in++;
    if (t.type === "youth") youth++;
    if (!isFeeRow(t)) continue;
    const fee = effectiveFee(t, mode, indices)!;
    if (t.direction === "in") {
      gross_spend += fee;
      spend_rows++;
    } else {
      gross_received += fee;
      received_rows++;
    }
  }

  return {
    signings,
    departures,
    free_in,
    youth,
    gross_spend,
    gross_received,
    spend_rows,
    received_rows,
  };
}

export function spendTideForMode(
  transfers: TransferRow[],
  mode: MoneyMode,
  indices: InflationIndices,
): SpendYear[] {
  const byYear = new Map<number, SpendYear>();

  for (const t of transfers) {
    if (!t.date) continue;
    const year = Number.parseInt(t.date.slice(0, 4), 10);
    const row = byYear.get(year) ?? {
      year,
      spend: 0,
      received: 0,
      signings: 0,
      departures: 0,
    };
    if (t.direction === "in") row.signings++;
    else row.departures++;
    if (isFeeRow(t)) {
      const fee = effectiveFee(t, mode, indices)!;
      if (t.direction === "in") row.spend += fee;
      else row.received += fee;
    }
    byYear.set(year, row);
  }

  return [...byYear.values()].sort((a, b) => a.year - b.year);
}

export function topTransfersForMode(
  transfers: TransferRow[],
  direction: "in" | "out",
  limit: number,
  mode: MoneyMode,
  indices: InflationIndices,
): TransferRow[] {
  return transfers
    .filter((t) => t.direction === direction && isFeeRow(t))
    .sort((a, b) => effectiveFee(b, mode, indices)! - effectiveFee(a, mode, indices)!)
    .slice(0, limit);
}

export function netSpendByManagerForMode(
  transfers: TransferRow[],
  managerTenures: { manager_id: string; manager_name: string; date_from: string; date_to: string | null }[],
  mode: MoneyMode,
  indices: InflationIndices,
): NetSpendBucket[] {
  const buckets = new Map<string, NetSpendBucket>();

  for (const t of transfers) {
    if (!t.date) continue;
    const tenure = managerTenures.find(
      (mt) => t.date! >= mt.date_from && (mt.date_to == null || t.date! <= mt.date_to),
    );
    if (!tenure) continue;

    const bucket = buckets.get(tenure.manager_id) ?? {
      bucket: tenure.manager_name,
      bucket_id: tenure.manager_id,
      spend: 0,
      received: 0,
      net: 0,
      signings: 0,
      departures: 0,
    };
    if (t.direction === "in") bucket.signings++;
    else bucket.departures++;
    if (isFeeRow(t)) {
      const fee = effectiveFee(t, mode, indices)!;
      if (t.direction === "in") {
        bucket.spend += fee;
        bucket.net += fee;
      } else {
        bucket.received += fee;
        bucket.net -= fee;
      }
    }
    buckets.set(tenure.manager_id, bucket);
  }

  return [...buckets.values()]
    .filter((b) => b.spend > 0 || b.received > 0)
    .sort((a, b) => b.net - a.net);
}

/** Fee value used for display and sorting in a given money mode. */
export function displayFeeGbp(
  t: Pick<TransferRow, "fee_gbp" | "fee_kind" | "date" | "season">,
  mode: MoneyMode,
  indices: InflationIndices,
): number | null {
  if (!isFeeRow(t)) return null;
  return effectiveFee(t, mode, indices);
}
