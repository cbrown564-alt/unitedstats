import { managerById } from "@/lib/queries";
import { immutableDataHeaders } from "@/lib/cache";
import { OG_CONTENT_TYPE, OG_SIZE, entityCard, trustStrip } from "@/lib/og-card";

export const dynamic = "force-dynamic";
export const alt = "Manchester United manager — UnitedStats";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = managerById(id);
  const subtitle = m
    ? `${m.p.toLocaleString("en-GB")} matches · ${Math.round((100 * m.w) / (m.p || 1))}% won`
    : "Ask a question, get a sourced answer.";
  return entityCard(
    {
      eyebrow: (m?.role ?? "Manager").toUpperCase(),
      title: m?.name ?? "Manchester United history, answered.",
      subtitle,
      strip: trustStrip(),
    },
    immutableDataHeaders,
  );
}
