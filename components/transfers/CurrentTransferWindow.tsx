import Link from "next/link";
import { CoverageNote } from "@/components/CoverageNote";
import { SectionHead } from "@/components/SectionHead";
import { TransferList } from "@/components/TransferList";
import { TransferHistoryLink } from "@/components/transfers/TransferHistoryLink";
import {
  currentWindowMoneyForMode,
  feeRankLabel,
  type CurrentTransferWindowModel,
  type CurrentWindowDeal,
} from "@/lib/currentTransferWindow";
import { costBandLabel, isKnownFee } from "@/lib/transferTaxonomy";
import { fmtDate, fmtFee, fmtNum } from "@/lib/format";
import type { InflationIndices, MoneyMode } from "@/lib/inflation";
import { moneyModeLabel } from "@/lib/inflation";
import { seasonAnchorId } from "@/lib/transferFeature";

function DealContext({ deal }: { deal: CurrentWindowDeal }) {
  const notes: string[] = [];
  if (deal.feeRank) notes.push(feeRankLabel(deal.feeRank));
  if (deal.relativeCostBand && deal.feePlMeanMultiple != null) {
    notes.push(
      `${costBandLabel(deal.relativeCostBand)} (${deal.feePlMeanMultiple.toFixed(1)}× PL season mean)`,
    );
  } else if (isKnownFee(deal.transfer)) {
    // A published fee with no band means the season benchmark is missing, not
    // that the deal was cheap.
    notes.push("PL season-mean benchmark unavailable for this window");
  }
  if (notes.length === 0) return null;
  return (
    <p className="mt-1 text-xs leading-5 text-ink-faint">
      {notes.join(" · ")}
    </p>
  );
}

function PositionNote({
  note,
}: {
  note: CurrentTransferWindowModel["positionNotes"][number];
}) {
  return (
    <p className="text-xs leading-5 text-ink-dim">
      <span className="font-medium text-ink">{note.playerName}</span> shares the{" "}
      {note.positionLabel} lane with{" "}
      {note.peers.map((peer, index) => (
        <span key={peer.playerId}>
          {index > 0 && (index === note.peers.length - 1 ? " and " : ", ")}
          <Link href={`/player/${peer.playerId}`} prefetch={false} className="text-ink hover:text-devil-bright">
            {peer.playerName}
          </Link>
        </span>
      ))}
      .
    </p>
  );
}

