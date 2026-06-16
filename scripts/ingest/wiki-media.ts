/**
 * Shared Wikimedia image resolver. Given subjects identified by a Wikipedia
 * article title, it resolves a reusable Wikimedia Commons image plus license /
 * attribution metadata, preferring Wikidata P18 and falling back to the
 * Wikipedia pageimage. This is the same pipeline used for player portraits,
 * reused for managers and own-goal scorers.
 */
import { userAgent } from "../lib";

const COMMONS_THUMB_WIDTH = 320;
const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

type SourceMethod = "wikidata-p18" | "wikipedia-pageimage";

export interface MediaSubject {
  /** Stable key the caller uses to look the result back up (id, name, …). */
  key: string;
  /** Wikipedia article title to resolve. */
  wikiTitle: string;
}

interface ResolvedMedia {
  key: string;
  wikiTitle: string;
  wikidataId: string | null;
  commonsFile: string;
  imageUrl: string;
  thumbUrl: string | null;
  pageUrl: string | null;
  license: string | null;
  artist: string | null;
  credit: string | null;
  sourceMethod: SourceMethod;
}

interface WikiPage {
  title: string;
  pageprops?: { wikibase_item?: string };
  pageimage?: string;
}
interface WikiQueryResponse {
  query?: { pages?: WikiPage[]; normalized?: { from: string; to: string }[]; redirects?: { from: string; to: string }[] };
  error?: { info?: string };
}
interface WikidataClaim { mainsnak?: { datavalue?: { value?: string } } }
interface WikidataResponse {
  entities?: Record<string, { claims?: { P18?: WikidataClaim[] } }>;
  error?: { info?: string };
}
interface CommonsPage {
  title: string;
  imageinfo?: { url?: string; thumburl?: string; descriptionurl?: string; extmetadata?: Record<string, { value?: string }> }[];
}
type CommonsImageInfo = NonNullable<CommonsPage["imageinfo"]>[number];
interface CommonsResponse { query?: { pages?: CommonsPage[] }; error?: { info?: string } }

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

const UA = userAgent("media ingest");

async function apiJson<T>(base: string, params: Record<string, string>, attempt = 1): Promise<T> {
  const url = new URL(base);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

  const res = await fetch(url, { headers: { "user-agent": UA } });
  if (!res.ok) {
    if ((res.status === 429 || res.status >= 500) && attempt < 5) {
      const retryAfter = Number(res.headers.get("retry-after"));
      const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : attempt * 2000;
      await sleep(delay);
      return apiJson<T>(base, params, attempt + 1);
    }
    throw new Error(`${base} ${res.status} ${res.statusText}`);
  }
  const json = (await res.json()) as T & { error?: { info?: string } };
  if (json.error) throw new Error(json.error.info ?? "API error");
  return json;
}

/** Resolve each title to a Wikidata QID via Wikipedia pageprops. */
async function fetchWikidataIds(titles: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  for (const batch of chunks(titles, 50)) {
    const json = await apiJson<WikiQueryResponse>("https://en.wikipedia.org/w/api.php", {
      action: "query", prop: "pageprops", ppprop: "wikibase_item", redirects: "1",
      titles: batch.join("|"), format: "json", formatversion: "2", origin: "*",
    });
    const pageQids = new Map<string, string>();
    for (const page of json.query?.pages ?? []) {
      const qid = page.pageprops?.wikibase_item;
      if (qid) pageQids.set(normalizeTitle(page.title), qid);
    }
    const normalized = new Map((json.query?.normalized ?? []).map((r) => [normalizeTitle(r.from), normalizeTitle(r.to)]));
    const redirects = new Map((json.query?.redirects ?? []).map((r) => [normalizeTitle(r.from), normalizeTitle(r.to)]));
    for (const title of batch) {
      const nt = normalizeTitle(title);
      const lookup = redirects.get(normalized.get(nt) ?? nt) ?? normalized.get(nt) ?? nt;
      const qid = pageQids.get(lookup) ?? pageQids.get(nt);
      if (qid) out.set(title, qid);
    }
  }
  return out;
}

/** Wikidata P18 (image) Commons filename per QID. */
async function fetchCommonsFiles(qids: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  for (const batch of chunks(qids, 50)) {
    const json = await apiJson<WikidataResponse>("https://www.wikidata.org/w/api.php", {
      action: "wbgetentities", ids: batch.join("|"), props: "claims", format: "json", origin: "*",
    });
    for (const qid of batch) {
      const image = json.entities?.[qid]?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
      if (image && IMAGE_EXTENSIONS.has(fileExtension(image))) out.set(qid, image);
    }
  }
  return out;
}

