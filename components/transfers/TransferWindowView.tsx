"use client";

import { useMemo, useState } from "react";
import { track } from "@vercel/analytics";
import { SectionHead } from "@/components/SectionHead";
import { CoverageNote } from "@/components/CoverageNote";
import { TransferList } from "@/components/TransferList";
import { MoneyModeToggle } from "@/components/transfers/MoneyModeToggle";
import { TransferHistoryLink } from "@/components/transfers/TransferHistoryLink";
import { TransferReceiptCard } from "@/components/transfers/TransferReceipt";
import { windowMoneyForMode, type TransferWindowModel } from "@/lib/transferWindow";
import type { InflationIndices, MoneyMode } from "@/lib/inflation";
import { moneyModeLabel } from "@/lib/inflation";
import { clubName, fmtDate, fmtFee, fmtNum, pct } from "@/lib/format";

function ordinal(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

/** Signed delta with an explicit zero, so an unchanged lane reads as unchanged. */
function delta(value: number): string {
  if (value === 0) return "0";
  return value > 0 ? `+${value}` : `−${Math.abs(value)}`;
}

function ManagerLine({ model }: { model: TransferWindowModel }) {
  if (model.managers.length === 0) {
    return <span className="text-ink-faint">Manager not attributable from the recorded dates</span>;
  }
  return (
    <>
      {model.managers.map((spell, index) => (
        <span key={spell.managerId}>
          {index > 0 && <span className="mx-1.5 text-ink-faint">then</span>}
          <TransferHistoryLink
            href={`/manager/${spell.managerId}`}
            destination="manager"
            source="transfer_window"
            className="text-ink hover:text-devil-bright"
          >
            {spell.managerName}
          </TransferHistoryLink>
          <span className="stat-num ml-1 text-ink-faint">
            ({fmtNum(spell.deals)} {spell.deals === 1 ? "deal" : "deals"})
          </span>
        </span>
      ))}
    </>
  );
}

function CampaignPanel({ model }: { model: TransferWindowModel }) {
  const campaign = model.campaign;
  if (!campaign) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-panel px-4 py-5 text-sm leading-6 text-ink-dim sm:px-6">
        The {model.seasonLabel} season has no recorded matches yet, so there is no campaign to place this business
        against. The window stands on its own until the season is played.
      </div>
    );
  }

  const finish =
    campaign.leaguePosition != null
      ? `${ordinal(campaign.leaguePosition)}${campaign.leagueSize ? ` of ${campaign.leagueSize}` : ""} in the ${campaign.leagueName}`
      : campaign.leagueName
        ? `${campaign.leagueName} finish not recorded`
        : "No league campaign recorded";

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-panel">
      <div className="border-b border-line/70 px-4 py-4 sm:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
          The campaign that followed
        </p>
        <p className="display mt-1.5 text-xl text-balance sm:text-2xl">{finish}</p>
        {campaign.honours.length > 0 && (
          <p className="mt-2 text-sm leading-6 text-gold">
            Won during the season: {campaign.honours.join(", ")}.
          </p>
        )}
      </div>
      <dl className="grid grid-cols-2 divide-x divide-line/70 border-b border-line/70 sm:grid-cols-4">
        <div className="px-3 py-3 sm:px-6">
          <dt className="text-xs text-ink-faint">Played</dt>
          <dd className="stat-num mt-1 text-sm font-semibold text-ink sm:text-lg">{fmtNum(campaign.played)}</dd>
        </div>
        <div className="px-3 py-3 sm:px-6">
          <dt className="text-xs text-ink-faint">W · D · L</dt>
          <dd className="stat-num mt-1 text-sm font-semibold text-ink sm:text-lg">
            {campaign.wins}–{campaign.draws}–{campaign.losses}
          </dd>
        </div>
        <div className="border-t border-line/70 px-3 py-3 sm:border-t-0 sm:px-6">
          <dt className="text-xs text-ink-faint">Win rate</dt>
          <dd className="stat-num mt-1 text-sm font-semibold text-ink sm:text-lg">
            {pct(campaign.wins, campaign.played)}
          </dd>
        </div>
        <div className="border-t border-line/70 px-3 py-3 sm:border-t-0 sm:px-6">
          <dt className="text-xs text-ink-faint">Goals</dt>
          <dd className="stat-num mt-1 text-sm font-semibold text-ink sm:text-lg">
            {campaign.goalsFor}–{campaign.goalsAgainst}
          </dd>
        </div>
      </dl>
      <div className="px-4 py-4 sm:px-6">
        <p className="max-w-3xl text-xs leading-5 text-ink-faint">
          What a squad did over a season is context for the window, not evidence that these signings produced the
          result. Injuries, inherited players, opposition and luck all sit between the two.
        </p>
        <TransferHistoryLink
          href={`/seasons/${model.season}`}
          destination="season"
          source="transfer_window"
          className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-ink hover:text-devil-bright"
        >
          Open the {model.seasonLabel} season record <span aria-hidden>→</span>
        </TransferHistoryLink>
      </div>
    </div>
  );
}

