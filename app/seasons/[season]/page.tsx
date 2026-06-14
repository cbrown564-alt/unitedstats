import Link from "next/link";
import { notFound } from "next/navigation";
import { seasonMatches, allSeasons, seasonsIndex } from "@/lib/queries";
import { seasonNarrative } from "@/lib/narrative";
import { MatchList } from "@/components/MatchList";
import { CompetitionDot } from "@/components/CompetitionChip";
import { WdlBar, WdlRecord } from "@/components/WdlBar";
import { fmtNum, pct, clubName, tallyWdl } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function SeasonPage({ params }: { params: Promise<{ season: string }> }) {
  const { season } = await params;
  const matches = seasonMatches(season);
  if (matches.length === 0) notFound();

  const seasons = allSeasons(); // desc
  const idx = seasons.indexOf(season);
  const newer = idx > 0 ? seasons[idx - 1] : null;
  const older = idx >= 0 && idx < seasons.length - 1 ? seasons[idx + 1] : null;

  const byComp = new Map<string, typeof matches>();
  for (const m of matches) {
    const list = byComp.get(m.competition_name) ?? [];
    list.push(m);
    byComp.set(m.competition_name, list);
  }
  const { w, d, l } = tallyWdl(matches);
  const gf = matches.reduce((a, m) => a + m.gf, 0);
  const ga = matches.reduce((a, m) => a + m.ga, 0);
  const managers = [...new Set(matches.map((m) => m.manager_name).filter(Boolean))];
  const leagueSummary = seasonsIndex().find((s) => s.season === season && s.type === "league");
  const atts = matches.filter((m) => m.venue === "H" && m.attendance != null);
  const avgAtt = atts.length
    ? Math.round(atts.reduce((a, m) => a + (m.attendance ?? 0), 0) / atts.length)
    : null;
  const narrative = seasonNarrative(season);

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <nav className="flex items-center gap-3 text-sm text-ink-faint">
          {older && <Link href={`/seasons/${older}`} className="hover:text-ink">← {older}</Link>}
          <Link href="/seasons" className="hover:text-ink">All seasons</Link>
          {newer && <Link href={`/seasons/${newer}`} className="hover:text-ink">{newer} →</Link>}
        </nav>
        <h1 className="display text-4xl">
          {season} <span className="text-ink-faint text-2xl">{clubName(matches[0].date)}</span>
        </h1>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-px bg-line border border-line rounded-lg overflow-hidden max-w-3xl">
          {[
            ["Played", String(matches.length)],
            ["W–D–L", <WdlRecord key="wdl" w={w} d={d} l={l} />],
            ["Goals", `${gf}–${ga}`],
            ["Win rate", pct(w, matches.length)],
            ["Avg home crowd", avgAtt ? fmtNum(avgAtt) : "—"],
          ].map(([label, value], i) => (
            <div key={i} className="bg-panel px-3 py-2.5">
              <div className="stat-num text-lg font-semibold">{value}</div>
              <div className="text-[11px] text-ink-faint uppercase tracking-wider">{label}</div>
            </div>
          ))}
        </div>
        <p className="text-sm text-ink-dim">
          {leagueSummary?.position && (
            <>
              Finished <span className="text-ink font-medium">{leagueSummary.position === 1 ? "champions" : `#${leagueSummary.position} of ${leagueSummary.league_size}`}</span> in the {leagueSummary.competition_name}.{" "}
            </>
          )}
          {managers.length > 0 && (
            <>Manager{managers.length > 1 ? "s" : ""}: {managers.join(", ")}.</>
          )}
        </p>
        <WdlBar w={w} d={d} l={l} size="md" className="max-w-3xl" />
        {narrative.length > 0 && (
          <div className="border border-line rounded-lg bg-panel p-4 max-w-3xl">
            <h2 className="text-xs uppercase tracking-wider text-ink-faint mb-1.5">Season in brief</h2>
            <p className="text-sm text-ink-dim leading-relaxed">{narrative.join(" ")}</p>
            <p className="text-[11px] text-ink-faint mt-2">
              Written by the data: every sentence is computed from the match record below, and
              scorer claims state their coverage.
            </p>
          </div>
        )}
      </header>

      {[...byComp.entries()].map(([comp, list]) => (
        <section key={comp}>
          <h2 className="display mb-3 flex items-center gap-2 text-xl">
            <CompetitionDot type={list[0].competition_type} className="h-2 w-2" />
            <span>
              {comp} <span className="text-ink-faint text-sm font-normal">({list.length})</span>
            </span>
          </h2>
          <MatchList matches={list} />
        </section>
      ))}
    </div>
  );
}
