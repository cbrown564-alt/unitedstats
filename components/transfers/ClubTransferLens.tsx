"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { TransferArchive } from "@/components/TransferArchive";
import { CoverageNote } from "@/components/CoverageNote";
import { EvidenceLink } from "@/components/EvidenceLink";
import { SectionHead } from "@/components/SectionHead";
import { StatTile } from "@/components/PageHeader";
import { MoneyModeToggle } from "@/components/transfers/MoneyModeToggle";
import { TransferHistoryLink } from "@/components/transfers/TransferHistoryLink";
import type { InflationIndices, MoneyMode } from "@/lib/inflation";
import { moneyModeLabel } from "@/lib/inflation";
import { buildClubTransferLens, clubDirectionFees } from "@/lib/transferClubs";
import { fmtFee, fmtNum } from "@/lib/format";
import type { TransferRow } from "@/lib/queries";

export function ClubTransferLensPanel({
  clubId,
  transfers,
  indices,
}: {
  clubId: string;
  transfers: TransferRow[];
  indices: InflationIndices;
}) {
  const [moneyMode, setMoneyMode] = useState<MoneyMode>("nominal");
  const lens = useMemo(
    () => buildClubTransferLens(clubId, transfers, moneyMode, indices),
    [clubId, transfers, moneyMode, indices],
  );
  if (!lens) return null;

  const spend = clubDirectionFees(lens.transfers, "in", moneyMode, indices);
  const received = clubDirectionFees(lens.transfers, "out", moneyMode, indices);
  const net = spend - received;

  return (
    <div className="space-y-8">
      {lens.authored && (
        <section className="rounded-xl border border-line bg-panel px-4 py-4 sm:px-5">
          <h2 className="display text-lg">{lens.authored.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-dim">{lens.authored.blurb}</p>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <SectionHead
            title="Known fees exchanged"
            aside={`${moneyModeLabel(moneyMode)} · ${fmtNum(lens.marketCount)} market moves`}
            className="mb-0"
          />
          <MoneyModeToggle mode={moneyMode} onChange={setMoneyMode} />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatTile label="Arrivals from club" value={fmtNum(lens.arrivals)} detail="incoming players" />
          <StatTile label="Departures to club" value={fmtNum(lens.departures)} detail="outgoing players" />
          <StatTile label="Paid in" value={fmtFee(spend)} tone="red" />
          <StatTile
            label="Received"
            value={fmtFee(received)}
            detail={net >= 0 ? `${fmtFee(net)} net spend` : `+${fmtFee(-net)} net gain`}
            tone="gold"
          />
        </div>
      </section>

      {lens.bidirectional.length > 0 && (
        <section>
          <SectionHead title="Both ways" aside="players who moved in each direction" />
          <ul className="divide-y divide-line/60 overflow-hidden rounded-xl border border-line bg-panel">
            {lens.bidirectional.map((player) => (
              <li key={player.playerId} className="flex items-center justify-between gap-3 px-3.5 py-2.5 sm:px-4">
                <Link href={`/player/${player.playerId}`} className="font-medium text-ink hover:text-devil-bright">
                  {player.playerName}
                </Link>
                <span className="stat-num text-xs text-ink-faint">
                  {fmtNum(player.inCount)} in · {fmtNum(player.outCount)} out
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <SectionHead title="Every deal with this club" aside="market transfers only" />
        <TransferArchive
          transfers={lens.transfers}
          moneyMode={moneyMode}
          indices={indices}
          trackingSource="club_transfer_lens"
        />
        <CoverageNote
          className="mt-3"
          slice="counterparty relationship"
          coverage="this page exists only where the canonical record carries enough market business to tell a relationship story; fee totals count known amounts only."
        />
        <div className="mt-3 flex flex-wrap justify-end gap-4">
          <EvidenceLink href="/transfers" label="Full transfer archive →" />
          <TransferHistoryLink
            href={`/opponent/${clubId}`}
            destination="opponent"
            source="club_transfer_lens"
            className="text-sm text-devil-bright hover:underline"
          >
            Head-to-head record →
          </TransferHistoryLink>
        </div>
      </section>
    </div>
  );
}
