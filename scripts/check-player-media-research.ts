/**
 * Validate disjoint player-media research batch artifacts before integration.
 *
 * Usage:
 *   npm run check:player-media-research
 */
import fs from "node:fs";
import path from "node:path";
import { CANONICAL, readJson } from "./lib";

const RESEARCH_DIR = path.join(CANONICAL, "player-media-research");
const REUSABLE_LICENSE = /\bcc\b|creative commons|public domain|cc0|gfdl|free documentation license/i;

interface Player {
  id: string;
  name: string;
}

interface ResearchRecord {
  playerId: string;
  name: string;
  status: "found" | "unresolved" | "ambiguous";
  commonsFile: string | null;
  imageUrl: string | null;
  pageUrl: string | null;
  license: string | null;
  sourceMethod: string | null;
  notes: string;
}

interface ResearchBatch {
  range: string;
  records: ResearchRecord[];
  summary: { total: number; found: number; unresolved: number; ambiguous: number };
}

function normalizedInitial(name: string): string {
  return (name.normalize("NFKD").replace(/[^A-Za-z]/g, "")[0] ?? "#").toUpperCase();
}

function expectedPlayers(): Player[] {
  return readJson<{ players: Player[] }>(path.join(CANONICAL, "players.json")).players;
}

function main(): void {
  if (!fs.existsSync(RESEARCH_DIR)) throw new Error(`Research directory is missing: ${RESEARCH_DIR}`);
  const files = fs.readdirSync(RESEARCH_DIR).filter((file) => /^batch-.*\.json$/.test(file)).sort();
  if (!files.length) throw new Error(`No batch artifacts found in ${RESEARCH_DIR}`);

  const failures: string[] = [];
  const expected = new Map(expectedPlayers().map((player) => [player.id, player]));
  const seen = new Map<string, { file: string; record: ResearchRecord }>();
  let found = 0;
  let unresolved = 0;
  let ambiguous = 0;

  for (const file of files) {
    const batch = readJson<ResearchBatch>(path.join(RESEARCH_DIR, file));
    if (batch.summary.total !== batch.records.length) {
      failures.push(`${file}: summary.total ${batch.summary.total} != ${batch.records.length} records`);
    }

    const batchCounts = { found: 0, unresolved: 0, ambiguous: 0 };
    for (const record of batch.records) {
      const canonical = expected.get(record.playerId);
      if (!canonical) {
        failures.push(`${file}: unknown player id ${record.playerId}`);
      } else {
        if (canonical.name !== record.name) failures.push(`${file}: name mismatch for ${record.playerId}`);
        if (!batch.range.split("-").some((range) => normalizedInitial(record.name) === range)) {
          const [start, end] = batch.range.split("-");
          const initial = normalizedInitial(record.name);
          if (initial < start || initial > end) failures.push(`${file}: ${record.playerId} falls outside ${batch.range}`);
        }
      }

      const prior = seen.get(record.playerId);
      if (prior) failures.push(`${file}: duplicate ${record.playerId}; already present in ${prior.file}`);
      else seen.set(record.playerId, { file, record });

      if (!record.notes.trim()) failures.push(`${file}: ${record.playerId} has no notes`);
      batchCounts[record.status]++;
      if (record.status === "found") {
        found++;
        if (!record.commonsFile || !record.imageUrl || !record.pageUrl || !record.license || !REUSABLE_LICENSE.test(record.license)) {
          failures.push(`${file}: ${record.playerId} is found without explicit reusable Commons metadata`);
        }
      } else if (record.status === "unresolved") unresolved++;
      else ambiguous++;
    }

    for (const status of ["found", "unresolved", "ambiguous"] as const) {
      if (batch.summary[status] !== batchCounts[status]) {
        failures.push(`${file}: summary.${status} ${batch.summary[status]} != ${batchCounts[status]}`);
      }
    }
  }

  const missing = [...expected.values()].filter((player) => !seen.has(player.id));
  for (const player of missing) failures.push(`missing research record: ${player.id} (${player.name})`);

  if (failures.length) {
    console.error(`player-media research check failed: ${failures.length} issue(s)`);
    for (const failure of failures.slice(0, 100)) console.error(`- ${failure}`);
    if (failures.length > 100) console.error(`...and ${failures.length - 100} more`);
    process.exit(1);
  }

  console.log(`player-media research check passed: ${seen.size} players (${found} found, ${unresolved} unresolved, ${ambiguous} ambiguous)`);
}

main();
