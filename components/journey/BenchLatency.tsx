import { familyName } from "@/lib/names";
import type { SubGoal } from "@/lib/journey";

export type BenchLatencyNight = {
  /** Short night label — "16 May · Spurs", "22 May · Newcastle", "26 May · Bayern". */
  label: string;
  /** Ground — Old Trafford / Wembley / Camp Nou. */
  place: string;
  goals: SubGoal[];
};

type Props = {
  nights: BenchLatencyNight[];
};

/**
 * Match-clock axis: 0 → 90, with stoppage goals carried past full time
 * (`minute === 90 && added > 0` → `90 + added`, the same convention MatchFlow
 * and goalClock use). The three nights share one scale so the on→score spans
 * read at their true position and length — Cole's 46′→48′ and Sheringham's
 * 9′→11′ are both two-minute wonders, but at opposite ends of the pitch; the
 * Barcelona pair runs visibly across full time. That contrast is the beat.
 */
const FULL_TIME = 90;
/** Pad past the latest stoppage goal so its knot isn't pinned to the edge. */
const AXIS_END = 96;

/** Stoppage clocks onto the axis: 90+1 → 91, 90+3 → 93. */
function axisMinute(minute: number, added: number | null): number {
  if (minute === FULL_TIME && added != null && added > 0) return FULL_TIME + added;
  return minute;
}

/** Goal clock as the receipts print it — stoppage stays "90+1". */
function clockLabel(minute: number, added: number | null): string {
  return added ? `${minute}+${added}` : `${minute}`;
}

/**
 * Journey-local composition for Treble beat 1 — the bench-latency rhyme
 * (docs/JOURNEY.md §4b). Three nights, each an on→score span read from
 * `subGoals()` and laid on a shared 90-minute axis. Not a general-purpose
 * chart; gold knots + devil-bright thread language from the stage. Barcelona
 * keeps both stoppage goals visible so the climax teamsheet still has
 * something left to prove.
 */
export function BenchLatency({ nights }: Props) {
  const pct = (m: number) => (m / AXIS_END) * 100;
  const fullTimePct = pct(FULL_TIME);

  return (
    <div className="relative mx-auto w-full max-w-2xl px-2 sm:px-4">
      <ul className="flex flex-col gap-10 sm:gap-14">
        {nights.map((night) => {
          const twin = night.goals.length > 1;
          return (
            <li key={night.label} className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-faint">
                  {night.label}
                </p>
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-faint/70">
                  {night.place}
                </p>
              </div>

              <div className={`flex flex-col ${twin ? "gap-5" : "gap-3"}`}>
                {night.goals.map((g, i) => {
                  if (g.subOn == null) return null;
                  const onAx = axisMinute(g.subOn, null);
                  const scoredAx = axisMinute(g.minute, g.added);
                  const latency = scoredAx - onAx;
                  const onPct = pct(onAx);
                  const spanPct = pct(scoredAx) - onPct;
                  const tiny = latency <= 5;
                  const onLabel = `${g.subOn}′`;
                  const scoredLabel = `${clockLabel(g.minute, g.added)}′`;

                  return (
                    <div key={`${g.playerId}-${g.minute}-${g.added ?? 0}`} className="flex flex-col gap-1.5">
                      <div className="relative flex h-10 items-center">
                        {/* The 90-minute baseline with a full-time tick — goals
                            past it read as "after the whistle". */}
                        <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-ink-faint/15" />
                        <span
                          className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-ink-faint/30"
                          style={{ left: `${fullTimePct}%` }}
                          aria-hidden
                        />

                        {/* The on→score span — its width IS the latency. */}
                        <span
                          className="absolute top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-devil-bright/70"
                          style={{ left: `${onPct}%`, width: `${spanPct}%` }}
                          aria-hidden
                        />

                        {/* Subbed-on knot */}
                        <span
                          className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold shadow-[0_0_10px_rgba(245,197,24,0.55)]"
                          style={{ left: `${onPct}%` }}
                          aria-hidden
                        />
                        {/* Scored knot — slightly larger, the payoff. */}
                        <span
                          className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold shadow-[0_0_12px_rgba(245,197,24,0.7)] ring-2 ring-gold/25"
                          style={{ left: `${pct(scoredAx)}%` }}
                          aria-hidden
                        />

                        {tiny ? (
                          /* One tight cluster — a single range label above it, so
                             the two knots read as a pair without their clocks
                             colliding. The latency rides just under the thread. */
                          <span
                            className="absolute top-0 whitespace-nowrap stat-num text-[10px] font-semibold text-ink-dim sm:text-xs"
                            style={{
                              left: `${Math.min(Math.max(onPct + spanPct / 2, 8), 92)}%`,
                              transform: "translateX(-50%)",
                            }}
                          >
                            {onLabel} → <span className="text-gold">{scoredLabel}</span>
                          </span>
                        ) : (
                          <>
                            <span
                              className="absolute top-0 stat-num text-[10px] font-semibold text-ink-dim sm:text-xs"
                              style={{
                                left: `${Math.min(Math.max(onPct, 4), 96)}%`,
                                transform: onPct > 88 ? "translateX(-100%)" : "translateX(-50%)",
                              }}
                            >
                              {onLabel}
                            </span>
                            <span
                              className="absolute top-0 stat-num text-[10px] font-semibold text-gold sm:text-xs"
                              style={{
                                left: `${Math.min(pct(scoredAx), 96)}%`,
                                transform: pct(scoredAx) > 88 ? "translateX(-100%)" : "translateX(-50%)",
                              }}
                            >
                              {scoredLabel}
                            </span>
                          </>
                        )}

                        {/* Latency — the beat's own measure. Tight spans sit it on
                            the thread; long spans lift it above so the thread reads. */}
                        {latency > 0 && (
                          <span
                            className="absolute bottom-0.5 whitespace-nowrap text-[10px] font-medium uppercase tracking-[0.14em] text-ink-faint"
                            style={{
                              left: `${Math.min(Math.max(onPct + spanPct / 2, 6), 94)}%`,
                              transform: "translateX(-50%)",
                            }}
                          >
                            {tiny
                              ? latency === 2
                                ? "two minutes"
                                : `${latency}′`
                              : `${latency} min`}
                          </span>
                        )}
                      </div>

                      <p className="text-center text-xs text-ink-dim">
                        {familyName(g.name)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>

      {/* Axis caption — the 90′ the spans are measured against. */}
      <div className="relative mt-4 h-4">
        <span className="absolute left-0 text-[10px] font-medium uppercase tracking-[0.14em] text-ink-faint/60">0′</span>
        <span
          className="absolute -translate-x-1/2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint"
          style={{ left: `${fullTimePct}%` }}
        >
          90′
        </span>
      </div>
    </div>
  );
}
