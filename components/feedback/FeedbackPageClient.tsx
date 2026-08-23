"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FeedbackFormEmbed } from "@/components/FeedbackFormEmbed";
import { FEEDBACK_FORM_CONFIGURED } from "@/lib/feedback";

function readFromPath(raw: string | null): string | null {
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export function FeedbackPageClient() {
  const fromPath = readFromPath(useSearchParams().get("from"));

  return (
    <>
      {fromPath && FEEDBACK_FORM_CONFIGURED && (
        <p className="rounded-lg border border-line/70 bg-panel px-4 py-3 text-sm text-ink-dim">
          Sending feedback about{" "}
          <code className="font-mono text-xs text-ink">{fromPath.startsWith("/") ? fromPath : `/${fromPath}`}</code> (
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
    </>
  );
}
