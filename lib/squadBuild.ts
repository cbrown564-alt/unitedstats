import { feeLabel } from "./format";
import type { PitchBand } from "./placement";
import { getDb } from "./db";
import type { ManagerTransferTenure, TransferRow } from "./queries";
import { honourSeasonMarkers } from "./queries";

/** Bounded squad-build eras — prototype datasets before a universal renderer. */
export type SquadBuildEraId = "ferguson-early" | "ferguson-late" | "post-ferguson";

export interface SquadBuildEra {
  id: SquadBuildEraId;
  label: string;
  blurb: string;
  /** Inclusive first season start year (e.g. 1992 → 1992–93). */
  seasonFrom: number;
  /** Inclusive last season start year (e.g. 2002 → 2002–03). */
  seasonTo: number;
  /** When thread count exceeds this, default the position lens on desktop. */
  denseThreshold: number;
}

export const SQUAD_BUILD_ERAS: SquadBuildEra[] = [
  {
    id: "ferguson-early",
    label: "Ferguson 1992–2002",
    blurb: "Premier League foundation — Cantona's lift through the Treble core.",
    seasonFrom: 1992,
    seasonTo: 2002,
    denseThreshold: 80,
  },
  {
    id: "ferguson-late",
    label: "Ferguson 2003–2013",
    blurb: "The Ronaldo years, three more titles, and the last Ferguson squad.",
    seasonFrom: 2003,
    seasonTo: 2012,
    denseThreshold: 80,
  },
  {
    id: "post-ferguson",
    label: "Post-Ferguson",
    blurb: "Rebuilds, record fees, and the market since May 2013.",
    seasonFrom: 2013,
    seasonTo: 2026,
    denseThreshold: 60,
  },
];

export interface SquadBuildThread {
  id: string;
  playerId: string | null;
  playerName: string;
  direction: "in" | "out";
  season: string;
  seasonStart: number;
  date: string | null;
  position: PitchBand | "UNK";
  positionLabel: string | null;
  feeGbp: number | null;
  feeKind: string;
  feeDisplay: string;
  club: string | null;
  type: string;
  managerId: string | null;
  managerName: string | null;
  thumbUrl: string | null;
  /** Normalised bar length within the era for known fees; null when not comparable. */
  feeScale: number | null;
}

export interface SquadBuildSeasonMarker {
  season: string;
  startYear: number;
  label: string;
  managerId: string | null;
  managerName: string;
  leagueFinish: number | null;
  honourCount: number;
  arrivals: number;
  departures: number;
}

export interface SquadBuildManagerBand {
  managerId: string;
  managerName: string;
  fromSeason: string;
  toSeason: string;
  fromYear: number;
  toYear: number;
}

export interface SquadBuildDataset {
  era: SquadBuildEra;
  seasons: SquadBuildSeasonMarker[];
  threads: SquadBuildThread[];
  managerBands: SquadBuildManagerBand[];
  maxKnownFee: number;
  /** True when the full-squad desktop view would be unreadably dense. */
  defaultPositionLens: boolean;
}

const OFFMARKET_TYPES = new Set(["released", "retired"]);

export function seasonStartYear(season: string | null | undefined): number | null {
  if (!season) return null;
  const year = Number.parseInt(season.slice(0, 4), 10);
  return Number.isFinite(year) ? year : null;
}

/** Short season label for the axis — e.g. 1998-99 → 98–99. */
export function squadBuildSeasonLabel(season: string): string {
  const end = season.includes("-") ? season.split("-")[1] : season.slice(5, 7);
  return `${season.slice(2, 4)}–${end}`;
}

function resolvePosition(bucket: string | null | undefined): PitchBand | "UNK" {
  if (!bucket) return "UNK";
  const band = bucket.trim().toUpperCase();
  if (band === "GK" || band === "DEF" || band === "MID" || band === "FWD") return band;
  return "UNK";
}

function managerAtDate(
  tenures: ManagerTransferTenure[],
  date: string | null,
): { id: string; name: string } | null {
  if (!date) return null;
  for (let i = tenures.length - 1; i >= 0; i--) {
    const tenure = tenures[i]!;
    if (date >= tenure.date_from && (tenure.date_to == null || date <= tenure.date_to)) {
      return { id: tenure.manager_id, name: tenure.manager_name };
    }
  }
  return null;
}

function inEra(seasonStart: number | null, era: SquadBuildEra): boolean {
  return seasonStart != null && seasonStart >= era.seasonFrom && seasonStart <= era.seasonTo;
}

export function compareSquadBuildThreads(a: SquadBuildThread, b: SquadBuildThread): number {
  const dateA = a.date ?? "";
  const dateB = b.date ?? "";
  if (dateA !== dateB) return dateA.localeCompare(dateB);
  if (a.direction !== b.direction) return a.direction === "in" ? -1 : 1;
  return a.playerName.localeCompare(b.playerName);
}

function primaryManagerForSeason(
  season: string,
  tenures: ManagerTransferTenure[],
): { id: string; name: string } | null {
  const startYear = seasonStartYear(season);
  if (!startYear) return null;
  return managerAtDate(tenures, `${startYear}-12-15`);
}

