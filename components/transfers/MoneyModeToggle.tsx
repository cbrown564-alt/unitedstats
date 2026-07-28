"use client";

import type { MoneyMode } from "@/lib/inflation";
import { moneyModeShort } from "@/lib/inflation";

const MODES: MoneyMode[] = ["nominal", "cpi", "football"];

/**
 * Inline money-mode switch — small text, active option underlined.
 * Nominal fees at the time, UK CPI-adjusted, or Sky-style PL football inflation.
 */
export function MoneyModeToggle({
  mode,
  onChange,
}: {
  mode: MoneyMode;
  onChange: (mode: MoneyMode) => void;
}) {
  return (
    <div
      className="shrink-0 text-[11px] leading-none text-ink-faint"
      role="radiogroup"
      aria-label="Show fees"
    >
      {MODES.map((m, i) => {
        const active = mode === m;
        const isFootball = m === "football";
        return (
          <span key={m}>
            {i > 0 && <span className="px-1 text-ink-faint/60">·</span>}
            <button
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(m)}
              className={`transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-devil-bright ${
                isFootball
                  ? active
                    ? "text-ink underline decoration-devil-bright underline-offset-[3px]"
                    : "text-ink-dim underline decoration-devil-bright/70 underline-offset-[3px] hover:text-ink hover:decoration-devil-bright"
                  : active
                    ? "text-ink underline decoration-ink/40 underline-offset-[3px]"
                    : "text-ink-dim hover:text-ink"
              }`}
            >
              {moneyModeShort(m)}
            </button>
          </span>
        );
      })}
    </div>
  );
}
