"use client";

import { useEffect, useState } from "react";
import { familyName } from "@/lib/names";

export type StoppageEchoNight = {
  label: string;
  deficitAt: string;
  goals: { name: string; clock: string; absoluteMinute: number }[];
};

const CLOCK_START = 86;
const CLOCK_END = 97;
const CLOCK_RANGE = CLOCK_END - CLOCK_START;
const RUN_MS = 12_000;
const FINAL_HOLD_MS = 1_800;
const CYCLE_MS = RUN_MS + FINAL_HOLD_MS;

function clockFace(minute: number): string {
  return minute <= 90 ? `${minute}:00` : `90+${String(minute - 90).padStart(2, "0")}`;
}

function position(minute: number): string {
  return `${((minute - CLOCK_START) / CLOCK_RANGE) * 100}%`;
}

function goalPosition(minute: number): string {
  // Keep a 97th-minute strike off the score gutter while preserving its real
  // time for the countdown and score transition.
  return position(Math.min(minute, CLOCK_END - 0.9));
}

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

function FlapDigit({ value }: { value: "0" | "1" | "2" }) {
  const values = ["0", "1", "2"] as const;
  const index = values.indexOf(value);
  return (
    <span className="relative block h-9 w-[0.93em] overflow-hidden rounded-[2px] border border-line/90 bg-[#0b0c0f] shadow-[inset_0_1px_rgba(255,255,255,0.08),0_3px_9px_rgba(0,0,0,0.38)] sm:h-12">
      <span className="block transition-transform duration-[420ms] ease-[cubic-bezier(0.22,0.8,0.22,1)]" style={{ transform: `translateY(-${index * (100 / values.length)}%)` }}>
        {values.map((digit) => <span key={digit} className="relative left-[-0.045em] flex h-9 items-center justify-center sm:h-12">{digit}</span>)}
      </span>
      <span className="pointer-events-none absolute inset-x-0 top-1/2 z-10 h-px bg-black/90 shadow-[0_1px_rgba(255,255,255,0.08)]" />
    </span>
  );
}

function FlipScore({ state }: { state: "0–1" | "1–1" | "2–1" }) {
  return (
    <div className="flex items-center justify-end gap-[0.08em] text-[1.8rem] font-bold leading-none tracking-[-0.08em] text-current sm:text-[2.6rem]" aria-label={state}>
      <FlapDigit value={state[0] as "0" | "1" | "2"} />
      <span className="text-ink-faint">–</span>
      <FlapDigit value="1" />
    </div>
  );
}

/**
 * The three games live on one clock. The scorelines are not small match charts:
 * they are three separate shocks landing in the same final eleven minutes.
 */
