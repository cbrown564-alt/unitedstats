"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import { track } from "@vercel/analytics";
import { RecordDeals } from "@/components/RecordDeals";
import { SpendBars } from "@/components/SpendBars";
import { SpendTide } from "@/components/charts/SpendTide";
import { TransferArchive } from "@/components/TransferArchive";
import { CoverageNote } from "@/components/CoverageNote";
import { SectionHead } from "@/components/SectionHead";
import { CurrentTransferWindow } from "@/components/transfers/CurrentTransferWindow";
import { MoneyModeToggle } from "@/components/transfers/MoneyModeToggle";
import { TransferHistoryLink } from "@/components/transfers/TransferHistoryLink";
import type { InflationIndices, MoneyMode } from "@/lib/inflation";
import { moneyModeLabel } from "@/lib/inflation";
import {
  netSpendByManagerForMode,
  spendTideForMode,
  topTransfersForMode,
  transferRecordSummary,
  transferTotalsForMode,
} from "@/lib/transferAggregates";
import { seasonAnchorId, type FeaturedTransferWindow } from "@/lib/transferFeature";
import type { CurrentTransferWindowModel } from "@/lib/currentTransferWindow";
import { fmtDate, fmtFee, fmtNum } from "@/lib/format";
import { SquadBuildTimeline } from "@/components/transfers/SquadBuildTimeline";
import { ClubRelationships } from "@/components/transfers/ClubRelationships";
import type { GatedClub } from "@/lib/transferClubs";
import type { SquadBuildDataset } from "@/lib/squadBuild";
import type { TransferReceipt } from "@/lib/transferReceiptTypes";
import type { ManagerTransferTenure, TransferRow } from "@/lib/queries";

