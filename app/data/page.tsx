import Link from "next/link";
import { matchRef } from "@/lib/citations";
import {
  coverageByCompetitionType,
  coverageByDecade,
  coverageOverview,
  dataGaps,
  sourceUsage,
} from "@/lib/queries";
import { CoverageMatrix } from "@/components/charts/CoverageMatrix";
import { CoverageNote } from "@/components/CoverageNote";
import { DataTable } from "@/components/DataTable";
import { clubName, fmtNum, pct, COMPETITION_TYPE_LABELS } from "@/lib/format";
import { correctionPrefillHref, CORRECTION_STATUS_URL, type CorrectionPrefill } from "@/lib/corrections";

export const metadata = { title: "Data and corrections" };

type DataGap = ReturnType<typeof dataGaps>[number];

/** Plain-language reason each gap type is queued — derived from {@link dataGaps} CASE labels. */
function gapWhy(gap: string): string {
  switch (gap) {
    case "United goalscorers":
      return "United scored here but the goal-by-goal row isn't complete yet.";
    case "opposition goals":
      return "They scored but the opposition scorers aren't on file.";
    case "lineup":
      return "No starting XI recorded for this fixture.";
    case "attendance":
      return "Crowd figure missing — still open if you have a cited source.";
    case "source note":
      return "A source note is flagged on this match.";
    default:
      return "Coverage is incomplete on this fixture.";
  }
}

