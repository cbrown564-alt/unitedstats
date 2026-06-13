import Link from "next/link";
import { notFound } from "next/navigation";
import {
  playerAssistPartnerships, playerById, playerClubRanks, playerGoalMatches,
  playerGoalMinutes, playerGoalsByOpponent, playerLineupMatches,
  playerShirtNumbersByDecade, playerSplitsBySeason,
} from "@/lib/queries";
import { playerBestScoringRun, playerGoalsByCompetitionType } from "@/lib/trails";
import { ChartPanel } from "@/components/ChartPanel";
import { CoverageNote } from "@/components/CoverageNote";
import { Column, DataTable } from "@/components/DataTable";
import { InspectableBarChart } from "@/components/charts/InspectableBarChart";
import { PageHeader, StatTile, TrailLink } from "@/components/PageHeader";
import { PlayerPortrait } from "@/components/PlayerPortrait";
import { ResultBadge } from "@/components/ResultBadge";
import { ShirtBadge } from "@/components/ShirtBadge";
import { fmtDate, fmtNum, pct, scoreline } from "@/lib/format";

const TYPE_LABELS: Record<string, string> = {
  league: "League",
  "domestic-cup": "FA Cup",
  "league-cup": "League Cup",
  european: "Europe",
  "super-cup": "Shields & Super Cups",
  world: "World",
  playoff: "Test Matches",
  unofficial: "Wartime & friendlies",
};

export const dynamic = "force-dynamic";

const GOALS_PAGE_SIZE = 50;

type SeasonSplit = {
  season: string;
  apps: number;
  starts: number;
  goals: number;
  assists: number;
};

