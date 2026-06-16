/**
 * Build a licensed image manifest for Manchester United managers, using the same
 * Wikidata P18 → Wikimedia Commons pipeline as player portraits.
 *
 * Titles are curated: modern managers resolve from their name, but the early
 * secretary-managers share names with other people, so they carry explicit
 * disambiguated Wikipedia titles. A wrong title simply yields no image (the UI
 * falls back to initials) rather than the wrong person's photo.
 *
 * Usage:
 *   npm run ingest:manager-media
 */
import path from "node:path";
import { CANONICAL, readJson, writeJson } from "../lib";
import { resolveMedia, type MediaSubject } from "./wiki-media";

const SOURCE_ID = "wikidata-commons";

interface ManagersFile {
  managers: { id: string; name: string; role: string | null }[];
}

// Explicit Wikipedia titles where the plain name is ambiguous or stylised.
const TITLE_OVERRIDES: Record<string, string> = {
  "ah-albut": "A. H. Albut",
  "james-west": "James West (football secretary)",
  "john-bentley": "J. J. Bentley",
  "jack-robson": "Jack Robson (football manager)",
  "john-chapman": "John Chapman (football manager)",
  "lal-hilditch": "Lal Hilditch",
  "scott-duncan": "Scott Duncan (footballer)",
  "matt-busby": "Matt Busby",
  "jimmy-murphy": "Jimmy Murphy (footballer)",
};

function defaultTitle(name: string): string {
  return name
    .replace(/^Sir\s+/, "")
    .replace(/\s*['‘’].*?['‘’]\s*/g, " ") // drop nickname in quotes
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  const managers = readJson<ManagersFile>(path.join(CANONICAL, "managers.json")).managers;
  const subjects: MediaSubject[] = managers.map((m) => ({
    key: m.id,
    wikiTitle: TITLE_OVERRIDES[m.id] ?? defaultTitle(m.name),
  }));

  const { records, missing } = await resolveMedia(subjects);
  const retrievedAt = new Date().toISOString();

  writeJson(path.join(CANONICAL, "manager-media.json"), {
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
      "Titles are curated; early secretary-managers carry disambiguated Wikipedia titles to avoid name collisions.",
      "Only raster Commons images are imported; the UI falls back to initials for managers without a free image.",
    ],
    records: records.map((r) => ({
      managerId: r.key,
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

  console.log(`wrote ${records.length}/${subjects.length} manager media records (${missing.length} missing)`);
  if (missing.length) console.log("missing:", missing.map((m) => m.key).join(", "));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
