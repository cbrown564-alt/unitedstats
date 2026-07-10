import { familyName } from "@/lib/names";
import type { SubGoal } from "@/lib/journey";

export type BenchLatencyNight = {
  /** Short night label — "16 May · Spurs", "22 May · Newcastle", "26 May · Bayern". */
  label: string;
  /** Competition — Premier League / FA Cup / Champions League. */
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
const HALF_TIME = 45;
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

/** Clamp a mid-span anchor so edge labels don't clip the frame. */
function midAnchor(onPct: number, spanPct: number): number {
  return Math.min(Math.max(onPct + spanPct / 2, 8), 92);
}

/** Unified latency copy — "two minutes", "twelve minutes", never "12 min". */
function latencyWords(n: number): string {
  const WORDS = [
    "zero", "one", "two", "three", "four", "five", "six", "seven", "eight",
    "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen",
    "sixteen", "seventeen", "eighteen", "nineteen", "twenty",
  ];
  if (n <= 20) return `${WORDS[n]} minutes`;
  return `${n} minutes`;
}

/**
 * Journey-local composition for Treble beat 1 — the bench-latency rhyme
 * (docs/JOURNEY.md §4b). Three nights, each an on→score span read from
 * `subGoals()` and laid on a shared 90-minute axis. Grey = on; gold = scored.
 * Barcelona keeps both stoppage goals visible so the climax teamsheet still
 * has something left to prove.
 */
export function BenchLatency({ nights }: Props) {
  const pct = (m: number) => (m / AXIS_END) * 100;
  const halfTimePct = pct(HALF_TIME);
  const fullTimePct = pct(FULL_TIME);

  return (
    <div className="relative mx-auto w-full max-w-2xl px-2 sm:px-4">
      <ul className="flex flex-col gap-11 sm:gap-14">
        {nights.map((night) => {
          const twin = night.goals.length > 1;
          return (
            <li key={night.label} className="flex flex-col gap-3.5">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-faint">
                  {night.label}
                </p>
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-faint/70">
                  {night.place}
                </p>
              </div>

              <div className={`flex flex-col ${twin ? "gap-7" : "gap-4"}`}>
                {night.goals.map((g) => {
                  if (g.subOn == null) return null;
                  const onAx = axisMinute(g.subOn, null);
                  const scoredAx = axisMinute(g.minute, g.added);
                  const latency = scoredAx - onAx;
                  const onPct = pct(onAx);
                  const spanPct = pct(scoredAx) - onPct;
                  const mid = midAnchor(onPct, spanPct);
                  const tiny = latency <= 5;
                  const onLabel = `${g.subOn}′`;
                  const scoredLabel = `${clockLabel(g.minute, g.added)}′`;
                  const latencyCopy = latency > 0 ? latencyWords(latency) : null;

                  return (
                    <div
                      key={`${g.playerId}-${g.minute}-${g.added ?? 0}`}
                      className="relative"
                      style={{ minHeight: tiny ? "5rem" : "5.5rem" }}
                    >
                      {/* Clock range — sits clear above the knots. */}
                      <div className="relative h-4">
                        {tiny ? (
                          <span
                            className="absolute top-0 whitespace-nowrap stat-num text-[10px] font-semibold text-ink-dim sm:text-xs"
                            style={{ left: `${mid}%`, transform: "translateX(-50%)" }}
                          >
                            <span className="text-ink-faint">{onLabel}</span>
                            {" → "}
                            <span className="text-gold">{scoredLabel}</span>
                          </span>
                        ) : (
                          <>
                            <span
                              className="absolute top-0 stat-num text-[10px] font-semibold text-ink-faint sm:text-xs"
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
                      </div>

                      {/* Axis + span + knots — grey on, gold scored. */}
                      <div className="relative mt-2 h-5">
                        <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-ink-faint/15" aria-hidden />
                        {/* Half-time — quiet mid-pitch mark (Cole's entry reads against it). */}
                        <span
                          className="absolute top-1/2 h-2.5 w-px -translate-y-1/2 bg-ink-faint/25"
                          style={{ left: `${halfTimePct}%` }}
                          aria-hidden
                        />
                        <span
                          className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-ink-faint/35"
                          style={{ left: `${fullTimePct}%` }}
                          aria-hidden
                        />
                        <span
                          className="absolute top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-gradient-to-r from-ink-faint/50 to-gold/80"
                          style={{ left: `${onPct}%`, width: `${Math.max(spanPct, 0.4)}%` }}
                          aria-hidden
                        />
                        {/* Subbed-on — quiet grey knot. */}
                        <span
                          className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink-faint/70 ring-1 ring-ink-faint/40"
                          style={{ left: `${onPct}%` }}
                          aria-hidden
                        />
                        {/* Scored — gold payoff, the emphasis. */}
                        <span
                          className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold shadow-[0_0_16px_rgba(245,197,24,0.85)] ring-2 ring-gold/40"
                          style={{ left: `${pct(scoredAx)}%` }}
                          aria-hidden
                        />
                      </div>

                      {/* Latency + name — one column under the span midpoint. */}
                      <div
                        className="mt-3.5 flex flex-col items-center gap-1"
                        style={{
                          marginLeft: `${mid}%`,
                          transform: "translateX(-50%)",
                          width: "max-content",
                        }}
                      >
                        {latencyCopy && (
                          <span className="whitespace-nowrap text-[10px] font-medium uppercase tracking-[0.14em] text-ink-faint">
                            {latencyCopy}
                          </span>
                        )}
                        <span className="whitespace-nowrap text-xs font-medium text-ink-dim">
                          {familyName(g.name)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>

      {/* Axis caption — half and full time the spans are measured against. */}
      <div className="relative mt-5 h-4">
        <span className="absolute left-0 text-[10px] font-medium uppercase tracking-[0.14em] text-ink-faint/60">0′</span>
        <span
          className="absolute -translate-x-1/2 text-[10px] font-medium uppercase tracking-[0.14em] text-ink-faint/55"
          style={{ left: `${halfTimePct}%` }}
        >
          45′
        </span>
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
