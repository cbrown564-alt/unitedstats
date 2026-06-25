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
const PREMIER_LEAGUE_ERA_START_YEAR = 1992;

/**
 * Players featured on editorial surfaces (e.g. the /questions cup-specialists
 * ladder) who fall outside the top-N appearance cohorts and would otherwise have
 * no portrait. Keyed by the players-table id used as the media join key, with an
 * explicit Wikipedia title so short-career stars resolve correctly. Names that
 * already appear in the top-N cohorts are harmless duplicates (deduped on id).
 */
const FEATURED_PLAYERS: { playerId: string; name: string; wikiTitle: string }[] = [
  { playerId: "casemiro", name: "Casemiro", wikiTitle: "Casemiro" },
  { playerId: "lee-sharpe", name: "Lee Sharpe", wikiTitle: "Lee Sharpe" },
  { playerId: "zlatan-ibrahimovic", name: "Zlatan Ibrahimović", wikiTitle: "Zlatan Ibrahimović" },
  { playerId: "javier-hernandez", name: "Javier Hernández", wikiTitle: "Javier Hernández" },
  { playerId: "john-connelly", name: "John Connelly", wikiTitle: "John Connelly (footballer, born 1938)" },
];

/**
 * Licensed Commons portraits chosen for era-appropriate likeness and framing.
 * Wikidata P18 often points at post-career or poorly cropped images; overrides
 * win when present. Re-run ingest:player-media after edits.
 */
const CURATED_COMMONS_OVERRIDES: Record<string, string> = {
  "denis-law": "Manu-Finland-1965.jpg",
  "ruud-van-nistelrooy": "Ruud.JPG",
  "cristiano-ronaldo": "Cristiano Ronaldo of Manchester United, November 5, 2008, B.jpg",
};

/** Hand-cropped portraits stored under public/media/sources/ — see cache:media. */
const MANUAL_PORTRAIT_SOURCES: Record<string, string> = {
  "denis-law": "/media/sources/denis-law-manu-finland.png",
};

interface FandomPortrait {
  playerId: string;
  file: string;
  imageUrl: string;
}

/** Player portraits from Football Wiki (Fandom) when Wikimedia has none. */
const FANDOM_PLAYER_PORTRAITS: FandomPortrait[] = [
  {
    playerId: "gary-pallister",
    file: "PALLISTER.png",
    imageUrl:
      "https://static.wikia.nocookie.net/the-football-database/images/4/4f/PALLISTER.png/revision/latest?cb=20140811135253",
  },
  {
    playerId: "lee-sharpe",
    file: "SHARPE.png",
    imageUrl:
      "https://static.wikia.nocookie.net/the-football-database/images/4/4a/SHARPE.png/revision/latest?cb=20140811135827",
  },
  {
    playerId: "mike-duxbury",
    file: "MDuxbury.png",
    imageUrl:
      "https://static.wikia.nocookie.net/the-football-database/images/d/d7/MDuxbury.png/revision/latest?cb=20180122201853",
  },
  {
    playerId: "mal-donaghy",
    file: "DONAGHY.png",
    imageUrl:
      "https://static.wikia.nocookie.net/the-football-database/images/9/98/DONAGHY.png/revision/latest?cb=20140811134120",
  },
  {
    playerId: "neil-webb",
    file: "Webb.png",
    imageUrl:
      "https://static.wikia.nocookie.net/the-football-database/images/f/f4/Webb.png/revision/latest?cb=20140706174303",
  },
  {
    playerId: "willie-morgan",
    file: "Morgan.png",
    imageUrl:
      "https://static.wikia.nocookie.net/the-football-database/images/b/b5/Morgan.png/revision/latest?cb=20140120191619",
  },
  {
    playerId: "kobbie-mainoo",
    file: "Kobbie_Mainoo.png",
    imageUrl:
      "https://static.wikia.nocookie.net/the-football-database/images/4/48/Kobbie_Mainoo.png/revision/latest?cb=20230106045237",
  },
];

const FANDOM_CREDIT = "Football Wiki (Fandom), The Football Database";
const FANDOM_LICENSE = "CC BY-SA 3.0";
const FANDOM_SOURCE_ID = "football-fandom";

function fandomPageUrl(file: string): string {
  return `https://football.fandom.com/wiki/File:${encodeURIComponent(file)}`;
}

function buildFandomPortraits(): Record<
  string,
  {
    manualPortraitSource: string;
    imageUrl: string;
    pageUrl: string;
    commonsFile: string;
    credit: string;
    license: string;
    sourceId: string;
  }
