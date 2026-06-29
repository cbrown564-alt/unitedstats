import { seasonMatches } from "@/lib/queries";
import { immutableDataHeaders } from "@/lib/cache";
import { OG_CONTENT_TYPE, OG_SIZE, entityCard, seasonCard, trustStrip } from "@/lib/og-card";

export const dynamic = "force-dynamic";
export const alt = "Manchester United season — Red Thread";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ season: string }> }) {
  const { season } = await params;
  const matches = seasonMatches(season);
  if (matches.length === 0) {
    return entityCard(
      { eyebrow: "SEASON", title: "Manchester United history, answered.", subtitle: "Ask a question, get a sourced answer.", strip: trustStrip() },
      immutableDataHeaders,
    );
  }
  const results = matches.map((m) => m.result as "W" | "D" | "L");
  const w = results.filter((r) => r === "W").length;
  const d = results.filter((r) => r === "D").length;
  const l = results.filter((r) => r === "L").length;
  return seasonCard(
    {
      season,
      results,
      w,
      d,
      l,
      strip: trustStrip(),
    },
    immutableDataHeaders,
  );
}
