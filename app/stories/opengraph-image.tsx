import { collectionCard, OG_CONTENT_TYPE, OG_SIZE, trustStrip } from "@/lib/og-card";

export const dynamic = "force-static";
export const alt = "Manchester United stories — Red Thread";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export default function Image() { return collectionCard({ eyebrow: "RED THREAD STORIES", marker: "FIVE EVIDENCED JOURNEYS", title: "History loops back.", description: "Authored stories where the match record reveals the rhyme.", strip: trustStrip() }); }
