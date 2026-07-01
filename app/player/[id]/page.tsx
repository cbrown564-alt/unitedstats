import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  playerAssistPartnerships, playerById, playerClubRanks,
  playerCuratedGoalTypes, playerCuratedTotals,
  playerGoalMatches, playerGoalsByOpponent, playerLineupMatches,
  playerShirtNumbersByDecade, playerSplitsBySeason, playerTransfers, playersIndex,
  type CuratedTotals,
} from "@/lib/queries";
import { playerBestScoringRun } from "@/lib/trails";
import { ChartPanel } from "@/components/ChartPanel";
import { CoverageNote } from "@/components/CoverageNote";
import { PlayerSeasonTable, type SeasonSplit } from "@/components/PlayerSeasonTable";
import { GoalBodyMap } from "@/components/charts/GoalBodyMap";
import { SeasonContributionChartLazy as SeasonContributionChart } from "@/components/charts/lazy";
import { PlayerPlate } from "@/components/PlayerPlate";
import { DetailBreadcrumb } from "@/components/DetailBreadcrumb";
import { DetailSectionTabs } from "@/components/mobile/DetailSectionTabs";
import { PlayerCareerPitch } from "@/components/charts/PlayerCareerPitch";
import { AssistPartnerships } from "@/components/AssistPartnerships";
import { MatchList } from "@/components/MatchList";
import { HaulCards } from "@/components/HaulCards";
import { OwnGoalProfile } from "@/components/OwnGoalProfile";
import { SectionHead } from "@/components/SectionHead";
import { TransferList } from "@/components/TransferList";
import { EvidenceLink } from "@/components/EvidenceLink";
import { fmtDate, fmtNum, playerCareerSpan } from "@/lib/format";
import { queryString } from "@/lib/url";
import { entityRef } from "@/lib/citations";
import { correctionPrefillHref } from "@/lib/corrections";
import { sampleStaticIds } from "@/lib/static-build";

// Sampled SSG (see lib/static-build): preview builds prerender a subset, so
// non-sampled ids render on demand; full builds prerender every id, leaving only
// missing ids to fall through to notFound(). Must be a static literal for Next.
export const dynamicParams = true;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const p = playerById(id);
  if (!p) return {};
  const span = playerCareerSpan(p);
  const title = `${p.name}`;
  const description = `${p.name} — Manchester United playing record from ${span}. ${fmtNum(p.apps)} appearances, ${fmtNum(p.goals)} goals, and ${fmtNum(p.assists)} assists.`;
  return {
    title,
    description,
    openGraph: {
      title: `${title} · Red Thread`,
      description,
    },
  };
}

const SCORING_ARCHIVE_INLINE_MAX = 25;
const APPEARANCE_ARCHIVE_INLINE_MAX = 60;

