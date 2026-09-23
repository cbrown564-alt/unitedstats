import type { Metadata } from "next";
import { RecordClient } from "@/components/record/RecordClient";

export const metadata: Metadata = {
  title: "Archive record",
  description: "Inspect a Manchester United match, player, or opponent in the complete historical record.",
  robots: { index: false, follow: true },
};

export default function RecordPage() {
  return <RecordClient />;
}
