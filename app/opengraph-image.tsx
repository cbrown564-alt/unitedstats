import { SITE_TAGLINE } from "@/lib/site";
import { collectionCard, OG_CONTENT_TYPE, OG_SIZE, trustStrip } from "@/lib/og-card";

export const alt = "Red Thread — the open evidence engine for Manchester United history";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return collectionCard({
    eyebrow: "MANCHESTER UNITED HISTORY",
    marker: "1886 TO TODAY · OPEN EVIDENCE",
    title: "Every match. One red thread.",
    description: `${SITE_TAGLINE} Ask a question, inspect the answer, follow the record.`,
    strip: trustStrip(),
  });
}
