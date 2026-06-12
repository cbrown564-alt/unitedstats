/**
 * Build a licensed player image manifest for the top Manchester United player
 * records. Wikidata P18 points to Wikimedia Commons files, then Commons
 * imageinfo supplies reusable URLs plus license/attribution metadata.
 *
 * Usage:
 *   npm run ingest:player-media
 */
import path from "node:path";
import { CANONICAL, readJson, writeJson } from "../lib";

const USER_AGENT = "unitedstats/1.0 player-media ingest";
const SOURCE_ID = "wikidata-commons";
const TOP_N = 100;
const COMMONS_THUMB_WIDTH = 320;
const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

interface PlayerRecordsFile {
  records: {
    playerId: string;
    name: string;
    wikiTitle: string;
    apps: number;
    goals: number;
  }[];
}

interface WikiPage {
  title: string;
  pageprops?: {
    wikibase_item?: string;
  };
}

interface WikiQueryResponse {
  query?: {
    pages?: WikiPage[];
    normalized?: { from: string; to: string }[];
    redirects?: { from: string; to: string }[];
  };
  error?: { info?: string };
}

interface WikidataClaim {
  mainsnak?: {
    datavalue?: {
      value?: string;
    };
  };
}

interface WikidataResponse {
  entities?: Record<string, {
    claims?: {
      P18?: WikidataClaim[];
    };
  }>;
  error?: { info?: string };
}

interface CommonsPage {
  title: string;
  imageinfo?: {
    url?: string;
    thumburl?: string;
    descriptionurl?: string;
    extmetadata?: Record<string, { value?: string }>;
  }[];
}

type CommonsImageInfo = NonNullable<CommonsPage["imageinfo"]>[number];

interface CommonsResponse {
  query?: {
    pages?: CommonsPage[];
  };
  error?: { info?: string };
}

interface MediaRecord {
  rank: number;
  playerId: string;
  name: string;
  wikiTitle: string;
  wikidataId: string;
  commonsFile: string;
  imageUrl: string;
  thumbUrl: string | null;
  pageUrl: string | null;
  license: string | null;
  artist: string | null;
  credit: string | null;
  sourceId: string;
  retrievedAt: string;
}

function chunks<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function normalizeTitle(title: string): string {
  return title.replace(/_/g, " ").trim();
}

function fileExtension(file: string): string {
  const clean = file.split("?")[0].split("#")[0];
  const ext = clean.match(/\.([a-z0-9]+)$/i)?.[1];
  return ext ? ext.toLowerCase() : "";
}

function stripHtml(value: string | undefined): string | null {
  if (!value) return null;
  const stripped = value
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
  return stripped || null;
}

async function apiJson<T>(base: string, params: Record<string, string>): Promise<T> {
  const url = new URL(base);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

  const res = await fetch(url, { headers: { "user-agent": USER_AGENT } });
  if (!res.ok) throw new Error(`${base} ${res.status} ${res.statusText}`);
  const json = await res.json() as T & { error?: { info?: string } };
  if (json.error) throw new Error(json.error.info ?? "API error");
  return json;
}

async function fetchWikidataIds(titles: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();

  for (const batch of chunks(titles, 50)) {
    const json = await apiJson<WikiQueryResponse>("https://en.wikipedia.org/w/api.php", {
      action: "query",
      prop: "pageprops",
      ppprop: "wikibase_item",
      redirects: "1",
      titles: batch.join("|"),
      format: "json",
      formatversion: "2",
      origin: "*",
    });

    const pageQids = new Map<string, string>();
    for (const page of json.query?.pages ?? []) {
      const qid = page.pageprops?.wikibase_item;
      if (qid) pageQids.set(normalizeTitle(page.title), qid);
    }

    const normalized = new Map((json.query?.normalized ?? []).map((r) => [normalizeTitle(r.from), normalizeTitle(r.to)]));
    const redirects = new Map((json.query?.redirects ?? []).map((r) => [normalizeTitle(r.from), normalizeTitle(r.to)]));

    for (const title of batch) {
      const normalizedTitle = normalizeTitle(title);
      const lookup = redirects.get(normalized.get(normalizedTitle) ?? normalizedTitle)
        ?? normalized.get(normalizedTitle)
        ?? normalizedTitle;
      const qid = pageQids.get(lookup) ?? pageQids.get(normalizedTitle);
      if (qid) out.set(title, qid);
    }
  }

  return out;
}

