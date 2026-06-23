import { immutableDataHeaders } from "@/lib/cache";
import { digestSummary, digestTitle, readHistoryDigest } from "@/lib/historyDigests";
import { OG_CONTENT_TYPE, OG_SIZE, entityCard, trustStrip } from "@/lib/og-card";

export const dynamic = "force-dynamic";
export const alt = "Manchester United history changed digest — UnitedStats";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const digest = readHistoryDigest(id);
  if (!digest) {
    return entityCard(
      { eyebrow: "HISTORY CHANGED", title: "Manchester United history, answered.", subtitle: "Ask a question, get a sourced answer.", strip: trustStrip() },
      immutableDataHeaders,
    );
  }
  return entityCard(
    {
      eyebrow: "HISTORY CHANGED",
      title: digestTitle(digest),
      subtitle: digestSummary(digest),
      strip: trustStrip(),
    },
    immutableDataHeaders,
  );
}