> {
  const out: Record<string, ReturnType<typeof buildFandomPortraits>[string]> = {};
  for (const portrait of FANDOM_PLAYER_PORTRAITS) {
    const manualPortraitSource = `/media/sources/${portrait.playerId}.png`;
    out[portrait.playerId] = {
      manualPortraitSource,
      imageUrl: portrait.imageUrl,
      pageUrl: fandomPageUrl(portrait.file),
      commonsFile: portrait.file,
      credit: FANDOM_CREDIT,
      license: FANDOM_LICENSE,
      sourceId: FANDOM_SOURCE_ID,
    };
    MANUAL_PORTRAIT_SOURCES[portrait.playerId] = manualPortraitSource;
  }
  return out;
}

/**
 * Portraits with no Wikimedia Commons file — cached locally from an attributed
 * third-party wiki. Re-run ingest:player-media after edits.
 */
const MANUAL_ONLY_PORTRAITS = buildFandomPortraits();
const COMMONS_THUMB_WIDTH = 320;
const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

type SourceMethod = "wikidata-p18" | "wikipedia-pageimage" | "curated-override" | "manual-portrait";

interface PlayerRecordsFile {
  records: {
    playerId: string;
    name: string;
    wikiTitle: string;
    career: string;
    firstYear: number | null;
    lastYear: number | null;
    apps: number;
    goals: number;
  }[];
}

interface WikiPage {
  title: string;
  pageprops?: {
    wikibase_item?: string;
  };
  pageimage?: string;
}

interface WikiQueryResponse {
  query?: {
    pages?: WikiPage[];
    normalized?: { from: string; to: string }[];
    redirects?: { from: string; to: string }[];
  };
  error?: { info?: string };
}

interface WikiPageImage extends WikiPage {
  thumbnail?: {
    source?: string;
  };
  original?: {
    source?: string;
  };
}

