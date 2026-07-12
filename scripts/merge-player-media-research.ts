/**
 * Merge validated player-media research batches into the canonical manifest.
 * Existing curated records win; only genuinely new found candidates are added.
 *
 * Usage:
 *   npm run merge:player-media-research
 */
import fs from "node:fs";
import path from "node:path";
import { CANONICAL, readJson, writeJson } from "./lib";

const RESEARCH_DIR = path.join(CANONICAL, "player-media-research");
const MANIFEST_FILE = path.join(CANONICAL, "player-media.json");

interface ExistingMediaRecord {
  rank?: number;
  overallRank?: number | null;
  premierLeagueEraRank?: number | null;
  playerId: string;
  name: string;
  wikiTitle?: string | null;
  wikidataId?: string | null;
  commonsFile: string;
  imageUrl: string;
  thumbUrl?: string | null;
  pageUrl?: string | null;
  license?: string | null;
  artist?: string | null;
  credit?: string | null;
  sourceId: string;
  sourceMethod?: string;
  retrievedAt?: string | null;
  manualPortraitSource?: string | null;
  localPath?: string | null;
}

interface ResearchRecord {
  playerId: string;
  name: string;
  status: "found" | "unresolved" | "ambiguous";
  wikiTitle: string | null;
  wikidataId: string | null;
  commonsFile: string | null;
  imageUrl: string | null;
  thumbUrl: string | null;
  pageUrl: string | null;
  license: string | null;
  artist: string | null;
  credit: string | null;
  sourceMethod: string | null;
  confidence: string | null;
  notes: string;
}

interface ResearchBatch {
  generatedAt?: string;
  records: ResearchRecord[];
}

interface PlayerRecordIdentity {
  playerId: string;
  name: string;
  wikiTitle: string;
}

interface ExistingManifest {
  generatedAt?: string;
  sourceId?: string;
  sourceName?: string;
  requestedTopPlayers?: number | null;
  requestedTopPlayersPerCohort?: number | null;
  selectedPlayers?: number;
  selectionMode?: string;
  ranking?: string[];
  sourceUrls?: string[];
  notes?: string[];
  records: ExistingMediaRecord[];
  missing?: Record<string, unknown>[];
}

function main(): void {
  const manifest = readJson<ExistingManifest>(MANIFEST_FILE);
  const batchFiles = fs.readdirSync(RESEARCH_DIR).filter((file) => /^batch-.*\.json$/.test(file)).sort();
  const batches = batchFiles.map((file) => readJson<ResearchBatch>(path.join(RESEARCH_DIR, file)));
  const research = batches.flatMap((batch) => batch.records);
  const found = research.filter((record) => record.status === "found");

  const recordsById = new Map<string, ExistingMediaRecord>();
  for (const record of manifest.records) {
    if (recordsById.has(record.playerId)) throw new Error(`Duplicate existing media record: ${record.playerId}`);
    recordsById.set(record.playerId, record);
  }

  const researchIds = new Set<string>();
  for (const record of found) {
    if (researchIds.has(record.playerId)) throw new Error(`Duplicate research record: ${record.playerId}`);
    researchIds.add(record.playerId);
    if (!record.commonsFile || !record.imageUrl || !record.pageUrl || !record.license) {
      throw new Error(`Found research record is missing media metadata: ${record.playerId}`);
    }
  }

  const retrievedAt = new Date().toISOString();
  let added = 0;
  for (const record of found) {
    if (recordsById.has(record.playerId)) continue;
    const merged: ExistingMediaRecord = {
      rank: manifest.records.length + added + 1,
      overallRank: null,
      premierLeagueEraRank: null,
      playerId: record.playerId,
      name: record.name,
      wikiTitle: record.wikiTitle,
      wikidataId: record.wikidataId,
      commonsFile: record.commonsFile,
      imageUrl: record.imageUrl,
      thumbUrl: record.thumbUrl,
      pageUrl: record.pageUrl,
      license: record.license,
      artist: record.artist,
      credit: record.credit,
      sourceId: "wikidata-commons",
      sourceMethod: record.sourceMethod ?? "commons-search",
      retrievedAt,
    };
    recordsById.set(record.playerId, merged);
    added++;
  }

  const missingById = new Map<string, Record<string, unknown>>();
  for (const missing of manifest.missing ?? []) {
    const playerId = typeof missing.playerId === "string" ? missing.playerId : null;
    if (playerId) missingById.set(playerId, missing);
  }
  for (const record of research) {
    if (record.status === "found") continue;
    missingById.set(record.playerId, {
      playerId: record.playerId,
      name: record.name,
      wikiTitle: record.wikiTitle,
      wikidataId: record.wikidataId,
      status: record.status,
      reason: record.notes,
      confidence: record.confidence,
    });
  }

  // player-records.json contains a small set of legacy/alias IDs that are
  // materialized into the runtime database even though they are absent from
  // players.json. Keep those visible-register identities in the ledger until
  // they receive an explicit alias mapping or a separately verified image.
  const playerRecords = readJson<{ records: PlayerRecordIdentity[] }>(
    path.join(CANONICAL, "player-records.json"),
  ).records;
  for (const player of playerRecords) {
    if (recordsById.has(player.playerId) || missingById.has(player.playerId)) continue;
    missingById.set(player.playerId, {
      playerId: player.playerId,
      name: player.name,
      wikiTitle: player.wikiTitle,
      wikidataId: null,
      status: "unresolved",
      reason: "Legacy player-records alias is absent from players.json research roster; hold for explicit alias resolution.",
      confidence: null,
    });
  }

  const records = [...recordsById.values()];
  const missing = [...missingById.values()].filter((record) => !recordsById.has(String(record.playerId)));
  writeJson(MANIFEST_FILE, {
    generatedAt: retrievedAt,
    sourceId: "wikidata-commons",
    sourceName: "Wikidata P18, Wikipedia pageimages, Wikimedia Commons imageinfo, and reviewed research batches",
    requestedTopPlayers: null,
    requestedTopPlayersPerCohort: null,
    selectedPlayers: records.length,
    selectionMode: "exhaustive research merge; existing curated records preserved",
    ranking: [
      "Existing curated player-media records are preserved as the first-choice image for each player.",
      "New records come only from validated Wikimedia-first research batches.",
      "The missing ledger records every researched player without a verified reusable image.",
    ],
    sourceUrls: [
      "https://www.wikidata.org/wiki/Property:P18",
      "https://www.mediawiki.org/wiki/API:Pageimages",
      "https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia",
    ],
    notes: [
      "Only found research records with explicit reusable license metadata are merged.",
      "Existing curated records win over newer batch candidates so prior portrait curation is not silently replaced.",
      "Run npm run cache:media after merging to create local WebP assets and localPath fields.",
    ],
    records,
    missing,
  });

  console.log(`merged ${added} new player media records; manifest now has ${records.length} records and ${missing.length} missing-ledger entries`);
}

main();
