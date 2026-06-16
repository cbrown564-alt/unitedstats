/**
 * Build a licensed image manifest for the opposition players who have scored own
 * goals for United. Keyed by the scorer name exactly as it appears in the event
 * record (that is the join key the app uses). Resolution is by name only, so
 * obscure or pre-war scorers won't resolve — the UI falls back to initials.
 *
 * Usage:
 *   npm run ingest:ogscorer-media
 */
import path from "node:path";
import Database from "better-sqlite3";
import { CANONICAL, DB_PATH, writeJson } from "../lib";
import { resolveMedia, type MediaSubject } from "./wiki-media";

const SOURCE_ID = "wikidata-commons";

// Scorers whose plain name lands on a Wikipedia disambiguation page; point them
// at the footballer's article directly so the page-shown benefactors resolve.
// (Most resolve from the plain name; add entries here only when they don't.)
const TITLE_OVERRIDES: Record<string, string> = {};

function distinctScorerNames(): string[] {
  const db = new Database(DB_PATH, { readonly: true });
  const rows = db
    .prepare(
      `SELECT DISTINCT player_name name
       FROM match_events
       WHERE type = 'own-goal-for'
         AND player_name GLOB '*[A-Za-z][A-Za-z]*'
         AND lower(player_name) NOT LIKE '%own%goal%'
       ORDER BY player_name`,
    )
    .all() as { name: string }[];
  db.close();
  return rows.map((r) => r.name);
}

async function main() {
  const names = distinctScorerNames();
  const subjects: MediaSubject[] = names.map((name) => ({
    key: name,
    wikiTitle: TITLE_OVERRIDES[name] ?? name,
  }));

  const { records, missing } = await resolveMedia(subjects);
  const retrievedAt = new Date().toISOString();

  writeJson(path.join(CANONICAL, "og-scorer-media.json"), {
    generatedAt: retrievedAt,
    sourceId: SOURCE_ID,
    sourceName: "Wikidata P18, Wikipedia pageimages, and Wikimedia Commons imageinfo",
    subjects: subjects.length,
    sourceUrls: [
      "https://www.wikidata.org/wiki/Property:P18",
      "https://www.mediawiki.org/wiki/API:Pageimages",
      "https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia",
    ],
    notes: [
      "Keyed by the own-goal scorer name as stored in match events.",
      "Resolution is by name only; obscure scorers won't resolve and fall back to initials in the UI.",
    ],
    records: records.map((r) => ({
      name: r.key,
      wikidataId: r.wikidataId,
      commonsFile: r.commonsFile,
      imageUrl: r.imageUrl,
      thumbUrl: r.thumbUrl,
      pageUrl: r.pageUrl,
      license: r.license,
      artist: r.artist,
      credit: r.credit,
      sourceId: SOURCE_ID,
      sourceMethod: r.sourceMethod,
      retrievedAt,
    })),
    missing,
  });

  console.log(`wrote ${records.length}/${subjects.length} OG-scorer media records (${missing.length} missing)`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
