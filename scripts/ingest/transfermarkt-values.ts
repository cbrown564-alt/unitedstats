/**
 * Enrich the transfer spine with market-value-at-the-time from the CC0
 * dcaribou/transfermarkt-datasets `player_valuations` table.
 *
 * mufcinfo (scripts/ingest/mufcinfo-transfers.ts) stays the authoritative spine
 * and the GBP fee of record; this lane only adds `marketValueEur` — the player's
 * Transfermarkt valuation closest to the transfer date — and never touches the
 * fee or creates transfers.
 *
 * The dataset's own `transfers` table is too sparse for United (it misses Pogba,
 * Fernandes, Maguire, …), so we instead use the half-million-row valuation time
 * series. It is keyed by Transfermarkt player id, which our canonical lineups
 * already carry: the transfermarkt-datasets lineup lane stamped each United player
 * with their numeric `providerId`, so we map canonical player → TM id from there
 * (no fragile name matching) and take the valuation nearest each transfer date.
 *
 * Coverage is therefore the modern, lineup-covered era (2013-14→present); older
 * moves resolve to no value, which is correct rather than guessed.
 *
 * Usage:
 *   tsx scripts/ingest/transfermarkt-values.ts            # dry run
 *   tsx scripts/ingest/transfermarkt-values.ts --write
 *   tsx scripts/ingest/transfermarkt-values.ts --write --refresh
 */
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { Readable } from "node:stream";
import zlib from "node:zlib";
import {
  CANONICAL, RAW, listSeasonFiles, loadSeasonFile, parseCsvLine, readJson, userAgent, writeJson,
} from "../lib";

const BASE_URL = "https://pub-e682421888d945d684bcae8890b0ec20.r2.dev/data";
const CACHE = path.join(RAW, "transfermarkt-datasets");
const SOURCE_ID = "transfermarkt-datasets";
const WRITE = process.argv.includes("--write");
const REFRESH = process.argv.includes("--refresh");
const USER_AGENT = userAgent("transfermarkt-values ingest");

// Valuations are stamped roughly twice a year, so the one nearest a transfer is
// normally within a few months; a year's window covers a quiet spell without
// reaching into a different phase of a long career.
const DATE_WINDOW_DAYS = 365;

interface Transfer {
  id: string;
  player: string | null;
  playerName: string;
  direction: "in" | "out";
  date: string | null;
  datePrecision: string | null;
  dateRaw: string | null;
  season: string | null;
  club: string | null;
  clubId: string | null;
  fee: { gbp: number | null; raw: string | null; kind: string };
  marketValueEur?: number | null;
  type: string;
  sources: string[];
}

interface Valuation {
  date: string;
  mv: number;
}

/**
 * canonical player id → Transfermarkt numeric id, learned from the providerId the
 * lineup lane stamped on United players. The most-stamped numeric id per player
 * wins (a player only ever has one TM id; this just ignores any stray value).
 */
function buildProviderIdMap(): Map<string, string> {
  const tally = new Map<string, Map<string, number>>();
  for (const file of listSeasonFiles()) {
    const sf = loadSeasonFile(file.replace(".json", ""));
    for (const match of sf.matches) {
      for (const entry of match.lineup ?? []) {
        if (entry.playerSide && entry.playerSide !== "united") continue;
        if (!entry.player || !entry.providerId) continue;
        const providerId = String(entry.providerId);
        if (!/^\d+$/.test(providerId)) continue;
        const counts = tally.get(entry.player) ?? tally.set(entry.player, new Map()).get(entry.player)!;
        counts.set(providerId, (counts.get(providerId) ?? 0) + 1);
      }
    }
  }
  const map = new Map<string, string>();
  for (const [player, counts] of tally) {
    const best = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    if (best) map.set(player, best[0]);
  }
  return map;
}

