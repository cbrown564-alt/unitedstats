import { collectionCard, OG_CONTENT_TYPE, OG_SIZE, trustStrip } from "@/lib/og-card";

export const dynamic = "force-static";
export const alt = "Manchester United season archive — Red Thread";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export default function Image() { return collectionCard({ eyebrow: "SEASON ARCHIVE", marker: "CAMPAIGNS · CUPS · FORM", title: "See the shape of a season.", description: "Read every campaign through its results, runs and defining nights.", strip: trustStrip() }); }
