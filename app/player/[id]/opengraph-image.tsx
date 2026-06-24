import { playerById } from "@/lib/queries";
import { immutableDataHeaders } from "@/lib/cache";
import { OG_CONTENT_TYPE, OG_SIZE, entityCard, trustStrip } from "@/lib/og-card";

// On-demand + CDN-cached rather than ~1,000 images baked into every build.
export const dynamic = "force-dynamic";
export const alt = "Manchester United player — Red Thread";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = playerById(id);
  const subtitle = p
    ? `${p.goals.toLocaleString("en-GB")} goals · ${p.apps.toLocaleString("en-GB")} appearances`
    : "Ask a question, get a sourced answer.";
  return entityCard(
    {
      eyebrow: "PLAYER",
      title: p?.name ?? "Manchester United history, answered.",
      subtitle,
      strip: trustStrip(),
    },
    immutableDataHeaders,
  );
}
