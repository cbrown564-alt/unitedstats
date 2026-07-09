import type { Metadata } from "next";
import Link from "next/link";
import {
  coverageByCompetitionType,
  coverageByDecade,
  coverageOverview,
  dataGapCounts,
  dataGapsSample,
  sourceExamples,
  sourceUsage,
} from "@/lib/queries";
import { CoverageMatrix } from "@/components/charts/CoverageMatrix";
import { CoverageNote } from "@/components/CoverageNote";
import { PageHeader } from "@/components/PageHeader";
import { DataGapsQueue } from "@/components/data/DataGapsQueue";
import { SourceRegister } from "@/components/data/SourceRegister";
import { DataTable } from "@/components/DataTable";
import { enrichDataGaps } from "@/lib/dataGaps";
import { fmtNum, pct, COMPETITION_TYPE_LABELS } from "@/lib/format";
import { CORRECTION_STATUS_URL } from "@/lib/corrections";
import {
  API_INDEX_PATH,
  CITABLE_ID_EXAMPLE,
  CITABLE_ID_PREFIX,
  DATASET_FILES,
  DATASET_LICENSE,
  DATASET_LICENSE_URL,
  DATASET_MANIFEST_PATH,
  DATASET_NAME,
  DATA_PAGE_API_ANCHOR,
  DATA_PAGE_CITATION_ANCHOR,
  DATA_PAGE_DOWNLOADS_ANCHOR,
  LLMS_TXT_PATH,
  absoluteUrl,
  apiEndpointHref,
  citationBibTeX,
  citationPlain,
  featuredApiEndpoints,
  featuredDatasetFiles,
} from "@/lib/datasetDistribution";
import { SITE_URL } from "@/lib/site";

const DATA_DESCRIPTION =
  "Coverage ledger, open dataset downloads, public API, citation guidance, and correction contract for United's match record since 1886.";

export const metadata: Metadata = {
  title: "Data and corrections",
  description: DATA_DESCRIPTION,
  alternates: { canonical: "/data" },
  openGraph: {
    type: "website",
    title: "Data and corrections · Red Thread",
    description: DATA_DESCRIPTION,
    url: "/data",
  },
  twitter: { card: "summary_large_image", title: "Data and corrections", description: DATA_DESCRIPTION },
};

/**
 * Movement header for the page's three acts (the record → its cuts → how it's
 * built). Same device as `/analytics`: a ghosted numeral, kicker, title, dek.
 */
function Act({ n, kicker, title, children }: { n: string; kicker: string; title: string; children?: React.ReactNode }) {
  return (
    <header className="flex items-baseline gap-4 border-b border-line/70 pb-3">
      <span aria-hidden className="display text-4xl leading-none text-devil-bright/25 sm:text-5xl">{n}</span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-devil-bright">{kicker}</p>
        <h2 className="display text-2xl">{title}</h2>
        {children && <p className="mt-1 max-w-2xl text-sm leading-6 text-ink-dim">{children}</p>}
      </div>
    </header>
  );
}

