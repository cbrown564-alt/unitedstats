import { collectionCard, OG_CONTENT_TYPE, OG_SIZE, trustStrip } from "@/lib/og-card";

export const dynamic = "force-static";
export const alt = "Manchester United match archive — Red Thread";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export default function Image() { return collectionCard({ eyebrow: "MATCH ARCHIVE", marker: "1886 TO TODAY", title: "Every match. One thread.", description: "Search the scores, scorers and turning points across United history.", strip: trustStrip() }); }
