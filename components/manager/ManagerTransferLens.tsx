"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { TransferArchive } from "@/components/TransferArchive";
import { TransferList } from "@/components/TransferList";
import { CoverageNote } from "@/components/CoverageNote";
import { EvidenceLink } from "@/components/EvidenceLink";
import { SectionHead } from "@/components/SectionHead";
import { StatTile } from "@/components/PageHeader";
import { MoneyModeToggle } from "@/components/transfers/MoneyModeToggle";
import { TransferHistoryLink } from "@/components/transfers/TransferHistoryLink";
import type { InflationIndices, MoneyMode } from "@/lib/inflation";
import { moneyModeLabel } from "@/lib/inflation";
import { buildManagerTransferLensView, type ManagerTransferLensStatic } from "@/lib/transferManagerLens";
import { fmtFee, fmtNum } from "@/lib/format";
import type { ManagerTransferLens } from "@/lib/transferManagerLens";
import type { TransferRow } from "@/lib/queries";

export function ManagerTransferLensPanel({
  managerName,
  transfers,
  indices,
  staticLens,
}: {
  managerId: string;
  managerName: string;
  transfers: TransferRow[];
  indices: InflationIndices;
  staticLens: ManagerTransferLensStatic;
}) {
  const [moneyMode, setMoneyMode] = useState<MoneyMode>("nominal");
  const lens = useMemo(
    () => buildManagerTransferLensView(transfers, moneyMode, indices, staticLens),
    [transfers, moneyMode, indices, staticLens],
  );
  const transferById = useMemo(() => new Map(transfers.map((t) => [t.id, t])), [transfers]);
  const net = lens.totals.gross_spend - lens.totals.gross_received;

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <SectionHead
            title="In the market"
            aside={`${moneyModeLabel(moneyMode)} · known fees only`}
            className="mb-0"
          />
          <MoneyModeToggle mode={moneyMode} onChange={setMoneyMode} />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatTile
            label="Net spend"
            value={net >= 0 ? fmtFee(net) : `+${fmtFee(-net)}`}
            detail={net >= 0 ? undefined : "net gain"}
            tone={net >= 0 ? "red" : "default"}
          />
          <StatTile
            label="Spent"
            value={fmtFee(lens.totals.gross_spend)}
            detail={`${fmtNum(lens.totals.signings)} signings`}
            tone="red"
          />
          <StatTile
            label="Received"
            value={fmtFee(lens.totals.gross_received)}
            detail={`${fmtNum(lens.totals.departures)} departures`}
            tone="gold"
          />
          <StatTile
            label="Squad churn"
            value={fmtNum(lens.churn.signings + lens.churn.departures)}
            detail={`${fmtNum(Math.abs(lens.churn.netHeadcount))} net ${lens.churn.netHeadcount >= 0 ? "in" : "out"}`}
          />
        </div>
        <p className="text-xs text-ink-faint">
          Tenure-length and market inflation make cross-manager spend comparisons misleading — this lens stays within{" "}
          {managerName}&apos;s dates only.{" "}
          <Link href="/transfers" className="text-devil-bright hover:underline">
            Full transfer history →
          </Link>
        </p>
      </section>

      {lens.seasons.length > 0 && (
        <section>
          <SectionHead title="Season by season" aside="every window, newest first" />
          <div className="overflow-hidden rounded-xl border border-line bg-panel">
            <div className="grid grid-cols-[minmax(0,5.5rem)_1fr_auto] gap-3 border-b border-line/60 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint sm:px-4">
              <span>Season</span>
              <span>In · out</span>
              <span className="text-right">Net</span>
            </div>
            {lens.seasons.map((row) => (
              <SeasonEvidenceRow key={row.season} row={row} transferById={transferById} />
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-6 lg:grid-cols-2">
        <AggregateBucketPanel
          title="Signing cost bands"
          aside="relative to Premier League season mean"
          buckets={lens.costBands.filter((b) => b.count > 0)}
          transferById={transferById}
          trackingSource="manager_transfer_lens"
        />
        <AggregateBucketPanel
          title="Position mix"
          aside="incoming market signings"
          buckets={lens.positionMix}
          transferById={transferById}
          trackingSource="manager_transfer_lens"
        />
      </section>

      {lens.completedSpells.length > 0 && (
        <section>
          <SectionHead
            title="Completed signing spells"
            aside={`${fmtNum(lens.completedSpells.length)} permanent arrivals with a recorded exit`}
          />
          <SpellOutcomeTable spells={lens.completedSpells.slice(0, 12)} />
          {lens.completedSpells.length > 12 && (
            <p className="mt-2 text-xs text-ink-faint">
              Showing the twelve most recent completed spells — every row links to the player record behind it.
            </p>
          )}
          <CoverageNote
            className="mt-3"
            slice="career outcomes"
            coverage="appearances and goals are counted within each signing spell only; no success badge is applied in this phase."
          />
        </section>
      )}

      {lens.ongoingSpells.length > 0 && (
        <section>
          <SectionHead title="Ongoing spells" aside="still at the club or without a recorded exit" />
          <SpellOutcomeTable spells={lens.ongoingSpells} ongoing />
        </section>
      )}

      {lens.definingLinks.length > 0 && (
        <section>
          <SectionHead title="Into the wider record" aside="seasons and defining nights" />
          <ul className="space-y-3">
            {lens.definingLinks.map((link) => (
              <li key={`${link.kind}:${link.href}`} className="rounded-lg border border-line bg-panel px-4 py-3">
                <TransferHistoryLink
                  href={link.href}
                  destination={link.kind === "player" ? "player" : link.kind === "season" ? "season" : "match"}
                  source="manager_transfer_lens"
                  className="font-medium text-ink hover:text-devil-bright"
                >
                  {link.label}
                </TransferHistoryLink>
                <p className="mt-1 text-xs leading-5 text-ink-dim">{link.blurb}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <SectionHead title="Full transfer ledger" aside="every dated move in tenure order" />
        {transfers.length > 0 ? (
          <TransferArchive transfers={transfers} moneyMode={moneyMode} indices={indices} trackingSource="manager_transfer_lens" />
        ) : (
          <p className="rounded-lg border border-line bg-panel px-4 py-6 text-center text-sm text-ink-dim">
            No dated transfers during this tenure.
          </p>
        )}
        <div className="mt-3 flex justify-end">
          <EvidenceLink href="/transfers" label="Open the canonical transfer archive →" />
        </div>
      </section>
    </div>
  );
}

function SeasonEvidenceRow({
  row,
  transferById,
}: {
  row: ManagerTransferLens["seasons"][number];
  transferById: Map<string, TransferRow>;
}) {
  const deals = row.transferIds
    .map((id) => transferById.get(id))
    .filter((t): t is TransferRow => t != null)
    .slice(0, 4);
  const hasFee = row.spend > 0 || row.received > 0;
  return (
    <div className="grid grid-cols-[minmax(0,5.5rem)_1fr_auto] items-start gap-3 border-b border-line/40 px-3 py-2.5 last:border-b-0 sm:px-4">
      <span className="display text-sm leading-none">{row.season}</span>
      <div className="min-w-0">
        <p className="stat-num text-xs text-ink-faint">
          {fmtNum(row.signings)} in · {fmtNum(row.departures)} out
        </p>
        {deals.length > 0 && (
          <p className="mt-1 text-xs leading-relaxed text-ink-dim">
            {deals.map((deal, index) => (
              <span key={deal.id}>
                {index > 0 && <span className="text-ink-faint"> · </span>}
                {deal.player_id ? (
                  <Link href={`/player/${deal.player_id}`} className="hover:text-ink">
                    {deal.player_name}
                  </Link>
                ) : (
                  deal.player_name
                )}
              </span>
            ))}
          </p>
        )}
      </div>
      <div className="text-right">
        {hasFee ? (
          <span className={`stat-num text-sm font-semibold ${row.net >= 0 ? "text-devil-bright" : "text-win"}`}>
            {row.net >= 0 ? fmtFee(row.net) : `+${fmtFee(-row.net)}`}
          </span>
        ) : (
          <span className="text-[10px] uppercase tracking-[0.12em] text-ink-faint">undisclosed</span>
        )}
      </div>
    </div>
  );
}

function AggregateBucketPanel({
  title,
  aside,
  buckets,
  transferById,
  trackingSource,
}: {
  title: string;
  aside: string;
  buckets: ManagerTransferLens["costBands"];
  transferById: Map<string, TransferRow>;
  trackingSource: string;
}) {
  const max = Math.max(1, ...buckets.map((b) => b.count));
  return (
    <section>
      <SectionHead title={title} aside={aside} />
      <div className="space-y-3 rounded-xl border border-line bg-panel p-4">
        {buckets.map((bucket) => (
          <div key={bucket.id}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
              <span className="text-ink-dim">{bucket.label}</span>
              <span className="stat-num text-xs text-ink-faint">{fmtNum(bucket.count)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-sm bg-pitch">
              <div className="h-full rounded-sm bg-devil/80" style={{ width: `${(bucket.count / max) * 100}%` }} />
            </div>
            {bucket.transferIds.length > 0 && (
              <div className="mt-2">
                <TransferList
                  transfers={bucket.transferIds
                    .map((id) => transferById.get(id))
                    .filter((t): t is TransferRow => t != null)
                    .slice(0, 3)}
                  showPlayer
                  showDirection={false}
                  trackingSource={trackingSource}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function SpellOutcomeTable({
  spells,
  ongoing = false,
}: {
  spells: ManagerTransferLens["completedSpells"];
  ongoing?: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-panel">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-line/60 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
          <tr>
            <th className="px-3 py-2 sm:px-4">Player</th>
            <th className="px-3 py-2 sm:px-4">Window</th>
            <th className="px-3 py-2 sm:px-4">Apps</th>
            <th className="px-3 py-2 sm:px-4">Starts</th>
            <th className="px-3 py-2 sm:px-4">Goals</th>
            <th className="px-3 py-2 sm:px-4">Cost band</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line/50">
          {spells.map((spell) => (
            <tr key={spell.transferId}>
              <td className="px-3 py-2.5 sm:px-4">
                {spell.playerId ? (
                  <Link href={`/player/${spell.playerId}`} className="font-medium text-ink hover:text-devil-bright">
                    {spell.playerName}
                  </Link>
                ) : (
                  spell.playerName
                )}
                {ongoing && <span className="ml-2 text-[10px] uppercase tracking-[0.12em] text-gold">ongoing</span>}
              </td>
              <td className="stat-num px-3 py-2.5 text-xs text-ink-faint sm:px-4">{spell.season ?? "—"}</td>
              <td className="stat-num px-3 py-2.5 sm:px-4">{spell.apps != null ? fmtNum(spell.apps) : "—"}</td>
              <td className="stat-num px-3 py-2.5 sm:px-4">{spell.starts != null ? fmtNum(spell.starts) : "—"}</td>
              <td className="stat-num px-3 py-2.5 sm:px-4">{spell.goals != null ? fmtNum(spell.goals) : "—"}</td>
              <td className="px-3 py-2.5 text-xs capitalize text-ink-dim sm:px-4">{spell.costBand.replace("-", " ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
