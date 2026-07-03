import Link from "next/link";
import type { RediscoveryPrompt } from "@/lib/rediscovery";
import { promptDateLine } from "@/lib/rediscovery";

const EDGE: Record<string, string> = {
  W: "border-l-win/60",
  L: "border-l-loss/60",
  D: "border-l-draw/60",
};
const SCORE_TONE: Record<string, string> = {
  W: "text-win",
  L: "text-loss",
  D: "text-ink",
};

/**
 * "You might have forgotten…" — the Phase 3a entity-page rail. Surfaces the
 * highest-charge faded night from that season, opponent, or player history as a
 * recognition prompt, not a fixture row.
 */
export function RediscoveryRail({ prompt }: { prompt: RediscoveryPrompt }) {
  const edge =
    prompt.tone === "text-win" ? EDGE.W : prompt.tone === "text-loss" ? EDGE.L : EDGE.D;
  const scoreTone =
    prompt.tone === "text-win" ? SCORE_TONE.W : prompt.tone === "text-loss" ? SCORE_TONE.L : SCORE_TONE.D;

  return (
    <section className="rounded-xl border border-line bg-panel p-4 sm:p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-devil-bright/80">
        You might have forgotten…
      </p>
      <p className="mt-1 text-sm text-ink-dim">{prompt.prompt}</p>
      <Link
        href={prompt.href}
        className={`group mt-3 block rounded-lg border border-l-2 border-line bg-panel-2/40 px-4 py-3 transition-colors hover:border-devil/60 ${edge}`}
      >
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className={`stat-num text-2xl font-semibold ${scoreTone}`}>
            {prompt.score}
          </span>
          <span className="min-w-0 text-sm font-medium text-ink-dim group-hover:text-devil-bright sm:truncate" title={prompt.opponent}>
            {prompt.opponent}
          </span>
          {prompt.scoreSuffix ? <span className="text-xs text-ink-dim">{prompt.scoreSuffix}</span> : null}
        </div>
        <p className="mt-1 text-sm leading-relaxed text-ink">{prompt.line}</p>
        <p className="stat-num mt-1 text-xs text-ink-faint">{promptDateLine(prompt)}</p>
        <span className="mt-2 inline-block text-xs text-devil-bright">Open the match →</span>
      </Link>
    </section>
  );
}