export function TransferWindowView({
  model,
  indices,
}: {
  model: TransferWindowModel;
  indices: InflationIndices;
}) {
  const [moneyMode, setMoneyMode] = useState<MoneyMode>("nominal");
  const money = useMemo(
    () => windowMoneyForMode(model.transfers, moneyMode, indices),
    [model.transfers, moneyMode, indices],
  );

  const setMode = (nextMode: MoneyMode) => {
    if (nextMode === moneyMode) return;
    track("transfer_history_money_mode", { mode: nextMode });
    setMoneyMode(nextMode);
  };

  const arrivals = model.transfers.filter((row) => row.direction === "in").length;
  const departures = model.transfers.length - arrivals;

  return (
    <div className="space-y-10 sm:space-y-12">
      <section
        aria-labelledby="transfer-window-title"
        className="-mx-4 overflow-hidden border-y border-line bg-panel sm:mx-0 sm:rounded-xl sm:border"
      >
        <header className="grid gap-6 border-b border-line/70 px-4 py-5 sm:px-6 sm:py-7 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,0.42fr)] lg:items-end lg:gap-12">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-devil-bright">
              Transfer window <span className="text-ink-faint">·</span>{" "}
              <span className="stat-num tracking-normal text-ink-dim">{model.seasonLabel}</span>
            </p>
            <h1 id="transfer-window-title" className="display mt-2 text-3xl text-balance sm:text-4xl">
              {model.exemplar.title}
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-ink-dim">{model.exemplar.blurb}</p>
            <p className="mt-3 text-sm leading-6 text-ink-faint">
              <span className="stat-num text-ink">{fmtNum(arrivals)}</span> in ·{" "}
              <span className="stat-num text-ink">{fmtNum(departures)}</span> out ·{" "}
              <ManagerLine model={model} />
            </p>
          </div>

          <div className="min-w-0">
            <p className="mb-2 text-sm leading-5 text-ink-dim" aria-live="polite">
              {moneyMode === "nominal" && <>Fees as published when each deal completed.</>}
              {moneyMode === "cpi" && <>Published fees restated in today&apos;s UK consumer prices.</>}
              {moneyMode === "football" && (
                <>Fees restated against Premier League transfer prices since 1992; earlier deals use UK inflation.</>
              )}
            </p>
            <MoneyModeToggle mode={moneyMode} onChange={setMode} />
          </div>
        </header>

        <dl className="grid grid-cols-3 divide-x divide-line/70">
          <div className="px-3 py-3 sm:px-6 sm:py-4">
            <dt className="text-xs text-ink-faint">Known spend</dt>
            <dd className="stat-num mt-1 text-sm font-semibold text-devil-bright sm:text-xl">
              {fmtFee(money.knownSpend)}
            </dd>
          </div>
          <div className="px-3 py-3 sm:px-6 sm:py-4">
            <dt className="text-xs text-ink-faint">Known receipts</dt>
            <dd className="stat-num mt-1 text-sm font-semibold text-gold sm:text-xl">
              {fmtFee(money.knownReceived)}
            </dd>
          </div>
          <div className="px-3 py-3 sm:px-6 sm:py-4">
            <dt className="text-xs text-ink-faint">Known net</dt>
            <dd className="stat-num mt-1 text-sm font-semibold text-ink sm:text-xl">{fmtFee(money.knownNet)}</dd>
          </div>
        </dl>

        <p className="border-t border-line/70 px-4 py-3 text-xs leading-5 text-ink-faint sm:px-6">
          <span className="stat-num text-ink-dim">{fmtNum(money.feeRows)}</span> of{" "}
          <span className="stat-num text-ink-dim">{fmtNum(model.feeCoverage.total)}</span> moves in this window carry a
          published fee, so each total is a floor. Free, undisclosed and unrecorded fees are never counted as £0.
          {moneyMode !== "nominal" && <> Figures restated as {moneyModeLabel(moneyMode).toLowerCase()}.</>}
        </p>
      </section>

      <section id="window-lanes" className="scroll-mt-28 space-y-4">
        <SectionHead title="The business, lane by lane" aside="permanent, loan, academy, release" />
        {/* Direction owns the column, so arrivals and departures read straight down
            against each other rather than interleaving as the lane order flows. */}
        <div className="grid items-start gap-x-6 gap-y-5 lg:grid-cols-2">
          {(["in", "out"] as const).map((direction) => (
            <div key={direction} className="min-w-0 space-y-5">
              {model.lanes
                .filter((lane) => lane.direction === direction)
                .map((lane) => (
                  <div key={lane.id} className="min-w-0">
                    <div className="mb-2 flex items-baseline gap-2">
                      <h3
                        className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${
                          direction === "in" ? "text-devil-bright" : "text-gold"
                        }`}
                      >
                        {lane.title}
                      </h3>
                      <span className="stat-num text-[11px] text-ink-faint">{lane.transfers.length}</span>
                    </div>
                    <TransferList
                      transfers={lane.transfers}
                      showPlayer
                      showDirection={false}
                      moneyMode={moneyMode}
                      indices={indices}
                      trackingSource="transfer_window"
                    />
                  </div>
                ))}
            </div>
          ))}
        </div>
        <CoverageNote slice={`every recorded ${model.seasonLabel} move`}>
          Loans, academy promotions, releases and retirements keep their own lanes because they are not market
          business — no fee changes hands and there may be no counterparty club at all.
        </CoverageNote>
      </section>

      {model.positionBalance && (
        <section id="position-balance" className="scroll-mt-28 space-y-4">
          <SectionHead title="Position balance either side of the window" aside="players who appeared" />
          <div className="overflow-x-auto rounded-xl border border-line bg-panel">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line/70 text-xs text-ink-faint">
                  <th scope="col" className="px-4 py-2.5 font-medium">Lane</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Before</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">After</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Change</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">In · out</th>
                </tr>
              </thead>
              <tbody>
                {model.positionBalance.map((row) => (
                  <tr key={row.group} className="border-b border-line/40 last:border-b-0">
                    <th scope="row" className="px-4 py-2.5 font-medium text-ink">{row.label}</th>
                    <td className="stat-num px-4 py-2.5 text-ink-dim">{row.before}</td>
                    <td className="stat-num px-4 py-2.5 text-ink-dim">{row.after}</td>
                    <td className="stat-num px-4 py-2.5 text-ink">{delta(row.after - row.before)}</td>
                    <td className="stat-num px-4 py-2.5 text-ink-faint">
                      {row.arrivals} · {row.departures}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <CoverageNote
            slice="players who made a recorded, non-bench appearance in each season"
            count={
              model.positionCoverage.covered < model.positionCoverage.total
                ? {
                    covered: model.positionCoverage.covered,
                    total: model.positionCoverage.total,
                    noun: "of those players carry a recorded position",
                    note: "players without one are absent from every lane rather than guessed into a bucket",
                  }
                : undefined
            }
          >
            Before and after are the two squads that actually played, not registered lists the record does not hold.
            A player who appeared in both seasons counts in both columns.
          </CoverageNote>
        </section>
      )}

      <section id="what-followed" className="scroll-mt-28 space-y-4">
        <SectionHead title="What followed" aside={`the ${model.seasonLabel} campaign`} />
        <CampaignPanel model={model} />

        {model.definingNights.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
              Defining nights of the campaign
            </h3>
            <ul className="grid gap-2 sm:grid-cols-3">
              {model.definingNights.map((night) => (
                <li key={night.matchId}>
                  <TransferHistoryLink
                    href={`/match/${night.matchId}`}
                    destination="match"
                    source="transfer_window"
                    className="group flex h-full flex-col gap-1 rounded-lg border border-line bg-panel px-3.5 py-3 transition-colors hover:bg-panel-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-devil-bright"
                  >
                    <span className="stat-num text-xs text-ink-faint">{fmtDate(night.date)}</span>
                    {/* Named both ways round: "Arsenal 2–1" alone reads as Arsenal winning. */}
                    <span className="text-sm font-semibold text-ink group-hover:text-devil-bright">
                      {clubName(night.date)} {night.score} {night.opponent}
                    </span>
                    <span className="text-xs leading-5 text-ink-dim">{night.note}</span>
                    {!night.authored && (
                      <span className="mt-auto pt-1 text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                        {night.competition} · selected by the record
                      </span>
                    )}
                  </TransferHistoryLink>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {model.receipts.length > 0 && (
        <section id="window-receipts" className="scroll-mt-28 space-y-4">
          <SectionHead title="Receipts for the biggest deals" aside="by published fee" />
          <div className="space-y-4">
            {model.receipts.map((receipt) => (
              <TransferReceiptCard
                key={receipt.deal.transferId}
                receipt={receipt}
                moneyMode={moneyMode}
                indices={indices}
              />
            ))}
          </div>
          <CoverageNote slice="the window's highest published fees">
            Only deals with a published fee are ranked here. A receipt is a scorecard of what the record holds about
            the spell, not a verdict on the signing.
          </CoverageNote>
        </section>
      )}

      <section id="window-ledger" className="scroll-mt-28 space-y-3">
        <SectionHead title="Every recorded move" aside="the full window ledger" />
        <TransferList
          transfers={[...model.transfers].sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""))}
          showPlayer
          moneyMode={moneyMode}
          indices={indices}
          trackingSource="transfer_window_ledger"
        />
        <CoverageNote slice={`all canonical ${model.seasonLabel} transfers`}>
          {model.verifiedAt
            ? `Latest dated move in this window: ${fmtDate(model.verifiedAt)}. `
            : "No move in this window carries a precise date. "}
          <TransferHistoryLink
            href="/data"
            destination="evidence"
            source="transfer_window_ledger"
            className="font-medium text-ink-dim underline decoration-line underline-offset-2 hover:text-ink"
          >
            Coverage details
          </TransferHistoryLink>
        </CoverageNote>
      </section>
    </div>
  );
}
