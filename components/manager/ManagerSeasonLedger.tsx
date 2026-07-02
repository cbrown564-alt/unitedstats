import type { SeasonSummary } from "@/lib/queries";
import { fmtNum } from "@/lib/format";
import { eraForFirstMatchYear, eraSeasonRowClass } from "@/lib/managerEras";
import { EvidenceLink } from "@/components/EvidenceLink";
import { SeasonLedgerCard } from "@/components/seasons/SeasonLedgerCard";
import { SeasonLedgerGrid, type SeasonLedgerRow } from "@/components/seasons/SeasonLedgerGrid";
import {
  cupOutcomesForSeason,
  lanesForComps,
  type Lane,
} from "@/components/seasons/seasonLedgerLanes";
import { seasonDecade } from "@/lib/managerSeasonHighlights";

const isTopFlight = (s: { competition_name: string }) =>
  s.competition_name === "First Division" || s.competition_name === "Premier League";

function DecadeHeader({ decade }: { decade: number }) {
  return (
    <div className="border-b border-line/70 bg-pitch/50 px-4 py-2">
      <span className="display text-sm text-ink-dim">{decade}s</span>
    </div>
  );
}

/**
 * Season-by-season ledger under one manager — same grid/card pattern as `/seasons`,
 * scoped to matches managed and linking each season through to the club campaign page.
 */
export function ManagerSeasonLedger({
  summaries,
  cupResults,
  managerId,
  managerName,
  showDecadeHeaders = true,
}: {
  summaries: SeasonSummary[];
  cupResults: Map<string, string>;
  managerId: string;
  managerName: string;
  showDecadeHeaders?: boolean;
}) {
  const bySeason = new Map<string, SeasonSummary[]>();
  for (const s of summaries) {
    const list = bySeason.get(s.season) ?? [];
    list.push(s);
    bySeason.set(s.season, list);
  }

  const rows: SeasonLedgerRow[] = [...bySeason.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([season, comps]) => ({
      season,
      href: `/seasons/${season}`,
      comps,
      league: comps.find((c) => c.type === "league"),
      totalP: comps.reduce((a, c) => a + c.p, 0),
      eraClass: eraSeasonRowClass(eraForFirstMatchYear(Number(season.slice(0, 4))).key),
    }));

  const lanes: Lane[] = lanesForComps(summaries);

  const maxLeagueP = Math.max(1, ...rows.map((r) => r.league?.p ?? 0));

  function decadeBefore(row: SeasonLedgerRow, prev: SeasonLedgerRow | undefined) {
    if (!showDecadeHeaders || rows.length < 15) return null;
    const decade = seasonDecade(row.season);
    const prevDecade = prev ? seasonDecade(prev.season) : null;
    if (decade === prevDecade) return null;
    return <DecadeHeader key={`decade-${decade}`} decade={decade} />;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-ink-dim">
        <span>{fmtNum(rows.length)} recorded seasons under {managerName}</span>
        <EvidenceLink href={`/matches?manager=${managerId}`} label="All matches →" />
      </div>

      <ol className="season-card-stream register-card-list space-y-2.5 sm:hidden">
        {rows.map((r) => {
          const seasonGlory =
            r.league != null && isTopFlight(r.league) && r.league.position === 1;
          return (
            <SeasonLedgerCard
              key={r.season}
              season={r.season}
              href={r.href}
              league={r.league}
              totalP={r.totalP}
              cups={cupOutcomesForSeason(r.comps, lanes, cupResults)}
              glory={seasonGlory}
              eraClass={r.eraClass}
              maxLeagueP={maxLeagueP}
            />
          );
        })}
      </ol>

      <div className="hidden overflow-x-auto sm:block">
        <SeasonLedgerGrid
          rows={rows}
          lanes={lanes}
          cupResults={cupResults}
          renderBeforeRow={decadeBefore}
        />
      </div>
    </div>
  );
}
