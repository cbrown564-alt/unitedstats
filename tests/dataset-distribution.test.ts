import assert from "node:assert/strict";
import test from "node:test";

import {
  API_ENDPOINTS,
  CITABLE_ID_EXAMPLE,
  DATASET_FILES,
  DATASET_LICENSE,
  DATASET_MANIFEST_PATH,
  DATA_PAGE_PATH,
  LLMS_TXT_PATH,
  apiEndpointHref,
  apiEndpointUrl,
  citationBibTeX,
  citationPlain,
  datasetFileUrl,
  featuredApiEndpoints,
  featuredDatasetFiles,
  manifestRegistryFields,
} from "../lib/datasetDistribution";
import { SITE_URL } from "../lib/site";

test("dataset distribution catalogs are non-empty and featured subsets exist", () => {
  assert.ok(DATASET_FILES.length >= 7);
  assert.ok(API_ENDPOINTS.length >= 8);
  assert.ok(featuredDatasetFiles().length >= 7);
  assert.ok(featuredApiEndpoints().length >= 8);
});

test("dataset distribution builds absolute URLs from SITE_URL", () => {
  assert.equal(datasetFileUrl("matches.csv"), `${SITE_URL}/dataset/matches.csv`);
  assert.equal(apiEndpointHref("/api/v1/matches/{id}"), "/api/v1/matches/1999-05-26-bayern-munich-n");
  assert.equal(
    apiEndpointUrl(API_ENDPOINTS[2].path, API_ENDPOINTS[2].examplePath),
    `${SITE_URL}/api/v1/matches/1999-05-26-bayern-munich-n`,
  );
});

test("citation templates reference stable IDs, license, and data page", () => {
  const plain = citationPlain("2026-07-08T16:39:47.080Z");
  assert.match(plain, /Red Thread \(2026\)/);
  assert.match(plain, new RegExp(DATASET_LICENSE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(plain, new RegExp(`${SITE_URL}${DATA_PAGE_PATH}`));
  assert.match(plain, new RegExp(CITABLE_ID_EXAMPLE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

  const bib = citationBibTeX("2026-07-08T16:39:47.080Z");
  assert.match(bib, /@dataset\{red-thread-manchester-united_2026/);
  assert.match(bib, /license = \{CC BY-SA 4\.0\}/);
});

test("manifest registry fields include homepage, license, and llms.txt", () => {
  const fields = manifestRegistryFields();
  assert.equal(fields.homepage, SITE_URL);
  assert.equal(fields.license, DATASET_LICENSE);
  assert.equal(fields.url, `${SITE_URL}${DATASET_MANIFEST_PATH}`);
  assert.equal(fields.llms_txt, LLMS_TXT_PATH);
  assert.ok(fields.citation);
});
