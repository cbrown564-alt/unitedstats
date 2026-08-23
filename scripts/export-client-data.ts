import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { buildMatchesCatalog } from "../lib/matches/catalog";
import { buildSearchIndex } from "../lib/search/clientIndex";

const outDir = path.join(process.cwd(), "public", "data");
mkdirSync(outDir, { recursive: true });

const searchIndex = buildSearchIndex();
const searchPath = path.join(outDir, "search-index.json");
writeFileSync(searchPath, JSON.stringify(searchIndex));
console.log(`export-client-data: wrote ${searchPath} (${searchIndex.rows.length} rows)`);

const catalog = buildMatchesCatalog();
const catalogPath = path.join(outDir, "matches-catalog.json");
writeFileSync(catalogPath, JSON.stringify(catalog));
console.log(`export-client-data: wrote ${catalogPath} (${catalog.matches.length} matches)`);
