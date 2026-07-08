/**
 * Canonical open-data distribution metadata — download URLs, API catalog, and
 * citation templates shared by /data, dataset manifest export, and llms.txt.
 */
import { SITE_URL, SITE_TAGLINE } from "./site";

export const DATASET_NAME = "Red Thread dataset";
const DATASET_SLUG = "red-thread-manchester-united";
export const DATASET_LICENSE = "CC BY-SA 4.0";
export const DATASET_LICENSE_URL = "https://creativecommons.org/licenses/by-sa/4.0/";

export const DATA_PAGE_PATH = "/data";
export const DATA_PAGE_API_ANCHOR = `${DATA_PAGE_PATH}#api`;
export const DATA_PAGE_DOWNLOADS_ANCHOR = `${DATA_PAGE_PATH}#downloads`;
export const DATA_PAGE_CITATION_ANCHOR = `${DATA_PAGE_PATH}#citation`;

export const LLMS_TXT_PATH = "/llms.txt";
export const API_INDEX_PATH = "/api/v1";
export const DATASET_MANIFEST_PATH = "/dataset/manifest.json";

export const CITABLE_ID_PREFIX = "us";
export const CITABLE_ID_EXAMPLE = "us:match:1999-05-26-bayern-munich-n";

export interface DatasetFile {
  file: string;
  label: string;
  /** Relative path from site root, e.g. /dataset/matches.csv */
  path: string;
  featured?: boolean;
}

export interface ApiEndpoint {
  path: string;
  label: string;
  featured?: boolean;
  /** Concrete href for links; defaults to path with generic placeholders filled. */
  examplePath?: string;
}

/** Flat-file exports under /dataset/. Featured files surface on /data first. */
export const DATASET_FILES: DatasetFile[] = [
  { file: "manifest.json", label: "Release metadata, row counts, and registry fields", path: DATASET_MANIFEST_PATH, featured: true },
  { file: "matches.csv", label: "Fixture spine and match facts", path: "/dataset/matches.csv", featured: true },
  { file: "events.csv", label: "Goal, assist, and card event rows", path: "/dataset/events.csv", featured: true },
  { file: "lineups.csv", label: "Starting, bench, and substitution rows", path: "/dataset/lineups.csv", featured: true },
  { file: "elo_history.csv", label: "Pre/post-match ratings and expectancies", path: "/dataset/elo_history.csv", featured: true },
  { file: "season_summaries.csv", label: "Competition season summaries", path: "/dataset/season_summaries.csv", featured: true },
  { file: "players.csv", label: "All-time player totals and media references", path: "/dataset/players.csv", featured: true },
  { file: "transfers.csv", label: "Transfer ledger with fees and directions", path: "/dataset/transfers.csv" },
  { file: "league_standings.csv", label: "League table rows by season and position", path: "/dataset/league_standings.csv" },
  { file: "player_media.csv", label: "Player portrait references and Commons licenses", path: "/dataset/player_media.csv" },
  { file: "manager_media.csv", label: "Manager portrait references", path: "/dataset/manager_media.csv" },
  { file: "og_scorer_media.csv", label: "Own-goal scorer media references", path: "/dataset/og_scorer_media.csv" },
  { file: "player_positions.csv", label: "Playing positions from Wikidata P413", path: "/dataset/player_positions.csv" },
];

const MATCH_EXAMPLE_ID = "1999-05-26-bayern-munich-n";
const SEASON_EXAMPLE = "1998-99";
const PLAYER_EXAMPLE_ID = "cristiano-ronaldo";
const CUT_EXAMPLE_SLUG = "opponents-by-win-rate";

