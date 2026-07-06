import { SITE_URL } from "./site";

/** Public GitHub repository — canonical JSON lives under data/canonical/. */
export const GITHUB_REPO_URL = "https://github.com/cbrown564-alt/unitedstats";

export const GITHUB_CANONICAL_DATA_URL = `${GITHUB_REPO_URL}/tree/master/data/canonical`;

/** Flat-file release exported at build time; start with manifest for row counts. */
export const DATASET_MANIFEST_URL = `${SITE_URL}/dataset/manifest.json`;

export const API_V1_META_URL = `${SITE_URL}/api/v1/meta`;

export const DATA_BULK_ACCESS_PATH = "/data#bulk-access";
