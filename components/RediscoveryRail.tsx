"use client";

import Link from "next/link";
import type { RediscoveryPrompt } from "@/lib/rediscovery-prompt";

const SCORE_TONE: Record<string, string> = {
  "text-win": "text-win",
  "text-loss": "text-loss",
  "text-draw": "text-ink",
};

/**
 * A single-line rediscovery hint — woven into entity pages, not a standalone card.
 * One scoreline, one opponent, one date; the whole row is the door.
 */
export function RediscoveryRail({ prompt }: { prompt: RediscoveryPrompt }) {
  if (prompt.reason === "a charged night") return null;
  const scoreTone = SCORE_TONE[prompt.tone] ?? "text-ink";

  return (
    <p className="text-sm leading-relaxed text-ink-dim">
      <span className="font-medium text-ink">{prompt.reason}</span>
      {" — "}
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
  );
}
