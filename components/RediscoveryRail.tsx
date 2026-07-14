"use client";

import Link from "next/link";
import type { RediscoveryPrompt } from "@/lib/rediscovery-prompt";
import { ThreadSignalKnot } from "@/components/ThreadSignalKnot";

const SCORE_TONE: Record<string, string> = {
  "text-win": "text-win",
  "text-loss": "text-loss",
  "text-draw": "text-ink",
};

/** A compact match door with an explicit reason for the editorial choice. */
export function RediscoveryRail({ prompt }: { prompt: RediscoveryPrompt }) {
  if (prompt.reason === "a charged night") return null;
  const scoreTone = SCORE_TONE[prompt.tone] ?? "text-ink";

  return (
    <div className="flex items-start gap-2 sm:items-center sm:gap-3">
      <ThreadSignalKnot />
      <p className="min-w-0 text-sm leading-relaxed text-ink-dim">
        <span className="font-medium text-ink">{prompt.reason}.</span>{" "}
        <Link
          href={prompt.href}
          className="group inline text-ink transition-colors hover:text-devil-bright focus-ring"
        >
          <span className={`stat-num font-semibold ${scoreTone}`}>{prompt.score}</span>
          {prompt.scoreSuffix ? (
            <span className="text-ink-faint"> {prompt.scoreSuffix}</span>
          ) : null}
          {" v "}
          <span className="font-medium">{prompt.opponent}</span>
          <span className="text-ink-faint">, {prompt.dateLine}</span>
          <span className="text-devil-bright" aria-hidden>
            {" "}
            →
          </span>
        </Link>
      </p>
    </div>
  );
}
