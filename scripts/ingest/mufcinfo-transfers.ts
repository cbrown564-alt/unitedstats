/**
 * Player transfer history from the MUFCInfo decade archive — the in/out spine
 * for United transfers, 1883 (Newton Heath) to present.
 *
 * Source: https://www.mufcinfo.com/manupag/transfers/transfers.htm, split into
 * fifteen decade pages. Each transfer is a table row of five cells:
 *
 *   [0] direction   <img src=".../transfers_images/arrival.jpg" alt="Arrival">
 *   [1] portrait     <img src=".../portraits/pogba_paul.jpg" alt="Paul Pogba">
 *   [2] name link    <a href=".../a-z_player_archive_pages/...">Paul Pogba</a>
 *   [3] nationality   flag image
 *   [4] details      " Transferred to Juventus, 03/07/2012, £?m"
 *
 * Direction comes from the arrival/departure image (authoritative); the details
 * cell carries club, date and fee. Fees are GBP and frequently incomplete
 * ("£??", "£undisclosed", "£") — those are kept as a kind, never as £0. Youth
 * intakes read "Signed Trainee: …/Signed Professional: …" with no club or fee.
 *
 * The player-name LINK href is unreliable (some rows point at the wrong archive
 * page), so the visible link text / portrait alt is the name of record, resolved
 * to a canonical players.json id via the shared career-window resolver. Signings
 * who never debuted resolve to `player: null` and keep only `playerName`.
 *
 * Pages cache to data/raw/mufcinfo/transfers/<slug>.html (gitignored); nothing is
 * refetched unless --refresh is passed.
 *
 * Usage:
 *   tsx scripts/ingest/mufcinfo-transfers.ts --decade 2010 --inspect   # dry, print rows
 *   tsx scripts/ingest/mufcinfo-transfers.ts all                       # dry summary
 *   tsx scripts/ingest/mufcinfo-transfers.ts all --write               # -> transfers.json
 */
import fs from "node:fs";
import path from "node:path";
import { CANONICAL, RAW, readJson, seasonOfDate, slugify, userAgent, writeJson } from "../lib";
import {
  createPlayerResolver, displayName, htmlDecode, normalizedSlug,
  type PlayerRecord, type PlayersFile,
} from "../player-resolver";

const SOURCE_ID = "mufcinfo-transfers";
const BASE_URL = "https://www.mufcinfo.com/manupag/transfers/transfers_pages";
const USER_AGENT = userAgent("mufcinfo-transfers-ingest");
const CACHE = path.join(RAW, "mufcinfo", "transfers");
const WRITE = process.argv.includes("--write");
const REFRESH = process.argv.includes("--refresh");
const INSPECT = process.argv.includes("--inspect");

// Decade page slugs, verbatim from the archive index (filenames are not uniform:
// the Newton Heath years and the 1900s changeover carry different stems).
const DECADES = [
  "1883-1889_newton_heath_transfers",
  "1890-1899_newton_heath_transfers",
  "1900-1909_newton_heath_-_manchester_united_transfers",
  "1910-1919_manchester_united_transfers",
  "1920-1929_manchester_united_transfers",
  "1930-1939_manchester_united_transfers",
  "1940-1949_manchester_united_transfers",
  "1950-1959_manchester_united_transfers",
  "1960-1969_manchester_united_transfers",
  "1970-1979_manchester_united_transfers",
  "1980-1989_manchester_united_transfers",
  "1990-1999_manchester_united_transfers",
  "2000-2009_manchester_united_transfers",
  "2010-2019_manchester_united_transfers",
  "2020-2029_manchester_united_transfers",
];

type Direction = "in" | "out";
type FeeKind = "fee" | "free" | "undisclosed" | "unknown" | "none";
type TransferType = "permanent" | "loan" | "youth" | "released" | "retired";

interface Fee {
  gbp: number | null;
  raw: string | null;
  kind: FeeKind;
}

interface Transfer {
  id: string;
  player: string | null;
  playerName: string;
  direction: Direction;
  date: string | null;       // ISO, best-effort (month-only dates padded to -01)
  datePrecision: "day" | "month" | "year" | null;
  dateRaw: string | null;
  season: string | null;
  club: string | null;       // the other club (from-club for in, to-club for out)
  clubId: string | null;
  fee: Fee;
  type: TransferType;
  sources: string[];
}

interface TransfersFile {
  transfers: Transfer[];
}

interface ParseStats {
  rows: number;
  resolved: number;
  unresolved: string[];
  feeKinds: Record<FeeKind, number>;
  types: Record<TransferType, number>;
  noDetails: number;
}

function stringArg(flag: string): string | null {
  const index = process.argv.indexOf(flag);
  if (index < 0) return null;
  const value = process.argv[index + 1];
  return value && !value.startsWith("--") ? value : null;
}

function usage(): never {
  console.error(
    "usage: tsx scripts/ingest/mufcinfo-transfers.ts all | --decade <substr> [--inspect] [--write] [--refresh]",
  );
  process.exit(1);
}

