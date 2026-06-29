import { playerById } from "@/lib/queries";
import { immutableDataHeaders } from "@/lib/cache";
import { OG_CONTENT_TYPE, OG_SIZE, entityCard, playerCard, trustStrip } from "@/lib/og-card";

// On-demand + CDN-cached rather than ~1,000 images baked into every build.
export const dynamic = "force-dynamic";
export const alt = "Manchester United player — Red Thread";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

const yearOf = (n: number | null, date: string | null) =>
  n ?? (date ? Number(date.slice(0, 4)) : null);

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = playerById(id);
  const firstYear = p ? yearOf(p.first_year, p.first_date) : null;
  const lastYear = p ? yearOf(p.last_year, p.last_date) : null;

  // The career-span shape needs years; without them, fall back to the text card.
  if (!p || firstYear == null || lastYear == null) {
    return entityCard(
      {
        eyebrow: "PLAYER",
        title: p?.name ?? "Manchester United history, answered.",
        subtitle: p ? `${p.goals.toLocaleString("en-GB")} goals · ${p.apps.toLocaleString("en-GB")} appearances` : "Ask a question, get a sourced answer.",
        strip: trustStrip(),
      },
      immutableDataHeaders,
    );
  }

  return playerCard(
    {
      name: p.name,
      position: p.position_label ?? undefined,
      goals: p.goals,
      apps: p.apps,
      firstYear,
      lastYear,
      strip: trustStrip(),
    },
    immutableDataHeaders,
  );
}
