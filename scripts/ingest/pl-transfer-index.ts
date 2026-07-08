/**
 * Build a Premier League football-inflation index in the Sky Sports style:
 * each season's mean disclosed transfer fee (GBP) vs a base season.
 *
 * Corpus (priority per season: scrape → seed):
 *   1. transfermarkt.co.uk PL transfers page per season (1992–2024, authoritative)
 *   2. tim-hy/tmarkt-transfers premier-league.csv (1992–93 → 2022–23 fallback)
 *
 * United's own fee_gbp spine is untouched — this lane only feeds the league index.
 *
 * Usage:
 *   tsx scripts/ingest/pl-transfer-index.ts
 *   tsx scripts/ingest/pl-transfer-index.ts --write
 *   tsx scripts/ingest/pl-transfer-index.ts --write --scrape
 *   tsx scripts/ingest/pl-transfer-index.ts --write --scrape --refresh
 */
import fs from "node:fs";
import path from "node:path";
import { CANONICAL, RAW, userAgent, writeJson } from "../lib";

const SEED_URL =
  "https://raw.githubusercontent.com/tim-hy/tmarkt-transfers/master/data/premier-league.csv";
const TM_UK_BASE =
  "https://www.transfermarkt.co.uk/premier-league/transfers/wettbewerb/GB1/saison_id";
const CACHE = path.join(RAW, "pl-transfers");
const SCRAPE_CACHE = path.join(CACHE, "tm-uk");
const OUT = path.join(CANONICAL, "pl-football-inflation.json");
const WRITE = process.argv.includes("--write");
const REFRESH = process.argv.includes("--refresh");
const SCRAPE = process.argv.includes("--scrape");
const USER_AGENT = userAgent("pl-transfer-index ingest");

const BASE_SEASON = "2024-25";
const PL_START = "1992-93";
const MAX_SEASON = "2024-25";
const MIN_FEE_GBP = 10_000;
const SCRAPE_DELAY_MS = 1_500;

/** BoE approximate annual average EUR/GBP — season start year → rate. */
const EUR_GBP: Record<number, number> = {
  1992: 0.78, 1993: 0.85, 1994: 0.81, 1995: 0.85, 1996: 0.83, 1997: 0.69,
  1998: 0.70, 1999: 0.66, 2000: 0.61, 2001: 0.61, 2002: 0.66, 2003: 0.70,
  2004: 0.68, 2005: 0.68, 2006: 0.68, 2007: 0.69, 2008: 0.79, 2009: 0.91,
  2010: 0.85, 2011: 0.87, 2012: 0.81, 2013: 0.85, 2014: 0.81, 2015: 0.73,
  2016: 0.82, 2017: 0.88, 2018: 0.88, 2019: 0.88, 2020: 0.89, 2021: 0.86,
  2022: 0.85, 2023: 0.87, 2024: 0.85,
};

export type PlFeeSource = "transfermarkt-uk-scrape" | "tmarkt-seed";

export interface PlTransferFee {
  season: string;
  feeGbp: number;
  source: PlFeeSource;
}

/** TM saison_id start year → canonical season label. */
export function saisonIdToSeason(startYear: number): string {
  const end = String((startYear + 1) % 100).padStart(2, "0");
  return `${startYear}-${end}`;
}

/** tim-hy "1992/1993" or "1992/93" → "1992-93". */
export function tmHySeasonToCanonical(season: string): string | null {
  const m = season.match(/(\d{4})\/(\d{2,4})/);
  if (!m) return null;
  const end = m[2]!.length === 2 ? m[2]! : m[2]!.slice(-2);
  return `${m[1]}-${end}`;
}

export function seasonStartYear(season: string): number {
  return Number.parseInt(season.slice(0, 4), 10);
}

export function eurToGbp(eur: number, year: number): number {
  const rate = EUR_GBP[year] ?? EUR_GBP[2024]!;
  return Math.round(eur * rate);
}

