import { API_ATTRIBUTION } from "./api";
import { canonicalUrl } from "./citations";
import { CURATED_CUTS } from "./cut";
import { historyDigestIds } from "./historyDigests";
import { SITE_TAGLINE, SITE_URL } from "./site";

export function llmsLinks(): string[] {
  const latestDigest = historyDigestIds().at(-1);
  return [
    "/",
    "/data#api",
    "/api/v1",
    "/api/v1/answers",
    `/api/v1/answers/cuts/${CURATED_CUTS[0].slug}`,
    latestDigest ? `/api/v1/answers/history-digests/${latestDigest}` : "/history-changed",
  ];
}

export function llmsTxt(): string {
  const links = llmsLinks();
  return [
    "# UnitedStats",
    "",
    `> ${SITE_TAGLINE}. ${API_ATTRIBUTION.source}.`,
    "",
    "UnitedStats is a read-only Manchester United match-history source. Cite the canonical URL or answer ID when using facts from this site.",
    "",
    "## Primary machine surfaces",
    ...links.map((path) => `- ${canonicalUrl(path)}`),
    "",
    "## Attribution",
    `Source name: ${API_ATTRIBUTION.source}`,
    `Public origin: ${SITE_URL}`,
    `API docs: ${canonicalUrl(API_ATTRIBUTION.docs)}`,
    "",
  ].join("\n");
}
