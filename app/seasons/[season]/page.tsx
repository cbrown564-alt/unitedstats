import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { seasonMatches, allSeasons, seasonsIndex, seasonLeagueTable, type MatchRow, type SeasonSummary } from "@/lib/queries";
import { matchesSequence } from "@/lib/trails";
import { seasonNarrative } from "@/lib/narrative";
import { MatchList } from "@/components/MatchList";
import { CompetitionBadge } from "@/components/CompetitionBadge";
import { CupRun } from "@/components/CupRun";
import { CampaignVerdict, type CampaignTier } from "@/components/CampaignVerdict";
import { buildCupRun } from "@/lib/cupRun";
import { ResultSpine } from "@/components/charts/ResultSpine";
import { IdentityPlate, type PlateHeadline } from "@/components/IdentityPlate";
import { SectionHead } from "@/components/SectionHead";
import { CoverageNote } from "@/components/CoverageNote";
import { LeagueTable } from "@/components/LeagueTable";
import { WdlBar } from "@/components/WdlBar";
import { fmtNum, pct, clubName, tallyWdl, fmtRound } from "@/lib/format";
import { sampleStaticIds } from "@/lib/static-build";

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

const CHEVRON =
  "h-3.5 w-3.5 shrink-0 text-ink-faint transition-transform duration-200 group-open:rotate-90";

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
}: {
  params: Promise<{ season: string }>;
}) {
  const { season } = await params;
  const matches = seasonMatches(season);
  if (matches.length === 0) notFound();

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
      {/* Older ← All seasons → Newer. A 3-column grid keeps "All seasons" centred
          even at the timeline's ends, where one neighbour is missing. */}
      <nav className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-2 text-sm">
        {older ? (
          <Link
            href={`/seasons/${older}`}
            className="group flex w-fit items-center gap-2.5 justify-self-start rounded-lg border border-line bg-panel px-3 py-2 transition-colors hover:border-devil/50 hover:bg-panel-2 focus-ring"
          >
            <span className="text-base leading-none text-ink-faint transition-colors group-hover:text-devil-bright" aria-hidden>←</span>
            <span className="leading-tight">
              <span className="block text-[10px] uppercase tracking-[0.14em] text-ink-faint">Previous</span>
              <span className="stat-num text-ink transition-colors group-hover:text-devil-bright">{older}</span>
            </span>
          </Link>
        ) : (
          <span aria-hidden />
        )}

        <Link
          href="/seasons"
          className="flex items-center justify-center rounded-lg border border-line bg-panel px-4 text-ink-dim transition-colors hover:border-devil/50 hover:text-ink focus-ring"
        >
          All seasons
        </Link>

        {newer ? (
          <Link
            href={`/seasons/${newer}`}
            className="group flex w-fit items-center gap-2.5 justify-self-end rounded-lg border border-line bg-panel px-3 py-2 text-right transition-colors hover:border-devil/50 hover:bg-panel-2 focus-ring"
          >
            <span className="leading-tight">
              <span className="block text-[10px] uppercase tracking-[0.14em] text-ink-faint">Next</span>
              <span className="stat-num text-ink transition-colors group-hover:text-devil-bright">{newer}</span>
            </span>
            <span className="text-base leading-none text-ink-faint transition-colors group-hover:text-devil-bright" aria-hidden>→</span>
          </Link>
        ) : (
          <span aria-hidden />
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

      {narrative.length > 0 && (
        <div className="max-w-3xl rounded-lg border border-line bg-panel p-4">
          <h2 className="mb-1.5 text-xs uppercase tracking-wider text-ink-faint">Season in brief</h2>
          <p className="text-sm leading-relaxed text-ink-dim">{narrative.join(" ")}</p>
          <p className="mt-2 text-[11px] text-ink-dim">
            Generated directly from the match record: every sentence is computed from the match history below, and goalscorer
            claims reflect database coverage.
          </p>
        </div>
      )}

      {leagueTable && (
        <LeagueTable table={leagueTable} season={season} />
      )}

      {sequence.length >= 24 && (
        <section>
          <SectionHead title="The season, match by match" aside={`${fmtNum(p)} matches`} />
          <div className="rounded-xl border border-line bg-panel p-4 sm:p-5">
            <ResultSpine matches={sequence} subject={`United ${season}`} />
            <p className="mt-2 text-[11px] leading-4 text-ink-dim">
              Every match in order — wins above the line, losses below, bar height the goal margin.
            </p>
          </div>
        </section>
      )}

      <section>
        <SectionHead
          title="Competitions"
          aside={trophies > 0 ? `${byComp.size} entered · ${trophies} won` : `${byComp.size} entered`}
        />
        <div className="space-y-2">
          {[...byComp.entries()].map(([comp, list]) => {
            const { w, d, l } = tallyWdl(list);
            const outcome = campaignOutcome(summaryByName.get(comp), list);
            // Knockout campaigns resolve into United's run; the bracket carries
            // the round-by-round scores the flat list would otherwise repeat, so
            // it replaces the list once there are ≥2 stages to ladder. Leagues and
            // one-off ties keep the chronological MatchList.
            const run = list[0].competition_type !== "league" ? buildCupRun(list) : null;
            const bracket = run && run.stages.length >= 2 ? run.stages : null;
            // Silverware and runners-up get an accented lane so the season's
            // critical achievements scan straight down the column.
            const accent =
              outcome?.tier === "silverware"
                ? "border-l-2 border-l-gold/70"
                : outcome?.tier === "final-loss"
                  ? "border-l-2 border-l-silver/55"
                  : "";
            return (
              <details key={comp} className={`group overflow-hidden rounded-lg border border-line bg-panel ${accent}`}>
                <summary
                  className={`flex cursor-pointer list-none items-center gap-2.5 py-2.5 pr-3 pl-2.5 transition-colors hover:bg-panel-2 focus-visible:outline-2 focus-visible:outline-devil-bright sm:gap-3 sm:pr-4 sm:pl-3 [&::-webkit-details-marker]:hidden ${
                    outcome?.tier === "silverware" ? "bg-gold/[0.04]" : ""
                  }`}
                >
                  <svg className={CHEVRON} viewBox="0 0 16 16" fill="none" aria-hidden>
                    <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <CompetitionBadge
                    id={list[0].competition_id}
                    name={comp}
                    type={list[0].competition_type}
                    size="md"
                  />
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2.5 gap-y-1">
                    <h3 className="display line-clamp-2 min-w-0 text-base leading-snug" title={comp}>{comp}</h3>
                    {outcome && <CampaignVerdict label={outcome.label} tier={outcome.tier} />}
                  </div>
                  {/* Right cluster: match total, then the stacked W/D/L record bar. */}
                  <span className="stat-num hidden w-20 shrink-0 whitespace-nowrap text-right text-xs text-ink-faint sm:block">
                    {list.length} {list.length === 1 ? "match" : "matches"}
                  </span>
                  <div className="w-28 shrink-0 sm:w-40">
                    <WdlBar w={w} d={d} l={l} size="md" showLabels tooltip={false} />
                  </div>
                </summary>
                <div className="border-t border-line p-2 sm:p-3">
                  {bracket ? <CupRun stages={bracket} /> : <MatchList matches={list} />}
                </div>
              </details>
            );
          })}
        </div>
        <CoverageNote
          slice="every competitive match this season, grouped by competition."
          coverage="Result data is complete; recorded goalscorer and lineup coverage vary by era."
        />
      </section>
    </div>
  );
}
