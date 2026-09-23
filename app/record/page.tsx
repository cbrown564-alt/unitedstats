import { Suspense } from "react";
import type { Metadata } from "next";
import { RecordClient } from "@/components/record/RecordClient";

export const metadata: Metadata = {
  title: "Archive record",
  description: "Inspect a Manchester United match, player, or opponent in the complete historical record.",
  robots: { index: false, follow: true },
};

export default function RecordPage() {
  return (
    <Suspense fallback={<p className="py-12 text-ink-dim">Opening the record…</p>}>
      <RecordClient />
    </Suspense>
  );
}
