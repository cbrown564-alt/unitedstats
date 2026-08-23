import { collectionCard, OG_CONTENT_TYPE, OG_SIZE, trustStrip } from "@/lib/og-card";

export const dynamic = "force-static";
export const alt = "Manchester United manager archive — Red Thread";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export default function Image() { return collectionCard({ eyebrow: "MANAGER ARCHIVE", marker: "REIGNS · RESULTS · SUCCESSION", title: "Every reign, in context.", description: "Compare the records behind United's managerial eras.", strip: trustStrip() }); }