export default async function PlayerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const p = playerById(id);
  if (!p) notFound();

  const bySeason = playerSplitsBySeason(id);
  const matches = playerGoalMatches(id);
  const appearances = playerLineupMatches(id);
  const shirts = playerShirtNumbersByDecade(id);
  const minutes = playerGoalMinutes(id);
  const partnerships = playerAssistPartnerships(id);
  const compSplits = playerGoalsByCompetitionType(id);
  const opponentGoals = playerGoalsByOpponent(id, 8);
  const ranks = playerClubRanks(id);
  const bestRun = p.goals >= 5 ? playerBestScoringRun(id) : null;

  const coveredSeasons = bySeason.filter((s) => s.apps > 0);

  // Goal-minute distribution, with the final-15 share called out for the late-goals trail.
  const buckets = [0, 0, 0, 0, 0, 0];
  for (const m of minutes) buckets[Math.min(Math.floor((m - 1) / 15), 5)]++;
  const bucketLabels = ["1–15", "16–30", "31–45", "46–60", "61–75", "76–90+"];
  const lateGoals = buckets[5];

  // Multi-goal hauls are computed from recorded scorer data, not headline totals.
  const multiGoalGames = matches.filter((m) => m.goals >= 2).length;
  const hatTricks = matches.filter((m) => m.goals >= 3).length;
  const peakSeason = bySeason.reduce<SeasonSplit | null>(
    (best, s) => (s.goals > 0 && (!best || s.goals > best.goals) ? s : best),
    null,
  );
  const topOpponent = opponentGoals[0];
  const goalsPerApp = p.apps > 0 ? p.goals / p.apps : null;

  // Earliest and latest match we can place this player in, across scorer and lineup coverage.
  const timeline = [...appearances, ...matches];
  const debut = timeline.length
    ? timeline.reduce((a, b) => (b.date < a.date ? b : a))
    : null;
  const latest = timeline.length
    ? timeline.reduce((a, b) => (b.date > a.date ? b : a))
    : null;

  const careerYears =
    p.career ??
    (p.first_year && p.last_year
      ? `${p.first_year}–${p.last_year}`
      : p.first_year
        ? `${p.first_year}–`
        : null);

  // Goals matches list, paginated, newest first.
  const goalsPages = Math.max(1, Math.ceil(matches.length / GOALS_PAGE_SIZE));
  const goalsPage = Math.min(Math.max(1, parseInt(sp.page ?? "1", 10) || 1), goalsPages);
  const pagedMatches = matches.slice((goalsPage - 1) * GOALS_PAGE_SIZE, goalsPage * GOALS_PAGE_SIZE);

  const seasonColumns: Column<SeasonSplit>[] = [
    {
      label: "Season",
      render: (s) => (
        <Link href={`/seasons/${s.season}`} className="font-medium text-ink hover:text-devil-bright">
          {s.season}
        </Link>
      ),
    },
    { label: "Apps", numeric: true, render: (s) => (s.apps ? fmtNum(s.apps) : "—") },
    { label: "Starts", numeric: true, hideBelow: "hidden sm:table-cell", render: (s) => (s.starts ? fmtNum(s.starts) : "—") },
    {
      label: "Goals",
      numeric: true,
      render: (s) => (
        <span className={s.goals > 0 ? "text-devil-bright" : "text-ink-faint"}>{s.goals || "—"}</span>
      ),
    },
    { label: "Assists", numeric: true, hideBelow: "hidden sm:table-cell", render: (s) => (s.assists ? fmtNum(s.assists) : "—") },
    {
      label: "G+A",
      numeric: true,
      render: (s) => (s.goals + s.assists > 0 ? fmtNum(s.goals + s.assists) : "—"),
    },
  ];

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Player"
        title={p.name}
        aside={
          <div className="lg:justify-self-end lg:text-right">
            <PlayerPortrait name={p.name} src={p.player_thumb_url ?? p.player_image_url} size="lg" />
            {p.player_image_page_url && (
              <a
                href={p.player_image_page_url}
                className="mt-2 block max-w-44 text-xs text-ink-faint hover:text-devil-bright lg:ml-auto"
              >
                Wikimedia Commons{p.player_image_license ? ` · ${p.player_image_license}` : ""}
              </a>
            )}
          </div>
        }
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 stat-num text-ink-dim">
          {careerYears && <span>United {careerYears}</span>}
          {p.primary_shirt != null && (
            <>
              <span aria-hidden className="text-ink-faint">·</span>
              <span>#{p.primary_shirt}</span>
            </>
          )}
          {ranks && (
            <>
              <span aria-hidden className="text-ink-faint">·</span>
              <span>
                #{ranks.goalRank} of {fmtNum(ranks.total)} recorded scorers
              </span>
            </>
          )}
        </div>
      </PageHeader>

      <section className="space-y-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <StatTile label="Goals" value={fmtNum(p.goals)} tone="red" />
          <StatTile label="Apps" value={p.apps ? fmtNum(p.apps) : "—"} />
          <StatTile label="Starts" value={p.starts ? fmtNum(p.starts) : "—"} detail={p.subs ? `${fmtNum(p.subs)} sub` : undefined} />
          <StatTile label="Goals / app" value={goalsPerApp != null ? goalsPerApp.toFixed(2) : "—"} />
          <StatTile
            label="Multi-goal"
            value={multiGoalGames ? fmtNum(multiGoalGames) : "—"}
            detail={hatTricks ? `${fmtNum(hatTricks)} hat-trick${hatTricks === 1 ? "" : "s"}` : undefined}
            tone={hatTricks ? "gold" : "default"}
          />
          {ranks ? (
            <StatTile label="Goal rank" value={`#${fmtNum(ranks.goalRank)}`} detail={`of ${fmtNum(ranks.total)}`} />
          ) : (
            <StatTile label="Assists" value={p.assists ? fmtNum(p.assists) : "—"} detail="recorded" />
          )}
        </div>
        <p className="max-w-3xl text-xs text-ink-faint">
          Goals, apps, and starts use verified competitive player records where available.
          Goals per app, multi-goal games, minute, assist, and opponent splits below are drawn from
          recorded match coverage, so they read as the part of a career we can evidence rather than a
          career total.
        </p>
        {shirts.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {shirts.map((shirt) => (
              <div
                key={`${shirt.decade}-${shirt.shirt}`}
                className="flex items-center gap-3 rounded-lg border border-line bg-panel px-3 py-2"
              >
                <ShirtBadge number={shirt.shirt} decade={shirt.decade} apps={shirt.apps} />
                <span className="text-xs leading-4 text-ink-faint">
                  <span className="stat-num text-ink">{fmtNum(shirt.apps)}</span> covered apps
                  {shirt.starts ? `, ${fmtNum(shirt.starts)} starts` : ""}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {(debut || latest) && (
        <section className="grid gap-3 sm:grid-cols-2">
          {debut && (
            <Link
              href={`/match/${debut.id}`}
              className="group block rounded-lg border border-line bg-panel px-4 py-3 transition-colors hover:border-devil/60 hover:bg-panel-2/70"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-faint">First recorded match</p>
              <p className="mt-1 text-sm font-medium group-hover:text-devil-bright">
                {debut.venue === "A" ? "@ " : "v "}
                {debut.opponent_name}
                <span className="stat-num ml-2 text-ink-dim">{scoreline(debut.gf, debut.ga)}</span>
              </p>
              <p className="stat-num mt-0.5 text-xs text-ink-faint">{fmtDate(debut.date)} · {debut.season}</p>
            </Link>
          )}
          {latest && (
            <Link
              href={`/match/${latest.id}`}
              className="group block rounded-lg border border-line bg-panel px-4 py-3 transition-colors hover:border-devil/60 hover:bg-panel-2/70"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-faint">Most recent recorded match</p>
              <p className="mt-1 text-sm font-medium group-hover:text-devil-bright">
                {latest.venue === "A" ? "@ " : "v "}
                {latest.opponent_name}
                <span className="stat-num ml-2 text-ink-dim">{scoreline(latest.gf, latest.ga)}</span>
              </p>
              <p className="stat-num mt-0.5 text-xs text-ink-faint">{fmtDate(latest.date)} · {latest.season}</p>
            </Link>
          )}
        </section>
      )}

      {bySeason.length > 1 && (
        <ChartPanel
          title="Goals by season"
          coverage={`${fmtNum(p.recorded_goals)} recorded goals across ${fmtNum(coveredSeasons.length)} of ${fmtNum(bySeason.length)} seasons.`}
          note="Bars use recorded scorer data, so early or sparsely covered seasons can read low."
        >
          <InspectableBarChart
            data={bySeason.map((s) => ({
              label: s.season.slice(0, 4),
              value: s.goals,
              valueLabel: `${fmtNum(s.goals)} goals`,
              meta: s.season,
              href: `/seasons/${s.season}`,
            }))}
            labelEvery={Math.max(1, Math.floor(bySeason.length / 12))}
            chartLabel={`${p.name} goals by season`}
          />
        </ChartPanel>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {minutes.length > 3 && (
          <ChartPanel
            title="When in the match"
            coverage={`${fmtNum(minutes.length)} goals with a recorded minute.`}
            note={
              lateGoals > 0
                ? `${pct(lateGoals, minutes.length)} of those came in the final 15 minutes.`
                : undefined
            }
          >
            <InspectableBarChart
              data={buckets.map((n, i) => ({
                label: bucketLabels[i],
                value: n,
                valueLabel: `${fmtNum(n)} goals`,
                meta: "Recorded goal minutes",
              }))}
              height={150}
              color="var(--color-gold)"
              highlightLabel="76–90+"
              chartLabel={`${p.name} goals by match-minute bucket`}
            />
          </ChartPanel>
        )}

        {compSplits.length > 1 && (
          <ChartPanel
            title="Goals by competition"
            note="Recorded goals only — cup splits depend on scorer coverage for those competitions."
          >
            <ul className="divide-y divide-line text-sm">
              {compSplits.map((c) => (
                <li key={c.type} className="flex items-center justify-between py-2">
                  <span className="text-ink-dim">{TYPE_LABELS[c.type] ?? c.type}</span>
                  <span className="stat-num text-devil-bright">{fmtNum(c.goals)}</span>
                </li>
              ))}
            </ul>
          </ChartPanel>
        )}

        {opponentGoals.length > 0 && (
          <ChartPanel
            title="Goals by opponent"
            note="Opponents this player has the most recorded goals against."
          >
            <ul className="divide-y divide-line text-sm">
              {opponentGoals.map((o) => (
                <li key={o.opponent_id}>
                  <Link
                    href={`/opponent/${o.opponent_id}`}
                    className="flex items-center justify-between gap-3 py-2 hover:text-devil-bright"
                  >
                    <span className="min-w-0 truncate text-ink-dim">{o.opponent_name}</span>
                    <span className="stat-num shrink-0 text-ink-faint">
                      <span className="text-devil-bright">{fmtNum(o.goals)}</span> in {fmtNum(o.matches)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </ChartPanel>
        )}

        {bestRun && (
          <ChartPanel
            title="Best scoring run"
            note="Counted across matches with complete scorer records; gaps in coverage break a run rather than extend it."
          >
            <div className="flex items-baseline gap-3">
              <span className="stat-num text-4xl font-semibold text-devil-bright">{bestRun.length}</span>
              <span className="text-sm text-ink-dim">consecutive matches scored in</span>
            </div>
            <p className="stat-num mt-1 text-xs text-ink-faint">
              {fmtDate(bestRun.from)} – {fmtDate(bestRun.to)}
            </p>
          </ChartPanel>
        )}
      </div>

      {bySeason.length > 0 && (
        <section>
          <details open className="group">
            <summary className="flex cursor-pointer items-baseline justify-between gap-3 list-none">
              <h2 className="display text-xl">Season by season</h2>
              <span className="stat-num text-xs text-ink-faint group-open:hidden">show</span>
              <span className="stat-num text-xs text-ink-faint hidden group-open:inline">hide</span>
            </summary>
            <div className="mt-3">
              <DataTable
                columns={seasonColumns}
                rows={bySeason}
                rowKey={(s) => s.season}
                density="compact"
                caption={`${p.name} season-by-season apps, goals, and assists`}
                summary={
                  <>
                    <span>{fmtNum(bySeason.length)} recorded seasons</span>
                    <span className="stat-num">
                      {fmtNum(coveredSeasons.length)} with lineup coverage
                    </span>
                  </>
                }
              />
              <CoverageNote
                slice="all competitions, per season"
                coverage="apps and assists reflect local lineup and scorer coverage; empty cells are coverage gaps, not zero."
              />
            </div>
          </details>
        </section>
      )}

      <section id="scored">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="display text-xl">Matches scored in</h2>
          {matches.length > 0 && (
            <span className="stat-num text-xs text-ink-faint">{fmtNum(matches.length)} matches</span>
          )}
        </div>
        {pagedMatches.length > 0 ? (
          <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-pitch/35">
            {pagedMatches.map((m) => {
              const mins = (m.minutes ?? "")
                .split(",")
                .map((s) => Number(s))
                .filter((n) => Number.isFinite(n) && n > 0)
                .sort((a, b) => a - b);
              return (
                <li key={m.id}>
                  <Link
                    href={`/match/${m.id}`}
                    className="grid min-h-14 grid-cols-[auto_1fr_auto] items-center gap-3 px-3 py-2.5 transition-colors hover:bg-panel focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-devil-bright sm:grid-cols-[7rem_auto_1fr_auto_auto] sm:px-4"
                  >
                    <span className="stat-num hidden text-xs text-ink-dim sm:block">{fmtDate(m.date)}</span>
                    <ResultBadge result={m.result} outcome={m.outcome} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        <span className="mr-1.5 text-ink-faint">{m.venue === "H" ? "v" : m.venue === "A" ? "@" : "n"}</span>
                        {m.opponent_name}
                      </span>
                      <span className="text-xs text-ink-dim sm:hidden">
                        {fmtDate(m.date)} · {m.season}
                      </span>
                    </span>
                    <span
                      className={`stat-num whitespace-nowrap rounded px-2 py-0.5 text-xs font-semibold ${
                        m.goals >= 3 ? "bg-gold/15 text-gold" : m.goals >= 2 ? "bg-devil/15 text-devil-bright" : "text-ink-faint"
                      }`}
                      title={mins.length ? `Goals at ${mins.map((x) => `${x}'`).join(", ")}` : undefined}
                    >
                      {m.goals >= 3 ? `${m.goals} goals` : m.goals === 2 ? "brace" : "1 goal"}
                      {mins.length > 0 && <span className="ml-1 font-normal text-ink-faint">{mins.map((x) => `${x}'`).join(" ")}</span>}
                    </span>
                    <span className="stat-num hidden whitespace-nowrap rounded bg-panel-2 px-2 py-1 text-sm font-semibold sm:block">
                      {scoreline(m.gf, m.ga, m.pen_gf != null ? [m.pen_gf, m.pen_ga] : null, !!m.aet)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="rounded-lg border border-line bg-panel px-4 py-6 text-center text-sm text-ink-faint">
            No matches with recorded scorer data yet.
          </p>
        )}
        {goalsPages > 1 && (
          <nav className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-line bg-panel px-3 py-2 text-sm">
            {goalsPage > 1 ? (
              <Link
                href={`/player/${id}?page=${goalsPage - 1}#scored`}
                className="rounded px-2 py-1 text-devil-bright hover:bg-panel-2 focus-visible:outline-2 focus-visible:outline-devil-bright"
              >
                Newer
              </Link>
            ) : (
              <span />
            )}
            <span className="stat-num text-ink-faint">
              page {goalsPage} / {fmtNum(goalsPages)}
            </span>
            {goalsPage < goalsPages ? (
              <Link
                href={`/player/${id}?page=${goalsPage + 1}#scored`}
                className="rounded px-2 py-1 text-devil-bright hover:bg-panel-2 focus-visible:outline-2 focus-visible:outline-devil-bright"
              >
                Older
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </section>

      {appearances.length > 0 && (
        <section>
          <details className="group">
            <summary className="flex cursor-pointer items-baseline justify-between gap-3 list-none">
              <h2 className="display text-xl">Lineup appearances</h2>
              <span className="stat-num text-xs text-ink-faint">
                {fmtNum(appearances.length)} covered · <span className="text-devil-bright group-open:hidden">show</span>
                <span className="hidden text-devil-bright group-open:inline">hide</span>
              </span>
            </summary>
            <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
              {appearances.slice(0, 30).map((m) => (
                <Link
                  key={m.id}
                  href={`/match/${m.id}`}
                  className="rounded-lg border border-line bg-panel px-4 py-2.5 hover:border-devil/60"
                >
                  <div className="flex justify-between gap-3">
                    <span className="truncate font-medium">{m.opponent_name}</span>
                    <span className="stat-num text-ink-faint">{m.gf}–{m.ga}</span>
                  </div>
                  <div className="mt-1 text-xs text-ink-faint">
                    {fmtDate(m.date)} · {m.started ? "started" : `sub ${m.sub_on != null ? `${m.sub_on}'` : ""}`}
                    {m.role ? ` · ${m.role}` : ""}
                  </div>
                </Link>
              ))}
            </div>
            {appearances.length > 30 && (
              <CoverageNote coverage={`30 most recent of ${fmtNum(appearances.length)} covered lineup rows shown.`} />
            )}
          </details>
        </section>
      )}

      {partnerships.length > 0 && (
        <section>
          <h2 className="display mb-3 text-xl">Assist partnerships</h2>
          <ul className="max-w-2xl divide-y divide-line overflow-hidden rounded-lg border border-line bg-panel text-sm">
            {partnerships.map((row) => (
              <li key={`${row.assister_id}-${row.scorer_id}`} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span>
                  <span className="font-medium">{row.assister_name}</span>
                  <span className="text-ink-faint"> assisted </span>
                  <span className="font-medium">{row.scorer_name}</span>
                </span>
                <span className="stat-num shrink-0 text-devil-bright">{fmtNum(row.goals)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {(peakSeason || topOpponent) && (
        <section>
          <h2 className="display mb-3 text-xl">Keep exploring</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {peakSeason && (
              <TrailLink href={`/seasons/${peakSeason.season}`} title={peakSeason.season}>
                His most prolific recorded season, with {fmtNum(peakSeason.goals)} goals.
              </TrailLink>
            )}
            {topOpponent && (
              <TrailLink href={`/opponent/${topOpponent.opponent_id}`} title={topOpponent.opponent_name}>
                The opponent he has scored against most: {fmtNum(topOpponent.goals)} recorded goals.
              </TrailLink>
            )}
            <TrailLink href="/players" title="All players">
              {ranks
                ? `Where ${p.name} ranks among ${fmtNum(ranks.total)} recorded scorers.`
                : "Browse the full scorer and appearance index."}
            </TrailLink>
          </div>
        </section>
      )}

      <p className="text-sm">
        <Link href="/players" className="text-devil-bright hover:underline">← All players</Link>
      </p>
    </div>
  );
}
