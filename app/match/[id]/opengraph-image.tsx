import { matchById } from "@/lib/queries";
import { immutableDataHeaders } from "@/lib/cache";
import { OG_CONTENT_TYPE, OG_SIZE, entityCard, trustStrip } from "@/lib/og-card";

// On-demand + CDN-cached rather than 6,000+ images baked into every build.
export const dynamic = "force-dynamic";
export const alt = "Manchester United match — Red Thread";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = matchById(id);
  if (!m) {
    return entityCard(
      { eyebrow: "MATCH", title: "Manchester United history, answered.", subtitle: "Ask a question, get a sourced answer.", strip: trustStrip() },
      immutableDataHeaders,
    );
  }
  const date = new Date(m.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  return entityCard(
    {
      eyebrow: "MATCH",
      title: `United ${m.gf}–${m.ga} ${m.opponent_name}`,
      subtitle: `${m.competition_name} · ${date}`,
      strip: trustStrip(),
    },
    immutableDataHeaders,
  );
}
