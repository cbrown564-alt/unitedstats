import { feeLabel } from "./format";
import type { PitchBand } from "./placement";
import { getDb } from "./db";
import type { ManagerTransferTenure, TransferRow } from "./queries";
import { honourSeasonMarkers } from "./queries";
import {
  SQUAD_BUILD_ERAS,
  compareSquadBuildThreads,
  seasonStartYear,
  squadBuildSeasonLabel,
  type SquadBuildDataset,
  type SquadBuildEra,
  type SquadBuildEraId,
  type SquadBuildManagerBand,
  type SquadBuildSeasonMarker,
  type SquadBuildThread,
} from "./squadBuild";
import { isSquadBuildMove } from "./transferTaxonomy";

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
    if (!isSquadBuildMove(transfer)) return false;
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