export function TransfersLedger({
  transfers,
  indices,
  managerTenures,
  managerPortrait,
  featured,
  since,
  squadBuildDatasets,
  currentWindow,
  recordDealReceipts,
  clubRelationships,
}: {
  transfers: TransferRow[];
  indices: InflationIndices;
  managerTenures: ManagerTransferTenure[];
  managerPortrait: Map<string, { name: string; src?: string | null }>;
  /** Authored window to lead with. Omitted when it has no anchor to point at. */
  featured?: FeaturedTransferWindow;
  since: number;
  squadBuildDatasets: SquadBuildDataset[];
  /** Rich confirmed-window surface for the latest season. */
  currentWindow?: CurrentTransferWindowModel | null;
  /** Server-built receipts for record deals — keyed by transfer id. */
  recordDealReceipts: Record<string, TransferReceipt>;
  /** Gated counterparty clubs, most-traded first. */
  clubRelationships: GatedClub[];
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
  const seasonOptions = useMemo(
    () =>
      [...new Set(transfers.map((transfer) => transfer.season).filter((season): season is string => !!season))]
        .filter((season) => Number.parseInt(season.slice(0, 4), 10) >= since)
        .sort((a, b) => b.localeCompare(a)),
    [transfers, since],
  );

  const net = totals.gross_spend - totals.gross_received;
  const setMode = (nextMode: MoneyMode) => {
    if (nextMode === moneyMode) return;
    track("transfer_history_money_mode", { mode: nextMode });
    setMoneyMode(nextMode);
  };
  const revealSeason = (season: string) => {
    const target = document.getElementById(seasonAnchorId(season));
    if (target instanceof HTMLDetailsElement) target.open = true;
  };
  const jumpToSeason = (event: ChangeEvent<HTMLSelectElement>) => {
    const season = event.currentTarget.value;
    if (!season) return;
    revealSeason(season);
    document.getElementById(seasonAnchorId(season))?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start",
    });
    event.currentTarget.value = "";
  };

  return (
    <div className="space-y-10 sm:space-y-14">
      <section
        id="money-tide"
        aria-labelledby="transfer-history-title"
        className="-mx-4 scroll-mt-28 overflow-hidden border-y border-line bg-panel sm:mx-0 sm:rounded-xl sm:border"
      >
        <header className="grid gap-6 border-b border-line/70 px-4 py-5 sm:px-6 sm:py-7 lg:grid-cols-[minmax(0,1fr)_minmax(19rem,0.48fr)] lg:items-end lg:gap-12">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-devil-bright">
              Transfer history <span className="text-ink-faint">·</span>{" "}
              <span className="stat-num tracking-normal text-ink-dim">{record.firstYear}–{record.lastYear}</span>
            </p>
            <h1 id="transfer-history-title" className="display mt-2 text-3xl text-balance sm:text-4xl">
              The money tide
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-ink-dim">
              For most of the first century, fees barely register in the surviving record. Then the modern market
              rises from the line — spending above it, receipts below.
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-faint">
              This is every recorded arrival and departure.{" "}
              <span className="stat-num text-ink">{fmtNum(record.knownFees)}</span> of{" "}
              <span className="stat-num text-ink">{fmtNum(record.total)}</span> moves carry a published fee, so every
              money total remains a floor.
            </p>
          </div>

          <div className="min-w-0">
            <p className="mb-2 text-sm leading-5 text-ink-dim" aria-live="polite">
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
        </header>

        <div className="px-3 py-5 sm:p-6">
          <SpendTide years={tide} />
        </div>

        <dl className="grid grid-cols-3 divide-x divide-line/70 border-t border-line/70">
          <div className="px-3 py-3 sm:px-6 sm:py-4">
            <dt className="text-xs text-ink-faint">Known spend</dt>
            <dd className="stat-num mt-1 text-sm font-semibold text-devil-bright sm:text-xl">
              {fmtFee(totals.gross_spend)}
            </dd>
          </div>
          <div className="px-3 py-3 sm:px-6 sm:py-4">
            <dt className="text-xs text-ink-faint">Known receipts</dt>
            <dd className="stat-num mt-1 text-sm font-semibold text-gold sm:text-xl">
              {fmtFee(totals.gross_received)}
            </dd>
          </div>
          <div className="px-3 py-3 sm:px-6 sm:py-4">
            <dt className="text-xs text-ink-faint">Net floor</dt>
            <dd className="stat-num mt-1 text-sm font-semibold text-ink sm:text-xl">{fmtFee(net)}</dd>
          </div>
        </dl>

        <div
          className={`grid border-t border-line/70 ${
            featured ? "lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]" : ""
          }`}
        >
          {featured && (
            <TransferHistoryLink
              href={`#${seasonAnchorId(featured.season)}`}
              destination="season"
              source="opening_thread"
              onClick={() => revealSeason(featured.season)}
              className="group block px-4 py-5 transition-colors hover:bg-panel-2 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-devil-bright sm:px-6 sm:py-6 lg:border-r lg:border-line/70"
            >
              <span className="stat-num text-xs font-medium text-devil-bright">{featured.label}</span>
              <h2 className="display mt-1.5 max-w-xl text-balance text-xl leading-tight text-ink group-hover:text-devil-bright sm:text-2xl">
                {featured.title}
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-ink-dim">{featured.blurb}</p>
              <span className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-ink">
                {featured.cta} <span aria-hidden>↓</span>
              </span>
            </TransferHistoryLink>
          )}

          <nav
            aria-label="Explore the transfer record"
            className={featured ? "border-t border-line/70 lg:border-t-0" : ""}
          >
            {currentWindow && (
              <TransferHistoryLink
                href="#current-window"
                destination="season"
                source="opening_routes"
                className="group flex min-h-14 items-center justify-between gap-4 border-b border-line/70 px-4 py-3 transition-colors hover:bg-panel-2 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-devil-bright sm:px-5"
              >
                <span>
                  <span className="block text-sm font-semibold text-ink group-hover:text-devil-bright">
                    Latest confirmed window
                  </span>
                  <span className="mt-0.5 block text-xs leading-5 text-ink-faint">
                    {currentWindow.seasonLabel} · {currentWindow.dealCount} confirmed
                    {currentWindow.verifiedAt ? ` · verified ${fmtDate(currentWindow.verifiedAt)}` : ""}
                  </span>
                </span>
                <span className="text-ink-faint group-hover:text-devil-bright" aria-hidden>↓</span>
              </TransferHistoryLink>
            )}
            <TransferHistoryLink
              href="#record-deals"
              destination="player"
              source="opening_routes"
              className="group flex min-h-14 items-center justify-between gap-4 border-b border-line/70 px-4 py-3 transition-colors hover:bg-panel-2 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-devil-bright sm:px-5"
            >
              <span>
                <span className="block text-sm font-semibold text-ink group-hover:text-devil-bright">Record deals</span>
                <span className="mt-0.5 block text-xs leading-5 text-ink-faint">The biggest published fees in and out</span>
              </span>
              <span className="text-ink-faint group-hover:text-devil-bright" aria-hidden>↓</span>
            </TransferHistoryLink>
            <TransferHistoryLink
              href="#manager-view"
              destination="manager"
              source="opening_routes"
              className="group flex min-h-14 items-center justify-between gap-4 border-b border-line/70 px-4 py-3 transition-colors hover:bg-panel-2 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-devil-bright sm:px-5"
            >
              <span>
                <span className="block text-sm font-semibold text-ink group-hover:text-devil-bright">Manager eras</span>
                <span className="mt-0.5 block text-xs leading-5 text-ink-faint">Who sanctioned the known-fee business</span>
              </span>
              <span className="text-ink-faint group-hover:text-devil-bright" aria-hidden>↓</span>
            </TransferHistoryLink>
            <TransferHistoryLink
              href="#squad-build"
              destination="season"
              source="opening_routes"
              className="group flex min-h-14 items-center justify-between gap-4 border-b border-line/70 px-4 py-3 transition-colors hover:bg-panel-2 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-devil-bright sm:px-5"
            >
              <span>
                <span className="block text-sm font-semibold text-ink group-hover:text-devil-bright">Squad-build timeline</span>
                <span className="mt-0.5 block text-xs leading-5 text-ink-faint">How arrivals and departures threaded through each era</span>
              </span>
              <span className="text-ink-faint group-hover:text-devil-bright" aria-hidden>↓</span>
            </TransferHistoryLink>
            {clubRelationships.length > 0 && (
              <TransferHistoryLink
                href="#club-relationships"
                destination="club"
                source="opening_routes"
                className="group flex min-h-14 items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-panel-2 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-devil-bright sm:px-5"
              >
                <span>
                  <span className="block text-sm font-semibold text-ink group-hover:text-devil-bright">Club relationships</span>
                  <span className="mt-0.5 block text-xs leading-5 text-ink-faint">The counterparties United trades with most</span>
                </span>
                <span className="text-ink-faint group-hover:text-devil-bright" aria-hidden>↓</span>
              </TransferHistoryLink>
            )}
          </nav>
        </div>
      </section>

      {currentWindow && (
        <CurrentTransferWindow
          window={currentWindow}
          moneyMode={moneyMode}
          indices={indices}
          onOpenSeason={revealSeason}
        />
      )}

      <section id="record-deals" className="scroll-mt-28 space-y-3">
        <SectionHead title="The record deals" aside="by published fee" />
        <RecordDeals
          signings={topIn}
          sales={topOut}
          receipts={recordDealReceipts}
          moneyMode={moneyMode}
          indices={indices}
        />
      </section>

      <section id="manager-view" className="scroll-mt-28 space-y-3">
        <SectionHead title="The manager view" aside="known fees · top 10 net spend" />
        <SpendBars
          buckets={byManager}
          hrefFor={(b) => `/manager/${b.bucket_id}`}
          portraitFor={(b) => managerPortrait.get(b.bucket_id) ?? null}
          trackingSource="manager_view"
        />
      </section>

      {squadBuildDatasets.length > 0 && <SquadBuildTimeline datasets={squadBuildDatasets} />}

      <ClubRelationships clubs={clubRelationships} />

      <section id="full-ledger" className="scroll-mt-28 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <SectionHead
            title="The full season ledger"
            aside="every dated window, newest first"
            className="mb-0"
          />
          <label className="flex min-h-11 shrink-0 items-center gap-2 rounded-lg border border-line bg-panel px-3 text-sm text-ink-dim has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-devil-bright">
            <span className="font-medium text-ink">Jump to season</span>
            <select
              defaultValue=""
              onChange={jumpToSeason}
              className="min-h-9 bg-transparent text-sm text-ink outline-none"
              aria-label={`Jump to a season from ${since} onwards`}
            >
              <option value="" disabled className="bg-panel text-ink">Choose</option>
              {seasonOptions.map((season) => (
                <option key={season} value={season} className="bg-panel text-ink">
                  {season}
                </option>
              ))}
            </select>
          </label>
        </div>
        <TransferArchive
          transfers={transfers}
          since={since}
          moneyMode={moneyMode}
          indices={indices}
          trackingSource="season_ledger"
        />
        <CoverageNote slice="all recorded transfers, 1883–present">
          Each season opens to its recorded transfers; the undated lane preserves moves that cannot be placed safely.
          Net spend counts only deals with a published fee.
          {moneyMode !== "nominal" && (
            <>
              {" "}
              Figures are inflation-adjusted ({moneyModeLabel(moneyMode)}).
            </>
          )}{" "}
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
    </div>
  );
}