/** Wikipedia pageimage fallback, keyed by subject key. */
async function fetchPageImages(
  subjects: MediaSubject[],
): Promise<Map<string, { commonsFile: string; wikidataId: string | null }>> {
  const out = new Map<string, { commonsFile: string; wikidataId: string | null }>();
  for (const batch of chunks(subjects, 50)) {
    const json = await apiJson<WikiQueryResponse & { query?: { pages?: (WikiPage & { thumbnail?: unknown })[] } }>(
      "https://en.wikipedia.org/w/api.php",
      {
        action: "query", prop: "pageimages|pageprops", ppprop: "wikibase_item",
        piprop: "name|thumbnail|original", pithumbsize: String(COMMONS_THUMB_WIDTH), redirects: "1",
        titles: batch.map((s) => s.wikiTitle).join("|"), format: "json", formatversion: "2", origin: "*",
      },
    );
    const pagesByTitle = new Map((json.query?.pages ?? []).map((page) => [normalizeTitle(page.title), page]));
    const normalized = new Map((json.query?.normalized ?? []).map((r) => [normalizeTitle(r.from), normalizeTitle(r.to)]));
    const redirects = new Map((json.query?.redirects ?? []).map((r) => [normalizeTitle(r.from), normalizeTitle(r.to)]));
    for (const subject of batch) {
      const nt = normalizeTitle(subject.wikiTitle);
      const lookup = redirects.get(normalized.get(nt) ?? nt) ?? normalized.get(nt) ?? nt;
      const page = pagesByTitle.get(lookup) ?? pagesByTitle.get(nt);
      const image = page?.pageimage;
      if (image && IMAGE_EXTENSIONS.has(fileExtension(image))) {
        out.set(subject.key, { commonsFile: image, wikidataId: page?.pageprops?.wikibase_item ?? null });
      }
    }
  }
  return out;
}

/** Commons imageinfo (URL + license metadata) per file. */
async function fetchCommonsMetadata(files: string[]): Promise<Map<string, CommonsImageInfo>> {
  const out = new Map<string, CommonsImageInfo>();
  for (const batch of chunks(files, 25)) {
    const titles = batch.map((file) => `File:${file}`);
    const json = await apiJson<CommonsResponse>("https://commons.wikimedia.org/w/api.php", {
      action: "query", prop: "imageinfo", titles: titles.join("|"),
      iiprop: "url|extmetadata", iiurlwidth: String(COMMONS_THUMB_WIDTH),
      format: "json", formatversion: "2", origin: "*",
    });
    for (const page of json.query?.pages ?? []) {
      const file = page.title.replace(/^File:/, "");
      const info = page.imageinfo?.[0];
      if (info?.url) out.set(commonsFileKey(file), info);
    }
  }
  return out;
}

export interface ResolveResult {
  records: ResolvedMedia[];
  missing: { key: string; wikiTitle: string; reason: string }[];
}

/** Resolve Commons media for a batch of titled subjects. */
export async function resolveMedia(subjects: MediaSubject[]): Promise<ResolveResult> {
  const titles = [...new Set(subjects.map((s) => s.wikiTitle))];
  const qidsByTitle = await fetchWikidataIds(titles);
  const filesByQid = await fetchCommonsFiles([...new Set(qidsByTitle.values())]);
  const pageImagesByKey = await fetchPageImages(subjects);

  const selectedFiles = new Map<string, string>();
  for (const subject of subjects) {
    const wikidataFile = qidsByTitle.get(subject.wikiTitle) ? filesByQid.get(qidsByTitle.get(subject.wikiTitle)!) : null;
    const file = wikidataFile ?? pageImagesByKey.get(subject.key)?.commonsFile;
    if (file) selectedFiles.set(commonsFileKey(file), file);
  }
  const metadataByFile = await fetchCommonsMetadata([...selectedFiles.values()]);

  const records: ResolvedMedia[] = [];
  const missing: ResolveResult["missing"] = [];
  for (const subject of subjects) {
    const pageImage = pageImagesByKey.get(subject.key);
    const wikidataId = qidsByTitle.get(subject.wikiTitle) ?? pageImage?.wikidataId ?? null;
    const wikidataFile = wikidataId ? filesByQid.get(wikidataId) : null;
    const commonsFile = wikidataFile ?? pageImage?.commonsFile;
    if (!commonsFile) {
      missing.push({ key: subject.key, wikiTitle: subject.wikiTitle, reason: "No Wikidata P18 image or Wikipedia pageimage found" });
      continue;
    }
    const info = metadataByFile.get(commonsFileKey(commonsFile));
    if (!info?.url) {
      missing.push({ key: subject.key, wikiTitle: subject.wikiTitle, reason: "No Commons imageinfo URL returned" });
      continue;
    }
    const ext = info.extmetadata ?? {};
    records.push({
      key: subject.key,
      wikiTitle: subject.wikiTitle,
      wikidataId,
      commonsFile,
      imageUrl: info.url,
      thumbUrl: info.thumburl ?? null,
      pageUrl: info.descriptionurl ?? null,
      license: stripHtml(ext.LicenseShortName?.value ?? ext.UsageTerms?.value),
      artist: stripHtml(ext.Artist?.value),
      credit: stripHtml(ext.Credit?.value),
      sourceMethod: wikidataFile ? "wikidata-p18" : "wikipedia-pageimage",
    });
  }
  return { records, missing };
}
