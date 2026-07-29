import {
  activePlayerPeersByPosition,
  allTransfers,
  databaseBuiltAt,
  managersIndex,
  managerTransferTenures,
  playerPositionMap,
} from "@/lib/queries";
import { loadInflationIndices } from "@/lib/inflationIndices";
import { TransfersLedger } from "@/components/transfers/TransfersLedger";
import { listSeo, seoMetadata } from "@/lib/seo";
import { latestTransferSeasonSummary } from "@/lib/transferAggregates";
import {
  buildCurrentTransferWindow,
  currentWindowPeerCutoff,
  type PositionGroup,
} from "@/lib/currentTransferWindow";
import {
  FEATURED_TRANSFER_WINDOW,
  TRANSFER_LEDGER_SINCE,
  featuredWindowResolves,
} from "@/lib/transferFeature";
import { buildRecordDealReceiptMap } from "@/lib/transferReceipt";
import { buildAllSquadBuildDatasets } from "@/lib/squadBuild.server";
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
  // Only lead with the authored window — and only claim it in structured data —
  // when the archive will actually render an anchor for it.
  const featured = featuredWindowResolves(transfers) ? FEATURED_TRANSFER_WINDOW : undefined;
  const squadBuildDatasets = buildAllSquadBuildDatasets(transfers, managerTenures);
  const positionMap = playerPositionMap() as Record<string, PositionGroup>;
  const latestWindowSeason = latestSeason?.season;
  const peersByPosition = latestWindowSeason
    ? (activePlayerPeersByPosition(currentWindowPeerCutoff(latestWindowSeason)) as Record<
        PositionGroup,
        Array<{ playerId: string; playerName: string }>
      >)
    : ({} as Record<PositionGroup, Array<{ playerId: string; playerName: string }>>);
  const currentWindow = buildCurrentTransferWindow({
    transfers,
    indices,
    positionMap,
    peersByPosition,
    datasetBuiltAt: databaseBuiltAt(),
  });
  const recordDealReceipts = buildRecordDealReceiptMap(transfers, indices);

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdHtml(transferHistoryJsonLd(latestSeason?.season, featured)),
        }}
      />
      <TransfersLedger
        transfers={transfers}
        indices={indices}
        managerTenures={managerTenures}
        managerPortrait={managerPortrait}
        featured={featured}
        since={TRANSFER_LEDGER_SINCE}
        squadBuildDatasets={squadBuildDatasets}
        currentWindow={currentWindow}
        recordDealReceipts={recordDealReceipts}
      />
    </div>
  );
}