function selectedDecades(): string[] {
  const filter = stringArg("--decade");
  if (!filter) {
    if (process.argv.includes("all")) return DECADES;
    return usage();
  }
  const matches = DECADES.filter((d) => d.includes(filter));
  return matches.length ? matches : usage();
}

async function decadeHtml(slug: string): Promise<string> {
  const file = path.join(CACHE, `${slug}.html`);
  if (fs.existsSync(file) && !REFRESH) return fs.readFileSync(file, "utf8");
  fs.mkdirSync(CACHE, { recursive: true });
  const res = await fetch(`${BASE_URL}/${slug}.htm`, { headers: { "user-agent": USER_AGENT } });
  if (!res.ok) throw new Error(`MUFCInfo ${res.status} ${res.statusText}: ${slug}`);
  const html = await res.text();
  fs.writeFileSync(file, html, "utf8");
  return html;
}

/** Decode a details cell, turning &pound; into a literal £ before tags are stripped. */
function detailText(cell: string): string {
  return htmlDecode(cell.replace(/&pound;/gi, "£"));
}

/**
 * The visible player name in display form: link text first, portrait alt as
 * fallback. `displayName` flips the occasional "Surname, First" link label.
 */
function rowPlayerName(block: string): string | null {
  const link = block.match(/a-z_player_archive_pages\/[^"]+\.html"[^>]*>\s*([^<]+?)\s*<\/a>/i);
  if (link && htmlDecode(link[1])) return displayName(link[1]);
  const alt = block.match(/portraits\/[^"]+\.jpg"[^>]*\balt="([^"]+)"/i)
    ?? block.match(/\balt="([^"]+)"[^>]*src="[^"]*portraits\//i);
  return alt ? displayName(alt[1]) : null;
}

/** The details cell — the one carrying transfer prose, not the name link. */
function rowDetails(block: string): string | null {
  const cells = block.split(/<td\b/i).slice(1);
  for (const cell of cells) {
    if (/a-z_player_archive_pages/i.test(cell)) continue; // skip the name cell
    if (/Transferred|Signed\s+(?:Trainee|Professional)|Loan|Released|Retired/i.test(cell)) {
      return detailText(cell);
    }
  }
  return null;
}

function parseDate(text: string): { iso: string | null; precision: Transfer["datePrecision"]; raw: string | null } {
  const full = text.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/);
  if (full) {
    const [, d, m, y] = full;
    return { iso: `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`, precision: "day", raw: full[0] };
  }
  const monthYear = text.match(/\b(\d{1,2})\/(\d{4})\b/);
  if (monthYear) {
    const [, m, y] = monthYear;
    return { iso: `${y}-${m.padStart(2, "0")}-01`, precision: "month", raw: monthYear[0] };
  }
  const yearOnly = text.match(/\b(\d{4})\b/);
  if (yearOnly) return { iso: `${yearOnly[1]}-07-01`, precision: "year", raw: yearOnly[1] };
  return { iso: null, precision: null, raw: null };
}

function parseFee(text: string, type: TransferType): Fee {
  const rawMatch = text.match(/£[^,<\n]*/);
  const raw = rawMatch ? rawMatch[0].replace(/\s+/g, " ").trim() : null;

  if (type === "youth") return { gbp: null, raw, kind: "none" };
  if (/\bfree\b|bosman/i.test(text)) return { gbp: null, raw: raw ?? "Free", kind: "free" };

  const num = text.match(/£\s*([\d]+(?:[.,]\d+)?)\s*([mkb])?/i);
  if (num) {
    const value = parseFloat(num[1].replace(/,/g, ""));
    const unit = (num[2] ?? "").toLowerCase();
    const scale = unit === "b" ? 1e9 : unit === "m" ? 1e6 : unit === "k" ? 1e3 : 1;
    return { gbp: Math.round(value * scale), raw, kind: "fee" };
  }
  if (/undisclosed/i.test(text)) return { gbp: null, raw, kind: "undisclosed" };
  return { gbp: null, raw, kind: "unknown" };
}

function classifyType(text: string): TransferType {
  if (/Signed\s+(?:Trainee|Professional)|\bTrainee\b/i.test(text)) return "youth";
  if (/Retired/i.test(text)) return "retired";
  if (/Released/i.test(text)) return "released";
  // A loan move — but not a permanent deal that merely mentions a loan add-on
  // clause, e.g. "£16m + Nani loan" (Rojo's transfer included loaning Nani out).
  if (/\bloan\b/i.test(text) && !/\+[^.]*\bloan\b/i.test(text)) return "loan";
  return "permanent";
}

function cleanClub(raw: string): string | null {
  const club = raw.replace(/\s+/g, " ").trim();
  // Reject placeholders the archive uses when the club is unknown ("?", "??", "-").
  return club && /[a-z]/i.test(club) ? club : null;
}

function parseClub(text: string): string | null {
  const transfer = text.match(/Transferred\s+(?:to|from):?\s*(.+?)\s*,\s*\d/i);
  if (transfer) return cleanClub(transfer[1]);
  const loan = text.match(/loan\s+(?:to|from)\s+(.+?)\s*(?:,|$)/i);
  if (loan) return cleanClub(loan[1]);
  return null;
}