function buildManagerBands(seasons: SquadBuildSeasonMarker[]): SquadBuildManagerBand[] {
  if (seasons.length === 0) return [];

  const bands: SquadBuildManagerBand[] = [];
  let bandStart = seasons[0]!;

  for (let i = 1; i < seasons.length; i++) {
    const season = seasons[i]!;
    if (season.managerId !== bandStart.managerId) {
      const previous = seasons[i - 1]!;
      bands.push({
        managerId: bandStart.managerId ?? "unknown",
        managerName: bandStart.managerName,
        fromSeason: bandStart.season,
        toSeason: previous.season,
        fromYear: bandStart.startYear,
        toYear: previous.startYear,
      });
      bandStart = season;
    }
  }

  const last = seasons[seasons.length - 1]!;
  bands.push({
    managerId: bandStart.managerId ?? "unknown",
    managerName: bandStart.managerName,
    fromSeason: bandStart.season,
    toSeason: last.season,
    fromYear: bandStart.startYear,
    toYear: last.startYear,
  });
  return bands;
}

function loadPlayerPositions(): Map<string, { bucket: string | null; label: string | null }> {
  const rows = getDb()
    .prepare("SELECT player_id, bucket, position_label FROM player_positions")
    .all() as Array<{ player_id: string; bucket: string | null; position_label: string | null }>;
  return new Map(rows.map((row) => [row.player_id, { bucket: row.bucket, label: row.position_label }]));
}

function loadLeagueFinishes(): Map<string, number> {
  const rows = getDb()
    .prepare(
      `SELECT ss.season, ss.position
       FROM season_summaries ss
       JOIN competitions c ON c.id = ss.competition_id
       WHERE c.type = 'league' AND c.name IN ('Premier League', 'First Division')`,
    )
    .all() as Array<{ season: string; position: number }>;
  return new Map(rows.map((row) => [row.season, row.position]));
}

export function buildSquadBuildDataset(
  eraId: SquadBuildEraId,
  transfers: TransferRow[],
  managerTenures: ManagerTransferTenure[],
): SquadBuildDataset {
  const era = SQUAD_BUILD_ERAS.find((entry) => entry.id === eraId);
  if (!era) throw new Error(`Unknown squad-build era: ${eraId}`);

  const positions = loadPlayerPositions();
  const finishes = loadLeagueFinishes();
  const honourMap = new Map(honourSeasonMarkers().map((marker) => [marker.season, marker.count]));

  const eraTransfers = transfers.filter((transfer) => {
    const seasonStart = seasonStartYear(transfer.season);
    if (!inEra(seasonStart, era) || !transfer.date || !transfer.season) return false;
    if (OFFMARKET_TYPES.has(transfer.type)) return false;
    return true;
  });

  const maxKnownFee = Math.max(
    0,
    ...eraTransfers
      .filter((transfer) => transfer.fee_kind === "fee" && transfer.fee_gbp != null)
      .map((transfer) => transfer.fee_gbp!),
  );

  const threads = eraTransfers
    .map((transfer): SquadBuildThread => {
      const pos = transfer.player_id ? positions.get(transfer.player_id) : null;
      const manager = managerAtDate(managerTenures, transfer.date);
      const feeScale =
        transfer.fee_kind === "fee" && transfer.fee_gbp != null && maxKnownFee > 0
          ? transfer.fee_gbp / maxKnownFee
          : null;

      return {
        id: transfer.id,
        playerId: transfer.player_id,
        playerName: transfer.player_name,
        direction: transfer.direction,
        season: transfer.season!,
        seasonStart: seasonStartYear(transfer.season)!,
        date: transfer.date,
        position: resolvePosition(pos?.bucket),
        positionLabel: pos?.label ?? null,
        feeGbp: transfer.fee_gbp,
        feeKind: transfer.fee_kind,
        feeDisplay: feeLabel(transfer.fee_kind, transfer.fee_gbp),
        club: transfer.club,
        type: transfer.type,
        managerId: manager?.id ?? null,
        managerName: manager?.name ?? null,
        thumbUrl: transfer.thumb_url,
        feeScale,
      };
    })
    .sort(compareSquadBuildThreads);

  const seasonKeys = [...new Set(threads.map((thread) => thread.season))].sort((a, b) => a.localeCompare(b));
  const seasons = seasonKeys.map((season) => {
    const seasonThreads = threads.filter((thread) => thread.season === season);
    const primaryManager = primaryManagerForSeason(season, managerTenures);
    return {
      season,
      startYear: seasonStartYear(season)!,
      label: squadBuildSeasonLabel(season),
      managerId: primaryManager?.id ?? null,
      managerName: primaryManager?.name ?? "—",
      leagueFinish: finishes.get(season) ?? null,
      honourCount: honourMap.get(season) ?? 0,
      arrivals: seasonThreads.filter((thread) => thread.direction === "in").length,
      departures: seasonThreads.filter((thread) => thread.direction === "out").length,
    };
  });

  return {
    era,
    seasons,
    threads,
    managerBands: buildManagerBands(seasons),
    maxKnownFee,
    defaultPositionLens: threads.length > era.denseThreshold,
  };
}

export function buildAllSquadBuildDatasets(
  transfers: TransferRow[],
  managerTenures: ManagerTransferTenure[],
): SquadBuildDataset[] {
  return SQUAD_BUILD_ERAS.map((era) => buildSquadBuildDataset(era.id, transfers, managerTenures));
}

export function filterSquadBuildThreads(
  threads: SquadBuildThread[],
  position: PitchBand | "UNK" | "all",
): SquadBuildThread[] {
  if (position === "all") return threads;
  return threads.filter((thread) => thread.position === position);
}
