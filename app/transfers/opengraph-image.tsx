import { immutableDataHeaders } from "@/lib/cache";
import { localOgMedia, OG_CONTENT_TYPE, OG_SIZE, transferShareCard, trustStrip } from "@/lib/og-card";
import { buildTransfersHubPayload } from "@/lib/transferCardData";

export const dynamic = "force-dynamic";
export const alt = "Manchester United transfer history — Red Thread";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  const payload = buildTransfersHubPayload();
  const media = payload.mediaPlayerId
    ? await localOgMedia(`/media/players/${payload.mediaPlayerId}.webp`, { position: "50% 25%", treatment: "panel" })
    : undefined;

  return transferShareCard(
    {
      eyebrow: payload.eyebrow,
      headline: payload.headline,
      facts: payload.facts,
      coverageCue: payload.coverageCue,
      marker: payload.marker,
      lanes: payload.lanes,
      strip: trustStrip(),
      media,
    },
    immutableDataHeaders,
  );
}
