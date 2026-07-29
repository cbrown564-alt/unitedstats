import { transferSeason, type InflationIndices, type MoneyMode } from "./inflation";
import { displayFeeGbp, transferTotalsForMode } from "./transferAggregates";
import type { TransferRow } from "./queries";

const OFF_MARKET_TYPES = new Set(["youth", "released", "retired"]);

export type CostBandId = "low" | "lower-middle" | "upper-middle" | "high" | "extreme" | "unknown";

export const COST_BAND_ORDER: Array<{ id: CostBandId; label: string }> = [
  { id: "low", label: "Low" },
  { id: "lower-middle", label: "Lower-middle" },
  { id: "upper-middle", label: "Upper-middle" },
  { id: "high", label: "High" },
  { id: "extreme", label: "Extreme" },
  { id: "unknown", label: "Unknown fee" },
];

/** Mean-relative band thresholds — chosen before inspecting outcomes (A0 index). */
export function costBandForMeanMultiple(multiple: number | null): CostBandId {
  if (multiple == null || !Number.isFinite(multiple)) return "unknown";
  if (multiple < 0.5) return "low";
  if (multiple < 1) return "lower-middle";
  if (multiple < 2) return "upper-middle";
  if (multiple < 4) return "high";
  return "extreme";
}

export function feePlMeanMultiple(
  feeGbp: number | null,
  feeKind: string,
  date: string | null,
  season: string | null,
  indices: InflationIndices,
): number | null {
  if (feeKind !== "fee" || feeGbp == null) return null;
  const resolvedSeason = transferSeason(date, season);
  const footballSeason = resolvedSeason ? indices.football.seasons[resolvedSeason] : undefined;
  if (!footballSeason?.meanGbp) return null;
  return feeGbp / footballSeason.meanGbp;
}

export interface ManagerTransferSeasonRow {
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

export interface ManagerSquadChurn {
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
  costBand: CostBandId;
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

function isMarketTransfer(t: Pick<TransferRow, "type">): boolean {
  return !OFF_MARKET_TYPES.has(t.type);
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
  const buckets = new Map<CostBandId, ManagerAggregateBucket>();
  for (const { id, label } of COST_BAND_ORDER) {
    buckets.set(id, { id, label, count: 0, transferIds: [] });
  }
  for (const t of signings) {
    if (t.direction !== "in" || t.type !== "permanent") continue;
    const band = costBandForMeanMultiple(feePlMeanMultiple(t.fee_gbp, t.fee_kind, t.date, t.season, indices));
    const bucket = buckets.get(band)!;
    bucket.count++;
    bucket.transferIds.push(t.id);
  }
  return COST_BAND_ORDER.map(({ id }) => buckets.get(id)!);
}

function managerSquadChurn(transfers: TransferRow[]): ManagerSquadChurn {
  const market = transfers.filter(isMarketTransfer);
  const signings = market.filter((t) => t.direction === "in").length;
  const departures = market.filter((t) => t.direction === "out").length;
  const turnover = signings + departures > 0 ? departures / signings : null;
  return {
    signings,
    departures,
    netHeadcount: signings - departures,
    turnover,
  };
}

/** Client-safe money-mode view merged with server-built spell and position evidence. */
export function buildManagerTransferLensView(
  transfers: TransferRow[],
  mode: MoneyMode,
  indices: InflationIndices,
  staticParts: ManagerTransferLensStatic,
): ManagerTransferLens {
  const market = transfers.filter(isMarketTransfer);
  const signings = market.filter((t) => t.direction === "in");
  return {
    totals: transferTotalsForMode(market, mode, indices),
    seasons: managerSeasonRows(transfers, mode, indices),
    costBands: managerCostBands(signings, indices),
    churn: managerSquadChurn(transfers),
    ...staticParts,
  };
}