export function StoppageEcho({ nights }: { nights: StoppageEchoNight[] }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) {
      const frame = window.requestAnimationFrame(() => setElapsed(RUN_MS));
      return () => window.cancelAnimationFrame(frame);
    }
    let frame = 0;
    const startedAt = performance.now();
    const animate = (now: number) => {
      setElapsed((now - startedAt) % CYCLE_MS);
      frame = window.requestAnimationFrame(animate);
    };
    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const sweep = Math.min(1, elapsed / RUN_MS);
  const clockMinute = Math.min(CLOCK_END, CLOCK_START + Math.floor(sweep * CLOCK_RANGE));
  const clockPosition = sweep * 100;

  return (
    <figure className="m-0 overflow-hidden border border-line/80 bg-[#090b11] shadow-[0_24px_90px_rgba(0,0,0,0.42)]">
      <div className="relative isolate overflow-hidden px-4 py-6 sm:px-8 sm:py-9">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(72%_115%_at_50%_110%,rgba(216,33,13,0.2),transparent_64%),linear-gradient(115deg,#0c1f31_0%,#101827_53%,#170d10_100%)]" />
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-30 [background-image:repeating-linear-gradient(90deg,transparent_0,transparent_calc(9.09%-1px),rgba(231,240,249,0.18)_calc(9.09%-1px),rgba(231,240,249,0.18)_9.09%)]" />

        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line/80 pb-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-devil-bright">One shared countdown</p>
            <h3 className="mt-2 text-xl font-semibold tracking-tight text-ink sm:text-2xl">Eleven minutes. Six strikes. No release.</h3>
          </div>
          <div className="min-w-28 border-l-2 border-devil-bright pl-3 text-right sm:min-w-36">
            <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-ink-faint">Live clock</p>
            <p className="stat-num mt-1 text-3xl font-bold leading-none tracking-[-0.07em] text-ink sm:text-4xl">{clockFace(clockMinute)}</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-[5.25rem_minmax(0,1fr)_4.1rem] items-end gap-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-ink-faint sm:grid-cols-[10.5rem_minmax(0,1fr)_5.25rem] sm:gap-4 sm:text-[10px]">
          <span>Match</span>
          <div className="relative h-5">
            {[86, 88, 90, 93, 97].map((mark) => (
              <span key={mark} className={`absolute bottom-0 -translate-x-1/2 ${mark === 97 ? "hidden sm:block" : ""}`} style={{ left: position(mark) }}>{mark <= 90 ? `${mark}′` : `90+${mark - 90}`}</span>
            ))}
          </div>
          <span className="text-right">Score</span>
        </div>

        <div className="mt-2 divide-y divide-line/70 border-y border-line/70">
          {nights.map((night) => {
            const [first, second] = night.goals;
            if (!first || !second) return null;
            const firstAt = (first.absoluteMinute - CLOCK_START) / CLOCK_RANGE;
            const secondAt = (second.absoluteMinute - CLOCK_START) / CLOCK_RANGE;
            const firstHit = firstAt === 1 ? sweep === 1 : sweep >= firstAt + 0.022;
            const secondHit = secondAt === 1 ? sweep === 1 : sweep >= secondAt + 0.022;
            const state = secondHit ? "2–1" : firstHit ? "1–1" : "0–1";

            return (
              <article key={night.label} className="grid grid-cols-[5.25rem_minmax(0,1fr)_4.1rem] items-center gap-2 py-5 sm:grid-cols-[10.5rem_minmax(0,1fr)_5.25rem] sm:gap-4 sm:py-6">
                <div>
                  <p className="stat-num text-[10px] font-bold tracking-[0.2em] text-devil-bright sm:text-[11px]">{night.label.slice(0, 4)}</p>
                  <p className="mt-1 text-[11px] font-semibold leading-tight text-ink sm:text-sm">{night.label.slice(7)}</p>
                  <p className="mt-1 hidden text-[11px] text-ink-faint sm:block">{night.deficitAt}</p>
                </div>

                <div className="relative h-16 overflow-visible sm:h-[4.5rem]" aria-label={`${night.label}: ${state} at ${clockFace(clockMinute)}`}>
                  <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-line" />
                  <div className="absolute bottom-0 top-0 w-px -translate-x-1/2 bg-gold/35 shadow-[0_0_22px_rgba(245,197,24,0.2)]" style={{ left: position(90) }} aria-hidden />
                  <div className="absolute left-0 top-1/2 h-[3px] -translate-y-1/2 bg-devil-bright shadow-[0_0_18px_rgba(255,59,31,0.8)]" style={{ width: `${clockPosition}%` }} />
                  <div className="absolute top-1/2 h-9 w-px -translate-x-1/2 -translate-y-1/2 bg-ink shadow-[0_0_18px_rgba(255,255,255,0.8)]" style={{ left: `${clockPosition}%` }} />

                  {[first, second].map((goal, index) => {
                    const eventAt = (goal.absoluteMinute - CLOCK_START) / CLOCK_RANGE;
                    const reveal = eventAt === 1
                      ? (sweep === 1 ? 1 : 0)
                      : clamp((sweep - eventAt) / 0.025);
                    const hit = reveal === 1;
                    const final = index === 1;
                    const flash = sweep < eventAt ? 0 : clamp(1 - (sweep - eventAt) / 0.075);
                    const glow = final ? "245,197,24" : "245,242,238";
                    return (
                      <div key={`${goal.name}-${goal.clock}`} className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: goalPosition(goal.absoluteMinute) }}>
                        <div
                          className={`grid h-8 w-8 place-items-center rounded-sm border text-[10px] font-bold transition-[transform,opacity,box-shadow] duration-300 sm:h-10 sm:w-10 sm:text-xs ${hit ? (final ? "border-gold bg-gold text-pitch" : "border-[#f5f2ee] bg-[#f5f2ee] text-pitch") : "border-line bg-pitch text-ink-faint"}`}
                          style={{
                            opacity: 0.34 + reveal * 0.66,
                            transform: `scale(${0.76 + reveal * 0.24})`,
                            boxShadow: `0 0 ${4 + flash * 28}px rgba(${glow},${0.12 + flash * 0.62})`,
                          }}
                        >
                          {final ? "2–1" : "1–1"}
                        </div>
                        <div className="absolute left-1/2 mt-2 w-max -translate-x-1/2 text-center" style={{ opacity: 0.3 + reveal * 0.7 }}>
                          <p className="hidden text-[10px] font-semibold text-ink sm:block sm:text-[11px]">{familyName(goal.name)}</p>
                          <p className="stat-num mt-0.5 text-[10px] font-bold text-gold">{goal.clock}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className={secondHit ? "text-gold" : firstHit ? "text-ink" : "text-ink-dim"}><FlipScore state={state} /></div>
              </article>
            );
          })}
        </div>

        <p className="mt-12 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-faint sm:mt-14">The same clock keeps finding a way to 2–1.</p>
      </div>
      <figcaption className="border-t border-line/60 bg-pitch/55 px-4 py-3 text-center text-xs text-ink-dim">The rail runs from Bruce at 86′ to McTominay at 90+7′. Each block is a goal, not an estimate.</figcaption>
    </figure>
  );
}
