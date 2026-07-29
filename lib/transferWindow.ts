import { adjustFeeGbp, type InflationIndices, type MoneyMode } from "./inflation";
import { isKnownFee, transferLaneKind, type TransferLaneKind } from "./transferTaxonomy";
import type { PositionGroup } from "./currentTransferWindow";
import type { TransferWindowExemplar } from "./transferFeature";
import type { TransferReceipt } from "./transferReceiptTypes";
import type { TransferRow } from "./queries";

/**
 * One season of transfer business placed against the campaign that followed it.
 *
 * The season — not a modern summer/winter window — is the route key, because the
 * record reaches back to 1883 and most of it predates formal windows entirely. A
 * January move therefore sits in the same page as the July business that opened
 * the season, which is also how the ledger has always grouped it.
 *
 * Nothing here claims the business *caused* the campaign. The campaign section
 * is labelled as what followed, and the wording stays associative throughout.
 */

export interface TransferWindowLane {
  id: string;
  kind: TransferLaneKind;
  direction: "in" | "out";
  title: string;
  transfers: TransferRow[];
}

export interface TransferWindowMoney {
  knownSpend: number;
  knownReceived: number;
  knownNet: number;
  feeRows: number;
}

/** A manager attributed by transfer date, not by who happened to hold the job in May. */
export interface TransferWindowManagerSpell {
  managerId: string;
  managerName: string;
  deals: number;
  firstDealDate: string | null;
  lastDealDate: string | null;
}

export interface TransferWindowPositionRow {
  group: PositionGroup;
  label: string;
  /** Distinct players who appeared in the preceding season / this season. */
  before: number;
  after: number;
  arrivals: number;
  departures: number;
}

export interface TransferWindowCampaign {
  season: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  leagueName: string | null;
  leaguePosition: number | null;
  leagueSize: number | null;
  /** Competitions won in the campaign — never inferred from a league position alone. */
  honours: string[];
}

export interface TransferWindowNight {
  matchId: string;
  date: string;
  opponent: string;
  score: string;
  competition: string;
  /** Authored stakes when the night is curated, otherwise the computed reason. */
  note: string;
  authored: boolean;
}

export interface TransferWindowModel {
  season: string;
  seasonLabel: string;
  exemplar: TransferWindowExemplar;
  transfers: TransferRow[];
  lanes: TransferWindowLane[];
  managers: TransferWindowManagerSpell[];
  /** Null when the following season has no recorded appearances to compare against. */
  positionBalance: TransferWindowPositionRow[] | null;
  positionCoverage: { covered: number; total: number };
  campaign: TransferWindowCampaign | null;
  definingNights: TransferWindowNight[];
  receipts: TransferReceipt[];
  feeCoverage: { known: number; total: number };
  verifiedAt: string | null;
  /** Neighbouring exemplar windows, for the breadcrumb rail. */
  neighbours: { previous: TransferWindowExemplar | null; next: TransferWindowExemplar | null };
}

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
  loan: { in: "Loans in", out: "Loans out" },
  academy: { in: "Academy promotions", out: "Academy departures" },
  released: { in: "Released", out: "Released" },
  retired: { in: "Retired", out: "Retirements" },
};

export const POSITION_GROUP_LABELS: Record<PositionGroup, string> = {
  GK: "Goalkeepers",
  DEF: "Defenders",
  MID: "Midfielders",
  FWD: "Forwards",
};

export const POSITION_GROUP_ORDER: PositionGroup[] = ["GK", "DEF", "MID", "FWD"];

/** Every recorded lane, in a fixed order — empty lanes are dropped, not zero-filled. */
export function buildWindowLanes(rows: TransferRow[]): TransferWindowLane[] {
  const lanes: TransferWindowLane[] = [];
  for (const { kind, direction } of LANE_ORDER) {
    const transfers = rows
      .filter((row) => row.direction === direction && transferLaneKind(row) === kind)
      .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
    if (transfers.length === 0) continue;
    lanes.push({ id: `${kind}-${direction}`, kind, direction, title: LANE_TITLES[kind][direction], transfers });
  }
  return lanes;
}

/**
 * Known money only. Free, undisclosed and unknown fees never enter the totals,
 * so every figure here is a floor rather than a settled account.
 */
export function windowMoneyForMode(
  rows: TransferRow[],
  mode: MoneyMode,
  indices: InflationIndices,
): TransferWindowMoney {
  let knownSpend = 0;
  let knownReceived = 0;
  let feeRows = 0;
  for (const row of rows) {
    if (!isKnownFee(row)) continue;
    feeRows++;
    const fee = adjustFeeGbp(row.fee_gbp, row.fee_kind, row.date, row.season, mode, indices)!;
    if (row.direction === "in") knownSpend += fee;
    else knownReceived += fee;
  }
  return { knownSpend, knownReceived, knownNet: knownSpend - knownReceived, feeRows };
}