export async function generateStaticParams() {
  return sampleStaticIds(playersIndex().map((p) => p.player_id)).map((id) => ({ id }));
}

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // "Own Goal" is a synthetic scorer, not a person: its page shows the opposition
  // players behind the tally rather than a career.
  if (id === "own-goal") return <OwnGoalProfile />;

  const p = playerById(id);
  if (!p) notFound();
  const playerCorrectionHref = correctionPrefillHref({
    targetKind: "player",
    targetId: id,
    targetLabel: p.name,
    fieldPath: `players[id=${id}].name`,
    currentValue: p.name,
    pagePath: `/player/${id}`,
    citableId: entityRef("player", id).id,
  });

  const bySeason = playerSplitsBySeason(id);
  const matches = playerGoalMatches(id);
  const appearances = playerLineupMatches(id);
  const shirts = playerShirtNumbersByDecade(id);
  const partnerships = playerAssistPartnerships(id);
  const opponentGoals = playerGoalsByOpponent(id, 1);
  const ranks = playerClubRanks(id);
  const bestRun = p.goals >= 5 ? playerBestScoringRun(id) : null;
  const transfers = playerTransfers(id);

  // Curated Tableau lane: season-level goals/assists and goal-type breakdown,
  // 1987-88..2014-15. Not match-attributed, so it stays in its own labelled section.
  const curatedTotals = playerCuratedTotals(id);
  const curatedGoalTypes = curatedTotals ? playerCuratedGoalTypes(id) : [];

  const coveredSeasons = bySeason.filter((s) => s.apps > 0);

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

  const careerYears = playerCareerSpan(p);

  // Scoring matches (newest first). For a prolific scorer the flat list is huge,
  // so we lead with the hauls and tuck the complete record, season-grouped, behind
  // a disclosure. The hauls lead with the biggest, then most recent.
  const braces = multiGoalGames - hatTricks;
  const hauls = matches
    .filter((m) => m.goals >= 2)
    .sort((a, b) => b.goals - a.goals || b.date.localeCompare(a.date));
  // The haul cards are a highlight reel, not the full multi-goal list — biggest
  // nights first, capped, with the complete record carried by the archive below.
  const topHauls = hauls.slice(0, 6);
  const longScoredList = matches.length > SCORING_ARCHIVE_INLINE_MAX;
  const scoredBySeason: [string, typeof matches][] = [];
  const seasonIndex = new Map<string, number>();
  for (const m of matches) {
    let i = seasonIndex.get(m.season);
    if (i === undefined) {
      i = scoredBySeason.length;
      seasonIndex.set(m.season, i);
      scoredBySeason.push([m.season, []]);
    }
    scoredBySeason[i][1].push(m);
  }
  // Lineup appearances, season-grouped (newest first) for the full archive.
  const appsBySeason: [string, typeof appearances][] = [];
  const appsIndex = new Map<string, number>();
  for (const m of appearances) {
    let i = appsIndex.get(m.season);
    if (i === undefined) {
      i = appsBySeason.length;
      appsIndex.set(m.season, i);
      appsBySeason.push([m.season, []]);
    }
    appsBySeason[i][1].push(m);
  }
  const longAppearanceList = appearances.length > APPEARANCE_ARCHIVE_INLINE_MAX;

  // Goal-count badge with the recorded minutes, reused across the scored lists.
  const goalExtra = (m: { goals: number; minutes?: string | null }) => {
    const mins = (m.minutes ?? "")
      .split(",")
      .map((s) => Number(s))
      .filter((n) => Number.isFinite(n) && n > 0)
      .sort((a, b) => a - b);
    return (
      <span
        className={`stat-num whitespace-nowrap rounded px-2 py-0.5 text-xs font-semibold ${
          m.goals >= 3 ? "bg-gold/15 text-gold" : m.goals >= 2 ? "bg-devil/15 text-devil-bright" : "text-ink-faint"
        }`}
        title={mins.length ? `Goals at ${mins.map((x) => `${x}'`).join(", ")}` : undefined}
      >
        {m.goals >= 3 ? `${m.goals} goals` : m.goals === 2 ? "brace" : "1 goal"}
        {mins.length > 0 && <span className="ml-1 font-normal text-ink-faint">{mins.map((x) => `${x}'`).join(" ")}</span>}
      </span>
    );
  };

  // How he entered each appearance — started vs off the bench, with the role.
  const appsExtra = (m: { started: number; sub_on: number | null; role: string | null }) => (
    <span className="stat-num whitespace-nowrap text-xs">
      {m.started ? (
        <span className="text-devil-bright">Started</span>
      ) : (
        <span className="text-ink-dim">Sub{m.sub_on != null ? ` ${m.sub_on}'` : ""}</span>
      )}
      {m.role && <span className="ml-1.5 font-normal text-ink-faint">{m.role}</span>}
    </span>
  );

  // The season-by-season table is rendered by the PlayerSeasonTable client island
  // below, which owns its sort so this page can be statically prerendered.

  return (
    <div className="space-y-10">
      <DetailBreadcrumb
        segments={[
          { label: "Players", href: "/players" },
          { label: p.name },
        ]}
      />
      <PlayerPlate
        name={p.name}
        share={{ path: `/player/${id}`, title: `${p.name} — Manchester United record` }}
        portrait={{
          src: p.player_thumb_url ?? p.player_image_url,
          pageUrl: p.player_image_page_url,
          license: p.player_image_license,
        }}
        primaryShirt={p.primary_shirt}
        position={p.position_label ? p.position_label.charAt(0).toUpperCase() + p.position_label.slice(1) : null}
        careerYears={careerYears}
        rank={ranks}
        stats={{
          goals: p.goals,
          apps: p.apps,
          starts: p.starts,
          subs: p.subs,
          goalsPerApp,
          multiGoalGames,
          hatTricks,
          assists: p.assists,
          curatedAssists: p.curated_assists,
        }}
        span={{ debut, latest, peakSeason }}
        shirts={shirts}
        caveatBrief="Verified competitive record · recorded splits below may cover fewer matches"
      />
      <Link href={playerCorrectionHref} className="inline-block text-xs font-semibold text-devil-bright hover:underline focus-ring">
        Suggest player correction
      </Link>

      <DetailSectionTabs
        defaultTab="career"
        ariaLabel="Player sections"
        idPrefix="player"
        tabs={[
          {
            id: "career",
            label: "Career History",
            content: bySeason.length > 0 ? (
              <section id="seasons" className="space-y-6">
                {bySeason.length > 1 && (
                  <div className="rounded-xl border border-line bg-panel p-4 sm:p-5">
                    <h2 className="display mb-3 text-xl">Goals and assists by season</h2>
                    <div className="mb-2 flex items-center gap-4 text-[11px] text-ink-faint">
                      <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-devil" /> goals</span>
                      <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-gold" /> assists</span>
                    </div>
                    <SeasonContributionChart
                      data={bySeason.map((s) => ({
                        label: s.season.slice(0, 4),
                        goals: s.goals,
                        assists: s.assists,
                        valueLabel: `${fmtNum(s.goals)} goals · ${fmtNum(s.assists)} assists`,
                        meta: s.season,
                        href: `/seasons/${s.season}`,
                      }))}
                      labelEvery={Math.max(1, Math.floor(bySeason.length / 12))}
                      chartLabel={`${p.name} goals and assists by season`}
                    />
                    <p className="mt-1 text-xs text-ink-dim">
                      Recorded goals and combined assists (curated through 2014-15, match events after) per season;
                      early or sparsely covered seasons can read low.
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <h2 className="display text-xl">Season by season</h2>
                    <span className="stat-num text-xs text-ink-dim">
                      {fmtNum(p.recorded_goals)} recorded goals · {fmtNum(coveredSeasons.length)} of {fmtNum(bySeason.length)} seasons covered
                    </span>
                  </div>
                  <PlayerSeasonTable seasons={bySeason} playerName={p.name} />
                </div>
              </section>
            ) : (
              <p className="rounded-lg border border-line bg-panel px-4 py-6 text-center text-sm text-ink-dim">
                No season-by-season coverage yet.
              </p>
            ),
          },
          {
            id: "goals",
            label: "Goals and Assists",
            content: (
              <div className="space-y-10">
                {curatedTotals && curatedGoalTypes.length > 1 && (
                  <ChartPanel title="How the goals were scored">
                    <GoalBodyMap types={curatedGoalTypes} totalGoals={curatedTotals.goals} />
                    <p className="mt-3 text-xs text-ink-dim">
                      Hand-curated goal types · {curatedTotals.from_season?.slice(0, 4)}–{curatedTotals.to_season?.slice(0, 4)}
                      {curatedTotals.source_url && (
                        <>
                          {" · "}
                          <a href={curatedTotals.source_url} className="text-devil-bright hover:underline focus-ring">
                            Tableau source
                          </a>
                        </>
                      )}
                    </p>
                  </ChartPanel>
                )}

                {partnerships.length > 0 && (
                  <AssistPartnerships playerId={id} rows={partnerships} hideCoverageNote />
                )}

                <section id="scored" className="space-y-4">
                  <div className="flex items-baseline justify-between">
                    <h2 className="display text-xl">Matches where he scored</h2>
                    {matches.length > 0 && (
                      <span className="stat-num text-xs text-ink-faint">{fmtNum(matches.length)} matches</span>
                    )}
                  </div>

                  {matches.length === 0 ? (
                    <p className="rounded-lg border border-line bg-panel px-4 py-6 text-center text-sm text-ink-dim">
                      No matches with recorded goalscorer data yet.
                    </p>
                  ) : (
                    <>
                      {(topOpponent || bestRun) && (
                        <p className="text-sm text-ink-dim">
                          {topOpponent && (
                            <>
                              Most goals{" "}
                              <Link href={`/opponent/${topOpponent.opponent_id}`} className="text-devil-bright hover:underline focus-ring">
                                v {topOpponent.opponent_name}
                              </Link>
                              {" — "}
                              <span className="stat-num text-ink">{fmtNum(topOpponent.goals)}</span>
                            </>
                          )}
                          {topOpponent && bestRun && " · "}
                          {bestRun && (
                            <>
                              Longest scoring run:{" "}
                              <span className="stat-num text-ink">{fmtNum(bestRun.length)}</span> in a row
                              <span className="text-ink-faint">
                                {" "}({fmtDate(bestRun.from)}–{fmtDate(bestRun.to)})
                              </span>
                            </>
                          )}
                        </p>
                      )}

                      {!longScoredList ? (
                        <MatchList matches={matches} showSeason renderExtra={goalExtra} />
                      ) : (
                        <>
                          <p className="text-sm text-ink-dim">
                            He scored in {fmtNum(matches.length)} matches with recorded goal data
                            {multiGoalGames > 0 && (
                              <>
                                , including{" "}
                                {braces > 0 && (
                                  <span className="text-devil-bright">{fmtNum(braces)} brace{braces === 1 ? "" : "s"}</span>
                                )}
                                {braces > 0 && hatTricks > 0 && " and "}
                                {hatTricks > 0 && (
                                  <span className="text-gold">{fmtNum(hatTricks)} hat-trick{hatTricks === 1 ? "" : "s"}</span>
                                )}
                              </>
                            )}
                            .
                          </p>

                          {topHauls.length > 0 && (
                            <div>
                              <h3 className="mb-2 text-sm font-medium text-ink-dim">
                                The big nights{hauls.length > topHauls.length && (
                                  <span className="ml-2 font-normal text-ink-faint">top {topHauls.length} of {fmtNum(hauls.length)} multi-goal games</span>
                                )}
                              </h3>
                              <HaulCards hauls={topHauls} />
                            </div>
                          )}

                          <div>
                            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
                              <h3 className="text-sm font-medium text-ink-dim">Seasons where he scored</h3>
                              <EvidenceLink
                                href={`/matches${queryString({ scorer: id })}`}
                                label={`Open all ${fmtNum(matches.length)} in the match browser →`}
                              />
                            </div>
                            <div className="space-y-2">
                              {scoredBySeason.map(([season, ms]) => {
                                const seasonGoals = ms.reduce((a, m) => a + m.goals, 0);
                                return (
                                  <SeasonEvidenceRow
                                    key={season}
                                    id={`scored-${season}`}
                                    season={season}
                                    href={`/matches${queryString({ scorer: id, season })}`}
                                    primary={`${fmtNum(seasonGoals)} goal${seasonGoals === 1 ? "" : "s"}`}
                                    secondary={`Scored in ${fmtNum(ms.length)} match${ms.length === 1 ? "" : "es"}`}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </section>
              </div>
            ),
          },
          {
            id: "apps",
            label: "Appearances",
            content: appearances.length > 0 ? (
              <section className="space-y-6">
                <PlayerCareerPitch
                  appearances={appearances.map((a) => ({
                    date: a.date,
                    role: a.role,
                    shirt: a.shirt,
                    career_band: a.career_band,
                  }))}
                  playerName={p.name}
                />

                <div className="space-y-3">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <h2 className="display text-xl">Lineup appearances</h2>
                  <span className="stat-num text-xs text-ink-faint">{fmtNum(appearances.length)} covered</span>
                </div>

                {longAppearanceList ? (
                  <div>
                    <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
                      <h3 className="text-sm font-medium text-ink-dim">Seasons with lineup appearances</h3>
                      <EvidenceLink
                        href={`/matches${queryString({ player: id })}`}
                        label={`Open all ${fmtNum(appearances.length)} in the match browser →`}
                      />
                    </div>
                    <div className="space-y-2">
                      {appsBySeason.map(([season, ms]) => {
                        const starts = ms.filter((x) => x.started).length;
                        return (
                          <SeasonEvidenceRow
                            key={season}
                            id={`apps-${season}`}
                            season={season}
                            href={`/matches${queryString({ player: id, season })}`}
                            primary={`${fmtNum(ms.length)} app${ms.length === 1 ? "" : "s"}`}
                            secondary={`${fmtNum(starts)} start${starts === 1 ? "" : "s"}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {appsBySeason.map(([season, ms]) => {
                      const starts = ms.filter((x) => x.started).length;
                      return (
                        <div key={season} id={`apps-${season}`} className="scroll-mt-24">
                          <div className="mb-2 flex items-baseline justify-between border-b border-line pb-1">
                            <Link href={`/seasons/${season}`} className="stat-num text-sm font-medium text-ink hover:text-devil-bright focus-ring">
                              {season}
                            </Link>
                            <span className="stat-num text-xs text-ink-faint">
                              {fmtNum(ms.length)} app{ms.length === 1 ? "" : "s"}
                              {" · "}<span className="text-devil-bright">{fmtNum(starts)}</span> started
                            </span>
                          </div>
                          <MatchList matches={ms} renderExtra={appsExtra} />
                        </div>
                      );
                    })}
                  </div>
                )}
                </div>
              </section>
            ) : null,
          },
          {
            id: "transfers",
            label: "Transfers",
            content: (
              <section>
                <SectionHead title="Transfer record" aside={transfers.length > 0 ? `${fmtNum(transfers.length)} recorded` : undefined} />
                {transfers.length > 0 ? (
                  <TransferList transfers={transfers} />
                ) : (
                  <p className="rounded-lg border border-line bg-panel px-4 py-6 text-center text-sm text-ink-dim">
                    No recorded transfers yet.
                  </p>
                )}
              </section>
            ),
          },
        ]}
      />

      <PlayerDataCoverage
        coveredSeasons={coveredSeasons.length}
        totalSeasons={bySeason.length}
        curatedTotals={curatedTotals}
        appearancesCount={appearances.length}
        hasPartnerships={partnerships.length > 0}
      />

      <p className="text-sm">
        <Link href="/players" className="text-devil-bright hover:underline focus-ring">← All players</Link>
      </p>
    </div>
  );
}

function SeasonEvidenceRow({
  id,
  season,
  href,
  primary,
  secondary,
}: {
  id: string;
  season: string;
  href: string;
  primary: string;
  secondary: string;
}) {
  return (
    <section id={id} className="scroll-mt-24 rounded-lg border border-line bg-panel px-3 py-2.5 sm:px-4">
      <div className="flex items-center gap-3">
        <Link href={`/seasons/${season}`} className="display w-[5.25rem] shrink-0 text-base leading-none hover:text-devil-bright focus-ring">
          {season}
        </Link>
        <span className="stat-num text-xs text-ink">
          <span className="text-devil-bright">{primary}</span>
          <span className="text-ink-dim"> · {secondary}</span>
        </span>
        <Link
          href={href}
          className="ml-auto shrink-0 rounded-md border border-line bg-panel-2 px-2.5 py-1 text-xs text-devil-bright transition-colors hover:border-devil/60 hover:bg-devil/10 focus-ring"
        >
          Open
        </Link>
      </div>
    </section>
  );
}

/** One collapsed footnote for every data lane on the player page — replaces repeated section notes. */
function PlayerDataCoverage({
  coveredSeasons,
  totalSeasons,
  curatedTotals,
  appearancesCount,
  hasPartnerships,
}: {
  coveredSeasons: number;
  totalSeasons: number;
  curatedTotals: CuratedTotals | null;
  appearancesCount: number;
  hasPartnerships: boolean;
}) {
  return (
    <details className="group rounded-xl border border-line bg-panel">
      <summary className="flex cursor-pointer list-none items-baseline justify-between gap-3 px-4 py-3 sm:px-5">
        <span className="text-sm font-medium text-ink-dim">Data coverage</span>
        <span className="stat-num text-xs text-ink-faint">
          <span className="text-devil-bright group-open:hidden">show</span>
          <span className="hidden text-devil-bright group-open:inline">hide</span>
        </span>
      </summary>
      <div className="space-y-3 border-t border-line px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
        <p className="text-xs text-ink-dim">
          <span className="font-medium text-ink">Club record</span> — verified competitive goals, apps, and starts in the hero plate.
          Recorded splits below are drawn from match coverage we can evidence, not necessarily a full career total.
        </p>

        {totalSeasons > 0 && (
          <CoverageNote
            className="!mt-0"
            slice="all competitions, per season"
            count={{
              covered: coveredSeasons,
              total: totalSeasons,
              noun: "seasons carry lineup coverage",
              note: "apps and assists reflect local data, so empty cells are coverage gaps, not zero",
            }}
          />
        )}

        {curatedTotals && (
          <CoverageNote
            className="!mt-0"
            slice="curated goals, assists, and goal types, 1987–2015"
            coverage={`${fmtNum(curatedTotals.goals)} goals and ${fmtNum(curatedTotals.assists)} assists across ${fmtNum(curatedTotals.seasons)} seasons; hand-curated, not exhaustive, and not match-attributed.`}
            evidenceHref={curatedTotals.source_url ?? undefined}
            evidenceLabel="Tableau source"
          />
        )}

        {appearancesCount > 0 && (
          <CoverageNote
            className="!mt-0"
            slice="lineup appearances, all competitions"
            coverage={`${fmtNum(appearancesCount)} matches with lineup coverage, season by season — drawn from local lineup data, not a career appearance total.`}
          />
        )}

        {hasPartnerships && (
          <CoverageNote
            className="!mt-0"
            slice="recorded match-event assists, both directions"
            coverage="goals where both scorer and assister are recorded; curated season assists are not pairwise and are excluded here."
          />
        )}
      </div>
    </details>
  );
}
