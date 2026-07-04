import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { seasonMatches, allSeasons, seasonsIndex, seasonLeagueTable, type MatchRow, type SeasonSummary } from "@/lib/queries";
import { matchesSequence } from "@/lib/trails";
import { seasonNarrative } from "@/lib/narrative";
import { MatchList } from "@/components/MatchList";
import { CupRun } from "@/components/CupRun";
import type { CampaignTier } from "@/components/CampaignVerdict";
import { SeasonCompetitionLane } from "@/components/seasons/SeasonCompetitionLane";
import { buildCupRun } from "@/lib/cupRun";
import { ResultSpine } from "@/components/charts/ResultSpine";
import { IdentityPlate, type PlateHeadline } from "@/components/IdentityPlate";
import { DetailSectionTabs } from "@/components/mobile/DetailSectionTabs";
import { SectionHead } from "@/components/SectionHead";
import { CoverageNote } from "@/components/CoverageNote";
import { LeagueTable } from "@/components/LeagueTable";
import { WdlBar } from "@/components/WdlBar";
import { RediscoveryRail } from "@/components/RediscoveryRail";
import { fmtNum, pct, clubName, tallyWdl, fmtRound } from "@/lib/format";
import { rediscoveryForEntity, parseSinceYear } from "@/lib/rediscovery";
import { sampleStaticIds } from "@/lib/static-build";

// Sampled SSG (see lib/static-build): preview builds prerender a subset, so
// non-sampled ids render on demand; full builds prerender every id, leaving only
// missing ids to fall through to notFound(). Must be a static literal for Next.
export const dynamicParams = true;

export async function generateMetadata({ params }: { params: Promise<{ season: string }> }): Promise<Metadata> {
  const { season } = await params;
  const title = `${season} season`;
  const description = `Manchester United campaign record for the ${season} season — matches, league table, cup runs, goals, and managers.`;
  return {
    title,
    description,
    openGraph: {
      title: `${title} · Red Thread`,
      description,
    },
  };
}