function parseCsvRow(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (const ch of line) {
    if (ch === '"') {
      quoted = !quoted;
      continue;
    }
    if (ch === "," && !quoted) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}

function parseMoneyToken(raw: string): { amount: number; currency: "GBP" | "EUR" } | null {
  const text = raw.trim();
  if (!text || /loan|free|-/i.test(text)) return null;
  const gbpM = text.match(/£([0-9.,]+)m/i);
  if (gbpM) {
    return { amount: parseFloat(gbpM[1]!.replace(",", "")) * 1_000_000, currency: "GBP" };
  }
  const eurM = text.match(/€([0-9.,]+)m/i);
  if (eurM) {
    return { amount: parseFloat(eurM[1]!.replace(",", "")) * 1_000_000, currency: "EUR" };
  }
  const gbpK = text.match(/£([0-9.,]+)k/i);
  if (gbpK) {
    return { amount: parseFloat(gbpK[1]!.replace(",", "")) * 1_000, currency: "GBP" };
  }
  const eurK = text.match(/€([0-9.,]+)k/i);
  if (eurK) {
    return { amount: parseFloat(eurK[1]!.replace(",", "")) * 1_000, currency: "EUR" };
  }
  return null;
}

/**
 * Parse disclosed fees from a transfermarkt.co.uk PL season page.
 * Sky's index uses all disclosed PL moves (arrivals and departures).
 */
export function parseTmUkFees(html: string, year: number): number[] {
  const fees: number[] = [];
  const tables = html.split("<thead>");
  for (const chunk of tables.slice(1)) {
    const headerEnd = chunk.indexOf("</thead>");
    const header = chunk.slice(0, headerEnd);
    const body = chunk.slice(headerEnd);
    const isTransferTable = header.includes(">Joined<") || header.includes(">Left<");
    if (!isTransferTable) continue;

    const re = /<td class="rechts "><a href="\/jumplist\/transfers[^"]*">([^<]+)<\/a><\/td>/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(body))) {
      const parsed = parseMoneyToken(m[1]!);
      if (!parsed) continue;
      const feeGbp =
        parsed.currency === "GBP" ? Math.round(parsed.amount) : eurToGbp(parsed.amount, year);
      if (feeGbp >= MIN_FEE_GBP) fees.push(feeGbp);
    }
  }
  return fees;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureSeed(): Promise<string> {
  const file = path.join(CACHE, "tmarkt-premier-league.csv");
  if (fs.existsSync(file) && !REFRESH) return file;
  fs.mkdirSync(CACHE, { recursive: true });
  const res = await fetch(SEED_URL, { headers: { "user-agent": USER_AGENT } });
  if (!res.ok) throw new Error(`tmarkt-seed ${res.status} ${res.statusText}`);
  fs.writeFileSync(file, await res.text());
  return file;
}

function loadSeedFees(file: string): PlTransferFee[] {
  const text = fs.readFileSync(file, "utf8");
  const lines = text.split("\n").filter(Boolean);
  const header = parseCsvRow(lines[0]!);
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));
  const fees: PlTransferFee[] = [];

  for (const line of lines.slice(1)) {
    const row = parseCsvRow(line);
    const season = tmHySeasonToCanonical(row[idx.season!] ?? "");
    const feeRaw = row[idx.fee] ?? "";
    const feeM = Number.parseFloat(row[idx.fee_cleaned!] ?? "");
    if (!season || season < PL_START || season > MAX_SEASON) continue;
    if (/loan/i.test(feeRaw)) continue;
    if (!Number.isFinite(feeM) || feeM <= 0) continue;
    const year = seasonStartYear(season);
    const feeGbp = eurToGbp(feeM * 1_000_000, year);
    if (feeGbp < MIN_FEE_GBP) continue;
    fees.push({ season, feeGbp, source: "tmarkt-seed" });
  }

  return fees;
}

async function fetchSeasonHtml(startYear: number): Promise<string> {
  const file = path.join(SCRAPE_CACHE, `${startYear}.html`);
  if (fs.existsSync(file) && !REFRESH) return fs.readFileSync(file, "utf8");

  if (!SCRAPE) {
    throw new Error(
      `missing cached scrape for ${saisonIdToSeason(startYear)} — run with --scrape`,
    );
  }

  fs.mkdirSync(SCRAPE_CACHE, { recursive: true });
  const res = await fetch(`${TM_UK_BASE}/${startYear}`, {
    headers: { "user-agent": USER_AGENT, accept: "text/html" },
  });
  if (!res.ok) throw new Error(`transfermarkt-uk ${startYear} ${res.status} ${res.statusText}`);
  const html = await res.text();
  fs.writeFileSync(file, html);
  await sleep(SCRAPE_DELAY_MS);
  return html;
}

