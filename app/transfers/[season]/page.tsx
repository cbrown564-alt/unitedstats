import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { allTransfers, playerPositionMap } from "@/lib/queries";
import { loadInflationIndices } from "@/lib/inflationIndices";
import { DetailBreadcrumb } from "@/components/DetailBreadcrumb";
import { TransferWindowView } from "@/components/transfers/TransferWindowView";
import { TransferHistoryLink } from "@/components/transfers/TransferHistoryLink";
import { buildTransferWindow } from "@/lib/transferWindow.server";
import { transferWindowExemplars } from "@/lib/transferFeature";
import { isKnownFee, seasonDashLabel } from "@/lib/transferTaxonomy";
import { seoMetadata, transferWindowSeoDescription, transferWindowSeoTitle } from "@/lib/seo";
import { jsonLdHtml, transferWindowJsonLd } from "@/lib/structuredData";

/**
 * Window pages exist only for the authored exemplars (see
 * `transferWindowExemplars`), so every generated route is a page with a real
 * contextual job. Unlike the sampled id routes there is no on-demand tail to
 * keep open — an unlisted season is not a missing render, it is a season the
 * plan has deliberately not spread the pattern to yet.
 */
export const dynamicParams = false;

function windowCounts(season: string) {
  const rows = allTransfers().filter((row) => row.season === season);
  return {
    arrivals: rows.filter((row) => row.direction === "in").length,
    departures: rows.filter((row) => row.direction === "out").length,
    knownFees: rows.filter(isKnownFee).length,
    total: rows.length,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ season: string }>;
}): Promise<Metadata> {
  const { season } = await params;
  const label = seasonDashLabel(season);
  return seoMetadata(transferWindowSeoTitle(label), transferWindowSeoDescription(label, windowCounts(season)));
}

export function generateStaticParams() {
  return transferWindowExemplars(allTransfers()).map((exemplar) => ({ season: exemplar.season }));
}

export default async function TransferWindowPage({
  params,
}: {
  params: Promise<{ season: string }>;
}) {
  const { season } = await params;
  const transfers = allTransfers();
  const indices = loadInflationIndices();
  const model = buildTransferWindow(season, transfers, indices, playerPositionMap());
  if (!model) notFound();

  return (
    <div className="space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdHtml(
            transferWindowJsonLd(model.season, model.seasonLabel, {
              receipts: model.receipts.length > 0,
              campaign: model.campaign != null,
              positionBalance: model.positionBalance != null,
            }),
          ),
        }}
      />

      <DetailBreadcrumb
        segments={[
          { label: "Transfer history", href: "/transfers" },
          { label: `${model.seasonLabel} window` },
        ]}
      />

      <TransferWindowView model={model} indices={indices} />

      <nav aria-label="Other transfer windows" className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        {model.neighbours.previous && (
          <TransferHistoryLink
            href={`/transfers/${model.neighbours.previous.season}`}
            destination="window"
            source="transfer_window_nav"
            className="text-devil-bright hover:underline focus-ring"
          >
            ← {model.neighbours.previous.label} window
          </TransferHistoryLink>
        )}
        <TransferHistoryLink
          href="/transfers"
          destination="evidence"
          source="transfer_window_nav"
          className="text-ink-dim hover:text-ink focus-ring"
        >
          All transfer history
        </TransferHistoryLink>
        {model.neighbours.next && (
          <TransferHistoryLink
            href={`/transfers/${model.neighbours.next.season}`}
            destination="window"
            source="transfer_window_nav"
            className="text-devil-bright hover:underline focus-ring"
          >
            {model.neighbours.next.label} window →
          </TransferHistoryLink>
        )}
      </nav>
    </div>
  );
}
