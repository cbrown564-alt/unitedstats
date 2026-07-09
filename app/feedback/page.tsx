import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { FeedbackFormEmbed } from "@/components/FeedbackFormEmbed";
import { FEEDBACK_FORM_CONFIGURED } from "@/lib/feedback";

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

type SP = Record<string, string | string[] | undefined>;

function readFromPath(sp: SP): string | null {
  const raw = sp.from;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default async function FeedbackPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const fromPath = readFromPath(sp);

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Feedback" title="Send feedback">
        Bug, confusing chart, missing feature, or just how the spark landed — tell us. For wrong scores or
        dates, use the{" "}
        <Link href="/corrections" className="font-semibold text-devil-bright hover:underline focus-ring">
          correction builder
        </Link>{" "}
        instead so we can track it against the record.
      </PageHeader>

      {fromPath && FEEDBACK_FORM_CONFIGURED && (
        <p className="rounded-lg border border-line/70 bg-panel px-4 py-3 text-sm text-ink-dim">
          Sending feedback about{" "}
          <code className="font-mono text-xs text-ink">{fromPath.startsWith("/") ? fromPath : `/${fromPath}`}</code>{" "}
          (
          <Link
            href={fromPath.startsWith("/") ? fromPath : `/${fromPath}`}
            className="text-devil-bright hover:underline focus-ring"
          >
            open page
          </Link>
          ).
        </p>
      )}

      <FeedbackFormEmbed fromPath={fromPath} />

      <footer className="border-t border-line/70 pt-4 text-sm text-ink-dim">
        Responses go straight to the site maintainer. We read everything, even if we cannot reply to every note.
      </footer>
    </div>
  );
}
