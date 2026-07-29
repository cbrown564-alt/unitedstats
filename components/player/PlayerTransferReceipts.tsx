import { TransferReceiptCard } from "@/components/transfers/TransferReceipt";
import { PlayerTransferRecord } from "@/components/player/PlayerTransferRecord";
import { loadInflationIndices } from "@/lib/inflationIndices";
import { buildTransferReceiptsForPlayer } from "@/lib/transferReceipt";
import type { TransferRow } from "@/lib/queries";

/** Player transfer tab — timeline plus scorecard receipts where linkage supports them. */
export function PlayerTransferReceipts({
  playerId,
  transfers,
  careerYears,
}: {
  playerId: string;
  transfers: TransferRow[];
  careerYears?: string | null;
}) {
  const indices = loadInflationIndices();
  const receipts = buildTransferReceiptsForPlayer(playerId, indices);

  return (
    <div className="space-y-6">
      {receipts.length > 0 && (
        <div className="space-y-4">
          {receipts.map((receipt) => (
            <TransferReceiptCard key={receipt.deal.transferId} receipt={receipt} indices={indices} />
          ))}
        </div>
      )}
      <PlayerTransferRecord transfers={transfers} careerYears={careerYears} />
    </div>
  );
}
