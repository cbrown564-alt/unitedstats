import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import type { SeasonSummary } from "@/lib/queries";
import { WdlBar } from "@/components/WdlBar";
import { FinishLadder } from "@/components/seasons/FinishLadder";
import { CupCell } from "@/components/seasons/CupCell";
import { LANE_LABEL, laneOf, type Lane } from "@/components/seasons/seasonLedgerLanes";

export type SeasonLedgerRow = {
  season: string;
  href: string;
  comps: SeasonSummary[];
  league?: SeasonSummary;
  totalP: number;
  eraClass?: string;
};

const isTopFlight = (s: { competition_name: string }) =>
  s.competition_name === "First Division" || s.competition_name === "Premier League";

function gridTemplate(lanes: Lane[]): string {
  return `4.5rem minmax(8.5rem,1.1fr) minmax(6.5rem,0.85fr) ${lanes.map(() => "minmax(4.5rem,6rem)").join(" ")}`;
}

/**
 * The season ledger — shared by `/seasons` and `/manager/[id]`. One markup for
 * both layouts: below `sm` each season is an answer-first card (finish, W-D-L,
 * then the cup lanes it entered as a quiet subline); from `sm` the same nodes
 * fall into a scannable grid with a fixed column per cup lane. Rendering the
 * season once (instead of a card stream plus a hidden table) halves the
 * ledger's HTML and its share of the page's flight payload.
 */
export function SeasonLedgerGrid({
  rows,
  lanes,
  cupResults,
  borderClass = "border-line",
  renderBeforeRow,
}: {
  rows: SeasonLedgerRow[];
  lanes: Lane[];
  cupResults: Map<string, string>;
  borderClass?: string;
  /** Desktop-only separators (e.g. decade headers) inserted above a row. */
  renderBeforeRow?: (row: SeasonLedgerRow, prev: SeasonLedgerRow | undefined) => ReactNode;
}) {
  if (rows.length === 0) return null;

  const cols = { "--ledger-cols": gridTemplate(lanes) } as CSSProperties;
  const maxLeagueP = Math.max(1, ...rows.map((r) => r.league?.p ?? 0));
  const grid = "ledger-grid";

  return (
    <div className="sm:overflow-x-auto">
      <div className={`sm:min-w-max sm:overflow-hidden sm:rounded-lg sm:border sm:bg-pitch/35 ${borderClass}`} style={cols}>
        <div
          className={`max-sm:hidden items-center border-b border-line bg-panel/50 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-faint ${grid}`}
          aria-hidden
        >
          <span>Season</span>
          <span className="flex items-center gap-1.5">
            Finish
            <span className="hidden items-center gap-1 normal-case tracking-normal text-ink-faint/80 lg:inline-flex">
              <span className="text-[8px]">1st</span>
              <span className="h-1 w-6 rounded-full bg-gradient-to-r from-gold/45 via-line to-loss/45" />
              <span className="text-[8px]">last</span>
            </span>
          </span>
          <span>Record</span>
          {lanes.map((l) => (
            <span key={l}>{LANE_LABEL[l]}</span>
          ))}
        </div>

        <ul className="season-ledger max-sm:space-y-2.5">
          {rows.map((r, index) => {
            const prev = index > 0 ? rows[index - 1] : undefined;
            const before = renderBeforeRow?.(r, prev);
            const hasCups = r.comps.some((c) => laneOf(c.type) != null);
            const glory = r.league != null && isTopFlight(r.league) && r.league.position === 1;
            return (
              <li key={r.season} className={`season-ledger__row sm:border-b sm:border-b-line sm:last:border-b-0 ${r.eraClass ?? ""}`}>
                {before && <div className="max-sm:hidden">{before}</div>}
                <Link
                  href={r.href}
                  prefetch={false}
                  className={`ledger-link ledger-grid focus-ring${glory ? " ledger-link--glory" : ""}`}
                >
                  <div className="ledger-season">
                    <span className="display">{r.season}</span>
                  </div>

                  <div className="ledger-body">
                    {r.league ? (
                      <FinishLadder league={r.league} />
                    ) : (
                      <span className="text-xs text-ink-faint">
                        Cup competitions only<span className="sm:hidden"> · {r.totalP} matches</span>
                      </span>
                    )}

                    {r.league ? (
                      <WdlBar
                        w={r.league.w}
                        d={r.league.d}
                        l={r.league.l}
                        size="md"
                        showLabels
                        tooltip={false}
                        volume={{ fraction: Math.sqrt(r.league.p / maxLeagueP), games: r.league.p }}
                      />
                    ) : (
                      <span className="max-sm:hidden" aria-hidden />
                    )}

                    <div className={hasCups ? "ledger-cups" : "ledger-cups max-sm:hidden"}>
                      {lanes.map((l) => (
                        <CupCell
                          key={l}
                          lane={l}
                          comps={r.comps.filter((c) => laneOf(c.type) === l)}
                          results={cupResults}
                        />
                      ))}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
