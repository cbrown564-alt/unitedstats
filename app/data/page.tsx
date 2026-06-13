import Link from "next/link";
import {
  coverageByCompetitionType,
  coverageOverview,
  dataGaps,
  eventCoverage,
  lineupCoverage,
  sourceUsage,
} from "@/lib/queries";
import { InspectableBarChart } from "@/components/charts/InspectableBarChart";
import { DataTable } from "@/components/DataTable";
import { fmtNum, pct, COMPETITION_TYPE_LABELS } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Data & corrections" };

function CoverageBars({
  data,
  field,
  title,
  color = "var(--color-devil)",
}: {
  data: { decade: string; matches: number; withEvents?: number; withLineups?: number }[];
  field: "withEvents" | "withLineups";
  title: string;
  color?: string;
}) {
  return (
    <div>
      <h3 className="display text-base mb-3">{title}</h3>
      <InspectableBarChart
        data={data.map((c) => {
          const covered = Number(c[field] ?? 0);
          return {
            label: c.decade,
            tickLabel: c.decade.slice(0, 4),
            value: c.matches ? Math.round((1000 * covered) / c.matches) / 10 : 0,
            valueLabel: pct(covered, c.matches),
            meta: `${fmtNum(covered)} of ${fmtNum(c.matches)} matches`,
          };
        })}
        height={160}
        color={color}
        chartLabel={title}
        labelEvery={2}
        yTickSuffix="%"
      />
    </div>
  );
}

