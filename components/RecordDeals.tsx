import { TransferReceiptCard } from "@/components/transfers/TransferReceipt";
import type { InflationIndices, MoneyMode } from "@/lib/inflation";
import type { TransferReceipt } from "@/lib/transferReceipt";
import type { TransferRow } from "@/lib/queries";

function DealBoard({
  title,
  unit,
  deals,
  receipts,
  moneyMode = "nominal",
  indices,
}: {
  title: string;
  unit: string;
  deals: TransferRow[];
  receipts: Record<string, TransferReceipt>;
  moneyMode?: MoneyMode;
  indices?: InflationIndices;
}) {
  const dealReceipts = deals
    .map((deal) => receipts[deal.id])
    .filter((receipt): receipt is TransferReceipt => receipt != null);

  const [featured, ...rest] = dealReceipts;
  if (!featured) return null;

  return (
    <section className="flex flex-col overflow-hidden rounded-lg border border-line bg-panel">
      <header className="flex items-baseline justify-between gap-2 border-b border-line/70 px-3.5 py-2.5">
        <h3 className="display text-base leading-none">{title}</h3>
        <span className="text-[11px] uppercase tracking-[0.12em] text-ink-faint">{unit}</span>
      </header>
      <TransferReceiptCard
        receipt={featured}
        moneyMode={moneyMode}
        indices={indices}
        rank={1}
        className="rounded-none border-0"
      />
      {rest.length > 0 && (
        <ol className="divide-y divide-line/50 border-t border-line/70">
          {rest.map((receipt, i) => (
            <li key={receipt.deal.transferId} className="px-3.5 py-2">
              <TransferReceiptCard receipt={receipt} compact rank={i + 2} />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

/** Record deals by fee — featured receipt plus compact scorecards for ranks 2–6. */
export function RecordDeals({
  signings,
  sales,
  receipts,
  moneyMode = "nominal",
  indices,
}: {
  signings: TransferRow[];
  sales: TransferRow[];
  receipts: Record<string, TransferReceipt>;
  moneyMode?: MoneyMode;
  indices?: InflationIndices;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <DealBoard
        title="Most expensive signings"
        unit="fee in"
        deals={signings}
        receipts={receipts}
        moneyMode={moneyMode}
        indices={indices}
      />
      <DealBoard
        title="Most expensive sales"
        unit="fee out"
        deals={sales}
        receipts={receipts}
        moneyMode={moneyMode}
        indices={indices}
      />
    </div>
  );
}