export default function DataPage() {
  const overview = coverageOverview();
  const byType = coverageByCompetitionType();
  const decades = coverageByDecade();
  const sources = sourceUsage();
  const examples = sourceExamples();
  const gapCounts = dataGapCounts();
  const gaps = enrichDataGaps(dataGapsSample(12));

  return (
    <div className="space-y-14">
      <PageHeader eyebrow="The canonical record" title="Data and corrections">
        Every result since 1886. Detail fills in where sources allow — gaps stay on the page.
      </PageHeader>

      {/* ───────────────── Fan trust lane — Acts I–II ───────────────── */}
      <div className="space-y-14">
        {/* Act I — the record */}
        <div className="space-y-6">
          <Act n="01" kicker="The record" title="Complete results, layers that fill in">
            Every result is known back to 1886. The richer detail thins as the record reaches into the Victorian past —
            this is exactly where, layer by layer and decade by decade.
          </Act>

          <section className="relative overflow-hidden rounded-xl border border-line bg-panel p-5 shadow-[0_22px_44px_rgb(0_0_0_/0.22)] sm:p-6">
            <div className="hero-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden />
            <div
              className="pointer-events-none absolute -right-24 -top-28 h-72 w-2/3 rounded-full opacity-[0.12] blur-3xl"
              style={{ backgroundColor: "var(--color-devil)" }}
              aria-hidden
            />

            <div className="relative">
              <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
                <div className="leading-none">
                  <div className="flex items-baseline gap-2">
                    <span className="stat-num text-5xl font-semibold text-devil-bright sm:text-6xl">{fmtNum(overview.officialMatches)}</span>
                    <span className="text-sm uppercase tracking-[0.16em] text-ink-faint">official matches</span>
                  </div>
                  <p className="mt-2 text-xs text-ink-dim">every result known, back to 1886</p>
                </div>
                <dl className="flex flex-wrap items-end gap-x-8 gap-y-3.5 border-l border-line pl-6">
                  {[
                    ["Complete goalscorer rows", overview.completeScorers],
                    ["Starting XIs", overview.withStartingLineups],
                    ["Attendances", overview.withAttendance],
                  ].map(([label, value]) => (
                    <div key={label as string} className="leading-none">
                      <dd className="stat-num text-xl font-semibold text-ink">
                        {pct(Number(value), overview.matches)}
                      </dd>
                      <dt className="mt-1.5 text-[11px] uppercase tracking-[0.13em] text-ink-faint">{label}</dt>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="mt-7">
                <CoverageMatrix rows={decades} totals={overview} />
              </div>

              <CoverageNote
                className="mt-4"
                slice={`all ${fmtNum(overview.matches)} matches in the database, grouped by decade. Every match carries a result row.`}
              >
                Intensity and the cell value are the share of each decade&apos;s matches that carry the layer. The
                all-time column on the right is the same share across the whole record.
              </CoverageNote>
            </div>
          </section>
        </div>

        {/* Act II — coverage by competition */}
        <div className="space-y-6">
          <Act n="02" kicker="The other cut" title="Coverage by competition type">
            The same layers, sliced by competition rather than by decade — league fixtures are the best-covered, the
            deep cup and European archive the thinnest.
          </Act>

          <DataTable
            registerCards
            registerLayout="metrics"
            caption="Coverage by competition type"
            rows={byType}
            rowKey={(row) => row.type}
            columns={[
              {
                label: "Scope",
                key: "scope",
                className: "font-medium",
                card: "identity",
                render: (row) => COMPETITION_TYPE_LABELS[row.type] ?? row.type,
              },
              {
                label: "Matches",
                key: "matches",
                numeric: true,
                card: "metric",
                render: (row) => fmtNum(row.matches),
              },
              {
                label: "United goalscorers",
                key: "scorers",
                numeric: true,
                card: "metric",
                cardLabel: "Scorers",
                render: (row) => (
                  <>
                    {fmtNum(row.completeScorers)}{" "}
                    <span className="text-ink-dim">({pct(row.completeScorers, row.matches)})</span>
                  </>
                ),
                cardRender: (row) => (
                  <>
                    {fmtNum(row.completeScorers)}{" "}
                    <span className="text-[10px] font-normal text-ink-faint">({pct(row.completeScorers, row.matches)})</span>
                  </>
                ),
              },
              {
                label: "Starting XI",
                key: "starting-xi",
                numeric: true,
                card: "metric",
                cardLabel: "Lineups",
                render: (row) => (
                  <>
                    {fmtNum(row.withStartingLineups)}{" "}
                    <span className="text-ink-dim">({pct(row.withStartingLineups, row.matches)})</span>
                  </>
                ),
                cardRender: (row) => (
                  <>
                    {fmtNum(row.withStartingLineups)}{" "}
                    <span className="text-[10px] font-normal text-ink-faint">({pct(row.withStartingLineups, row.matches)})</span>
                  </>
                ),
              },
            ]}
          />
        </div>
      </div>

      {/* ───────────────── Builder / developer lane — Act III + appendix ───────────────── */}
      <div className="space-y-14 border-t border-line/70 pt-14">
        {/* Act III — how it's built and corrected */}
        <div className="space-y-6">
          <Act n="03" kicker="Provenance" title="How the record is built and corrected">
            Every layered fact cites a source, and corrections follow one contract. The queue below is where the faint
            cells above turn into work.
          </Act>

          <div className="space-y-6">
            <section>
              <h3 className="display mb-3 text-lg">Sources</h3>
              <p className="mb-3 max-w-2xl text-xs text-ink-dim">
                Grouped by upstream source where several use cases share a lineage. Expand a family to see how
                each use case is applied and an example on file.
              </p>
              <SourceRegister sources={sources} examples={examples} />
            </section>

            <aside className="rounded-lg border border-line bg-panel px-4 py-3">
              <h3 className="display text-base">Correction contract</h3>
              <ol className="mt-2 list-inside list-decimal space-y-1.5 text-sm text-ink-dim">
                <li>
                  Edit the season file in <span className="font-mono text-xs text-ink">data/canonical/matches</span>.
                </li>
                <li>
                  Add players to <span className="font-mono text-xs text-ink">players.json</span> before referencing them.
                </li>
              </ol>
              <p className="mt-2 text-xs text-ink-faint">Cite every changed fact, then validate and rebuild.</p>
              <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold">
                <Link href="/corrections" className="text-devil-bright hover:underline">
                  Correction builder →
                </Link>
                <a href={CORRECTION_STATUS_URL} className="text-ink-dim hover:text-devil-bright hover:underline">
                  Open issues
                </a>
              </div>
            </aside>

            <section>
              <h3 className="display mb-3 text-lg">High-value gaps</h3>
              <DataGapsQueue gaps={gaps} gapCounts={gapCounts} />
              <p className="mt-3 text-xs text-ink-dim">
                The queue prioritises recent post-war United goalscorer gaps, then opposition goals, lineups, and
                attendance. Older archive work can still be added whenever a citation is strong.
              </p>
            </section>
          </div>
        </div>

        {/* Appendix — researchers, developers, and machine readers */}
        <div className="rounded-xl border border-line/80 bg-black/20 p-5 shadow-[inset_0_1px_0_rgb(255_255_255_/0.04)] sm:p-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-ink-faint">
            For researchers &amp; developers
          </p>
          <p className="mb-6 max-w-2xl text-sm text-ink-dim">
            The same compiled record powers the site, the public API, and the flat-file exports. Start with the manifest,
            cite stable <span className="font-mono text-xs text-ink">{CITABLE_ID_PREFIX}:</span> IDs when linking back to
            a specific match or entity, and read facet flags before treating event or lineup fields as complete totals.
          </p>

          <div className="space-y-8">
            <section id="downloads" className="scroll-mt-24">
              <h3 className="display mb-3 text-lg">
                <a href={DATA_PAGE_DOWNLOADS_ANCHOR} className="hover:text-devil-bright">
                  Dataset downloads
                </a>
              </h3>
              <p className="mb-4 max-w-2xl text-sm text-ink-dim">
                Each production build exports flat files from the compiled SQLite database, so the downloadable{" "}
                {DATASET_NAME.toLowerCase()} matches the app and API.{" "}
                <a href={DATASET_MANIFEST_PATH} className="font-mono text-xs text-devil-bright hover:underline">
                  {DATASET_MANIFEST_PATH}
                </a>{" "}
                lists row counts, build metadata, and registry fields for data catalogs.
              </p>
              <ul className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                {featuredDatasetFiles().map((file) => (
                  <li key={file.file}>
                    <a
                      href={file.path}
                      className="block rounded border border-line/70 bg-panel/60 px-3 py-2 transition-colors hover:border-devil/60 focus-visible:outline-2 focus-visible:outline-devil-bright"
                    >
                      <span className="font-mono text-sm text-devil-bright">{file.file}</span>
                      <span className="mt-1 block text-xs text-ink-dim">{file.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
              <details className="mt-4 rounded-lg border border-line/70 bg-panel/40 px-4 py-3">
                <summary className="cursor-pointer text-sm font-medium text-ink">All export files ({DATASET_FILES.length})</summary>
                <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
                  {DATASET_FILES.filter((f) => !f.featured).map((file) => (
                    <li key={file.file}>
                      <a href={file.path} className="font-mono text-xs text-devil-bright hover:underline">
                        {file.file}
                      </a>
                      <span className="mt-0.5 block text-xs text-ink-dim">{file.label}</span>
                    </li>
                  ))}
                </ul>
              </details>
            </section>

            <section id="api" className="scroll-mt-24">
              <h3 className="display mb-3 text-lg">Public read-only API</h3>
              <p className="mb-4 max-w-2xl text-sm text-ink-dim">
                JSON responses with permissive CORS, pagination on large lists, and an attribution block on every payload.
                The index at{" "}
                <a href={DATA_PAGE_API_ANCHOR} className="font-mono text-xs text-devil-bright hover:underline">
                  {API_INDEX_PATH}
                </a>{" "}
                lists every endpoint with filter notes.
              </p>
              <ul className="grid gap-2 text-sm sm:grid-cols-2">
                {featuredApiEndpoints().map((endpoint) => (
                  <li key={endpoint.path}>
                    <a
                      href={apiEndpointHref(endpoint.path, endpoint.examplePath)}
                      className="block rounded border border-line/70 bg-panel/60 px-3 py-2 transition-colors hover:border-devil/60 focus-visible:outline-2 focus-visible:outline-devil-bright"
                    >
                      <span className="font-mono text-sm text-devil-bright">{endpoint.path}</span>
                      <span className="mt-1 block text-xs text-ink-dim">{endpoint.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
              <p className="mt-4 max-w-2xl text-xs text-ink-dim">
                Treat result rows as the stable core and read facet flags before using event, lineup, assist, card,
                attendance, or source-derived fields as complete historical totals.
              </p>
            </section>

            <section id="citation" className="scroll-mt-24">
              <h3 className="display mb-3 text-lg">How to cite Red Thread</h3>
              <p className="mb-4 max-w-2xl text-sm text-ink-dim">
                The dataset is licensed{" "}
                <a href={DATASET_LICENSE_URL} className="text-devil-bright hover:underline">
                  {DATASET_LICENSE}
                </a>
                . Credit Red Thread with a link to{" "}
                <a href={DATA_PAGE_CITATION_ANCHOR} className="font-mono text-xs text-devil-bright hover:underline">
                  {SITE_URL}/data
                </a>
                , preserve per-source attribution in reused rows, and prefer stable{" "}
                <span className="font-mono text-xs text-ink">{CITABLE_ID_PREFIX}:</span> identifiers when pointing at a
                specific record (e.g.{" "}
                <span className="font-mono text-xs text-ink">{CITABLE_ID_EXAMPLE}</span>).
              </p>
              <div className="space-y-3">
                <div className="rounded-lg border border-line/70 bg-panel/60 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-ink-faint">Plain text</p>
                  <p className="mt-2 font-mono text-xs leading-6 text-ink-dim">{citationPlain()}</p>
                </div>
                <details className="rounded-lg border border-line/70 bg-panel/40 px-4 py-3">
                  <summary className="cursor-pointer text-sm font-medium text-ink">BibTeX</summary>
                  <pre className="mt-3 overflow-x-auto font-mono text-xs leading-6 text-ink-dim">{citationBibTeX()}</pre>
                </details>
              </div>
            </section>

            <section id="machines" className="scroll-mt-24">
              <h3 className="display mb-3 text-lg">AI crawlers &amp; registries</h3>
              <p className="max-w-2xl text-sm text-ink-dim">
                Machine-readable site guidance lives at{" "}
                <Link href={LLMS_TXT_PATH} className="font-mono text-xs text-devil-bright hover:underline">
                  {LLMS_TXT_PATH}
                </Link>
                . For football data registries and research indexes, list the dataset with manifest URL{" "}
                <span className="font-mono text-xs text-ink">{absoluteUrl(DATASET_MANIFEST_PATH)}</span> and point
                documentation to this page.
              </p>
            </section>

            <p className="text-xs text-ink-dim">
              Also layered onto lineups:{" "}
              <span className="stat-num text-ink">{fmtNum(overview.withUsedSubstitutes)}</span> matches with
              used-substitute records and <span className="stat-num text-ink">{fmtNum(overview.withBenches)}</span> with
              a named bench.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