interface WikiPageImagesResponse {
  query?: {
    pages?: WikiPageImage[];
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
  overallRank: number | null;
  premierLeagueEraRank: number | null;
  playerId: string;
  name: string;
  wikiTitle: string;
  wikidataId: string | null;
  commonsFile: string;
  imageUrl: string;
  thumbUrl: string | null;
  pageUrl: string | null;
  license: string | null;
  artist: string | null;
  credit: string | null;
  sourceId: string;
  sourceMethod: SourceMethod;
  retrievedAt: string;
  manualPortraitSource?: string | null;
}

type PlayerRecord = PlayerRecordsFile["records"][number];

interface SelectedPlayer extends PlayerRecord {
  overallRank: number | null;
  premierLeagueEraRank: number | null;
}

function chunks<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function normalizeTitle(title: string): string {
  return title.replace(/_/g, " ").trim();
}

function commonsFileKey(file: string): string {
  return normalizeTitle(file).replace(/^File:/i, "");
}

function fileExtension(file: string): string {
  const clean = file.split("?")[0].split("#")[0];
  const ext = clean.match(/\.([a-z0-9]+)$/i)?.[1];
  return ext ? ext.toLowerCase() : "";
}

function byRecordRank(a: PlayerRecord, b: PlayerRecord): number {
  return b.apps - a.apps || b.goals - a.goals || a.name.localeCompare(b.name);
}

function selectTopPlayers(playerRecords: PlayerRecord[]): SelectedPlayer[] {
  const selected = new Map<string, SelectedPlayer>();

  const overall = playerRecords.slice().sort(byRecordRank).slice(0, TOP_N);
  for (const [index, player] of overall.entries()) {
    selected.set(player.playerId, {
      ...player,
      overallRank: index + 1,
      premierLeagueEraRank: null,
    });
  }

  const premierLeagueEra = playerRecords
    .filter((player) => (player.lastYear ?? Number.MAX_SAFE_INTEGER) >= PREMIER_LEAGUE_ERA_START_YEAR)
    .sort(byRecordRank)
    .slice(0, TOP_N);

  for (const [index, player] of premierLeagueEra.entries()) {
    const existing = selected.get(player.playerId);
    if (existing) {
      existing.premierLeagueEraRank = index + 1;
    } else {
      selected.set(player.playerId, {
        ...player,
        overallRank: null,
        premierLeagueEraRank: index + 1,
      });
    }
  }

  // Always include featured players, even when outside the appearance cohorts.
  const recordById = new Map(playerRecords.map((p) => [p.playerId, p]));
  for (const featured of FEATURED_PLAYERS) {
    if (selected.has(featured.playerId)) continue;
    const record = recordById.get(featured.playerId);
    selected.set(featured.playerId, {
      playerId: featured.playerId,
      name: featured.name,
      wikiTitle: featured.wikiTitle,
      career: record?.career ?? "",
      firstYear: record?.firstYear ?? null,
      lastYear: record?.lastYear ?? null,
      apps: record?.apps ?? 0,
      goals: record?.goals ?? 0,
      overallRank: null,
      premierLeagueEraRank: null,
    });
  }

  return [...selected.values()];
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function apiJson<T>(base: string, params: Record<string, string>, attempt = 1): Promise<T> {
  const url = new URL(base);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

  const res = await fetch(url, { headers: { "user-agent": USER_AGENT } });
  if (!res.ok) {
    if ((res.status === 429 || res.status >= 500) && attempt < 5) {
      const retryAfter = Number(res.headers.get("retry-after"));
      const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : attempt * 2000;
      await sleep(delay);
      return apiJson<T>(base, params, attempt + 1);
    }
    throw new Error(`${base} ${res.status} ${res.statusText}`);
  }
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

async function fetchWikipediaPageImages(players: SelectedPlayer[]): Promise<Map<string, { commonsFile: string; wikidataId: string | null }>> {
  const out = new Map<string, { commonsFile: string; wikidataId: string | null }>();

  for (const batch of chunks(players, 50)) {
    const json = await apiJson<WikiPageImagesResponse>("https://en.wikipedia.org/w/api.php", {
      action: "query",
      prop: "pageimages|pageprops",
      ppprop: "wikibase_item",
      piprop: "name|thumbnail|original",
      pithumbsize: String(COMMONS_THUMB_WIDTH),
      redirects: "1",
      titles: batch.map((player) => player.wikiTitle).join("|"),
      format: "json",
      formatversion: "2",
      origin: "*",
    });

    const pagesByTitle = new Map((json.query?.pages ?? []).map((page) => [normalizeTitle(page.title), page]));
    const normalized = new Map((json.query?.normalized ?? []).map((r) => [normalizeTitle(r.from), normalizeTitle(r.to)]));
    const redirects = new Map((json.query?.redirects ?? []).map((r) => [normalizeTitle(r.from), normalizeTitle(r.to)]));

    for (const player of batch) {
      const normalizedTitle = normalizeTitle(player.wikiTitle);
      const lookup = redirects.get(normalized.get(normalizedTitle) ?? normalizedTitle)
        ?? normalized.get(normalizedTitle)
        ?? normalizedTitle;
      const page = pagesByTitle.get(lookup) ?? pagesByTitle.get(normalizedTitle);
      const image = page?.pageimage;
      if (image && IMAGE_EXTENSIONS.has(fileExtension(image))) {
        out.set(player.playerId, {
          commonsFile: image,
          wikidataId: page?.pageprops?.wikibase_item ?? null,
        });
      }
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
      if (info?.url) out.set(commonsFileKey(file), info);
    }
  }

  return out;
}

async function main() {
  const playerRecords = readJson<PlayerRecordsFile>(path.join(CANONICAL, "player-records.json")).records;
  const topPlayers = selectTopPlayers(playerRecords);

  const qidsByTitle = await fetchWikidataIds(topPlayers.map((p) => p.wikiTitle));
  const filesByQid = await fetchCommonsFiles([...qidsByTitle.values()]);
  const pageImagesByPlayer = await fetchWikipediaPageImages(topPlayers);
  const selectedFiles = new Map<string, string>();
  for (const player of topPlayers) {
    const overrideFile = CURATED_COMMONS_OVERRIDES[player.playerId];
    if (overrideFile) selectedFiles.set(commonsFileKey(overrideFile), overrideFile);
    const wikidataId = qidsByTitle.get(player.wikiTitle);
    const wikidataFile = wikidataId ? filesByQid.get(wikidataId) : null;
    const pageImageFile = pageImagesByPlayer.get(player.playerId)?.commonsFile;
    const commonsFile = overrideFile ?? wikidataFile ?? pageImageFile;
    if (commonsFile) selectedFiles.set(commonsFileKey(commonsFile), commonsFile);
  }
  const metadataByFile = await fetchCommonsMetadata([...selectedFiles.values()]);
  const retrievedAt = new Date().toISOString();

  const records: MediaRecord[] = [];
  const missing: {
    playerId: string;
    name: string;
    wikiTitle: string;
    overallRank: number | null;
    premierLeagueEraRank: number | null;
    reason: string;
  }[] = [];

  for (const [index, player] of topPlayers.entries()) {
    const pageImage = pageImagesByPlayer.get(player.playerId);
    const wikidataId = qidsByTitle.get(player.wikiTitle) ?? pageImage?.wikidataId ?? null;
    const manualOnly = MANUAL_ONLY_PORTRAITS[player.playerId];
    if (manualOnly) {
      records.push({
        rank: index + 1,
        overallRank: player.overallRank,
        premierLeagueEraRank: player.premierLeagueEraRank,
        playerId: player.playerId,
        name: player.name,
        wikiTitle: player.wikiTitle,
        wikidataId,
        commonsFile: manualOnly.commonsFile,
        imageUrl: manualOnly.imageUrl,
        thumbUrl: null,
        pageUrl: manualOnly.pageUrl,
        license: manualOnly.license,
        artist: null,
        credit: manualOnly.credit,
        sourceId: manualOnly.sourceId,
        sourceMethod: "manual-portrait",
        retrievedAt,
        manualPortraitSource: manualOnly.manualPortraitSource,
      });
      continue;
    }
    const overrideFile = CURATED_COMMONS_OVERRIDES[player.playerId];
    const wikidataFile = wikidataId ? filesByQid.get(wikidataId) : null;
    const commonsFile = overrideFile ?? wikidataFile ?? pageImage?.commonsFile;
    if (!commonsFile) {
      missing.push({
        playerId: player.playerId,
        name: player.name,
        wikiTitle: player.wikiTitle,
        overallRank: player.overallRank,
        premierLeagueEraRank: player.premierLeagueEraRank,
        reason: "No raster Wikidata P18 image or Wikipedia pageimage found",
      });
      continue;
    }

    const info = metadataByFile.get(commonsFileKey(commonsFile));
    if (!info?.url) {
      missing.push({
        playerId: player.playerId,
        name: player.name,
        wikiTitle: player.wikiTitle,
        overallRank: player.overallRank,
        premierLeagueEraRank: player.premierLeagueEraRank,
        reason: "No Commons imageinfo URL returned",
      });
      continue;
    }

    const ext = info.extmetadata ?? {};
    records.push({
      rank: index + 1,
      overallRank: player.overallRank,
      premierLeagueEraRank: player.premierLeagueEraRank,
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
      sourceMethod: overrideFile ? "curated-override" : wikidataFile ? "wikidata-p18" : "wikipedia-pageimage",
      retrievedAt,
      ...(MANUAL_PORTRAIT_SOURCES[player.playerId]
        ? { manualPortraitSource: MANUAL_PORTRAIT_SOURCES[player.playerId] }
        : {}),
    });
  }

  writeJson(path.join(CANONICAL, "player-media.json"), {
    generatedAt: retrievedAt,
    sourceId: SOURCE_ID,
    sourceName: "Wikidata P18, Wikipedia pageimages, and Wikimedia Commons imageinfo",
    requestedTopPlayers: TOP_N,
    requestedTopPlayersPerCohort: TOP_N,
    selectedPlayers: topPlayers.length,
    ranking: [
      "Top players by verified competitive appearances in data/canonical/player-records.json.",
      `Premier League-era cohort means records whose United career reaches ${PREMIER_LEAGUE_ERA_START_YEAR} or later; source records do not split appearances by era.`,
    ],
    sourceUrls: [
      "https://www.wikidata.org/wiki/Property:P18",
      "https://www.mediawiki.org/wiki/API:Pageimages",
      "https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia",
    ],
    notes: [
      "Only raster Commons images are imported; SVG files are skipped because Next image optimization does not serve arbitrary SVGs by default.",
      "Wikidata P18 is preferred; Wikipedia pageimages are used only as a fallback and still require Commons imageinfo metadata.",
      "URLs and license metadata come from Wikimedia Commons imageinfo. Re-run this script to refresh license or thumbnail changes.",
      "Hand-cropped portraits live in public/media/sources/; MANUAL_PORTRAIT_SOURCES maps player ids to those files for cache:media.",
      "MANUAL_ONLY_PORTRAITS covers players with no Commons file; source metadata is recorded in-manifest and images are cached locally.",
    ],
    records,
    missing,
  });

  console.log(`wrote ${records.length}/${topPlayers.length} player media records (${missing.length} missing)`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
