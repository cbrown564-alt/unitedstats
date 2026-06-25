import type { RoundParts } from "@/lib/format";

/**
 * Compact qualifier tag that rides alongside a round label, carrying the detail
 * {@link parseRound} strips out so labels stay short instead of truncating.
 *
 * Two-legged ties show the leg ordinal ("1st" / "2nd"); replays show "R" / "R2".
 * A small chip reads as a marker in one glance — no side-by-side comparison
 * needed — while the full original round stays on the row's own title for hover.
 */
export function RoundMark({ leg, replay }: Pick<RoundParts, "leg" | "replay">) {
  let text: string | null = null;
  let label: string | null = null;
  if (leg) {
    text = leg === 1 ? "1st" : "2nd";
    label = leg === 1 ? "First leg" : "Second leg";
  } else if (replay) {
    text = replay === 2 ? "R2" : "R";
    label = replay === 2 ? "Second replay" : "Replay";
  }
  if (!text) return null;
  return (
    <span
      className="stat-num shrink-0 rounded bg-panel-2 px-1 py-px text-[10px] font-semibold leading-none text-ink"
      title={label ?? undefined}
      aria-label={label ?? undefined}
    >
      {text}
    </span>
  );
}
