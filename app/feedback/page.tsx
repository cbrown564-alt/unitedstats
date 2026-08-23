import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { FeedbackPageClient } from "@/components/feedback/FeedbackPageClient";

const FEEDBACK_DESCRIPTION =
  "Bug, confusing chart, missing feature, or how the spark landed — send general feedback about Red Thread.";

export const metadata: Metadata = {
  title: "Send feedback",
  description: FEEDBACK_DESCRIPTION,
  alternates: { canonical: "/feedback" },
  openGraph: {
    type: "website",
    title: "Send feedback · Red Thread",
    description: FEEDBACK_DESCRIPTION,
    url: "/feedback",
  },
  twitter: { card: "summary_large_image", title: "Send feedback", description: FEEDBACK_DESCRIPTION },
};

export default function FeedbackPage() {
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Feedback" title="Send feedback">
        Bug, confusing chart, missing feature, or just how the spark landed — tell us. For wrong scores or dates, use
        the{" "}
        <Link href="/corrections" className="font-semibold text-devil-bright hover:underline focus-ring">
          correction builder
        </Link>{" "}
        instead so we can track it against the record.
      </PageHeader>

      <Suspense fallback={null}>
        <FeedbackPageClient />
      </Suspense>

      <footer className="border-t border-line/70 pt-4 text-sm text-ink-dim">
        Responses go straight to the site maintainer. We read everything, even if we cannot reply to every note.
      </footer>
    </div>
  );
}
