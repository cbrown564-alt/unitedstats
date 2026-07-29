import { type InflationIndices, type MoneyMode } from "./inflation";
import { displayFeeGbp, transferTotalsForMode } from "./transferAggregates";
import {
  COST_BUCKET_ORDER,
  costBucketForMeanMultiple,
  feePlMeanMultiple,
  isMarketTransfer,
  transferLaneKind,
  type CostBucketId,
} from "./transferTaxonomy";
import type { TransferRow } from "./queries";

interface ManagerTransferSeasonRow {
  season: string;
  signings: number;
  departures: number;
  spend: number;
  received: number;
  net: number;
  transferIds: string[];
}

export interface ManagerAggregateBucket {
  id: string;
  label: string;
  count: number;
  transferIds: string[];
}

interface ManagerSquadChurn {
  signings: number;
  departures: number;
  netHeadcount: number;
  turnover: number | null;
}

export type ManagerSpellState = "completed" | "active_candidate" | "unclosed_record" | "unresolved";

export interface ManagerSpellOutcome {
  transferId: string;
  playerId: string | null;
  playerName: string;
  season: string | null;
  feeGbp: number | null;
  feeKind: string;
  costBand: CostBucketId;
  spellState: ManagerSpellState;
  apps: number | null;
  starts: number | null;
  goals: number | null;
  observationSeasons: number | null;
}

export interface ManagerDefiningLink {
  kind: "season" | "player" | "match";
  href: string;
  label: string;
  blurb: string;
}

export interface ManagerTransferLensStatic {
  positionMix: ManagerAggregateBucket[];
  completedSpells: ManagerSpellOutcome[];
  ongoingSpells: ManagerSpellOutcome[];
  definingLinks: ManagerDefiningLink[];
}

export interface ManagerTransferLens {
  totals: ReturnType<typeof transferTotalsForMode>;
  seasons: ManagerTransferSeasonRow[];
  costBands: ManagerAggregateBucket[];
  positionMix: ManagerAggregateBucket[];
  churn: ManagerSquadChurn;
  completedSpells: ManagerSpellOutcome[];
  ongoingSpells: ManagerSpellOutcome[];
  definingLinks: ManagerDefiningLink[];
}

function managerSeasonRows(
  transfers: TransferRow[],
  mode: MoneyMode,
  indices: InflationIndices,
): ManagerTransferSeasonRow[] {
  const bySeason = new Map<string, ManagerTransferSeasonRow>();
  for (const t of transfers) {
    if (!t.season) continue;
    const row = bySeason.get(t.season) ?? {
      season: t.season,
      signings: 0,
      departures: 0,
      spend: 0,
      received: 0,
      net: 0,
      transferIds: [],
    };
    if (t.direction === "in") row.signings++;
    else row.departures++;
    row.transferIds.push(t.id);
    const fee = displayFeeGbp(t, mode, indices);
    if (fee != null) {
      if (t.direction === "in") {
        row.spend += fee;
        row.net += fee;
      } else {
        row.received += fee;
        row.net -= fee;
      }
    }
    bySeason.set(t.season, row);
  }
  return [...bySeason.values()].sort((a, b) => b.season.localeCompare(a.season));
}

function managerCostBands(signings: TransferRow[], indices: InflationIndices): ManagerAggregateBucket[] {
  const buckets = new Map<CostBucketId, ManagerAggregateBucket>();
  for (const { id, label } of COST_BUCKET_ORDER) {
    buckets.set(id, { id, label, count: 0, transferIds: [] });
  }
  for (const t of signings) {
    if (t.direction !== "in" || transferLaneKind(t) !== "permanent") continue;
    const bucket = buckets.get(
      costBucketForMeanMultiple(feePlMeanMultiple(t.fee_gbp, t.fee_kind, t.date, t.season, indices)),
    )!;
    bucket.count++;
    bucket.transferIds.push(t.id);
  }
  return COST_BUCKET_ORDER.map(({ id }) => buckets.get(id)!);
}

function managerSquadChurn(market: TransferRow[]): ManagerSquadChurn {
  const signings = market.filter((t) => t.direction === "in").length;
  const departures = market.filter((t) => t.direction === "out").length;
  return {
    signings,
    departures,
    netHeadcount: signings - departures,
    // Guard the divisor, not the sum: a manager who only sold would otherwise
    // report an infinite turnover ratio.
    turnover: signings > 0 ? departures / signings : null,
  };
}

/** Client-safe money-mode view merged with server-built spell and position evidence. */
export function buildManagerTransferLensView(
  transfers: TransferRow[],
  mode: MoneyMode,
  indices: InflationIndices,
  staticParts: ManagerTransferLensStatic,
): ManagerTransferLens {
  // Every aggregate on the panel counts the same rows: market business only.
  // Season counts previously included academy, release and retirement rows,
  // which made "signings" mean two different things on one screen.
  const market = transfers.filter(isMarketTransfer);
  const signings = market.filter((t) => t.direction === "in");
  return {
    totals: transferTotalsForMode(market, mode, indices),
    seasons: managerSeasonRows(market, mode, indices),
    costBands: managerCostBands(signings, indices),
    churn: managerSquadChurn(market),
    ...staticParts,
  };
}
