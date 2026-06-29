import Link from "next/link";
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
import { fmtNum, pct, COMPETITION_TYPE_LABELS } from "@/lib/format";
import { CORRECTION_STATUS_URL } from "@/lib/corrections";

export const metadata = { title: "Data and corrections" };

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
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-devil-bright">Canonical record</p>
        <h1 className="display text-3xl">Data and corrections</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-dim">
          Red Thread is built from plain JSON in <span className="stat-num">data/canonical</span>. The result of every
          match is the spine; United goalscorers, opposition goals, lineups, cards, attendance, and assists are layered on
          top with cited sources, so partial coverage can be shown honestly rather than hidden.
        </p>
      </header>

      {/* ───────────────── Act I — the record ───────────────── */}
      <div className="space-y-6">
        <Act n="01" kicker="The record" title="Complete spine, layers that fill in">
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
            {/* headline: the result spine is complete; the depth facets sit beside it as a ribbon */}
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
              slice={`all ${fmtNum(overview.matches)} matches in the database, grouped by decade. The result row is the spine — every match carries one.`}
            >
              Intensity and the cell value are the share of each decade’s matches that carry the layer. The
              all-time column on the right is the same share across the whole record.
            </CoverageNote>
          </div>
        </section>
      </div>

      {/* ───────────────── Act II — coverage by competition ───────────────── */}
      <div className="space-y-6">
        <Act n="02" kicker="The other cut" title="Coverage by competition type">
          The same layers, sliced by competition rather than by decade — league fixtures are the best-covered, the
          deep cup and European archive the thinnest.
        </Act>

        <DataTable
          caption="Coverage by competition type"
          rows={byType}
          rowKey={(row) => row.type}
          columns={[
            {
              label: "Scope",
              key: "scope",
              className: "font-medium",
              render: (row) => COMPETITION_TYPE_LABELS[row.type] ?? row.type,
            },
            { label: "Matches", key: "matches", numeric: true, render: (row) => fmtNum(row.matches) },
            {
              label: "United goalscorers",
              key: "scorers",
              numeric: true,
              render: (row) => (
                <>
                  {fmtNum(row.completeScorers)}{" "}
                  <span className="text-ink-dim">({pct(row.completeScorers, row.matches)})</span>
                </>
              ),
            },
            {
              label: "Opp goals",
              key: "opp-goals",
              numeric: true,
              hideBelow: "hidden sm:table-cell",
              render: (row) => (
                <>
                  {fmtNum(row.withOppositionGoals)}{" "}
                  <span className="text-ink-dim">({pct(row.withOppositionGoals, row.matches)})</span>
                </>
              ),
            },
            {
              label: "Assists",
              key: "assists",
              numeric: true,
              hideBelow: "hidden md:table-cell",
              render: (row) => (
                <>
                  {fmtNum(row.withAssists)}{" "}
                  <span className="text-ink-dim">({pct(row.withAssists, row.matches)})</span>
                </>
              ),
            },
            {
              label: "Starting XI",
              key: "starting-xi",
              numeric: true,
              hideBelow: "hidden lg:table-cell",
              render: (row) => (
                <>
                  {fmtNum(row.withStartingLineups)}{" "}
                  <span className="text-ink-dim">({pct(row.withStartingLineups, row.matches)})</span>
                </>
              ),
            },
            {
              label: "Cards",
              key: "cards",
              numeric: true,
              hideBelow: "hidden xl:table-cell",
              render: (row) => (
                <>
                  {fmtNum(row.withCards)} <span className="text-ink-dim">({pct(row.withCards, row.matches)})</span>
                </>
              ),
            },
          ]}
        />
        <p className="text-xs text-ink-dim">
          Also layered onto the lineups: <span className="stat-num text-ink">{fmtNum(overview.withUsedSubstitutes)}</span> matches
          with used-substitute records and <span className="stat-num text-ink">{fmtNum(overview.withBenches)}</span> with a named bench.
        </p>
      </div>

      {/* ───────────────── Act III — how it's built and corrected ───────────────── */}
      <div className="space-y-6">
        <Act n="03" kicker="Provenance" title="How the record is built and corrected">
          Every layered fact cites a source, and corrections follow one contract. The queue below is where the faint
          cells above turn into work.
        </Act>

        <section className="grid gap-6 lg:grid-cols-[1fr_21rem]">
          <div>
            <h3 className="display text-lg mb-3">Source lineage</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {sources.map((s) => (
                <div key={s.id} className="rounded-lg border border-line bg-panel px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-semibold">{s.label}</h4>
                      <p className="mt-0.5 text-[11px] uppercase tracking-wider text-ink-dim">{s.kind}</p>
                    </div>
                    <span className="stat-num text-xs text-ink-dim">{fmtNum(s.matches)} matches</span>
                  </div>
                  {s.coverage && <p className="mt-2 text-sm text-ink-dim">{s.coverage}</p>}
                  <p className="mt-2 text-xs text-ink-dim">
                    Facets: {s.facets ? s.facets.split(",").sort().join(", ") : "planned only"}
                    {s.url && (
                      <>
                        {" · "}
                        <a href={s.url} className="text-devil-bright hover:underline">
                          source
                        </a>
                      </>
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <aside className="self-start rounded-lg border border-line bg-panel p-4">
            <h3 className="display text-lg mb-3">Correction contract</h3>
            <ol className="list-inside list-decimal space-y-3 text-sm text-ink-dim">
              <li>Edit the season file in <span className="stat-num text-ink">data/canonical/matches</span>.</li>
              <li>Add players to <span className="stat-num text-ink">players.json</span> before referencing them.</li>
              <li>Use <span className="stat-num text-ink">sources</span> to cite every changed fact.</li>
              <li>Run <span className="stat-num text-ink">npm run validate</span> and <span className="stat-num text-ink">npm run build:db</span>.</li>
            </ol>
            <p className="mt-4 text-xs text-ink-dim">
              Wartime, abandoned matches, friendlies, and tours belong in the canonical files with
              <span className="stat-num text-ink"> wartime</span> or <span className="stat-num text-ink"> friendly</span> competition
              ids. They stay out of official records by default.
            </p>
            <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold">
              <Link href="/corrections" className="text-devil-bright hover:underline">
                Correction builder
              </Link>
              <a href={CORRECTION_STATUS_URL} className="text-devil-bright hover:underline">
                Correction status
              </a>
            </div>
          </aside>
        </section>

        <section>
          <h3 className="display text-lg mb-3">High-value gaps</h3>
          <div className="overflow-hidden rounded-lg border border-line">
            <ul className="divide-y divide-line">
              {gaps.map((g) => (
                <li key={g.id}>
                  <Link
                    href={`/match/${g.id}`}
                    className="grid gap-2 px-4 py-3 text-sm transition-colors hover:bg-panel sm:grid-cols-[7rem_1fr_auto_auto]"
                  >
                    <span className="stat-num text-ink-dim">{g.date}</span>
                    <span className="font-medium">
                      {g.opponent_name} <span className="stat-num text-devil-bright">{g.gf}-{g.ga}</span>
                    </span>
                    <span className="text-ink-dim">{g.competition_name}</span>
                    <span className="text-xs uppercase tracking-wider text-gold">{g.gap}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-2 text-xs text-ink-dim">
            The queue prioritises recent post-war United goalscorer gaps, then opposition goals, lineups, and attendance.
            Older archive work can still be added whenever a citation is strong.
          </p>
        </section>
      </div>

      {/* ───────────────── Appendix — use the data ───────────────── */}
      <div className="space-y-8 border-t border-line/70 pt-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-faint">Use the data</p>

        <section id="api" className="scroll-mt-24 grid gap-6 lg:grid-cols-[1fr_21rem]">
          <div>
            <h3 className="display text-lg mb-3">Public read-only API</h3>
            <p className="mb-4 max-w-2xl text-sm text-ink-dim">
              The API serves the same read-only record used by the app. Responses are plain JSON with permissive CORS,
              pagination on the large lists, and an attribution block that points back to this coverage ledger.
            </p>
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              {[
                ["/api/v1/meta", "Dataset metadata and coverage counts"],
                ["/api/v1/matches", "Paginated matches, filterable by date, season, venue, and opponent"],
                ["/api/v1/matches/{id}", "One match with events, lineups, Elo, and sources"],
                ["/api/v1/seasons", "Season summaries by competition"],
                ["/api/v1/players", "Player totals with pagination"],
                ["/api/v1/opponents", "Opponent head-to-head records"],
              ].map(([href, text]) => (
                <a
                  key={href}
                  href={href.replace("{id}", "1999-05-26-bayern-munich-n")}
                  className="block rounded border border-line bg-panel-2 px-3 py-2 hover:border-devil/60 focus-visible:outline-2 focus-visible:outline-devil-bright"
                >
                  <span className="stat-num text-devil-bright">{href}</span>
                  <span className="mt-1 block text-xs text-ink-dim">{text}</span>
                </a>
              ))}
            </div>
          </div>

          <aside className="self-start rounded-lg border border-line bg-panel p-4">
            <h3 className="display text-base mb-2">Scope language</h3>
            <p className="text-sm text-ink-dim">
              Treat result rows as the stable spine and read facet flags before using event, lineup, assist, card,
              attendance, or source-derived fields as complete historical totals.
            </p>
          </aside>
        </section>

        <section id="downloads" className="scroll-mt-24">
          <h3 className="display text-lg mb-3">Dataset downloads</h3>
          <p className="mb-4 max-w-2xl text-sm text-ink-dim">
            Each production build exports flat files from the compiled SQLite database, so the downloadable release
            matches the app and API. Use the manifest first to see file counts and build metadata.
          </p>
          <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["manifest.json", "Release metadata and row counts"],
              ["matches.csv", "Fixture spine and match facts"],
              ["events.csv", "Goal, assist, and card event rows"],
              ["lineups.csv", "Starting, bench, and substitution rows"],
              ["elo_history.csv", "Pre/post-match ratings and expectancies"],
              ["season_summaries.csv", "Competition season summaries"],
              ["players.csv", "All-time player totals"],
            ].map(([file, text]) => (
              <a
                key={file}
                href={`/dataset/${file}`}
                className="block rounded border border-line bg-panel-2 px-3 py-2 hover:border-devil/60 focus-visible:outline-2 focus-visible:outline-devil-bright"
              >
                <span className="stat-num text-devil-bright">{file}</span>
                <span className="mt-1 block text-xs text-ink-dim">{text}</span>
              </a>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
