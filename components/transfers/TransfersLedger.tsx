"use client";

import { useMemo, useState } from "react";
import { RecordDeals } from "@/components/RecordDeals";
import { SpendBars } from "@/components/SpendBars";
import { SpendTide } from "@/components/charts/SpendTide";
import { TransferArchive } from "@/components/TransferArchive";
import { CoverageNote } from "@/components/CoverageNote";
import { SectionHead } from "@/components/SectionHead";
import { MoneyModeToggle } from "@/components/transfers/MoneyModeToggle";
import type { InflationIndices, MoneyMode } from "@/lib/inflation";
import { moneyModeLabel } from "@/lib/inflation";
import {
  netSpendByManagerForMode,
  spendTideForMode,
  topTransfersForMode,
  transferTotalsForMode,
} from "@/lib/transferAggregates";
import { fmtFee, fmtNum } from "@/lib/format";
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

  const net = totals.gross_spend - totals.gross_received;

  return (
    <>
      <div className="mb-5 flex flex-col gap-1.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
        <p className="text-[11px] leading-relaxed text-ink-faint">
          {moneyMode === "football" && (
            <>
              Restates fees in today&apos;s transfer-market money, based on how Premier League prices have changed since
              1992 (Transfermarkt). Deals before then use UK inflation.
            </>
          )}
          {moneyMode === "nominal" && <>Fees as published when each deal completed.</>}
        </p>
        <MoneyModeToggle mode={moneyMode} onChange={setMoneyMode} />
      </div>

      <section className="relative overflow-hidden rounded-xl border border-line bg-panel shadow-[0_22px_44px_rgb(0_0_0_/0.22)]">
        <div className="hero-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden />
        <div
          className="pointer-events-none absolute -right-24 -top-28 h-72 w-2/3 rounded-full opacity-[0.12] blur-3xl"
          style={{ backgroundColor: "var(--color-devil)" }}
          aria-hidden
        />
        <div className="relative p-4 sm:p-5 lg:p-7">
          <dl className="mt-2 space-y-3 border-b border-line/60 pb-4 lg:hidden">
            <div className="min-w-0 border border-line/80 bg-panel-2/40 px-2.5 py-2">
              <dt className="text-[10px] uppercase tracking-[0.12em] text-ink-faint">Net</dt>
              <dd className="stat-num text-lg font-semibold leading-tight text-ink">{fmtFee(net)}</dd>
            </div>
            <div className="min-w-0 border border-line/80 bg-panel-2/40 px-2.5 py-2">
              <dt className="text-[10px] uppercase tracking-[0.12em] text-ink-faint">Spent</dt>
              <dd className="stat-num text-lg font-semibold leading-tight text-devil-bright">
                {fmtFee(totals.gross_spend)}
                {topIn[0] && (
                  <span className="mt-0.5 block truncate text-[11px] font-normal normal-case tracking-normal text-ink-dim">
                    {topIn[0].player_name}
                  </span>
                )}
              </dd>
            </div>
            <div className="min-w-0 border border-line/80 bg-panel-2/40 px-2.5 py-2">
              <dt className="text-[10px] uppercase tracking-[0.12em] text-ink-faint">Received</dt>
              <dd className="stat-num text-lg font-semibold leading-tight text-gold">
                {fmtFee(totals.gross_received)}
                {topOut[0] && (
                  <span className="mt-0.5 block truncate text-[11px] font-normal normal-case tracking-normal text-ink-dim">
                    {topOut[0].player_name}
                  </span>
                )}
              </dd>
            </div>
          </dl>

          <div className="hidden lg:block">
            <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
              <div className="leading-none">
                <div className="flex items-baseline gap-2">
                  <span className="stat-num text-4xl font-semibold text-ink sm:text-5xl">{fmtFee(net)}</span>
                  <span className="text-sm uppercase tracking-[0.16em] text-ink-faint">net since 1883</span>
                </div>
              </div>
              <dl className="flex flex-wrap items-end gap-x-7 gap-y-3.5 border-l border-line pl-6">
                <div className="leading-none">
                  <dd className="stat-num text-xl font-semibold text-devil-bright">{fmtFee(totals.gross_spend)}</dd>
                  <dt className="mt-1.5 text-[11px] uppercase tracking-[0.13em] text-ink-faint">
                    Spent <span className="ml-1 normal-case tracking-normal text-ink-dim">{fmtNum(totals.signings)} signings</span>
                  </dt>
                </div>
                <div className="leading-none">
                  <dd className="stat-num text-xl font-semibold text-gold">{fmtFee(totals.gross_received)}</dd>
                  <dt className="mt-1.5 text-[11px] uppercase tracking-[0.13em] text-ink-faint">
                    Received <span className="ml-1 normal-case tracking-normal text-ink-dim">{fmtNum(totals.departures)} departures</span>
                  </dt>
                </div>
              </dl>
            </div>
          </div>

          <details className="group mt-4 lg:hidden">
            <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-dim hover:text-ink focus-ring">
              The money tide
            </summary>
            <div className="mt-3">
              <SpendTide years={tide} />
            </div>
          </details>
          <div className="mt-6 hidden lg:block">
            <SpendTide years={tide} />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <SectionHead title="The record deals" aside="by fee" />
        <RecordDeals signings={topIn} sales={topOut} moneyMode={moneyMode} indices={indices} />
      </section>

      <section className="space-y-3">
        <SectionHead title="Who spent it" aside="top 10 by net" />
        <SpendBars
          buckets={byManager}
          hrefFor={(b) => `/manager/${b.bucket_id}`}
          portraitFor={(b) => managerPortrait.get(b.bucket_id) ?? null}
        />
      </section>

      <section className="space-y-3">
        <SectionHead title="Season by season" aside="every window, newest first" />
        <TransferArchive transfers={transfers} since={1980} moneyMode={moneyMode} indices={indices} />
        <CoverageNote
          slice="all recorded transfers, 1883–present"
          evidenceHref="/data"
          evidenceLabel="Coverage details"
        >
          Each season opens to its full list of transfers; net spend counts only the deals with a known fee.
          {moneyMode !== "nominal" && (
            <>
              {" "}
              Figures are inflation-adjusted ({moneyModeLabel(moneyMode)}).
            </>
          )}
        </CoverageNote>
      </section>
    </>
  );
}