export default function DataPage() {
  const overview = coverageOverview();
  const byType = coverageByCompetitionType();
  const sources = sourceUsage();
  const scorerCoverage = eventCoverage();
  const lineups = lineupCoverage();
  const gaps = dataGaps(14);

  return (
    <div className="space-y-12">
      <header>
        <p className="text-xs uppercase tracking-[0.25em] text-devil-bright font-semibold mb-2">
          Canonical record
        </p>
        <h1 className="display text-3xl">Data & corrections</h1>
        <p className="text-sm text-ink-dim mt-2 max-w-3xl">
          UnitedStats is built from plain JSON in <span className="stat-num">data/canonical</span>. Results are
          the official spine; United scorers, opposition goals, assists, lineups, attendance, wartime records, and friendlies are
          layered on with source facets so partial coverage can be explained where it matters.
        </p>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-line border border-line rounded-lg overflow-hidden">
        {[
          ["Official matches", fmtNum(overview.officialMatches)],
          ["Complete United scorer rows", `${fmtNum(overview.completeScorers)} / ${fmtNum(overview.matches)}`],
          ["Starting XIs", `${fmtNum(overview.withStartingLineups)} / ${fmtNum(overview.matches)}`],
          ["Source records", fmtNum(sources.length)],
        ].map(([label, value]) => (
          <div key={label} className="bg-panel px-4 py-3">
            <div className="stat-num text-2xl font-semibold">{value}</div>
            <div className="text-xs text-ink-faint uppercase tracking-wider mt-0.5">{label}</div>
          </div>
        ))}
      </section>

      <section className="grid lg:grid-cols-[1fr_21rem] gap-8">
        <div>
          <h2 className="display text-xl mb-3">Coverage by competition type</h2>
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
                label: "United scorers",
                key: "scorers",
                numeric: true,
                render: (row) => (
                  <>
                    {fmtNum(row.completeScorers)}{" "}
                    <span className="text-ink-faint">({pct(row.completeScorers, row.matches)})</span>
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
                    <span className="text-ink-faint">({pct(row.withOppositionGoals, row.matches)})</span>
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
                    <span className="text-ink-faint">({pct(row.withAssists, row.matches)})</span>
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
                    <span className="text-ink-faint">({pct(row.withStartingLineups, row.matches)})</span>
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
                    {fmtNum(row.withCards)} <span className="text-ink-faint">({pct(row.withCards, row.matches)})</span>
                  </>
                ),
              },
            ]}
          />
        </div>

        <aside className="border border-line rounded-lg bg-panel p-4">
          <h2 className="display text-xl mb-3">Correction contract</h2>
          <ol className="space-y-3 text-sm text-ink-dim list-decimal list-inside">
            <li>Edit the season file in <span className="stat-num">data/canonical/matches</span>.</li>
            <li>Add players to <span className="stat-num">players.json</span> before referencing them.</li>
            <li>Use <span className="stat-num">sources</span> to cite every changed fact.</li>
            <li>Run <span className="stat-num">npm run validate</span> and <span className="stat-num">npm run build:db</span>.</li>
          </ol>
          <p className="text-xs text-ink-faint mt-4">
            Wartime, abandoned matches, friendlies, and tours belong in the canonical match files with
            <span className="stat-num"> wartime</span> or <span className="stat-num"> friendly</span> competition ids.
            They are non-official and stay out of official records by default.
          </p>
        </aside>
      </section>

      <section className="grid lg:grid-cols-2 gap-8">
        <div className="border border-line rounded-lg bg-panel p-4">
          <CoverageBars data={scorerCoverage} field="withEvents" title="United scorer coverage by decade" />
        </div>
        <div className="border border-line rounded-lg bg-panel p-4">
          <CoverageBars
            data={lineups}
            field="withLineups"
            title="Lineup coverage by decade"
            color="var(--color-gold)"
          />
        </div>
      </section>

      <section>
        <h2 className="display text-xl mb-3">Event and lineup facets</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-line border border-line rounded-lg overflow-hidden">
          {[
            ["Opposition goals", overview.withOppositionGoals],
            ["Assists", overview.withAssists],
            ["Used substitutes", overview.withUsedSubstitutes],
            ["Bench records", overview.withBenches],
            ["Cards", overview.withCards],
            ["Attendance", overview.withAttendance],
          ].map(([label, value]) => (
            <div key={label} className="bg-panel px-4 py-3">
              <div className="stat-num text-xl font-semibold">{fmtNum(Number(value))}</div>
              <div className="text-xs text-ink-faint uppercase tracking-wider mt-0.5">{label}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-ink-faint mt-2 max-w-3xl">
          Phase 4 keeps each match-sheet layer separate so a reader can distinguish result certainty from
          United scorers, opposition scorers, assists, starting lineups, substitute usage, benches, cards, and attendance.
        </p>
      </section>

      <section id="api" className="grid lg:grid-cols-[1fr_21rem] gap-8 scroll-mt-24">
        <div>
          <h2 className="display text-xl mb-3">Public read-only API</h2>
          <div className="border border-line rounded-lg bg-panel p-4">
            <p className="text-sm text-ink-dim max-w-3xl">
              The API serves the same read-only record used by the app. Responses are plain JSON with
              permissive CORS, pagination on the large lists, and an attribution block that points back to
              this coverage ledger.
            </p>
            <div className="grid sm:grid-cols-2 gap-2 mt-4 text-sm">
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
                  <span className="block text-xs text-ink-faint mt-1">{text}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        <aside className="border border-line rounded-lg bg-panel p-4">
          <h3 className="display text-base mb-2">Scope language</h3>
          <p className="text-sm text-ink-dim">
            API consumers should treat result rows as the stable spine and read facet flags before using
            event, lineup, assist, card, attendance, or source-derived fields as complete historical totals.
          </p>
        </aside>
      </section>

      <section id="downloads" className="scroll-mt-24">
        <h2 className="display text-xl mb-3">Dataset downloads</h2>
        <div className="border border-line rounded-lg bg-panel p-4">
          <p className="text-sm text-ink-dim max-w-3xl">
            Each production build exports flat files from the compiled SQLite database, so the downloadable
            release matches the app and API. Use the manifest first to see file counts and build metadata.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 mt-4 text-sm">
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
                <span className="block text-xs text-ink-faint mt-1">{text}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section>
        <h2 className="display text-xl mb-3">Source lineage</h2>
        <div className="grid md:grid-cols-2 gap-3">
          {sources.map((s) => (
            <div key={s.id} className="border border-line rounded-lg bg-panel px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{s.label}</h3>
                  <p className="text-xs text-ink-faint uppercase tracking-wider mt-0.5">{s.kind}</p>
                </div>
                <span className="stat-num text-xs text-ink-dim">{fmtNum(s.matches)} matches</span>
              </div>
              {s.coverage && <p className="text-sm text-ink-dim mt-2">{s.coverage}</p>}
              <p className="text-xs text-ink-faint mt-2">
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
      </section>

      <section>
        <h2 className="display text-xl mb-3">High-value gaps</h2>
        <div className="border border-line rounded-lg overflow-hidden">
          <ul className="divide-y divide-line">
            {gaps.map((g) => (
              <li key={g.id}>
                <Link
                  href={`/match/${g.id}`}
                  className="grid sm:grid-cols-[7rem_1fr_auto_auto] gap-2 px-4 py-3 hover:bg-panel transition-colors text-sm"
                >
                  <span className="stat-num text-ink-faint">{g.date}</span>
                  <span className="font-medium">
                    {g.opponent_name} <span className="stat-num text-devil-bright">{g.gf}-{g.ga}</span>
                  </span>
                  <span className="text-ink-faint">{g.competition_name}</span>
                  <span className="text-xs uppercase tracking-wider text-gold">{g.gap}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-ink-faint mt-2">
          The queue prioritizes recent post-war United scorer gaps, then opposition goals, lineups, and attendance. Older
          archive work can still be added whenever a citation is strong.
        </p>
      </section>
    </div>
  );
}