async function loadScrapedFees(): Promise<PlTransferFee[]> {
  const fees: PlTransferFee[] = [];
  const firstYear = seasonStartYear(PL_START);
  const lastYear = seasonStartYear(MAX_SEASON);

  for (let year = firstYear; year <= lastYear; year++) {
    const season = saisonIdToSeason(year);
    let html: string | null = null;
    const cacheFile = path.join(SCRAPE_CACHE, `${year}.html`);
    if (fs.existsSync(cacheFile) && !REFRESH) {
      html = fs.readFileSync(cacheFile, "utf8");
    } else if (SCRAPE) {
      html = await fetchSeasonHtml(year);
    } else {
      continue;
    }

    const feeGbps = parseTmUkFees(html, year);
    for (const feeGbp of feeGbps) {
      fees.push({ season, feeGbp, source: "transfermarkt-uk-scrape" });
    }
  }

  return fees;
}

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function buildSeasonStats(fees: PlTransferFee[]): Map<string, number[]> {
  const bySeason = new Map<string, number[]>();
  for (const f of fees) {
    (bySeason.get(f.season) ?? bySeason.set(f.season, []).get(f.season)!).push(f.feeGbp);
  }
  return bySeason;
}

/** Scrape seasons replace seed rows for the same season. */
export function mergeFeeCorpus(seed: PlTransferFee[], scraped: PlTransferFee[]): PlTransferFee[] {
  const scrapedSeasons = new Set(scraped.map((f) => f.season));
  const merged = seed.filter((f) => !scrapedSeasons.has(f.season));
  merged.push(...scraped);
  return merged;
}

export function buildInflationIndex(
  bySeason: Map<string, number[]>,
  baseSeason: string,
): {
  baseSeason: string;
  earliestSeason: string;
  seasons: Record<string, { count: number; meanGbp: number; factor: number }>;
} {
  const seasons: Record<string, { count: number; meanGbp: number; factor: number }> = {};
  const keys = [...bySeason.keys()].sort();
  const baseFees = bySeason.get(baseSeason);
  if (!baseFees?.length) {
    throw new Error(`base season ${baseSeason} has no fee'd transfers`);
  }
  const baseMean = mean(baseFees);

  for (const season of keys) {
    const fees = bySeason.get(season)!;
    if (fees.length === 0) continue;
    const meanGbp = mean(fees);
    seasons[season] = {
      count: fees.length,
      meanGbp: Math.round(meanGbp),
      factor: baseMean / meanGbp,
    };
  }

  return {
    baseSeason,
    earliestSeason: keys.find((k) => (bySeason.get(k)?.length ?? 0) > 0) ?? baseSeason,
    seasons,
  };
}

async function main() {
  const seedFile = await ensureSeed();
  const seedFees = loadSeedFees(seedFile);
  const scrapedFees = await loadScrapedFees();
  const corpus = mergeFeeCorpus(seedFees, scrapedFees);
  const bySeason = buildSeasonStats(corpus);
  const index = buildInflationIndex(bySeason, BASE_SEASON);

  const scrapeSeasons = new Set(scrapedFees.map((f) => f.season)).size;
  const payload = {
    source:
      "Sky Sports-style PL mean fee index (transfermarkt.co.uk scrape + tim-hy seed fallback)",
    method:
      "Mean disclosed permanent transfer fee per PL season in GBP; adjusted fee = nominal × (base mean ÷ season mean). Loans excluded.",
    plEraStart: PL_START,
    corpusSize: corpus.length,
    scrapeSeasons,
    ...index,
  };

  if (WRITE) writeJson(OUT, payload);

  const examples = [
    ["2006-07", 30_800_000],
    ["2002-03", 29_000_000],
  ] as const;
  console.log(
    `pl-transfer-index ${WRITE ? "write" : "dry-run"}: ${corpus.length} fees, ` +
      `${scrapeSeasons} scraped seasons, ${Object.keys(index.seasons).length} indexed ` +
      `(${index.earliestSeason}→${BASE_SEASON})`,
  );
  for (const [season, nominal] of examples) {
    const row = index.seasons[season];
    if (!row) continue;
    console.log(
      `  ${season}: mean £${(row.meanGbp / 1e6).toFixed(2)}m ×${row.factor.toFixed(2)} → ` +
        `£${Math.round((nominal * row.factor) / 1e6)}m example`,
    );
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
