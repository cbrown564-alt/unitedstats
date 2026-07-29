import { immutableDataHeaders } from "@/lib/cache";
import { OG_CONTENT_TYPE, OG_SIZE, transferShareCard, trustStrip } from "@/lib/og-card";
import { buildWindowReceiptPayload, buildTransfersHubPayload } from "@/lib/transferCardData";

export const dynamic = "force-dynamic";
export const alt = "Manchester United transfer window — Red Thread";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/**
 * The window share card from Rec 7, now attached to the page it describes. A
 * season with no recorded business cannot happen here — the route only generates
 * for exemplars — but the hub card is a safe fallback rather than an empty frame.
 */
export default async function Image({ params }: { params: Promise<{ season: string }> }) {
  const { season } = await params;
  const payload = buildWindowReceiptPayload(season) ?? buildTransfersHubPayload();

  return transferShareCard(
    {
      eyebrow: payload.eyebrow,
      headline: payload.headline,
      facts: payload.facts,
      coverageCue: payload.coverageCue,
      marker: payload.marker,
      lanes: payload.lanes,
      strip: trustStrip(),
    },
    immutableDataHeaders,
  );
}
