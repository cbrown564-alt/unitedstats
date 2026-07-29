import { adjustFeeGbp, type InflationIndices, type MoneyMode } from "./inflation";
import {
  costBandForMeanMultiple,
  feePlMeanMultiple,
  isKnownFee,
  seasonDashLabel,
  transferLaneKind,
  type CostBandId,
  type TransferLaneKind,
} from "./transferTaxonomy";
import type { TransferRow } from "./queries";

/** Broad position bucket from Wikidata P413 — never inferred when absent. */
export type PositionGroup = "GK" | "DEF" | "MID" | "FWD";

export interface FeeRank {
  rank: number;
  total: number;
  direction: "in" | "out";
}

export interface CurrentWindowDeal {
  transfer: TransferRow;
  positionGroup: PositionGroup | null;
  feeRank: FeeRank | null;
  feePlMeanMultiple: number | null;
  relativeCostBand: CostBandId | null;
}

interface CurrentWindowLane {
  id: string;
  kind: TransferLaneKind;
  direction: "in" | "out";
  title: string;
  deals: CurrentWindowDeal[];
}

interface CurrentWindowComparison {
  season: string;
  seasonLabel: string;
  arrivals: number;
  departures: number;
  permanentArrivals: number;
  knownSpend: number;
  knownReceived: number;
  knownNet: number;
}

interface CurrentWindowPositionNote {
  transferId: string;
  playerName: string;
  positionGroup: PositionGroup;
  positionLabel: string;
  peers: Array<{ playerId: string; playerName: string }>;
}

export interface CurrentWindowMoney {
  knownSpend: number;
  knownReceived: number;
  knownNet: number;
}

export interface CurrentTransferWindowModel {
  season: string;
  seasonLabel: string;
  verifiedAt: string;
  verifiedAtSource: "dataset_build" | "latest_deal_date";
  quiet: boolean;
  quietLead: string | null;
  lanes: CurrentWindowLane[];
  comparisons: CurrentWindowComparison[];
  positionNotes: CurrentWindowPositionNote[];
  dealCount: number;
  feeCoverage: { known: number; total: number };
}

const POSITION_LABELS: Record<PositionGroup, string> = {
  GK: "goalkeepers",
  DEF: "defenders",
  MID: "midfielders",
  FWD: "forwards",
};

const LANE_ORDER: Array<{ kind: TransferLaneKind; direction: "in" | "out" }> = [
  { kind: "permanent", direction: "in" },
  { kind: "loan", direction: "in" },
  { kind: "academy", direction: "in" },
  { kind: "permanent", direction: "out" },
  { kind: "loan", direction: "out" },
  { kind: "released", direction: "out" },
  { kind: "retired", direction: "out" },
];

const LANE_TITLES: Record<TransferLaneKind, { in: string; out: string }> = {
  permanent: { in: "Permanent arrivals", out: "Permanent departures" },
  loan: { in: "Loan arrivals", out: "Loan departures" },
  academy: { in: "Academy promotions", out: "Academy departures" },
  released: { in: "Released", out: "Contract releases" },
  retired: { in: "Retired", out: "Retirements" },
};

