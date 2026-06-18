import Link from "next/link";
import { notFound } from "next/navigation";
import { seasonMatches, allSeasons, seasonsIndex, type MatchRow, type SeasonSummary } from "@/lib/queries";
import { matchesSequence } from "@/lib/trails";
import { seasonNarrative } from "@/lib/narrative";
import { MatchList } from "@/components/MatchList";
import { CompetitionDot } from "@/components/CompetitionChip";
import { ResultSpine } from "@/components/charts/ResultSpine";
import { IdentityPlate, type PlateHeadline } from "@/components/IdentityPlate";
import { SectionHead } from "@/components/SectionHead";
import { CoverageNote } from "@/components/CoverageNote";
import { WdlRecord } from "@/components/WdlBar";
import { fmtNum, pct, clubName, tallyWdl, fmtRound } from "@/lib/format";

export const dynamic = "force-dynamic";

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

/**
 * How far a competition campaign got — the line that turns a flat match list into
 * a season-within-the-season. League uses the final table position; a cup states
 * the trophy (won/lost final) or the furthest round reached. Gold marks silverware.
 */
function campaignOutcome(
  summary: SeasonSummary | undefined,
  list: MatchRow[],
): { label: string; tone: string } | null {
  if (summary?.type === "league") {
    if (summary.position == null) return null;
    return summary.position === 1
      ? { label: "Champions", tone: "text-gold" }
      : {
          label: `${ordinal(summary.position)}${summary.league_size ? ` of ${summary.league_size}` : ""}`,
          tone: "text-ink-dim",
        };
  }
  const isFinal = (r: string | null) => !!r && /final/i.test(r) && !/(semi|quarter)/i.test(r);
  const final = list.find((m) => isFinal(m.round));
  if (final) {
    return final.result === "W"
      ? { label: "Winners", tone: "text-gold" }
      : { label: "Runners-up", tone: "text-ink-dim" };
  }
  const round = summary?.furthest_round ?? list[list.length - 1]?.round ?? null;
  return round ? { label: fmtRound(round), tone: "text-ink-dim" } : null;
}

export default async function SeasonPage({ params }: { params: Promise<{ season: string }> }) {
  const { season } = await params;
  const matches = seasonMatches(season);
  if (matches.length === 0) notFound();

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
      <nav className="flex items-center gap-3 text-sm text-ink-faint">
        {older && <Link href={`/seasons/${older}`} className="hover:text-ink">← {older}</Link>}
        <Link href="/seasons" className="hover:text-ink">All seasons</Link>
        {newer && <Link href={`/seasons/${newer}`} className="hover:text-ink">{newer} →</Link>}
      </nav>

      <IdentityPlate
        eyebrow="Season"
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
          <p className="mt-2 text-[11px] text-ink-faint">
            Written by the data: every sentence is computed from the match record below, and scorer
            claims state their coverage.
          </p>
        </div>
      )}

      {sequence.length >= 24 && (
        <section>
          <SectionHead title="The season, match by match" aside={`${fmtNum(p)} matches`} />
          <div className="rounded-xl border border-line bg-panel p-4 sm:p-5">
            <ResultSpine matches={sequence} subject={`United ${season}`} />
            <p className="mt-2 text-[11px] leading-4 text-ink-faint">
              Every match in order — wins above the line, losses below, bar height the goal margin.
            </p>
          </div>
        </section>
      )}

      <section>
        <SectionHead title="Competitions" aside={`${byComp.size} entered`} />
        <div className="space-y-7">
          {[...byComp.entries()].map(([comp, list]) => {
            const rec = tallyWdl(list);
            const outcome = campaignOutcome(summaryByName.get(comp), list);
            return (
              <div key={comp}>
                <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-line pb-2">
                  <h3 className="display flex items-center gap-2 text-lg">
                    <CompetitionDot type={list[0].competition_type} className="h-2 w-2" />
                    {comp}
                    <span className="stat-num text-sm font-normal text-ink-faint">({list.length})</span>
                  </h3>
                  <div className="stat-num flex items-center gap-3 text-xs">
                    {outcome && <span className={`font-semibold ${outcome.tone}`}>{outcome.label}</span>}
                    <WdlRecord w={rec.w} d={rec.d} l={rec.l} className="text-ink-faint" />
                  </div>
                </div>
                <MatchList matches={list} />
              </div>
            );
          })}
        </div>
        <CoverageNote
          slice="every competitive match this season, grouped by competition."
          coverage="Result data is complete; recorded scorer and lineup coverage vary by era."
        />
      </section>
    </div>
  );
}
