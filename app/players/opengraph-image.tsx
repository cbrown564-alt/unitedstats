import { collectionCard, OG_CONTENT_TYPE, OG_SIZE, trustStrip } from "@/lib/og-card";
export const alt = "Manchester United player archive — Red Thread";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export default function Image() { return collectionCard({ eyebrow: "PLAYER ARCHIVE", marker: "CAREERS · GOALS · APPEARANCES", title: "Every player leaves a line.", description: "Follow a United career through the complete match record.", strip: trustStrip() }); }
