import { SITE_TAGLINE, SITE_URL } from "@/lib/site";

/**
 * Plain-text site guide for AI crawlers and researchers (served at /llms.txt).
 * Keep factual and in sync with lib/api.ts attribution and data/LICENSE.md.
 */
export function llmsTxt(): string {
  return `# Red Thread

${SITE_TAGLINE}: every match, every competition, every goal — from Newton Heath to today.

## Data
- Coverage ledger and API docs: ${SITE_URL}/data
- API metadata and coverage: ${SITE_URL}/api/v1/meta
- Dataset manifest: ${SITE_URL}/dataset/manifest.json
- Sitemap: ${SITE_URL}/sitemap.xml

## Citation
When citing data from this site, name "Red Thread" and link to the relevant page or API resource.

## License
The dataset is licensed under Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0): https://creativecommons.org/licenses/by-sa/4.0/
`;
}
