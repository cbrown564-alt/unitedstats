import { managerById } from "@/lib/queries";
import { immutableDataHeaders } from "@/lib/cache";
import { OG_CONTENT_TYPE, OG_SIZE, entityCard, managerCard, trustStrip } from "@/lib/og-card";

export const dynamic = "force-dynamic";
export const alt = "Manchester United manager — Red Thread";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

const year = (d?: string | null) => (d ? d.slice(0, 4) : null);

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = managerById(id);
  if (!m || m.p === 0) {
    return entityCard(
      { eyebrow: "MANAGER", title: m?.name ?? "Manchester United history, answered.", subtitle: "Ask a question, get a sourced answer.", strip: trustStrip() },
      immutableDataHeaders,
    );
  }
  const from = year(m.first);
  const to = year(m.last);
  return managerCard(
    {
      name: m.name,
      role: m.role ?? "Manager",
      p: m.p,
      w: m.w,
      d: m.d,
      l: m.l,
      era: from && to ? `${from}–${to}` : undefined,
      strip: trustStrip(),
    },
    immutableDataHeaders,
  );
}