async function ensureCached(): Promise<string> {
  const file = path.join(CACHE, "player_valuations.csv.gz");
  if (fs.existsSync(file) && !REFRESH) return file;
  fs.mkdirSync(CACHE, { recursive: true });
  const res = await fetch(`${BASE_URL}/player_valuations.csv.gz`, { headers: { "user-agent": USER_AGENT } });
  if (!res.ok || !res.body) throw new Error(`transfermarkt-datasets ${res.status} ${res.statusText}: player_valuations`);
  const temp = `${file}.tmp`;
  fs.rmSync(temp, { force: true });
  await new Promise<void>((resolve, reject) => {
    Readable.fromWeb(res.body as never)
      .on("error", reject)
      .pipe(fs.createWriteStream(temp))
      .on("error", reject)
      .on("finish", resolve);
  });
  fs.renameSync(temp, file);
  return file;
}

/** Valuation time series for the wanted TM ids, each ascending by date. */
async function loadValuations(file: string, wanted: Set<string>): Promise<Map<string, Valuation[]>> {
  const input = fs.createReadStream(file).pipe(zlib.createGunzip());
  const rl = readline.createInterface({ input, crlfDelay: Infinity });
  let header: string[] | null = null;
  const byId = new Map<string, Valuation[]>();
  for await (const line of rl) {
    if (header === null) {
      header = parseCsvLine(line);
      continue;
    }
    const cells = parseCsvLine(line);
    const row: Record<string, string> = {};
    header.forEach((h, i) => { row[h] = cells[i] ?? ""; });
    if (!wanted.has(row.player_id)) continue;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row.date)) continue;
    const mv = Math.round(parseFloat(row.market_value_in_eur));
    if (!Number.isFinite(mv) || mv <= 0) continue;
    (byId.get(row.player_id) ?? byId.set(row.player_id, []).get(row.player_id)!).push({ date: row.date, mv });
  }
  for (const series of byId.values()) series.sort((a, b) => a.date.localeCompare(b.date));
  return byId;
}

function daysBetween(a: string, b: string): number {
  return Math.abs((Date.parse(a) - Date.parse(b)) / 86_400_000);
}

/** The valuation closest to `date`, or null if the nearest is outside the window. */
function nearestValuation(series: Valuation[], date: string): number | null {
  let best: Valuation | null = null;
  let bestGap = Infinity;
  for (const v of series) {
    const gap = daysBetween(v.date, date);
    if (gap < bestGap) {
      bestGap = gap;
      best = v;
    }
  }
  return best && bestGap <= DATE_WINDOW_DAYS ? best.mv : null;
}

async function main() {
  const providerIds = buildProviderIdMap();
  const wanted = new Set(providerIds.values());
  const valuations = await loadValuations(await ensureCached(), wanted);

  const transfersFile = path.join(CANONICAL, "transfers.json");
  const file = readJson<{ transfers: Transfer[] }>(transfersFile);

  let eligible = 0;
  let filled = 0;
  let alreadySet = 0;
  const examples: string[] = [];

  for (const t of file.transfers) {
    if (!t.player || !t.date) continue;
    const tmId = providerIds.get(t.player);
    if (!tmId) continue;
    const series = valuations.get(tmId);
    if (!series) continue;
    eligible++;
    const mv = nearestValuation(series, t.date);
    if (mv == null) continue;
    if (t.marketValueEur != null) {
      alreadySet++;
      continue;
    }
    filled++;
    if (examples.length < 8) {
      examples.push(`${t.direction} ${t.date} ${t.playerName} €${(mv / 1e6).toFixed(1)}m`);
    }
    if (WRITE) {
      t.marketValueEur = mv;
      if (!t.sources.includes(SOURCE_ID)) t.sources.push(SOURCE_ID);
    }
  }

  if (WRITE) writeJson(transfersFile, file);

  console.log(
    `transfermarkt-values ${WRITE ? "write" : "dry-run"}: ` +
      `${providerIds.size} United players mapped to a TM id, ${valuations.size} with a valuation series; ` +
      `${filled} market values ${WRITE ? "filled" : "fillable"} across ${eligible} eligible transfers` +
      `${alreadySet ? ` (${alreadySet} already set)` : ""}.`,
  );
  for (const e of examples) console.log(`  ${e}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
