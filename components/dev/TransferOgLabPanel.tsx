import {
  buildAnalyticalStubPayload,
  buildDealReceiptPayload,
  buildManagerEraPayload,
  buildWindowReceiptPayload,
  TRANSFER_OG_EXEMPLARS,
  type TransferShareCardPayload,
} from "@/lib/transferCardData";

function PreviewCard({ payload, route }: { payload: TransferShareCardPayload; route: string }) {
  return (
    <article className="space-y-3 rounded-xl border border-line bg-panel p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="display text-lg capitalize">{payload.kind.replace("-", " ")}</h3>
        <code className="text-[11px] text-ink-faint">{route}</code>
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-devil-bright">{payload.eyebrow}</p>
      <p className="display text-xl leading-tight">{payload.headline}</p>
      {payload.marker && (
        <p className="font-mono text-xs tracking-[0.14em] text-gold">{payload.marker}</p>
      )}
      <ol className="space-y-2 text-sm leading-snug text-ink-dim">
        {payload.facts.map((fact) => (
          <li key={fact}>{fact}</li>
        ))}
      </ol>
      <p className="border-t border-line pt-3 text-xs leading-snug text-ink-faint">{payload.coverageCue}</p>
    </article>
  );
}

/** Server-fed transfer OG payloads for the dev lab — mirrors `npm run og:review` fixtures. */
export function TransferOgLabPanel() {
  const dealSigning = buildDealReceiptPayload(TRANSFER_OG_EXEMPLARS.recordSigning);
  const dealSale = buildDealReceiptPayload(TRANSFER_OG_EXEMPLARS.recordSale);
  const dealFree = buildDealReceiptPayload(TRANSFER_OG_EXEMPLARS.freeTransfer);
  const dealActive = buildDealReceiptPayload(TRANSFER_OG_EXEMPLARS.activeSigning);
  const window = buildWindowReceiptPayload(TRANSFER_OG_EXEMPLARS.trebleWindow);
  const manager = buildManagerEraPayload(TRANSFER_OG_EXEMPLARS.fergusonEra);
  const analytical = buildAnalyticalStubPayload();

  const cards = [
    dealSigning && { payload: dealSigning, route: `/transfers/deal/${TRANSFER_OG_EXEMPLARS.recordSigning}/opengraph-image` },
    dealSale && { payload: dealSale, route: `/transfers/deal/${TRANSFER_OG_EXEMPLARS.recordSale}/opengraph-image` },
    dealFree && { payload: dealFree, route: `/transfers/deal/${TRANSFER_OG_EXEMPLARS.freeTransfer}/opengraph-image` },
    dealActive && { payload: dealActive, route: `/transfers/deal/${TRANSFER_OG_EXEMPLARS.activeSigning}/opengraph-image` },
    window && { payload: window, route: "/transfers/opengraph-image" },
    manager && { payload: manager, route: "lab only · manager career OG unchanged" },
    { payload: analytical, route: "lab stub · not production metadata" },
  ].filter(Boolean) as { payload: TransferShareCardPayload; route: string }[];

  return (
    <section className="space-y-5 border-t border-line pt-8">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-devil-bright">
          Rec 7 · Transfer share cards
        </p>
        <h2 className="display mt-2 text-2xl">Receipt, window, manager era, and closed analysis stub</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-dim">
          Payloads are built from <code className="text-ink">lib/transferCardData.ts</code> and rendered through{" "}
          <code className="text-ink">transferShareCard()</code> in the shared OG renderer. Run{" "}
          <code className="text-ink">npm run og:review</code> to regenerate PNG fixtures under{" "}
          <code className="text-ink">output/og-review/</code>.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {cards.map(({ payload, route }) => (
          <PreviewCard key={`${payload.kind}-${payload.headline}`} payload={payload} route={route} />
        ))}
      </div>
    </section>
  );
}
