"use client";

import { useMemo, useState } from "react";
import { track } from "@vercel/analytics";
import { RecordDeals } from "@/components/RecordDeals";
import { SpendBars } from "@/components/SpendBars";
import { SpendTide } from "@/components/charts/SpendTide";
import { TransferArchive } from "@/components/TransferArchive";
import { CoverageNote } from "@/components/CoverageNote";
import { SectionHead } from "@/components/SectionHead";
import { MoneyModeToggle } from "@/components/transfers/MoneyModeToggle";
import { TransferHistoryLink } from "@/components/transfers/TransferHistoryLink";
import type { InflationIndices, MoneyMode } from "@/lib/inflation";
import { moneyModeLabel } from "@/lib/inflation";
import {
  netSpendByManagerForMode,
  latestTransferSeasonSummary,
  spendTideForMode,
  topTransfersForMode,
  transferRecordSummary,
  transferTotalsForMode,
} from "@/lib/transferAggregates";
import { fmtDate, fmtFee, fmtNum } from "@/lib/format";
import type { ManagerTransferTenure, TransferRow } from "@/lib/queries";

export function TransfersLedger({
  transfers,
  indices,
  managerTenures,
  managerPortrait,
}: {
  transfers: TransferRow[];
  indices: InflationIndices;
  managerTenures: ManagerTransferTenure[];
  managerPortrait: Map<string, { name: string; src?: string | null }>;
}) {
  const [moneyMode, setMoneyMode] = useState<MoneyMode>("nominal");

  const totals = useMemo(
    () => transferTotalsForMode(transfers, moneyMode, indices),
    [transfers, moneyMode, indices],
  );
  const tide = useMemo(
    () => spendTideForMode(transfers, moneyMode, indices),
    [transfers, moneyMode, indices],
  );
  const topIn = useMemo(
    () => topTransfersForMode(transfers, "in", 6, moneyMode, indices),
    [transfers, moneyMode, indices],
  );
  const topOut = useMemo(
    () => topTransfersForMode(transfers, "out", 6, moneyMode, indices),
    [transfers, moneyMode, indices],
  );
  const byManager = useMemo(
    () => netSpendByManagerForMode(transfers, managerTenures, moneyMode, indices).slice(0, 10),
    [transfers, managerTenures, moneyMode, indices],
  );
  const record = useMemo(() => transferRecordSummary(transfers), [transfers]);
  const latestSeason = useMemo(() => latestTransferSeasonSummary(transfers), [transfers]);

  const net = totals.gross_spend - totals.gross_received;
  const setMode = (nextMode: MoneyMode) => {
    if (nextMode === moneyMode) return;
    track("transfer_history_money_mode", { mode: nextMode });
    setMoneyMode(nextMode);
  };

  return (
    <>
      <section className="relative overflow-hidden rounded-xl border border-line bg-panel">
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgb(218_41_28_/_0.13),transparent_68%)]"
          aria-hidden
        />
        <div className="relative grid gap-6 p-4 sm:p-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(17rem,0.65fr)] lg:gap-10 lg:p-7">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-devil-bright">The recorded business</p>
            <h2 className="display mt-2 max-w-2xl text-2xl text-balance sm:text-3xl">
              {fmtNum(record.total)} arrivals and departures, from {record.firstYear} to {record.lastYear}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-dim">
              Follow a deal into the player, the manager who sanctioned it, and the season that followed. Only{" "}
              <span className="stat-num text-ink">{fmtNum(record.knownFees)}</span> records carry a published fee, so
              every money total is a floor and the early years sit flat on the line.
            </p>
          </div>

          <dl className="divide-y divide-line/70 border-y border-line/70 text-sm">
            <div className="flex items-baseline justify-between gap-4 py-2.5">
              <dt className="text-ink-faint">Record span</dt>
              <dd className="stat-num font-medium text-ink">{record.firstYear}–{record.lastYear}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 py-2.5">
              <dt className="text-ink-faint">Published fees</dt>
              <dd className="stat-num font-medium text-ink">{fmtNum(record.knownFees)} · {record.knownFeePercent}%</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 py-2.5">
              <dt className="text-ink-faint">Recorded moves</dt>
              <dd className="stat-num font-medium text-ink">{fmtNum(record.total)}</dd>
            </div>
          </dl>
        </div>

        <div className="relative border-t border-line/70 px-4 py-3 sm:px-5 lg:px-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl text-[11px] leading-5 text-ink-faint">
              {moneyMode === "nominal" && <>Fees as published when each deal completed.</>}
              {moneyMode === "cpi" && <>Published fees restated in today&apos;s UK consumer prices.</>}
              {moneyMode === "football" && (
                <>
                  Fees restated against Premier League transfer prices since 1992; earlier deals use UK inflation.
                </>
              )}
            </p>
            <MoneyModeToggle mode={moneyMode} onChange={setMode} />
          </div>
          <dl className="mt-3 grid grid-cols-3 divide-x divide-line/70 border-t border-line/70 pt-3">
            <div className="pr-3">
              <dt className="text-[10px] uppercase tracking-[0.12em] text-ink-faint">Spent</dt>
              <dd className="stat-num mt-1 text-base font-semibold text-devil-bright sm:text-xl">{fmtFee(totals.gross_spend)}</dd>
            </div>
            <div className="px-3">
              <dt className="text-[10px] uppercase tracking-[0.12em] text-ink-faint">Received</dt>
              <dd className="stat-num mt-1 text-base font-semibold text-gold sm:text-xl">{fmtFee(totals.gross_received)}</dd>
            </div>
            <div className="pl-3">
              <dt className="text-[10px] uppercase tracking-[0.12em] text-ink-faint">Net floor</dt>
              <dd className="stat-num mt-1 text-base font-semibold text-ink sm:text-xl">{fmtFee(net)}</dd>
            </div>
          </dl>
        </div>
      </section>

      {latestSeason && (
        <section
          id="current-window"
          className="scroll-mt-28 border-y border-line/70 py-4 sm:flex sm:items-center sm:justify-between sm:gap-8"
        >
          <div>
            <p className="text-xs font-semibold text-devil-bright">Current confirmed window · {latestSeason.season}</p>
            <p className="mt-1 text-sm leading-6 text-ink-dim">
              <span className="stat-num text-ink">{latestSeason.arrivals}</span> arrivals and{" "}
              <span className="stat-num text-ink">{latestSeason.departures}</span> departures are recorded
              {latestSeason.lastVerifiedDate ? ` through ${fmtDate(latestSeason.lastVerifiedDate)}` : ""}. No rumours
              enter this record.
            </p>
          </div>
          <TransferHistoryLink
            href={`#txseason-${latestSeason.season}`}
            destination="season"
            source="current_window"
            className="mt-3 inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-ink hover:text-devil-bright sm:mt-0"
          >
            Open the window <span aria-hidden>↓</span>
          </TransferHistoryLink>
        </section>
      )}

      <section id="money-tide" className="scroll-mt-28 space-y-3">
        <SectionHead title="The historical money tide" aside={`${record.firstYear}–${record.lastYear}`} />
        <div className="rounded-xl border border-line bg-panel p-3 sm:p-4">
          <SpendTide years={tide} />
        </div>
      </section>

      <section className="space-y-3">
        <SectionHead title="Ways into the record" aside="four authored paths" />
        <div className="grid overflow-hidden rounded-xl border border-line bg-panel sm:grid-cols-2">
          {latestSeason && (
            <TransferHistoryLink
              href={`#txseason-${latestSeason.season}`}
              destination="season"
              source="ways_into_record"
              className="group flex min-h-24 items-end justify-between gap-4 border-b border-line/70 p-4 hover:bg-panel-2 sm:border-r"
            >
              <span>
                <span className="block text-sm font-semibold text-ink">Latest window</span>
                <span className="mt-1 block text-xs leading-5 text-ink-faint">{latestSeason.season} confirmed business</span>
              </span>
              <span className="text-ink-faint group-hover:text-devil-bright" aria-hidden>↓</span>
            </TransferHistoryLink>
          )}
          <TransferHistoryLink
            href="#txseason-1998-99"
            destination="season"
            source="ways_into_record"
            className="group flex min-h-24 items-end justify-between gap-4 border-b border-line/70 p-4 hover:bg-panel-2"
          >
            <span>
              <span className="block text-sm font-semibold text-ink">The Treble window</span>
              <span className="mt-1 block text-xs leading-5 text-ink-faint">1998–99 arrivals and departures</span>
            </span>
            <span className="text-ink-faint group-hover:text-devil-bright" aria-hidden>↓</span>
          </TransferHistoryLink>
          <TransferHistoryLink
            href="#record-deals"
            destination="player"
            source="ways_into_record"
            className="group flex min-h-24 items-end justify-between gap-4 border-b border-line/70 p-4 hover:bg-panel-2 sm:border-b-0 sm:border-r"
          >
            <span>
              <span className="block text-sm font-semibold text-ink">Record deals</span>
              <span className="mt-1 block text-xs leading-5 text-ink-faint">The biggest recorded fees in and out</span>
            </span>
            <span className="text-ink-faint group-hover:text-devil-bright" aria-hidden>↓</span>
          </TransferHistoryLink>
          <TransferHistoryLink
            href="#manager-view"
            destination="manager"
            source="ways_into_record"
            className="group flex min-h-24 items-end justify-between gap-4 p-4 hover:bg-panel-2"
          >
            <span>
              <span className="block text-sm font-semibold text-ink">Manager eras</span>
              <span className="mt-1 block text-xs leading-5 text-ink-faint">Who sanctioned the recorded business</span>
            </span>
            <span className="text-ink-faint group-hover:text-devil-bright" aria-hidden>↓</span>
          </TransferHistoryLink>
        </div>
      </section>

      <section id="record-deals" className="scroll-mt-28 space-y-3">
        <SectionHead title="The record deals" aside="by published fee" />
        <RecordDeals signings={topIn} sales={topOut} moneyMode={moneyMode} indices={indices} />
      </section>

      <section id="manager-view" className="scroll-mt-28 space-y-3">
        <SectionHead title="The manager view" aside="top 10 by recorded net spend" />
        <SpendBars
          buckets={byManager}
          hrefFor={(b) => `/manager/${b.bucket_id}`}
          portraitFor={(b) => managerPortrait.get(b.bucket_id) ?? null}
          trackingSource="manager_view"
        />
      </section>

      <section id="full-ledger" className="scroll-mt-28 space-y-3">
        <SectionHead title="The full season ledger" aside="every dated window, newest first" />
        <TransferArchive
          transfers={transfers}
          since={1980}
          moneyMode={moneyMode}
          indices={indices}
          trackingSource="season_ledger"
        />
        <CoverageNote
          slice="all recorded transfers, 1883–present"
        >
          Each season opens to its recorded transfers; the undated lane preserves moves that cannot be placed safely.
          Net spend counts only deals with a published fee.
          {moneyMode !== "nominal" && (
            <>
              {" "}
              Figures are inflation-adjusted ({moneyModeLabel(moneyMode)}).
            </>
          )}
          {" "}
          <TransferHistoryLink
            href="/data"
            destination="evidence"
            source="season_ledger"
            className="font-medium text-ink-dim underline decoration-line underline-offset-2 hover:text-ink"
          >
            Coverage details
          </TransferHistoryLink>
        </CoverageNote>
      </section>
    </>
  );
}
