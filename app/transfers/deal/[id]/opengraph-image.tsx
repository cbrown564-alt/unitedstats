import { immutableDataHeaders } from "@/lib/cache";
import { entityCard, localOgMedia, OG_CONTENT_TYPE, OG_SIZE, transferShareCard, trustStrip } from "@/lib/og-card";
import { buildDealReceiptPayload } from "@/lib/transferCardData";

export const dynamic = "force-dynamic";
export const alt = "Manchester United transfer receipt — Red Thread";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payload = buildDealReceiptPayload(id);
  if (!payload) {
    return entityCard(
      {
        eyebrow: "TRANSFER RECEIPT",
        title: "Manchester United transfer history, answered.",
        subtitle: "Every recorded signing and sale with coverage shown.",
        strip: trustStrip(),
      },
      immutableDataHeaders,
    );
  }

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
      strip: trustStrip(),
      media,
    },
    immutableDataHeaders,
  );
}
