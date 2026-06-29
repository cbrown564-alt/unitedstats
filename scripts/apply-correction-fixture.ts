import fs from "node:fs";
import path from "node:path";
import { assertValidCorrectionPayload, type CorrectionPayload } from "../lib/corrections";

interface Args {
  fixture: string;
  canonical: string;
}

function parseArgs(argv: string[]): Args {
  const fixture = argv.find((arg) => !arg.startsWith("--"));
  const canonicalFlag = argv.indexOf("--canonical");
  const canonical = canonicalFlag >= 0 ? argv[canonicalFlag + 1] : "data/canonical";
  if (!fixture) throw new Error("usage: tsx scripts/apply-correction-fixture.ts <fixture.json> --canonical <dir>");
  if (!canonical) throw new Error("--canonical requires a directory");
  return { fixture, canonical };
}

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, "utf8")) as T;
}

function writeJson(file: string, value: unknown): void {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function setTypedValue(container: Record<string, unknown>, key: string, proposedValue: string): void {
  const current = container[key];
  if (typeof current === "number") {
    const next = Number(proposedValue);
    if (!Number.isFinite(next)) throw new Error(`proposed value for ${key} must be numeric`);
    container[key] = next;
    return;
  }
  if (typeof current === "boolean") {
    if (proposedValue !== "true" && proposedValue !== "false") throw new Error(`proposed value for ${key} must be true or false`);
    container[key] = proposedValue === "true";
    return;
  }
  if (current === null && proposedValue === "null") {
    container[key] = null;
    return;
  }
  container[key] = proposedValue;
}

function applyMatchCorrection(canonical: string, payload: CorrectionPayload): string {
  const match = /^matches\[id=([^\]]+)\]\.(.+)$/.exec(payload.fieldPath);
  if (!match) throw new Error(`unsupported match field path: ${payload.fieldPath}`);
  const [, matchId, rest] = match;
  const matchesDir = path.join(canonical, "matches");
  for (const file of fs.readdirSync(matchesDir).filter((name) => name.endsWith(".json")).sort()) {
    const full = path.join(matchesDir, file);
    const season = readJson<{ matches: Record<string, unknown>[] }>(full);
    const m = season.matches.find((row) => row.id === matchId);
    if (!m) continue;

    const event = /^events\[(\d+)\]\.(.+)$/.exec(rest);
    if (event) {
      const events = m.events as Record<string, unknown>[] | undefined;
      if (!events) throw new Error(`${matchId} has no events array`);
      const index = Number(event[1]);
      const row = events[index];
      if (!row) throw new Error(`${matchId} has no event at index ${index}`);
      setTypedValue(row, event[2], payload.proposedValue);
    } else {
      setTypedValue(m, rest, payload.proposedValue);
    }
    writeJson(full, season);
    return full;
  }
  throw new Error(`match ${matchId} not found`);
}

function applyPlayerCorrection(canonical: string, payload: CorrectionPayload): string {
  const match = /^players\[id=([^\]]+)\]\.(.+)$/.exec(payload.fieldPath);
  if (!match) throw new Error(`unsupported player field path: ${payload.fieldPath}`);
  const [, playerId, key] = match;
  const file = path.join(canonical, "players.json");
  const data = readJson<{ players: Record<string, unknown>[] }>(file);
  const player = data.players.find((row) => row.id === playerId);
  if (!player) throw new Error(`player ${playerId} not found`);
  setTypedValue(player, key, payload.proposedValue);
  writeJson(file, data);
  return file;
}

const args = parseArgs(process.argv.slice(2));
const payload = readJson<CorrectionPayload>(args.fixture);
assertValidCorrectionPayload(payload);
const changed =
  payload.target.kind === "player"
    ? applyPlayerCorrection(args.canonical, payload)
    : applyMatchCorrection(args.canonical, payload);
console.log(`applied correction fixture to ${changed}`);
