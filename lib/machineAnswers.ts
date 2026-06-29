import { API_ATTRIBUTION } from "./api";
import {
  answerRef,
  canonicalUrl,
  claimProvenance,
  claimVersion,
  cutKey,
  cutRef,
  type ClaimProvenance,
  type CitableRef,
} from "./citations";
import { CURATED_CUTS, curatedCut, runCut, type CutResult } from "./cut";
import { getDb } from "./db";

export interface MachineAnswer {
  ref: CitableRef;
  cut?: CitableRef;
  question: string;
  answer: string;
  version: string;
  page: string;
  api: string;
  provenance: ClaimProvenance[];
  evidence: { label: string; path: string; url: string }[];
  data: unknown;
}

interface ResultSourceRow {
  id: string;
  label: string;
  kind: string;
  url: string | null;
  matches: number;
}

function resultSourceProvenance(evidencePath: string, scope: string): ClaimProvenance[] {
  const rows = getDb()
    .prepare(
      `SELECT s.id, s.label, s.kind, s.url, COUNT(DISTINCT ms.match_id) AS matches
       FROM match_sources ms
       JOIN sources s ON s.id = ms.source_id
       WHERE ms.facet = 'result'
       GROUP BY s.id, s.label, s.kind, s.url
       ORDER BY s.id`,
    )
    .all() as ResultSourceRow[];

  return rows.map((row) =>
    claimProvenance({
      sourceId: row.id,
      sourceName: row.label,
      sourceUrl: row.url,
      facet: "result",
      confidence: "complete",
      scope,
      evidencePath,
      note: `${row.matches} canonical result facets from this source.`,
    }),
  );
}

function cutAnswerText(result: CutResult): string {
  if (!result.headline) return "No records matched this cut.";
  return `${result.headline.subject} leads with ${result.headline.figure} ${result.headline.metric}, ${result.headline.gloss}.`;
}

export function cutAnswer(slug: string): MachineAnswer | null {
  const curated = CURATED_CUTS.find((c) => c.slug === slug);
  if (!curated) return null;

  const cut = curatedCut(curated);
  const result = runCut(cut, 20);
  const cutCite = cutRef(cut);
  const ref = answerRef("cut-headline", cutKey(cut), `/api/v1/answers/cuts/${slug}`);
  const answer = cutAnswerText(result);
  const evidence = [
    { label: "Human-readable Cut", path: cutCite.path, url: cutCite.url },
    ...(result.headline
      ? [{ label: "Headline evidence", path: result.headline.href, url: canonicalUrl(result.headline.href) }]
      : []),
  ];
  const data = {
    cut: result.cut,
    headline: result.headline,
    groups: result.groups,
    total: result.total,
    played: result.played,
    baseline: result.baseline,
    coverage: result.coverage,
  };
  return {
    ref,
    cut: cutCite,
    question: curated.title,
    answer,
    version: claimVersion({ ref: ref.id, answer, data }),
    page: cutCite.path,
    api: ref.path,
    provenance: resultSourceProvenance(cutCite.path, `Curated Cut "${slug}" over ${result.played} records.`),
    evidence,
    data,
  };
}

export function answerIndex() {
  return {
    source: API_ATTRIBUTION.source,
    docs: API_ATTRIBUTION.docs,
    cache: "Read-only dataset responses use immutableDataHeaders: browser max-age 300s, edge s-maxage 86400s, stale-while-revalidate 604800s.",
    endpoints: {
      "/api/v1/answers/cuts/{slug}": CURATED_CUTS.map((c) => c.slug),
    },
  };
}