export function CurrentTransferWindow({
  window,
  moneyMode,
  indices,
  onOpenSeason,
}: {
  window: CurrentTransferWindowModel;
  moneyMode: MoneyMode;
  indices: InflationIndices;
  onOpenSeason?: (season: string) => void;
}) {
  const rows = window.lanes.flatMap((lane) => lane.deals.map((deal) => deal.transfer));
  const money = currentWindowMoneyForMode(rows, moneyMode, indices);
  const hasKnownMoney = money.knownSpend > 0 || money.knownReceived > 0;

  return (
    <section id="current-window" aria-labelledby="current-window-title" className="scroll-mt-28 space-y-4">
      <SectionHead
        title="Current confirmed window"
        aside={`${window.seasonLabel} · verified ${fmtDate(window.verifiedAt)}`}
      />

      <div className="overflow-hidden rounded-xl border border-line bg-panel">
        <header className="border-b border-line/70 px-4 py-5 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-devil-bright">
            Confirmed business only
          </p>
          <h2 id="current-window-title" className="display mt-2 text-2xl text-balance sm:text-3xl">
            {window.seasonLabel}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-dim">
            {window.quietLead ??
              `${fmtNum(window.dealCount)} confirmed move${window.dealCount === 1 ? "" : "s"} on file for this window. Rumoured or reported deals are not included until they enter the canonical record.`}
          </p>
          <p className="mt-2 text-xs text-ink-faint">
            Last verified{" "}
            {window.verifiedAtSource === "dataset_build" ? "at dataset build" : "from latest deal date"} ·{" "}
            {fmtDate(window.verifiedAt)}
          </p>
        </header>

        <dl className="grid grid-cols-3 divide-x divide-line/70 border-b border-line/70">
          <div className="px-3 py-3 sm:px-6 sm:py-4">
            <dt className="text-xs text-ink-faint">Known spend</dt>
            <dd className="stat-num mt-1 text-sm font-semibold text-devil-bright sm:text-lg">
              {hasKnownMoney || window.feeCoverage.known === 0 ? fmtFee(money.knownSpend) : "—"}
            </dd>
          </div>
          <div className="px-3 py-3 sm:px-6 sm:py-4">
            <dt className="text-xs text-ink-faint">Known receipts</dt>
            <dd className="stat-num mt-1 text-sm font-semibold text-gold sm:text-lg">
              {hasKnownMoney || window.feeCoverage.known === 0 ? fmtFee(money.knownReceived) : "—"}
            </dd>
          </div>
          <div className="px-3 py-3 sm:px-6 sm:py-4">
            <dt className="text-xs text-ink-faint">Known net</dt>
            <dd className="stat-num mt-1 text-sm font-semibold text-ink sm:text-lg">
              {hasKnownMoney || window.feeCoverage.known === 0 ? fmtFee(money.knownNet) : "—"}
            </dd>
          </div>
        </dl>

        {window.comparisons.length > 0 && (
          <div className="border-b border-line/70 px-4 py-4 sm:px-6">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
              Previous windows
            </h3>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="text-xs text-ink-faint">
                    <th scope="col" className="pb-2 pr-4 font-medium">
                      Window
                    </th>
                    <th scope="col" className="pb-2 pr-4 font-medium">
                      In
                    </th>
                    <th scope="col" className="pb-2 pr-4 font-medium">
                      Out
                    </th>
                    <th scope="col" className="pb-2 pr-4 font-medium">
                      Known spend
                    </th>
                    <th scope="col" className="pb-2 font-medium">
                      Known net
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-line/50 text-ink">
                    <th scope="row" className="py-2 pr-4 font-medium">
                      {window.seasonLabel}
                      <span className="ml-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-devil-bright">
                        current
                      </span>
                    </th>
                    <td className="stat-num py-2 pr-4">{window.lanes.filter((lane) => lane.direction === "in").reduce((sum, lane) => sum + lane.deals.length, 0)}</td>
                    <td className="stat-num py-2 pr-4">{window.lanes.filter((lane) => lane.direction === "out").reduce((sum, lane) => sum + lane.deals.length, 0)}</td>
                    <td className="stat-num py-2 pr-4">{fmtFee(money.knownSpend)}</td>
                    <td className="stat-num py-2">{fmtFee(money.knownNet)}</td>
                  </tr>
                  {window.comparisons.map((comparison) => (
                    <tr key={comparison.season} className="border-t border-line/50 text-ink-dim">
                      <th scope="row" className="py-2 pr-4 font-medium text-ink-dim">
                        {comparison.seasonLabel}
                      </th>
                      <td className="stat-num py-2 pr-4">{comparison.arrivals}</td>
                      <td className="stat-num py-2 pr-4">{comparison.departures}</td>
                      <td className="stat-num py-2 pr-4">{fmtFee(comparison.knownSpend)}</td>
                      <td className="stat-num py-2">{fmtFee(comparison.knownNet)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="space-y-5 px-4 py-5 sm:px-6 sm:py-6">
          {window.lanes.map((lane) => (
            <div key={lane.id}>
              <div className="mb-2 flex items-baseline gap-2">
                <h3
                  className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${
                    lane.direction === "in" ? "text-devil-bright" : "text-gold"
                  }`}
                >
                  {lane.title}
                </h3>
                <span className="stat-num text-[11px] text-ink-faint">{lane.deals.length}</span>
              </div>
              <TransferList
                transfers={lane.deals.map((deal) => deal.transfer)}
                showPlayer
                showDirection={false}
                moneyMode={moneyMode}
                indices={indices}
                trackingSource="current_window"
              />
              {lane.deals.some(
                (deal) => deal.feeRank || deal.relativeCostBand || deal.transfer.fee_kind === "fee",
              ) && (
                <div className="mt-2 space-y-2 border-t border-line/40 pt-2">
                  {lane.deals
                    .filter(
                      (deal) => deal.feeRank || deal.relativeCostBand || deal.transfer.fee_kind === "fee",
                    )
                    .map((deal) => (
                    <div key={`${deal.transfer.id}-context`}>
                      <span className="text-xs font-medium text-ink">{deal.transfer.player_name}</span>
                      <DealContext deal={deal} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {window.positionNotes.length > 0 && (
            <div className="rounded-lg border border-dashed border-line bg-panel-2/40 px-4 py-3">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
                Same-position context
              </h3>
              <div className="mt-2 space-y-2">
                {window.positionNotes.map((note) => (
                  <PositionNote key={note.transferId} note={note} />
                ))}
              </div>
            </div>
          )}

          {window.quiet && window.dealCount === 0 && (
            <div className="rounded-lg border border-dashed border-line px-4 py-5 text-sm leading-6 text-ink-dim">
              The window is open in the calendar, but no confirmed arrivals or departures have entered the canonical
              record yet. When business completes, it will appear here first — before any rumour or probability tracker.
            </div>
          )}
        </div>

        <footer className="flex flex-col gap-3 border-t border-line/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <CoverageNote
            slice={`confirmed ${window.seasonLabel} transfers`}
            count={
              window.feeCoverage.known < window.feeCoverage.total
                ? {
                    covered: window.feeCoverage.known,
                    total: window.feeCoverage.total,
                    noun: "moves carry a published fee",
                    note: "unknown and undisclosed fees stay out of the money totals",
                  }
                : undefined
            }
            coverage={
              window.feeCoverage.known === window.feeCoverage.total
                ? "Every recorded move in this window has a fee kind on file; only published fees enter the totals."
                : undefined
            }
            className="mt-0"
          />
          <TransferHistoryLink
            href={`#${seasonAnchorId(window.season)}`}
            destination="season"
            source="current_window"
            onClick={() => onOpenSeason?.(window.season)}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 text-sm font-semibold text-ink hover:text-devil-bright"
          >
            Open {window.seasonLabel} in the ledger <span aria-hidden>↓</span>
          </TransferHistoryLink>
        </footer>
      </div>

      {moneyMode !== "nominal" && (
        <p className="text-xs text-ink-faint">
          Money figures restated as {moneyModeLabel(moneyMode).toLowerCase()} fees.
        </p>
      )}
    </section>
  );
}
