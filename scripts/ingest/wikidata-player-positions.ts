/**
 * Primary playing position per player, from Wikidata property P413 ("position
 * played on team / speciality"). The hook is the enwiki sitelink we already store
 * on every player record (`wikiTitle`, 100% populated): we resolve each title to a
 * Wikidata QID via the Wikipedia pageprops API (following redirects/normalisation),
 * then read P413 off the entity. This is dramatically better than lineup-derived
 * roles, which cover only ~33% of the register and resolve the pre-1990 legends
 * from a handful of games (Charlton's modal lineup role is "Outside Left" from a
 * single appearance). Wikidata returns Charlton's listed midfielder + forward, Best
 * as a winger, Schmeichel as a goalkeeper.
 *
 * We keep the *primary* position — Wikidata's preferred-ranked claim, else the first
 * normal one — collapsed into one of four buckets (GK / DEF / MID / FWD) for a single
 * scannable glyph, but also record every listed bucket and the raw label/QID for
 * provenance. Players whose entity has no P413 are written to `missing` and simply
 * carry no glyph downstream (render only the facets the data can fill).
 *
 * Usage:
 *   npm run ingest:player-positions
 */
import path from "node:path";
import { CANONICAL, readJson, writeJson } from "../lib";

const USER_AGENT = "unitedstats/1.0 player-positions ingest";
const SOURCE_ID = "wikidata-positions";

type Bucket = "GK" | "DEF" | "MID" | "FWD";

interface PlayerRecordsFile {
  records: {
    playerId: string;
    name: string;
    wikiTitle?: string | null;
  }[];
}

interface WikiQueryResponse {
  query?: {
    pages?: { title: string; pageprops?: { wikibase_item?: string } }[];
    normalized?: { from: string; to: string }[];
    redirects?: { from: string; to: string }[];
  };
  error?: { info?: string };
}

interface WikidataClaim {
  mainsnak?: { datavalue?: { value?: { id?: string } } };
  rank?: "preferred" | "normal" | "deprecated";
}

interface WikidataEntitiesResponse {
  entities?: Record<string, {
    claims?: { P413?: WikidataClaim[] };
    labels?: { en?: { value?: string } };
  }>;
  error?: { info?: string };
}

