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

function gridTemplate(lanes: Lane[]): string {
  return `4.5rem minmax(8.5rem,1.1fr) minmax(6.5rem,0.85fr) ${lanes.map(() => "minmax(4.5rem,6rem)").join(" ")}`;
}

/**
 * Desktop season ledger grid — shared by `/seasons` and `/manager/[id]`.
 * Mobile callers use {@link SeasonLedgerCard} in a card stream instead.
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
  renderBeforeRow?: (row: SeasonLedgerRow, prev: SeasonLedgerRow | undefined) => React.ReactNode;
}) {
  if (rows.length === 0) return null;

  const template = gridTemplate(lanes);
  const maxLeagueP = Math.max(1, ...rows.map((r) => r.league?.p ?? 0));

  return (
    <div className={`min-w-max overflow-hidden rounded-lg border bg-pitch/35 ${borderClass}`}>
      <div
        className="grid items-center gap-x-3 border-b border-line bg-panel/50 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-faint"
        style={{ gridTemplateColumns: template }}
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

      <ul>
        {rows.map((r, index) => {
          const prev = index > 0 ? rows[index - 1] : undefined;
          return (
            <li key={r.season} className="border-b border-line last:border-b-0">
              {renderBeforeRow?.(r, prev)}
              <Link
                href={r.href}
                className={`grid items-start gap-x-3 px-4 py-2.5 transition-colors hover:bg-panel-2/60 ${r.eraClass ?? ""}`}
                style={{ gridTemplateColumns: template }}
              >
                <div className="min-w-0 pt-0.5">
                  <span className="display text-base leading-tight">{r.season}</span>
                </div>

                {r.league ? (
                  <FinishLadder league={r.league} />
                ) : (
                  <span className="text-xs text-ink-faint">Cup competitions only</span>
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
                  <span aria-hidden />
                )}

                {lanes.map((l) => (
                  <CupCell
                    key={l}
                    lane={l}
                    comps={r.comps.filter((c) => laneOf(c.type) === l)}
                    results={cupResults}
                  />
                ))}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
