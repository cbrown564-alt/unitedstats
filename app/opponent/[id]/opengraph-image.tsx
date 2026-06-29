import { opponentById } from "@/lib/queries";
import { immutableDataHeaders } from "@/lib/cache";
import { OG_CONTENT_TYPE, OG_SIZE, entityCard, opponentCard, trustStrip } from "@/lib/og-card";

export const dynamic = "force-dynamic";
export const alt = "Manchester United head-to-head record — Red Thread";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const o = opponentById(id);
  if (!o || o.p === 0) {
    return entityCard(
      { eyebrow: "HEAD TO HEAD", title: o ? `United v ${o.name}` : "Manchester United history, answered.", subtitle: "Ask a question, get a sourced answer.", strip: trustStrip() },
      immutableDataHeaders,
    );
  }
  const from = o.first ? o.first.slice(0, 4) : null;
  return opponentCard(
    {
      name: o.name,
      p: o.p,
      w: o.w,
      d: o.d,
      l: o.l,
      since: from ? `since ${from}` : undefined,
      strip: trustStrip(),
    },
    immutableDataHeaders,
  );
}