async function fetchCommonsFiles(qids: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();

  for (const batch of chunks(qids, 50)) {
    const json = await apiJson<WikidataResponse>("https://www.wikidata.org/w/api.php", {
      action: "wbgetentities",
      ids: batch.join("|"),
      props: "claims",
      format: "json",
      origin: "*",
    });

    for (const qid of batch) {
      const image = json.entities?.[qid]?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
      if (image && IMAGE_EXTENSIONS.has(fileExtension(image))) out.set(qid, image);
    }
  }

  return out;
}

async function fetchCommonsMetadata(files: string[]): Promise<Map<string, CommonsImageInfo>> {
  const out = new Map<string, CommonsImageInfo>();

  for (const batch of chunks(files, 25)) {
    const titles = batch.map((file) => `File:${file}`);
    const json = await apiJson<CommonsResponse>("https://commons.wikimedia.org/w/api.php", {
      action: "query",
      prop: "imageinfo",
      titles: titles.join("|"),
      iiprop: "url|extmetadata",
      iiurlwidth: String(COMMONS_THUMB_WIDTH),
      format: "json",
      formatversion: "2",
      origin: "*",
    });

    for (const page of json.query?.pages ?? []) {
      const file = page.title.replace(/^File:/, "");
      const info = page.imageinfo?.[0];
      if (info?.url) out.set(file, info);
    }
  }

  return out;
}

async function main() {
  const playerRecords = readJson<PlayerRecordsFile>(path.join(CANONICAL, "player-records.json")).records;
  const topPlayers = playerRecords
    .slice()
    .sort((a, b) => b.apps - a.apps || b.goals - a.goals || a.name.localeCompare(b.name))
    .slice(0, TOP_N);

  const qidsByTitle = await fetchWikidataIds(topPlayers.map((p) => p.wikiTitle));
  const filesByQid = await fetchCommonsFiles([...qidsByTitle.values()]);
  const metadataByFile = await fetchCommonsMetadata([...filesByQid.values()]);
  const retrievedAt = new Date().toISOString();

  const records: MediaRecord[] = [];
  const missing: { playerId: string; name: string; wikiTitle: string; reason: string }[] = [];

  for (const [index, player] of topPlayers.entries()) {
    const wikidataId = qidsByTitle.get(player.wikiTitle);
    if (!wikidataId) {
      missing.push({ playerId: player.playerId, name: player.name, wikiTitle: player.wikiTitle, reason: "No Wikidata entity found from enwiki page" });
      continue;
    }

    const commonsFile = filesByQid.get(wikidataId);
    if (!commonsFile) {
      missing.push({ playerId: player.playerId, name: player.name, wikiTitle: player.wikiTitle, reason: "No raster P18 image on Wikidata" });
      continue;
    }

    const info = metadataByFile.get(commonsFile);
    if (!info?.url) {
      missing.push({ playerId: player.playerId, name: player.name, wikiTitle: player.wikiTitle, reason: "No Commons imageinfo URL returned" });
      continue;
    }

    const ext = info.extmetadata ?? {};
    records.push({
      rank: index + 1,
      playerId: player.playerId,
      name: player.name,
      wikiTitle: player.wikiTitle,
      wikidataId,
      commonsFile,
      imageUrl: info.url,
      thumbUrl: info.thumburl ?? null,
      pageUrl: info.descriptionurl ?? null,
      license: stripHtml(ext.LicenseShortName?.value ?? ext.UsageTerms?.value),
      artist: stripHtml(ext.Artist?.value),
      credit: stripHtml(ext.Credit?.value),
      sourceId: SOURCE_ID,
      retrievedAt,
    });
  }

  writeJson(path.join(CANONICAL, "player-media.json"), {
    generatedAt: retrievedAt,
    sourceId: SOURCE_ID,
    sourceName: "Wikidata P18 and Wikimedia Commons imageinfo",
    requestedTopPlayers: TOP_N,
    ranking: "Top players by verified competitive appearances in data/canonical/player-records.json.",
    sourceUrls: [
      "https://www.wikidata.org/wiki/Property:P18",
      "https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia",
    ],
    notes: [
      "Only raster Commons images are imported; SVG files are skipped because Next image optimization does not serve arbitrary SVGs by default.",
      "URLs and license metadata come from Wikimedia Commons imageinfo. Re-run this script to refresh license or thumbnail changes.",
    ],
    records,
    missing,
  });

  console.log(`wrote ${records.length}/${TOP_N} player media records (${missing.length} missing)`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
