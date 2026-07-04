import Link from "next/link";
import type { RediscoveryPrompt } from "@/lib/rediscovery";
import { promptDateLine } from "@/lib/rediscovery";

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
  const scoreTone = SCORE_TONE[prompt.tone] ?? "text-ink";

  return (
    <p className="text-sm leading-relaxed text-ink-dim">
      <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-faint">
        Remember this?
      </span>
      {" · "}
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
        <span className="text-ink-faint"> · {promptDateLine(prompt)}</span>
        <span className="text-devil-bright" aria-hidden>
          {" "}
          →
        </span>
      </Link>
    </p>
  );
}
