"use client";

import { useRef } from "react";

/**
 * Replays a match flow: the cord sews at match pace and each scorer lands as
 * the needle reaches them. A state change the reader asks for, never on load;
 * hidden under reduced motion, where the flow already shows its final frame.
 */
export function MatchFlowPlay() {
  const ref = useRef<HTMLButtonElement>(null);
  const play = () => {
    const host = ref.current?.closest(".mf");
    if (!(host instanceof HTMLElement)) return;
    host.classList.remove("mf-play");
    void host.offsetWidth; // restart the animation
    host.classList.add("mf-play");
  };
  return (
    <button
      ref={ref}
      type="button"
      onClick={play}
      className="cord-host focus-ring inline-flex items-center gap-2 rounded-full border border-line bg-panel-2 px-3 py-1 text-xs font-medium text-ink-dim transition-colors hover:border-devil-bright/50 hover:text-ink motion-reduce:hidden"
    >
      <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden className="text-devil-bright">
        <path d="M3 1.8L10 6L3 10.2Z" fill="currentColor" />
      </svg>
      Play the match
    </button>
  );
}