function rowBlocks(html: string): string[] {
  return html
    .split(/<tr\b/i)
    .slice(1)
    .map((chunk) => chunk.split(/<\/tr>/i)[0])
    .filter((block) => /transfers_images\/(?:arrival|departure)/i.test(block));
}

function parseDecade(
  html: string,
  resolve: (name: string, year: number) => string | null,
  stats: ParseStats,
  seen: Set<string>,
): Transfer[] {
  const transfers: Transfer[] = [];
  for (const block of rowBlocks(html)) {
    const direction: Direction = /arrival\.jpg/i.test(block) ? "in" : "out";
    const name = rowPlayerName(block);
    if (!name) continue;
    stats.rows++;

    const details = rowDetails(block);
    if (!details) stats.noDetails++;
    const text = details ?? "";

    const type = classifyType(text);
    const { iso, precision, raw: dateRaw } = parseDate(text);
    const fee = parseFee(text, type);
    const club = parseClub(text);
    const year = iso ? parseInt(iso.slice(0, 4), 10) : 0;
    const player = resolve(name, year);

    if (player) stats.resolved++;
    else stats.unresolved.push(name);
    stats.feeKinds[fee.kind]++;
    stats.types[type]++;

    const slug = normalizedSlug(name);
    let id = `${iso ?? "undated"}-${slug}-${direction}`;
    for (let n = 2; seen.has(id); n++) id = `${iso ?? "undated"}-${slug}-${direction}-${n}`;
    seen.add(id);

    transfers.push({
      id,
      player,
      playerName: name,
      direction,
      date: iso,
      datePrecision: precision,
      dateRaw,
      season: iso ? seasonOfDate(iso) : null,
      club,
      clubId: club ? slugify(club) : null,
      fee,
      type,
      sources: [SOURCE_ID],
    });
  }
  return transfers;
}

function formatTransfer(t: Transfer): string {
  const arrow = t.direction === "in" ? "←" : "→";
  const fee = t.fee.kind === "fee" && t.fee.gbp != null ? `£${(t.fee.gbp / 1e6).toFixed(1)}m` : (t.fee.raw ?? t.fee.kind);
  const flag = t.player ? "  " : " ??";
  return `  ${(t.date ?? "????-??-??").padEnd(10)} ${arrow} ${t.playerName.padEnd(24)} ${(t.club ?? "—").padEnd(28)} ${String(fee).padEnd(14)} ${t.type}${flag}`;
}

async function main() {
  const decades = selectedDecades();
  const playersFile = readJson<PlayersFile>(path.join(CANONICAL, "players.json"));
  const records = readJson<{ records: PlayerRecord[] }>(path.join(CANONICAL, "player-records.json")).records;
  const resolver = createPlayerResolver(playersFile, records);
  const resolve = (name: string, year: number): string | null =>
    resolver.resolve(name, null, year)?.playerId ?? null;

  const stats: ParseStats = {
    rows: 0,
    resolved: 0,
    unresolved: [],
    feeKinds: { fee: 0, free: 0, undisclosed: 0, unknown: 0, none: 0 },
    types: { permanent: 0, loan: 0, youth: 0, released: 0, retired: 0 },
    noDetails: 0,
  };
  const seen = new Set<string>();
  const all: Transfer[] = [];

  for (const slug of decades) {
    const html = await decadeHtml(slug);
    const transfers = parseDecade(html, resolve, stats, seen);
    all.push(...transfers);
    if (INSPECT) {
      console.log(`\n=== ${slug} (${transfers.length} rows) ===`);
      for (const t of transfers) console.log(formatTransfer(t));
    }
  }

  all.sort((a, b) => (a.date ?? "9999").localeCompare(b.date ?? "9999") || a.id.localeCompare(b.id));

  console.log(
    `\nmufcinfo-transfers ${WRITE ? "write" : "dry-run"}: ${stats.rows} rows ` +
      `(${all.filter((t) => t.direction === "in").length} in, ${all.filter((t) => t.direction === "out").length} out); ` +
      `${stats.resolved} resolved, ${stats.unresolved.length} unresolved; ${stats.noDetails} without a details cell`,
  );
  console.log(`  fee kinds: ${Object.entries(stats.feeKinds).map(([k, v]) => `${k}=${v}`).join(" ")}`);
  console.log(`  types: ${Object.entries(stats.types).map(([k, v]) => `${k}=${v}`).join(" ")}`);
  if (stats.unresolved.length) {
    console.log(`  unresolved (${stats.unresolved.length}): ${stats.unresolved.slice(0, 40).join(", ")}${stats.unresolved.length > 40 ? " …" : ""}`);
  }

  if (WRITE) {
    const out: TransfersFile = { transfers: all };
    writeJson(path.join(CANONICAL, "transfers.json"), out);
    console.log(`\nwrote ${all.length} transfers to data/canonical/transfers.json`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
