/**
 * Download licensed Wikimedia media from canonical manifests into public/media.
 *
 * The canonical JSON keeps original Wikimedia URL/license/provenance fields.
 * This script only adds `localPath` after a local optimized image has been
 * written and verified, so failed downloads never create broken site paths.
 *
 * Usage:
 *   npm run cache:media
 *   npm run cache:media -- --limit 10 --force
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { CANONICAL, ROOT, readJson, slugify, userAgent, writeJson } from "./lib";

const PUBLIC_DIR = path.join(ROOT, "public");
const TARGET_SIZE = 320;
const MIN_DIMENSION = 24;
const DEFAULT_DELAY_MS = 1500;
const DEFAULT_RETRIES = 5;
const DEFAULT_TIMEOUT_MS = 20000;

interface MediaRecordBase {
  imageUrl: string;
  thumbUrl?: string | null;
  localPath?: string | null;
  manualPortraitSource?: string | null;
}

interface PlayerMediaRecord extends MediaRecordBase {
  playerId: string;
}

interface ManagerMediaRecord extends MediaRecordBase {
  managerId: string;
}

interface OgScorerMediaRecord extends MediaRecordBase {
  name: string;
}

interface MediaManifest<T extends MediaRecordBase> {
  records: T[];
  cachedAt?: string | null;
}

interface MediaLane<T extends MediaRecordBase> {
  label: string;
  file: string;
  dir: string;
  key: (record: T) => string;
  filename: (record: T) => string;
}

interface CliOptions {
  force: boolean;
  limit: number | null;
  delayMs: number;
  retries: number;
  timeoutMs: number;
  reconcileOnly: boolean;
}

const lanes: MediaLane<MediaRecordBase>[] = [
  {
    label: "player",
    file: "player-media.json",
    dir: "players",
    key: (record) => (record as PlayerMediaRecord).playerId,
    filename: (record) => (record as PlayerMediaRecord).playerId,
  },
  {
    label: "manager",
    file: "manager-media.json",
    dir: "managers",
    key: (record) => (record as ManagerMediaRecord).managerId,
    filename: (record) => (record as ManagerMediaRecord).managerId,
  },
  {
    label: "own-goal scorer",
    file: "og-scorer-media.json",
    dir: "own-goal-scorers",
    key: (record) => (record as OgScorerMediaRecord).name,
    filename: (record) => slugify((record as OgScorerMediaRecord).name),
  },
];

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    force: false,
    limit: null,
    delayMs: DEFAULT_DELAY_MS,
    retries: DEFAULT_RETRIES,
    timeoutMs: DEFAULT_TIMEOUT_MS,
    reconcileOnly: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--force") options.force = true;
    else if (arg === "--reconcile-only") options.reconcileOnly = true;
    else if (arg === "--limit") options.limit = Number(argv[++i]);
    else if (arg === "--delay-ms") options.delayMs = Number(argv[++i]);
    else if (arg === "--retries") options.retries = Number(argv[++i]);
    else if (arg === "--timeout-ms") options.timeoutMs = Number(argv[++i]);
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (options.limit != null && (!Number.isFinite(options.limit) || options.limit < 1)) {
    throw new Error("--limit must be a positive number");
  }
  if (!Number.isFinite(options.delayMs) || options.delayMs < 0) throw new Error("--delay-ms must be >= 0");
  if (!Number.isFinite(options.retries) || options.retries < 1) throw new Error("--retries must be >= 1");
  if (!Number.isFinite(options.timeoutMs) || options.timeoutMs < 1000) throw new Error("--timeout-ms must be >= 1000");
  return options;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function localPathFor<T extends MediaRecordBase>(lane: MediaLane<T>, record: T): string {
  return `/media/${lane.dir}/${lane.filename(record)}.webp`;
}

function diskPathFor(localPath: string): string {
  if (!localPath.startsWith("/media/")) throw new Error(`Unexpected media path: ${localPath}`);
  return path.join(PUBLIC_DIR, localPath);
}

function manualPortraitDiskPath(manualPortraitSource: string): string {
  if (!manualPortraitSource.startsWith("/media/")) {
    throw new Error(`Unexpected manual portrait path: ${manualPortraitSource}`);
  }
  return path.join(PUBLIC_DIR, manualPortraitSource);
}

async function readSourceBytes(record: MediaRecordBase, options: Pick<CliOptions, "retries" | "timeoutMs">): Promise<Buffer> {
  if (record.manualPortraitSource) {
    const manualPath = manualPortraitDiskPath(record.manualPortraitSource);
    if (!fs.existsSync(manualPath)) throw new Error(`manual portrait missing: ${record.manualPortraitSource}`);
    return fs.readFileSync(manualPath);
  }
  const source = record.thumbUrl ?? record.imageUrl;
  return fetchBytes(source, options);
}

async function verifiedImage(file: string): Promise<boolean> {
  if (!fs.existsSync(file)) return false;
  try {
    const meta = await sharp(file).metadata();
    return Boolean(meta.width && meta.height && meta.width >= MIN_DIMENSION && meta.height >= MIN_DIMENSION);
  } catch {
    return false;
  }
}

async function fetchBytes(url: string, options: Pick<CliOptions, "retries" | "timeoutMs">): Promise<Buffer> {
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= options.retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "user-agent": userAgent("media cache") },
        signal: AbortSignal.timeout(options.timeoutMs),
      });
      if (!res.ok) {
        const retryable = res.status === 429 || res.status >= 500;
        if (retryable && attempt < options.retries) {
          const retryAfter = Number(res.headers.get("retry-after"));
          const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : attempt * 3000;
          await sleep(delay);
          continue;
        }
        throw new Error(`${res.status} ${res.statusText}`);
      }
      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.startsWith("image/") && contentType !== "application/octet-stream") {
        throw new Error(`unexpected content-type ${contentType || "(missing)"}`);
      }
      return Buffer.from(await res.arrayBuffer());
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < options.retries) await sleep(attempt * 3000);
    }
  }
  throw lastError ?? new Error("download failed");
}

async function writeOptimizedImage(bytes: Buffer, file: string): Promise<void> {
  const meta = await sharp(bytes, { failOn: "none" }).metadata();
  if (!meta.width || !meta.height || meta.width < MIN_DIMENSION || meta.height < MIN_DIMENSION) {
    throw new Error(`invalid source dimensions ${meta.width ?? "?"}x${meta.height ?? "?"}`);
  }
  // Tall sources (full-body portraits) lose heads under attention cropping — bias up.
  const position = meta.height / meta.width > 1.15 ? "top" : "attention";
  fs.mkdirSync(path.dirname(file), { recursive: true });
  await sharp(bytes, { failOn: "none" })
    .rotate()
    .resize(TARGET_SIZE, TARGET_SIZE, { fit: "cover", position })
    .webp({ quality: 82 })
    .toFile(file);
  if (!(await verifiedImage(file))) throw new Error("optimized file failed validation");
}

async function cacheLane<T extends MediaRecordBase>(
  lane: MediaLane<T>,
  options: CliOptions,
): Promise<{ cached: number; skipped: number; failed: number; changed: boolean }> {
  const file = path.join(CANONICAL, lane.file);
  const manifest = readJson<MediaManifest<T>>(file);
  let remaining = options.limit;
  let cached = 0;
  let skipped = 0;
  let failed = 0;
  let changed = false;

  for (const record of manifest.records) {
    if (remaining === 0) break;
    const localPath = localPathFor(lane, record);
    const diskPath = diskPathFor(localPath);
    const alreadyValid = await verifiedImage(diskPath);

    if (!options.force && alreadyValid) {
      if (record.localPath !== localPath) {
        record.localPath = localPath;
        changed = true;
      }
      skipped++;
      continue;
    }

    if (options.reconcileOnly) {
      if (record.localPath === localPath) {
        delete record.localPath;
        changed = true;
      }
      skipped++;
      continue;
    }

    if (remaining != null) remaining--;
    if (options.delayMs > 0 && cached + failed > 0 && !record.manualPortraitSource) await sleep(options.delayMs);

    try {
      const bytes = await readSourceBytes(record, options);
      await writeOptimizedImage(bytes, diskPath);
      record.localPath = localPath;
      cached++;
      changed = true;
      const via = record.manualPortraitSource ? "manual portrait" : "remote";
      console.log(`cached ${lane.label}: ${lane.key(record)} (${via}) -> ${localPath}`);
    } catch (err) {
      if (record.localPath === localPath && !(await verifiedImage(diskPath))) {
        delete record.localPath;
        changed = true;
      }
      failed++;
      console.error(`WARN ${lane.label}: ${lane.key(record)}: ${err instanceof Error ? err.message : err}`);
    }
  }

  if (changed) {
    manifest.cachedAt = new Date().toISOString();
    writeJson(file, manifest);
  }
  return { cached, skipped, failed, changed };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  let totalCached = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  for (const lane of lanes) {
    const result = await cacheLane(lane, options);
    totalCached += result.cached;
    totalSkipped += result.skipped;
    totalFailed += result.failed;
  }

  console.log(`media cache: ${totalCached} cached, ${totalSkipped} already valid, ${totalFailed} failed`);
  if (totalFailed > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
