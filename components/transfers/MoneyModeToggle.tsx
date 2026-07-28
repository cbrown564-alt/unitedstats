"use client";

import type { MoneyMode } from "@/lib/inflation";
import { moneyModeShort } from "@/lib/inflation";

const MODES: MoneyMode[] = ["nominal", "cpi", "football"];

/** Native radio group with full-size targets for the three historical fee views. */
export function MoneyModeToggle({
  mode,
  onChange,
}: {
  mode: MoneyMode;
  onChange: (mode: MoneyMode) => void;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="sr-only">Show transfer fees</legend>
      <div className="grid grid-cols-3 overflow-hidden rounded-lg border border-line bg-pitch/40">
        {MODES.map((m) => {
          const active = mode === m;
          return (
            <label
              key={m}
              className={`flex min-h-11 cursor-pointer items-center justify-center border-r border-line px-2 text-center text-xs font-medium leading-tight transition-colors last:border-r-0 has-[:focus-visible]:relative has-[:focus-visible]:z-10 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-[-2px] has-[:focus-visible]:outline-devil-bright sm:px-3 ${
                active ? "bg-panel-2 text-ink" : "text-ink-dim hover:bg-panel-2/70 hover:text-ink"
              }`}
            >
              <input
                type="radio"
                name="transfer-money-mode"
                value={m}
                checked={active}
                onChange={() => onChange(m)}
                className="sr-only"
              />
              <span>{moneyModeShort(m)}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
