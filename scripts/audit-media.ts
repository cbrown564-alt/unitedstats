/**
 * Scan player and manager media manifests for portrait quality issues.
 *
 * Usage:
 *   npm run audit:media
 *   npm run audit:media -- --json
 *   npm run audit:media -- --strict
 */
import path from "node:path";
import { CANONICAL, readJson } from "./lib";

const ERA_TOLERANCE_YEARS = 5;
const MATCH_STYLE_MIN_STEM_LENGTH = 35;

interface MediaRecord {
  playerId?: string;
  managerId?: string;
  name?: string;
  commonsFile?: string | null;
  localPath?: string | null;
  sourceMethod?: string;
}

interface MediaManifest {
  records: MediaRecord[];
  missing?: { playerId?: string; key?: string; name?: string }[];
}

interface PlayerRecord {
  playerId: string;
  name: string;
  lastYear: number | null;
}

interface AuditSubject {
  lane: "player" | "manager";
  subjectId: string;
  name: string;
  commonsFile: string;
  sourceMethod?: string;
}

interface EraMismatchFlag extends AuditSubject {
  maxYearInFilename: number;
  lastYear: number;
  threshold: number;
}

interface NonPortraitFlag extends AuditSubject {
  reasons: string[];
}

interface MissingLocalPathFlag extends AuditSubject {}

interface DuplicateCommonsFileFlag {
  commonsFile: string;
  subjects: { lane: "player" | "manager"; subjectId: string; name: string }[];
}

interface CuratedOverrideCandidate extends AuditSubject {
  reasons: string[];
}

interface AuditReport {
  summary: {
    playerRecords: number;
    managerRecords: number;
    eraMismatch: number;
    nonPortrait: number;
    missingLocalPath: number;
    duplicateCommonsFile: number;
    curatedOverrideCandidates: number;
  };
  eraMismatch: EraMismatchFlag[];
  nonPortrait: NonPortraitFlag[];
  missingLocalPath: MissingLocalPathFlag[];
  duplicateCommonsFile: DuplicateCommonsFileFlag[];
  curatedOverrideCandidates: CuratedOverrideCandidate[];
}

function parseArgs(argv: string[]): { json: boolean; strict: boolean } {
  const json = argv.includes("--json");
  const strict = argv.includes("--strict");
  const unknown = argv.filter((arg) => arg !== "--json" && arg !== "--strict");
  if (unknown.length) throw new Error(`Unknown argument: ${unknown.join(" ")}`);
  return { json, strict };
}

function subjectFromRecord(lane: "player" | "manager", record: MediaRecord): AuditSubject | null {
  const subjectId = lane === "player" ? record.playerId : record.managerId;
  if (!subjectId || !record.commonsFile) return null;
  return {
    lane,
    subjectId,
    name: record.name ?? subjectId,
    commonsFile: record.commonsFile,
    sourceMethod: record.sourceMethod,
  };
}

/** Pull plausible calendar years from a Commons filename. */
export function extractYearsFromFilename(filename: string): number[] {
  const matches = filename.match(/\b(?:18|19|20)\d{2}\b/g);
  return matches ? [...new Set(matches.map(Number))] : [];
}

const NON_PORTRAIT_KEYWORDS = ["Summit", "statue", "West Ham", "Everton", "Leipzig", "Rennes"] as const;

const MATCH_STYLE_SUFFIX =
  /\(\d{1,3}\)(?:\s+\(cropped(?:\s+\d{1,3})?\))?\.(?:jpg|jpeg|png|webp)$/i;

/** Heuristic signals that a Commons filename is a match/event photo, not a portrait. */
export function nonPortraitReasons(commonsFile: string): string[] {
  const reasons: string[] = [];
  if (/\s v\s/i.test(commonsFile)) reasons.push('contains " v "');
  if (/\s vs\.?\s/i.test(commonsFile)) reasons.push('contains " vs " or " vs."');
  for (const keyword of NON_PORTRAIT_KEYWORDS) {
    if (commonsFile.includes(keyword)) reasons.push(`contains "${keyword}"`);
  }
  const stem = commonsFile.replace(/\.[^.]+$/, "");
  if (stem.length >= MATCH_STYLE_MIN_STEM_LENGTH && MATCH_STYLE_SUFFIX.test(commonsFile)) {
    reasons.push("match-style long filename");
  }
  return reasons;
}

function loadPlayerLastYears(): Map<string, number | null> {
  const file = path.join(CANONICAL, "player-records.json");
  const data = readJson<{ records: PlayerRecord[] }>(file);
  return new Map(data.records.map((record) => [record.playerId, record.lastYear]));
}

