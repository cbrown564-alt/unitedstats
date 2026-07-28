import {
  allTransfers,
  managersIndex,
  managerTransferTenures,
} from "@/lib/queries";
import { loadInflationIndices } from "@/lib/inflationIndices";
import { TransfersLedger } from "@/components/transfers/TransfersLedger";
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
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(transferHistoryJsonLd(latestSeason?.season)) }}
      />
      <TransfersLedger
        transfers={transfers}
        indices={indices}
        managerTenures={managerTenures}
        managerPortrait={managerPortrait}
      />
    </div>
  );
}