export async function generateStaticParams() {
  return sampleStaticIds(allSeasons()).map((season) => ({ season }));
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

/**
 * The verdict of a competition campaign — the line that turns a flat match list
 * into a season-within-the-season. League uses the final table position; a cup
 * states the trophy (won/lost final) or the furthest round reached.
 *
 * `tier` grades the achievement so the lane can render it at the right weight
 * (see {@link CampaignVerdict}): `silverware` (a trophy — title or cup won) and
 * `final-loss` (runners-up) are the critical outcomes that earn a medal + an
 * accented lane; everything else is a `neutral` placing stated quietly.
 */
function campaignOutcome(
  summary: SeasonSummary | undefined,
  list: MatchRow[],
): { label: string; tier: CampaignTier } | null {
  if (summary?.type === "league") {
    if (summary.position == null) return null;
    return summary.position === 1
      ? { label: "Champions", tier: "silverware" }
      : {
          label: `${ordinal(summary.position)}${summary.league_size ? ` of ${summary.league_size}` : ""}`,
          tier: "neutral",
        };
  }
  const isFinal = (r: string | null) => !!r && /final/i.test(r) && !/(semi|quarter)/i.test(r);
  const final = list.find((m) => isFinal(m.round));
  if (final) {
    // Use `outcome`, not `result`: a final settled on penalties is a draw in
    // `result` (0–0) but a win in `outcome` — the trophy hangs on the shootout.
    return final.outcome === "W"
      ? { label: "Winners", tier: "silverware" }
      : { label: "Runners-up", tier: "final-loss" };
  }
  const round = summary?.furthest_round ?? list[list.length - 1]?.round ?? null;
  return round ? { label: fmtRound(round), tier: "neutral" } : null;
}

export default async function SeasonPage({
  params,
  searchParams,
}: {
  params: Promise<{ season: string }>;
  searchParams?: Promise<{ since?: string }>;
}) {
  const { season } = await params;
  const sinceYear = parseSinceYear(searchParams ? (await searchParams).since : undefined);
  const matches = seasonMatches(season);
  if (matches.length === 0) notFound();
  const forgotten = rediscoveryForEntity("season", season, { sinceYear });

  // The full final table United played in that season (every club) — rendered as
  // context below the plate. Null for cup-only seasons or the rare source gap.
  const leagueTable = seasonLeagueTable(season);

  const seasons = allSeasons(); // desc
  const idx = seasons.indexOf(season);
  const newer = idx > 0 ? seasons[idx - 1] : null;
  const older = idx >= 0 && idx < seasons.length - 1 ? seasons[idx + 1] : null;

  // Matches arrive date-ordered, so competitions group by order of first appearance.
  const byComp = new Map<string, MatchRow[]>();
  for (const m of matches) {
    const list = byComp.get(m.competition_name) ?? [];
    list.push(m);
    byComp.set(m.competition_name, list);
  }

  const p = matches.length;
  const { w, d, l } = tallyWdl(matches);
  const gf = matches.reduce((a, m) => a + m.gf, 0);
  const ga = matches.reduce((a, m) => a + m.ga, 0);
  const managers = [...new Set(matches.map((m) => m.manager_name).filter(Boolean))];

  const compSummaries = seasonsIndex().filter((s) => s.season === season);
  const summaryByName = new Map(compSummaries.map((s) => [s.competition_name, s]));
  const league = compSummaries.find((s) => s.type === "league");
  const champions = league?.position === 1;

  // Silverware won this season — drives the section header's honours line.
  const trophies = [...byComp.entries()].filter(
    ([comp, list]) => campaignOutcome(summaryByName.get(comp), list)?.tier === "silverware",
  ).length;

  const narrative = seasonNarrative(season);
  // The spine reads the whole season in date order; it earns its space once there
  // are enough matches for a shape to emerge (the shortest early seasons fall short).
  const sequence = p >= 24 ? matchesSequence({ season }) : [];

  // A season's verdict is where it finished, not its win rate — so the league
  // position leads the plate, with win rate demoted to the supporting ribbon.
  const headline: PlateHeadline | undefined = league?.position
    ? {
        value: ordinal(league.position),
        label: "league finish",
        sub: champions
          ? `Champions of the ${league.competition_name}`
          : league.league_size
            ? `of ${league.league_size} in the ${league.competition_name}`
            : league.competition_name,
        tone: champions ? "text-gold" : "text-ink",
      }
    : undefined;
  const secondary = headline
    ? [
        { label: "Played", value: fmtNum(p) },
        { label: "Win rate", value: pct(w, p) },
      ]
    : [];

  return (
    <div className="space-y-8">
      <nav className="detail-breadcrumb flex flex-wrap items-center gap-y-0.5" aria-label="Breadcrumb">
        <Link href="/seasons" className="hover:text-devil-bright focus-ring">
          Seasons
        </Link>
        {older && (
          <>
            <span className="mx-1.5 text-ink-faint/70" aria-hidden>·</span>
            <Link
              href={`/seasons/${older}`}
              className="hover:text-devil-bright focus-ring"
              aria-label={`Previous season ${older}`}
            >
              ← {older}
            </Link>
          </>
        )}
        <span className="mx-1.5 text-ink-faint/70" aria-hidden>·</span>
        <span className="text-ink-dim">{season}</span>
        {newer && (
          <>
            <span className="mx-1.5 text-ink-faint/70" aria-hidden>·</span>
            <Link
              href={`/seasons/${newer}`}
              className="hover:text-devil-bright focus-ring"
              aria-label={`Next season ${newer}`}
            >
              {newer} →
            </Link>
          </>
        )}
      </nav>

      <IdentityPlate
        eyebrow="Season"
        share={{ path: `/seasons/${season}`, title: `Manchester United ${season} season` }}
        title={season}
        subtitle={
          <>
            <span>{clubName(matches[0].date)}</span>
            {managers.length > 0 && (
              <>
                <span aria-hidden className="text-ink-faint">·</span>
                <span>{managers.join(", ")}</span>
              </>
            )}
          </>
        }
        record={{ w, d, l, p, gf, ga }}
        headline={headline}
        secondary={secondary}
      />

      <DetailSectionTabs
        defaultTab="overview"
        ariaLabel="Season sections"
        idPrefix="season"
        edgeTabs
        tabs={[
          {
            id: "overview",
            label: "Overview",
            content: (
              <div className="space-y-8">
                {(narrative.length > 0 || forgotten) && (
                  <div className="rounded-none border-x-0 border-y border-line bg-panel p-4 sm:rounded-lg sm:border sm:p-5">
                    {narrative.length > 0 && (
                      <>
                        <h2 className="mb-2 text-xs uppercase tracking-wider text-ink-faint">Season in brief</h2>
                        <p className="max-w-3xl text-sm leading-relaxed text-ink-dim">{narrative.join(" ")}</p>
                      </>
                    )}
                    {forgotten && (
                      <div className={narrative.length > 0 ? "mt-3 border-t border-line/80 pt-3" : ""}>
                        <RediscoveryRail prompt={forgotten} />
                      </div>
                    )}
                  </div>
                )}

                {leagueTable && (
                  <div className="px-4 sm:px-0">
                    <LeagueTable table={leagueTable} season={season} />
                  </div>
                )}

                {sequence.length >= 24 && (
                  <section className="px-4 sm:px-0">
                    <SectionHead title="The season, match by match" aside={`${fmtNum(p)} matches`} />
                    <div className="-mx-4 rounded-none border-x-0 border-y border-line bg-panel p-4 sm:mx-0 sm:rounded-xl sm:border sm:p-5">
                      <ResultSpine matches={sequence} subject={`United ${season}`} hrefForMatch={(id) => `/match/${id}`} />
                      <p className="mt-2 text-[11px] leading-4 text-ink-dim">
                        Every match in order — wins above the line, losses below, bar height the goal margin.
                      </p>
                    </div>
                  </section>
                )}
              </div>
            ),
          },
          {
            id: "competitions",
            label: "Competitions",
            content: (
              <section>
                <div className="px-4 sm:px-0">
                  <SectionHead
                    title="Competitions"
                    aside={trophies > 0 ? `${byComp.size} entered · ${trophies} won` : `${byComp.size} entered`}
                  />
                </div>
                <div className="divide-y divide-line sm:space-y-2 sm:divide-y-0">
                  {[...byComp.entries()].map(([comp, list]) => {
                    const outcome = campaignOutcome(summaryByName.get(comp), list);
                    const run = list[0].competition_type !== "league" ? buildCupRun(list) : null;
                    const bracket = run && run.stages.length >= 2 ? run.stages : null;
                    return (
                      <SeasonCompetitionLane
                        key={comp}
                        name={comp}
                        competitionId={list[0].competition_id}
                        competitionType={list[0].competition_type}
                        matches={list}
                        summary={summaryByName.get(comp)}
                        outcome={outcome}
                      >
                        {bracket ? <CupRun stages={bracket} /> : <MatchList matches={list} />}
                      </SeasonCompetitionLane>
                    );
                  })}
                </div>
                <CoverageNote
                  className="px-4 sm:px-0"
                  slice="every competitive match this season, grouped by competition."
                  coverage="Result data is complete; recorded goalscorer and lineup coverage vary by era."
                />
              </section>
            ),
          },
        ]}
      />
    </div>
  );
}
