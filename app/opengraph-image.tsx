import { SITE_TAGLINE } from "@/lib/site";
import { OG_CONTENT_TYPE, OG_SIZE, evidenceCard, trustStrip } from "@/lib/og-card";

export const alt = "UnitedStats — the open evidence engine for Manchester United history";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return evidenceCard({
    question: "Manchester United history, answered.",
    summary: `${SITE_TAGLINE} — ask a question, get a sourced answer, and every match behind it.`,
    strip: trustStrip(),
  });
}