function ordinal(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

function positionGroupLabel(group: PositionGroup): string {
  return POSITION_LABELS[group];
}

export function feeRankLabel(rank: FeeRank): string {
  const label = ordinal(rank.rank);
  return rank.direction === "in"
    ? `${label} highest signing fee in the record`
    : `${label} highest sale receipt in the record`;
}

function buildFeeRankIndex(transfers: TransferRow[]): Map<string, FeeRank> {
  const index = new Map<string, FeeRank>();
  for (const direction of ["in", "out"] as const) {
    const feeRows = transfers
      .filter((row) => row.direction === direction && isKnownFee(row))
      .sort((a, b) => b.fee_gbp! - a.fee_gbp!);
    feeRows.forEach((row, i) => {
      index.set(row.id, { rank: i + 1, total: feeRows.length, direction });
    });
  }
  return index;
}

function latestSeason(transfers: TransferRow[]): string | null {
  return transfers.reduce<string | null>((latest, transfer) => {
    if (!transfer.season) return latest;
    return latest == null || transfer.season > latest ? transfer.season : latest;
  }, null);
}

function windowRows(transfers: TransferRow[], season: string): TransferRow[] {
  return transfers.filter((row) => row.season === season);
}

function enrichDeal(
  transfer: TransferRow,
  feeRanks: Map<string, FeeRank>,
  positionMap: Record<string, PositionGroup>,
  indices: InflationIndices,
): CurrentWindowDeal {
  const positionGroup = transfer.player_id ? (positionMap[transfer.player_id] ?? null) : null;
  const feeRank = feeRanks.get(transfer.id) ?? null;
  const feePlMean = feePlMeanMultiple(
    transfer.fee_gbp,
    transfer.fee_kind,
    transfer.date,
    transfer.season,
    indices,
  );
  return {
    transfer,
    positionGroup,
    feeRank,
    feePlMeanMultiple: feePlMean,
    relativeCostBand: costBandForMeanMultiple(feePlMean),
  };
}

function buildLanes(
  rows: TransferRow[],
  feeRanks: Map<string, FeeRank>,
  positionMap: Record<string, PositionGroup>,
  indices: InflationIndices,
): CurrentWindowLane[] {
  const lanes: CurrentWindowLane[] = [];
  for (const { kind, direction } of LANE_ORDER) {
    const deals = rows
      .filter((row) => row.direction === direction && transferLaneKind(row) === kind)
      .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
      .map((row) => enrichDeal(row, feeRanks, positionMap, indices));
    if (deals.length === 0) continue;
    lanes.push({
      id: `${kind}-${direction}`,
      kind,
      direction,
      title: LANE_TITLES[kind][direction],
      deals,
    });
  }
  return lanes;
}

function seasonComparison(
  transfers: TransferRow[],
  season: string,
  mode: MoneyMode,
  indices: InflationIndices,
): CurrentWindowComparison {
  const rows = windowRows(transfers, season);
  let knownSpend = 0;
  let knownReceived = 0;
  for (const row of rows) {
    if (!isKnownFee(row)) continue;
    const fee = adjustFeeGbp(row.fee_gbp, row.fee_kind, row.date, row.season, mode, indices)!;
    if (row.direction === "in") knownSpend += fee;
    else knownReceived += fee;
  }
  return {
    season,
    seasonLabel: seasonDashLabel(season),
    arrivals: rows.filter((row) => row.direction === "in").length,
    departures: rows.filter((row) => row.direction === "out").length,
    permanentArrivals: rows.filter((row) => row.direction === "in" && transferLaneKind(row) === "permanent").length,
    knownSpend,
    knownReceived,
    knownNet: knownSpend - knownReceived,
  };
}

function priorComparisonSeasons(transfers: TransferRow[], season: string, count: number): string[] {
  const seasons = [...new Set(transfers.map((row) => row.season).filter(Boolean) as string[])]
    .filter((candidate) => candidate < season)
    .sort((a, b) => b.localeCompare(a));
  return seasons.slice(0, count);
}

function buildPositionNotes(
  rows: TransferRow[],
  positionMap: Record<string, PositionGroup>,
  peersByPosition: Record<PositionGroup, Array<{ playerId: string; playerName: string }>>,
): CurrentWindowPositionNote[] {
  const notes: CurrentWindowPositionNote[] = [];
  for (const row of rows) {
    if (!row.player_id) continue;
    const positionGroup = positionMap[row.player_id];
    if (!positionGroup) continue;
    const peers = (peersByPosition[positionGroup] ?? []).filter((peer) => peer.playerId !== row.player_id);
    if (peers.length === 0) continue;
    notes.push({
      transferId: row.id,
      playerName: row.player_name,
      positionGroup,
      positionLabel: positionGroupLabel(positionGroup),
      peers: peers.slice(0, 4),
    });
  }
  return notes;
}

function verifiedTimestamp(
  rows: TransferRow[],
  datasetBuiltAt: string | null,
): { verifiedAt: string; verifiedAtSource: "dataset_build" | "latest_deal_date" } {
  if (datasetBuiltAt) {
    return { verifiedAt: datasetBuiltAt.slice(0, 10), verifiedAtSource: "dataset_build" };
  }
  const latestDealDate = rows.reduce<string | null>(
    (latest, row) => (!row.date || (latest && row.date <= latest) ? latest : row.date),
    null,
  );
  return {
    verifiedAt: latestDealDate ?? new Date().toISOString().slice(0, 10),
    verifiedAtSource: "latest_deal_date",
  };
}

function quietWindowLead(seasonLabelText: string, lanes: CurrentWindowLane[], dealCount: number): string | null {
  const permanentIn = lanes.find((lane) => lane.kind === "permanent" && lane.direction === "in");
  const marketLanes = lanes.filter((lane) => lane.kind === "permanent" || lane.kind === "loan");
  if (permanentIn && permanentIn.deals.length > 0) return null;
  if (dealCount === 0) {
    return `No confirmed moves are recorded for ${seasonLabelText} in the canonical dataset yet.`;
  }
  if (marketLanes.every((lane) => lane.direction === "out") && !permanentIn) {
    const parts: string[] = [];
    const releases = lanes.find((lane) => lane.kind === "released");
    const loans = lanes.filter((lane) => lane.kind === "loan");
    if (releases) parts.push(`${releases.deals.length} contract release${releases.deals.length === 1 ? "" : "s"}`);
    const loanOut = loans.find((lane) => lane.direction === "out");
    if (loanOut) parts.push(`${loanOut.deals.length} loan departure${loanOut.deals.length === 1 ? "" : "s"}`);
    const detail = parts.length > 0 ? ` — ${parts.join(" and ")}` : "";
    return `No permanent arrivals are recorded for ${seasonLabelText} yet. ${dealCount} confirmed departure${dealCount === 1 ? "" : "s"} ${dealCount === 1 ? "is" : "are"} on file${detail}.`;
  }
  return null;
}

export function currentWindowMoneyForMode(
  rows: TransferRow[],
  mode: MoneyMode,
  indices: InflationIndices,
): CurrentWindowMoney {
  let knownSpend = 0;
  let knownReceived = 0;
  for (const row of rows) {
    if (!isKnownFee(row)) continue;
    const fee = adjustFeeGbp(row.fee_gbp, row.fee_kind, row.date, row.season, mode, indices)!;
    if (row.direction === "in") knownSpend += fee;
    else knownReceived += fee;
  }
  return { knownSpend, knownReceived, knownNet: knownSpend - knownReceived };
}

export interface BuildCurrentTransferWindowInput {
  transfers: TransferRow[];
  indices: InflationIndices;
  positionMap: Record<string, PositionGroup>;
  peersByPosition: Record<PositionGroup, Array<{ playerId: string; playerName: string }>>;
  datasetBuiltAt?: string | null;
  comparisonCount?: number;
  moneyMode?: MoneyMode;
}

/** Build the confirmed current-window model for the latest recorded season. */
export function buildCurrentTransferWindow({
  transfers,
  indices,
  positionMap,
  peersByPosition,
  datasetBuiltAt = null,
  comparisonCount = 2,
  moneyMode = "nominal",
}: BuildCurrentTransferWindowInput): CurrentTransferWindowModel | null {
  const season = latestSeason(transfers);
  if (!season) return null;

  const rows = windowRows(transfers, season);
  const feeRanks = buildFeeRankIndex(transfers);
  const lanes = buildLanes(rows, feeRanks, positionMap, indices);
  const comparisons = priorComparisonSeasons(transfers, season, comparisonCount).map((candidate) =>
    seasonComparison(transfers, candidate, moneyMode, indices),
  );
  const positionNotes = buildPositionNotes(rows, positionMap, peersByPosition);
  const { verifiedAt, verifiedAtSource } = verifiedTimestamp(rows, datasetBuiltAt ?? null);
  const feeCoverage = {
    known: rows.filter(isKnownFee).length,
    total: rows.length,
  };
  const quiet = rows.every((row) => transferLaneKind(row) !== "permanent" || row.direction === "out");
  const label = seasonDashLabel(season);

  return {
    season,
    seasonLabel: label,
    verifiedAt,
    verifiedAtSource,
    quiet,
    quietLead: quietWindowLead(label, lanes, rows.length),
    lanes,
    comparisons,
    positionNotes,
    dealCount: rows.length,
    feeCoverage,
  };
}

/** Minimum last-appearance date for same-position peer lookup in a window. */
export function currentWindowPeerCutoff(season: string): string {
  const startYear = Number.parseInt(season.slice(0, 4), 10);
  return `${startYear - 1}-07-01`;
}

