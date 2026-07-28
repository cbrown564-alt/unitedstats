import {
  allTransfers,
  managersIndex,
  managerTransferTenures,
} from "@/lib/queries";
import { loadInflationIndices } from "@/lib/inflationIndices";
import { TransfersLedger } from "@/components/transfers/TransfersLedger";
import { CoverageNote } from "@/components/CoverageNote";
import { PageHeader } from "@/components/PageHeader";
import { listSeo, seoMetadata } from "@/lib/seo";
import { latestTransferSeasonSummary } from "@/lib/transferAggregates";
import { jsonLdHtml, transferHistoryJsonLd } from "@/lib/structuredData";

export const metadata = seoMetadata(listSeo.transfers.title, listSeo.transfers.description);

export default async function TransfersPage() {
  const transfers = allTransfers();
  const indices = loadInflationIndices();
  const managerTenures = managerTransferTenures();
  const latestSeason = latestTransferSeasonSummary(transfers);
  const managerPortrait = new Map(
    managersIndex().map((m) => [m.id, { name: m.name, src: m.thumb_url ?? m.image_url }]),
  );

  return (
    <div className="space-y-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(transferHistoryJsonLd(latestSeason?.season)) }}
      />
      <div>
        <PageHeader eyebrow="People · the ledger" title="Manchester United transfer history" deferOnMobile>
          Every recorded arrival and departure since 1883 — what it cost, who sanctioned it, and the career and
          season record that followed.
        </PageHeader>

        <div className="mt-4">
          <TransfersLedger
            transfers={transfers}
            indices={indices}
            managerTenures={managerTenures}
            managerPortrait={managerPortrait}
          />
        </div>
      </div>

      <CoverageNote slice="known-fee transfers, attributed to the manager in charge on the transfer date.">
        Toggle nominal, UK CPI, or PL football inflation to compare fees across eras. The red bar is spend, the gold
        receipts, on one shared scale; the figure is the net. Only the ten biggest net spenders are shown. Free and
        unrecorded fees carry no amount, so totals are a floor.
      </CoverageNote>
    </div>
  );
}
