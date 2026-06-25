/**
 * Validate the local media cache declared by canonical media manifests.
 *
 * App queries use localPath only; media records without localPath render through
 * the designed portrait fallback instead of hotlinking Wikimedia.
 *
 * Usage:
 *   npm run check:media
 *   npm run check:media -- --strict-coverage
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { CANONICAL, ROOT, readJson } from "./lib";

const PUBLIC_DIR = path.join(ROOT, "public");
const MIN_DIMENSION = 24;

interface MediaRecordBase {
  imageUrl: string;
  thumbUrl?: string | null;
  localPath?: string | null;
}

interface MediaManifest<T extends MediaRecordBase> {
  records: T[];
}

interface MediaLane {
  label: string;
  file: string;
  key: (record: MediaRecordBase & Record<string, unknown>) => string;
}

const lanes: MediaLane[] = [
  { label: "player", file: "player-media.json", key: (record) => String(record.playerId) },
  { label: "manager", file: "manager-media.json", key: (record) => String(record.managerId) },
  { label: "own-goal scorer", file: "og-scorer-media.json", key: (record) => String(record.name) },
];

function parseArgs(argv: string[]): { strictCoverage: boolean } {
  const strictCoverage = argv.includes("--strict-coverage");
  const unknown = argv.filter((arg) => arg !== "--strict-coverage");
  if (unknown.length) throw new Error(`Unknown argument: ${unknown.join(" ")}`);
  return { strictCoverage };
}

function diskPathFor(localPath: string): string | null {
  if (!localPath.startsWith("/media/")) return null;
  const diskPath = path.join(PUBLIC_DIR, localPath);
  const relative = path.relative(PUBLIC_DIR, diskPath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) return null;
  return diskPath;
}

async function validateLocalImage(localPath: string): Promise<string | null> {
  const diskPath = diskPathFor(localPath);
  if (!diskPath) return "localPath must stay under /media/";
  if (!fs.existsSync(diskPath)) return "local file is missing";
  try {
    const meta = await sharp(diskPath).metadata();
    if (!meta.format) return "local file is not a recognized image";
    if (!meta.width || !meta.height || meta.width < MIN_DIMENSION || meta.height < MIN_DIMENSION) {
      return `local image is too small (${meta.width ?? "?"}x${meta.height ?? "?"})`;
    }
  } catch (err) {
    return `local file is not a valid image: ${err instanceof Error ? err.message : err}`;
  }
  return null;
}

async function main() {
  const { strictCoverage } = parseArgs(process.argv.slice(2));
  const failures: string[] = [];
  let checked = 0;
  let cached = 0;
  let fallback = 0;

  for (const lane of lanes) {
    const manifest = readJson<MediaManifest<MediaRecordBase & Record<string, unknown>>>(
      path.join(CANONICAL, lane.file),
    );
    for (const record of manifest.records) {
      checked++;
      const key = lane.key(record);
      if (!record.localPath) {
        fallback++;
        if (strictCoverage) failures.push(`${lane.label} ${key}: no local media cache path`);
        continue;
      }
      cached++;
      if (/^https?:\/\//i.test(record.localPath)) {
        failures.push(`${lane.label} ${key}: localPath must not be remote (${record.localPath})`);
        continue;
      }
      const failure = await validateLocalImage(record.localPath);
      if (failure) failures.push(`${lane.label} ${key}: ${failure} (${record.localPath})`);
    }
  }

  if (failures.length) {
    console.error(`media check failed: ${failures.length} issue(s)`);
    for (const failure of failures.slice(0, 80)) console.error(`- ${failure}`);
    if (failures.length > 80) console.error(`...and ${failures.length - 80} more`);
    process.exit(1);
  }

  console.log(`media check passed: ${checked} records (${cached} cached, ${fallback} fallback-only)`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