/** Public read-only API under /api/v1. Featured endpoints surface on /data first. */
export const API_ENDPOINTS: ApiEndpoint[] = [
  { path: "/api/v1/meta", label: "Dataset metadata and coverage counts", featured: true },
  { path: "/api/v1/matches", label: "Paginated matches — filter by date, season, venue, opponent", featured: true },
  {
    path: "/api/v1/matches/{id}",
    examplePath: `/api/v1/matches/${MATCH_EXAMPLE_ID}`,
    label: "One match with events, lineups, Elo, and sources",
    featured: true,
  },
  { path: "/api/v1/seasons", label: "Season summaries by competition", featured: true },
  {
    path: "/api/v1/seasons/{season}",
    examplePath: `/api/v1/seasons/${SEASON_EXAMPLE}`,
    label: "One season with every match (e.g. 1998-99)",
    featured: true,
  },
  { path: "/api/v1/players", label: "Player totals with pagination", featured: true },
  {
    path: "/api/v1/players/{id}",
    examplePath: `/api/v1/players/${PLAYER_EXAMPLE_ID}`,
    label: "One player with per-season splits",
    featured: true,
  },
  { path: "/api/v1/opponents", label: "Opponent head-to-head records", featured: true },
  { path: "/api/v1/managers", label: "Managers with overall records and tenures" },
  { path: "/api/v1/competitions", label: "Competitions with type and match counts" },
  { path: "/api/v1/answers", label: "Machine-facing answer index with stable citable IDs" },
  {
    path: "/api/v1/answers/cuts/{slug}",
    examplePath: `/api/v1/answers/cuts/${CUT_EXAMPLE_SLUG}`,
    label: "Answer-shaped payload for a curated Cut",
  },
];

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
}

export function datasetFileUrl(file: DatasetFile | string): string {
  const path = typeof file === "string" ? `/dataset/${file}` : file.path;
  return absoluteUrl(path);
}

export function apiEndpointUrl(path: string, examplePath?: string): string {
  return absoluteUrl(examplePath ?? apiEndpointHref(path));
}

export function apiEndpointHref(path: string, examplePath?: string): string {
  if (examplePath) return examplePath;
  return path
    .replace("{id}", MATCH_EXAMPLE_ID)
    .replace("{season}", SEASON_EXAMPLE)
    .replace("{slug}", CUT_EXAMPLE_SLUG);
}

export function featuredDatasetFiles(): DatasetFile[] {
  return DATASET_FILES.filter((f) => f.featured);
}

export function featuredApiEndpoints(): ApiEndpoint[] {
  return API_ENDPOINTS.filter((e) => e.featured);
}

export function citationPlain(builtAt?: string): string {
  const year = (builtAt ? new Date(builtAt) : new Date()).getUTCFullYear();
  return `Red Thread (${year}). ${DATASET_NAME}: ${SITE_TAGLINE}. ${absoluteUrl(DATA_PAGE_PATH)}. Licensed ${DATASET_LICENSE}. Stable record IDs use the ${CITABLE_ID_PREFIX}: scheme (e.g. ${CITABLE_ID_EXAMPLE}).`;
}

export function citationBibTeX(builtAt?: string): string {
  const year = (builtAt ? new Date(builtAt) : new Date()).getUTCFullYear();
  return [
    `@dataset{${DATASET_SLUG}_${year},`,
    `  title = {${DATASET_NAME}},`,
    `  author = {Red Thread},`,
    `  year = {${year}},`,
    `  url = {${absoluteUrl(DATA_PAGE_PATH)}},`,
    `  note = {${SITE_TAGLINE}. Stable IDs: ${CITABLE_ID_PREFIX}:<kind>:<key>. Downloads: ${absoluteUrl(DATASET_MANIFEST_PATH)}},`,
    `  license = {${DATASET_LICENSE}},`,
    `  howpublished = {\\url{${absoluteUrl(DATA_PAGE_PATH)}}}`,
    `}`,
  ].join("\n");
}

/** Static registry fields merged into manifest.json at export time. */
export function manifestRegistryFields() {
  return {
    name: DATASET_NAME,
    description:
      "Every Manchester United match since 1886 with goal events, lineups, Elo history, season summaries, and transfer ledger. Coverage varies by facet; see events_complete and has_lineup flags and the site's /data page.",
    homepage: SITE_URL,
    url: absoluteUrl(DATASET_MANIFEST_PATH),
    license: DATASET_LICENSE,
    license_url: DATASET_LICENSE_URL,
    citation: citationPlain(),
    identifier_scheme: CITABLE_ID_PREFIX,
    identifier_example: CITABLE_ID_EXAMPLE,
    docs: DATA_PAGE_DOWNLOADS_ANCHOR,
    api: API_INDEX_PATH,
    llms_txt: LLMS_TXT_PATH,
    attribution:
      "Red Thread. Result data: engsoccerdata, openfootball, Wikipedia. Player record totals: Wikipedia Manchester United player lists. Player images: Wikidata and Wikimedia Commons. Player positions: Wikidata P413 (with hand-checked corrections). Transfers: MUFCInfo transfer archive.",
  };
}
