import { opponentById } from "@/lib/queries";
import { immutableDataHeaders } from "@/lib/cache";
import { OG_CONTENT_TYPE, OG_SIZE, entityCard, trustStrip } from "@/lib/og-card";

export const dynamic = "force-dynamic";
export const alt = "Manchester United head-to-head record — Red Thread";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const o = opponentById(id);
  const subtitle = o
    ? `${o.p.toLocaleString("en-GB")} meetings · ${Math.round((100 * o.w) / (o.p || 1))}% won`
    : "Ask a question, get a sourced answer.";
  return entityCard(
    {
      eyebrow: "HEAD TO HEAD",
      title: o ? `United v ${o.name}` : "Manchester United history, answered.",
      subtitle,
      strip: trustStrip(),
    },
    immutableDataHeaders,
  );
}