/** Contribute link — correction prefill when the contract supports it, otherwise the match page. */
function gapContributeHref(g: DataGap): string {
  const pagePath = `/match/${g.id}`;
  const label = `${clubName(g.date)} ${g.gf}-${g.ga} ${g.opponent_name}`;
  const citableId = matchRef(g.id).id;
  const matchPrefill = (field: string, current: string | number | null | undefined): CorrectionPrefill => ({
    targetKind: "match",
    targetId: g.id,
    targetLabel: label,
    fieldPath: `matches[id=${g.id}].${field}`,
    currentValue: current,
    pagePath,
    citableId,
  });

  switch (g.gap) {
    case "attendance":
      return correctionPrefillHref(matchPrefill("attendance", null));
    case "lineup":
      return `/match/${g.id}#lineup`;
    case "United goalscorers":
    case "opposition goals":
      return `/match/${g.id}#goals`;
    default:
      return `/match/${g.id}`;
  }
}

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
  const gaps = dataGaps(14);

  return (
    <div className="space-y-14">
      <header>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-devil-bright">The canonical record</p>
        <h1 className="display text-3xl">Data and corrections</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-dim">
          Every official result is here, back to 1886. Goalscorers, lineups, attendances, and the rest are filled in
          match by match, with every fact tied to a source — so you can see what&apos;s complete and what&apos;s still
          open.
        </p>
      </header>

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
              <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line">
                {sources.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 bg-panel px-4 py-2.5 text-sm">
                    <div className="min-w-0">
                      <span className="font-semibold">{s.label}</span>
                      <span className="ml-2 text-[11px] uppercase tracking-wider text-ink-dim">{s.kind}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 text-xs text-ink-dim">
                      <span className="stat-num">{fmtNum(s.matches)} matches</span>
                      {s.url && (
                        <a href={s.url} className="font-semibold text-devil-bright hover:underline">
                          source
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
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
              <div className="overflow-hidden rounded-lg border border-line">
                <ul className="divide-y divide-line">
                  {gaps.map((g) => (
                    <li key={g.id} className="bg-panel px-4 py-3 text-sm">
                      <div className="grid gap-2 sm:grid-cols-[7rem_1fr_auto] sm:items-start">
                        <Link href={`/match/${g.id}`} className="stat-num text-ink-dim hover:text-devil-bright">
                          {g.date}
                        </Link>
                        <div className="min-w-0">
                          <Link href={`/match/${g.id}`} className="font-medium hover:text-devil-bright">
                            {g.opponent_name}{" "}
                            <span className="stat-num text-devil-bright">
                              {g.gf}-{g.ga}
                            </span>
                          </Link>
                          <p className="mt-1 text-xs text-ink-dim">{gapWhy(g.gap)}</p>
                        </div>
                        <div className="flex flex-col items-start gap-1 sm:items-end">
                          <span className="text-xs uppercase tracking-wider text-gold">{g.gap}</span>
                          <span className="text-xs text-ink-faint">{g.competition_name}</span>
                          <Link href={gapContributeHref(g)} className="text-xs font-semibold text-devil-bright hover:underline">
                            Contribute →
                          </Link>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="mt-2 text-xs text-ink-dim">
                The queue prioritises recent post-war United goalscorer gaps, then opposition goals, lineups, and
                attendance. Older archive work can still be added whenever a citation is strong.
              </p>
            </section>
          </div>
        </div>

        {/* Appendix — in-page developer register */}
        <div className="rounded-xl border border-line/80 bg-black/20 p-5 shadow-[inset_0_1px_0_rgb(255_255_255_/0.04)] sm:p-6">
          <p className="mb-6 text-xs font-semibold uppercase tracking-[0.18em] text-ink-faint">For developers</p>

          <div className="space-y-8">
            <section id="api" className="scroll-mt-24">
              <h3 className="display mb-3 text-lg">Public read-only API</h3>
              <p className="mb-4 max-w-2xl text-sm text-ink-dim">
                The API serves the same read-only record used by the app. Responses are plain JSON with permissive CORS,
                pagination on the large lists, and an attribution block that points back to this coverage ledger.
              </p>
              <ul className="grid gap-2 text-sm sm:grid-cols-2">
                {[
                  ["/api/v1/meta", "Dataset metadata and coverage counts"],
                  ["/api/v1/matches", "Paginated matches, filterable by date, season, venue, and opponent"],
                  ["/api/v1/matches/{id}", "One match with events, lineups, Elo, and sources"],
                  ["/api/v1/seasons", "Season summaries by competition"],
                  ["/api/v1/players", "Player totals with pagination"],
                  ["/api/v1/opponents", "Opponent head-to-head records"],
                ].map(([href, text]) => (
                  <li key={href}>
                    <a
                      href={href.replace("{id}", "1999-05-26-bayern-munich-n")}
                      className="block rounded border border-line/70 bg-panel/60 px-3 py-2 transition-colors hover:border-devil/60 focus-visible:outline-2 focus-visible:outline-devil-bright"
                    >
                      <span className="font-mono text-sm text-devil-bright">{href}</span>
                      <span className="mt-1 block text-xs text-ink-dim">{text}</span>
                    </a>
                  </li>
                ))}
              </ul>
              <p className="mt-4 max-w-2xl text-xs text-ink-dim">
                Treat result rows as the stable core and read facet flags before using event, lineup, assist, card,
                attendance, or source-derived fields as complete historical totals.
              </p>
            </section>

            <section id="downloads" className="scroll-mt-24">
              <h3 className="display mb-3 text-lg">Dataset downloads</h3>
              <p className="mb-4 max-w-2xl text-sm text-ink-dim">
                Each production build exports flat files from the compiled SQLite database, so the downloadable release
                matches the app and API. Use the manifest first to see file counts and build metadata.
              </p>
              <ul className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ["manifest.json", "Release metadata and row counts"],
                  ["matches.csv", "Fixture spine and match facts"],
                  ["events.csv", "Goal, assist, and card event rows"],
                  ["lineups.csv", "Starting, bench, and substitution rows"],
                  ["elo_history.csv", "Pre/post-match ratings and expectancies"],
                  ["season_summaries.csv", "Competition season summaries"],
                  ["players.csv", "All-time player totals"],
                ].map(([file, text]) => (
                  <li key={file}>
                    <a
                      href={`/dataset/${file}`}
                      className="block rounded border border-line/70 bg-panel/60 px-3 py-2 transition-colors hover:border-devil/60 focus-visible:outline-2 focus-visible:outline-devil-bright"
                    >
                      <span className="font-mono text-sm text-devil-bright">{file}</span>
                      <span className="mt-1 block text-xs text-ink-dim">{text}</span>
                    </a>
                  </li>
                ))}
              </ul>
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