function chunks<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function normalizeTitle(title: string): string {
  return title.replace(/_/g, " ").trim();
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

/** Resolve enwiki titles → Wikidata QIDs, following normalisation and redirects. */
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

const RANK_ORDER: Record<string, number> = { preferred: 0, normal: 1, deprecated: 2 };

/** P413 position QIDs per entity, ordered preferred → normal, deprecated dropped. */
async function fetchPositionQids(qids: string[]): Promise<Map<string, string[]>> {
  const out = new Map<string, string[]>();

  for (const batch of chunks(qids, 50)) {
    const json = await apiJson<WikidataEntitiesResponse>("https://www.wikidata.org/w/api.php", {
      action: "wbgetentities",
      ids: batch.join("|"),
      props: "claims",
      format: "json",
      origin: "*",
    });

    for (const qid of batch) {
      const claims = (json.entities?.[qid]?.claims?.P413 ?? [])
        .map((c, i) => ({ id: c.mainsnak?.datavalue?.value?.id, rank: c.rank ?? "normal", i }))
        .filter((c): c is { id: string; rank: "preferred" | "normal" | "deprecated"; i: number } =>
          Boolean(c.id) && c.rank !== "deprecated")
        .sort((a, b) => (RANK_ORDER[a.rank] - RANK_ORDER[b.rank]) || (a.i - b.i))
        .map((c) => c.id);
      if (claims.length) out.set(qid, claims);
    }
  }

  return out;
}

/** English labels for a set of QIDs. */
async function fetchLabels(qids: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();

  for (const batch of chunks(qids, 50)) {
    const json = await apiJson<WikidataEntitiesResponse>("https://www.wikidata.org/w/api.php", {
      action: "wbgetentities",
      ids: batch.join("|"),
      props: "labels",
      languages: "en",
      format: "json",
      origin: "*",
    });
    for (const qid of batch) {
      const label = json.entities?.[qid]?.labels?.en?.value;
      if (label) out.set(qid, label);
    }
  }

  return out;
}

/**
 * Collapse a Wikidata position label into one of four buckets. Precedence matters:
 * a "wing-back" is a defender (it carries "back"), a "wing half" is a midfielder
 * (the old half-back line), but a "winger" / "right winger" is a forward — so the
 * back and half tests must run before the wing/forward test.
 */
function bucketForLabel(label: string): Bucket | null {
  const l = label.toLowerCase();
  if (/goalkeeper|keeper/.test(l)) return "GK";
  if (/\bback\b|sweeper|defender|libero/.test(l)) return "DEF";
  if (/midfield|\bhalf\b/.test(l)) return "MID";
  if (/forward|strik|wing|inside\s/.test(l)) return "FWD";
  return null;
}

/**
 * Q8025128 is labelled "wing half" but Wikidata applies it loosely to wide players
 * of every era — genuine half-backs (Setters, Duckworth) and out-and-out wingers
 * (Best, Meredith, Ronaldo) alike. We demote it in primary selection so a player who
 * also lists a clearer position uses that (Ronaldo → forward). A player carrying only
 * "wing half" keeps the conservative MID (the softer, central claim, right for the
 * genuine half-backs and only mildly off for an obscure winger); the famous wingers
 * among them are lifted to FWD by the curated overrides below.
 */
const WING_HALF_QID = "Q8025128";

/**
 * Hand-checked corrections layered over the Wikidata read, recorded as a `curated`
 * source. Two kinds: famous wingers whose only P413 is the ambiguous "wing half" (so
 * the automated read leaves them MID), and notable players Wikidata has no P413 for at
 * all. Confidence is the bar — everything we are unsure about stays on Wikidata or
 * honestly blank rather than guessed here.
 */
const CURATED_OVERRIDES: Record<string, { bucket: Bucket; label: string }> = {
  // Wingers/forwards Wikidata tags only as the ambiguous "wing half".
  "george-best": { bucket: "FWD", label: "winger" },
  "billy-meredith": { bucket: "FWD", label: "winger" },
  "george-wall": { bucket: "FWD", label: "winger" },
  "steve-coppell": { bucket: "FWD", label: "winger" },
  "willie-morgan": { bucket: "FWD", label: "winger" },
  "john-connelly": { bucket: "FWD", label: "winger" },
  "johnny-berry": { bucket: "FWD", label: "winger" },
  "david-pegg": { bucket: "FWD", label: "winger" },
  "jimmy-delaney": { bucket: "FWD", label: "winger" },
  "john-aston-jr": { bucket: "FWD", label: "winger" },
  "warren-bradley": { bucket: "FWD", label: "winger" },
  "nani": { bucket: "FWD", label: "winger" },
  "antonio-valencia": { bucket: "FWD", label: "winger" },
  "daniel-james": { bucket: "FWD", label: "winger" },
  "alejandro-garnacho": { bucket: "FWD", label: "winger" },
  "tom-manley": { bucket: "FWD", label: "inside forward" },
  "ole-gunnar-solskj-r": { bucket: "FWD", label: "forward" },
  // Notable players Wikidata has no P413 for.
  "juan-sebastian-veron": { bucket: "MID", label: "midfielder" },
  "henrikh-mkhitaryan": { bucket: "MID", label: "attacking midfielder" },
};

interface PositionRecord {
  playerId: string;
  name: string;
  wikiTitle: string;
  wikidataId: string | null;
  positionQid: string | null;
  positionLabel: string;
  bucket: Bucket;
  buckets: Bucket[];
  sourceId: string;
  retrievedAt: string;
}

async function main() {
  const records = readJson<PlayerRecordsFile>(path.join(CANONICAL, "player-records.json")).records
    .filter((r) => r.playerId !== "own-goal" && r.wikiTitle);

  const qidsByTitle = await fetchWikidataIds(records.map((r) => r.wikiTitle as string));
  const positionsByQid = await fetchPositionQids([...new Set(qidsByTitle.values())]);

  const allPositionQids = new Set<string>();
  for (const list of positionsByQid.values()) for (const q of list) allPositionQids.add(q);
  const labelByQid = await fetchLabels([...allPositionQids]);

  const retrievedAt = new Date().toISOString();
  const recordById = new Map(records.map((r) => [r.playerId, r]));
  const resultById = new Map<string, PositionRecord>();
  const missing: { playerId: string; name: string; wikiTitle: string; reason: string }[] = [];

  for (const r of records) {
    const wikiTitle = r.wikiTitle as string;
    const qid = qidsByTitle.get(wikiTitle);
    if (!qid) {
      missing.push({ playerId: r.playerId, name: r.name, wikiTitle, reason: "No Wikidata entity for the enwiki title" });
      continue;
    }
    // Demote the ambiguous "wing half" QID so a clearer co-listed position wins; it
    // only becomes the primary when it is the sole signal.
    const positionQids = (positionsByQid.get(qid) ?? [])
      .slice()
      .sort((a, b) => Number(a === WING_HALF_QID) - Number(b === WING_HALF_QID));
    const buckets: Bucket[] = [];
    let primaryQid: string | null = null;
    let primaryLabel: string | null = null;
    for (const pq of positionQids) {
      const label = labelByQid.get(pq);
      const b = label ? bucketForLabel(label) : null;
      if (!b) continue;
      if (!buckets.includes(b)) buckets.push(b);
      if (!primaryQid) {
        primaryQid = pq;
        primaryLabel = label as string;
      }
    }
    if (!primaryQid || !primaryLabel || buckets.length === 0) {
      missing.push({
        playerId: r.playerId,
        name: r.name,
        wikiTitle,
        reason: positionQids.length ? "P413 positions did not map to a bucket" : "No P413 position on the entity",
      });
      continue;
    }
    resultById.set(r.playerId, {
      playerId: r.playerId,
      name: r.name,
      wikiTitle,
      wikidataId: qid,
      positionQid: primaryQid,
      positionLabel: primaryLabel,
      bucket: buckets[0],
      buckets,
      sourceId: SOURCE_ID,
      retrievedAt,
    });
  }

  // Layer the hand-checked corrections on top, recorded as a `curated` source.
  let overrideCount = 0;
  for (const [pid, ov] of Object.entries(CURATED_OVERRIDES)) {
    const rec = recordById.get(pid);
    if (!rec) {
      console.warn(`  override skipped — no player record for "${pid}"`);
      continue;
    }
    const prev = resultById.get(pid);
    resultById.set(pid, {
      playerId: pid,
      name: rec.name,
      wikiTitle: rec.wikiTitle as string,
      wikidataId: prev?.wikidataId ?? qidsByTitle.get(rec.wikiTitle as string) ?? null,
      positionQid: null,
      positionLabel: ov.label,
      bucket: ov.bucket,
      buckets: [ov.bucket],
      sourceId: "curated",
      retrievedAt,
    });
    overrideCount += 1;
  }
  const overriddenIds = new Set(Object.keys(CURATED_OVERRIDES));
  const finalMissing = missing.filter((m) => !overriddenIds.has(m.playerId));

  const out = [...resultById.values()].sort((a, b) => a.playerId.localeCompare(b.playerId));

  writeJson(path.join(CANONICAL, "player-positions.json"), {
    generatedAt: retrievedAt,
    sourceId: SOURCE_ID,
    sourceName: "Wikidata P413 (position played on team), via enwiki sitelinks",
    property: "P413",
    records: out,
    missing: finalMissing,
  });

  const counts = out.reduce<Record<string, number>>((acc, r) => ((acc[r.bucket] = (acc[r.bucket] ?? 0) + 1), acc), {});
  console.log(`player positions: ${out.length} resolved (${overrideCount} curated), ${finalMissing.length} missing (of ${records.length} titled players)`);
  console.log(`buckets:`, counts);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
