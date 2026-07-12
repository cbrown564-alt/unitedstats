import { collectionCard, OG_CONTENT_TYPE, OG_SIZE, trustStrip } from "@/lib/og-card";

export const alt = "Red Thread open dataset and coverage ledger";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return collectionCard({ eyebrow: "OPEN DATA", marker: "COVERAGE · SOURCES · DOWNLOADS", title: "The record stays inspectable.", description: "See the gaps, trace the sources and download the match-level dataset.", strip: trustStrip() });
}
