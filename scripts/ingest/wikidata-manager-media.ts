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

/**
 * Licensed Commons portraits chosen for era-appropriate likeness and United context.
 * Wikidata P18 often points at post-career or other-club images; overrides win
 * when present. Re-run ingest:manager-media after edits.
 */
const CURATED_COMMONS_OVERRIDES: Record<string, string> = {
  // Phase 3 — post-career / wrong-club Wikidata P18 fixes
  "david-moyes": "David Moyes MUFC 2013.jpg",
  "ole-gunnar-solskjaer": "Ole Gunnar Solksjaer 2021.jpg",
  "ralf-rangnick": "Manchester United v Crystal Palace, 5 December 2021 (35).jpg",
  "ruud-van-nistelrooy": "Ruud.JPG",
  "michael-carrick": "Michael Carrick - July 2015 (cropped).jpg",
  "darren-fletcher": "Darren Fletcher vs Everton (cropped).jpg",
  "jose-mourinho": "José Mourinho (cropped).jpg",
  "wilf-mcguinness": "Manchester United FC 1957.jpg",
  // Phase 4 — genuine Commons portraits for pre-modern managers
  "james-west": "James West.jpg",
  "dave-sexton": "Dave Sexton.jpg",
};

/** Wikidata P18 exists but is unsuitable; UI falls back to initials. */
const CURATED_WIKIDATA_SKIP = [
  "scott-duncan", // only Commons file is a Newcastle team photo, not a MU-era likeness
  "jimmy-murphy", // only Commons file is a statue, not a portrait
];

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

  const { records, missing } = await resolveMedia(subjects, {
    overrides: CURATED_COMMONS_OVERRIDES,
    skipKeys: CURATED_WIKIDATA_SKIP,
  });
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
      "CURATED_COMMONS_OVERRIDES supplies era-appropriate portraits when Wikidata P18 is wrong-club or wrong-era.",
      "CURATED_WIKIDATA_SKIP omits unsuitable Wikidata P18 hits when no better Commons portrait exists.",
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