function auditManifests(): AuditReport {
  const playerManifest = readJson<MediaManifest>(path.join(CANONICAL, "player-media.json"));
  const managerManifest = readJson<MediaManifest>(path.join(CANONICAL, "manager-media.json"));
  const playerLastYears = loadPlayerLastYears();

  const eraMismatch: EraMismatchFlag[] = [];
  const nonPortrait: NonPortraitFlag[] = [];
  const missingLocalPath: MissingLocalPathFlag[] = [];
  const curatedOverrideCandidates: CuratedOverrideCandidate[] = [];

  const commonsIndex = new Map<string, { lane: "player" | "manager"; subjectId: string; name: string }[]>();

  for (const record of playerManifest.records) {
    const subject = subjectFromRecord("player", record);
    if (!subject) continue;

    const reasons = nonPortraitReasons(subject.commonsFile);
    if (reasons.length) nonPortrait.push({ ...subject, reasons });

    const years = extractYearsFromFilename(subject.commonsFile);
    const lastYear = playerLastYears.get(subject.subjectId);
    if (years.length && lastYear != null) {
      const maxYear = Math.max(...years);
      const threshold = lastYear + ERA_TOLERANCE_YEARS;
      if (maxYear > threshold) {
        eraMismatch.push({ ...subject, maxYearInFilename: maxYear, lastYear, threshold });
      }
    }

    if (!record.localPath) missingLocalPath.push(subject);

    if (record.sourceMethod === "wikidata-p18" && reasons.length) {
      curatedOverrideCandidates.push({ ...subject, reasons });
    }

    const bucket = commonsIndex.get(subject.commonsFile) ?? [];
    bucket.push({ lane: subject.lane, subjectId: subject.subjectId, name: subject.name });
    commonsIndex.set(subject.commonsFile, bucket);
  }

  for (const record of managerManifest.records) {
    const subject = subjectFromRecord("manager", record);
    if (!subject) continue;

    const reasons = nonPortraitReasons(subject.commonsFile);
    if (reasons.length) nonPortrait.push({ ...subject, reasons });

    if (!record.localPath) missingLocalPath.push(subject);

    if (record.sourceMethod === "wikidata-p18" && reasons.length) {
      curatedOverrideCandidates.push({ ...subject, reasons });
    }

    const bucket = commonsIndex.get(subject.commonsFile) ?? [];
    bucket.push({ lane: subject.lane, subjectId: subject.subjectId, name: subject.name });
    commonsIndex.set(subject.commonsFile, bucket);
  }

  const duplicateCommonsFile: DuplicateCommonsFileFlag[] = [];
  for (const [commonsFile, entries] of commonsIndex) {
    const uniqueIds = new Set(entries.map((entry) => `${entry.lane}:${entry.subjectId}`));
    if (uniqueIds.size > 1) duplicateCommonsFile.push({ commonsFile, subjects: entries });
  }
  duplicateCommonsFile.sort((a, b) => a.commonsFile.localeCompare(b.commonsFile));

  return {
    summary: {
      playerRecords: playerManifest.records.length,
      managerRecords: managerManifest.records.length,
      eraMismatch: eraMismatch.length,
      nonPortrait: nonPortrait.length,
      missingLocalPath: missingLocalPath.length,
      duplicateCommonsFile: duplicateCommonsFile.length,
      curatedOverrideCandidates: curatedOverrideCandidates.length,
    },
    eraMismatch,
    nonPortrait,
    missingLocalPath,
    duplicateCommonsFile,
    curatedOverrideCandidates,
  };
}

function printHumanReport(report: AuditReport): void {
  const { summary } = report;
  console.log("media audit summary");
  console.log(`  scanned: ${summary.playerRecords} player, ${summary.managerRecords} manager records`);
  console.log(`  era mismatch: ${summary.eraMismatch}`);
  console.log(`  non-portrait filename: ${summary.nonPortrait}`);
  console.log(`  missing localPath: ${summary.missingLocalPath}`);
  console.log(`  duplicate commonsFile: ${summary.duplicateCommonsFile}`);
  console.log(`  wikidata-p18 needing override: ${summary.curatedOverrideCandidates}`);

  if (report.eraMismatch.length) {
    console.log(`\nera mismatch (${report.eraMismatch.length})`);
    for (const item of report.eraMismatch) {
      console.log(
        `  ${item.lane} ${item.subjectId}: ${item.commonsFile} (max year ${item.maxYearInFilename} > career ${item.lastYear} + ${ERA_TOLERANCE_YEARS})`,
      );
    }
  }

  if (report.nonPortrait.length) {
    console.log(`\nnon-portrait filename (${report.nonPortrait.length})`);
    for (const item of report.nonPortrait) {
      console.log(`  ${item.lane} ${item.subjectId}: ${item.commonsFile} (${item.reasons.join("; ")})`);
    }
  }

  if (report.missingLocalPath.length) {
    console.log(`\nmissing localPath (${report.missingLocalPath.length})`);
    for (const item of report.missingLocalPath) {
      console.log(`  ${item.lane} ${item.subjectId}: ${item.commonsFile}`);
    }
  }

  if (report.duplicateCommonsFile.length) {
    console.log(`\nduplicate commonsFile (${report.duplicateCommonsFile.length})`);
    for (const item of report.duplicateCommonsFile) {
      const ids = item.subjects.map((s) => `${s.lane}:${s.subjectId}`).join(", ");
      console.log(`  ${item.commonsFile}: ${ids}`);
    }
  }

  if (report.curatedOverrideCandidates.length) {
    console.log(`\nwikidata-p18 needing override (${report.curatedOverrideCandidates.length})`);
    for (const item of report.curatedOverrideCandidates) {
      console.log(`  ${item.lane} ${item.subjectId}: ${item.commonsFile} (${item.reasons.join("; ")})`);
    }
  }
}

function main() {
  const { json, strict } = parseArgs(process.argv.slice(2));
  const report = auditManifests();

  if (json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printHumanReport(report);
  }

  if (strict && (report.summary.eraMismatch > 0 || report.summary.nonPortrait > 0)) {
    process.exit(1);
  }
}

main();
