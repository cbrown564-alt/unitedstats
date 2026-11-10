import type { EraFinish } from "@/lib/compare";
import { ChartInspector, type InspectPoint } from "./ChartInspector";
import { scale } from "./plot";

// Identity colours mirror the static signature and the career duel: side A is
// United red, side B a cool blue; gold is reserved for a title.
const A_COLOR = "var(--color-devil-bright)";
const B_COLOR = "var(--color-europe)";
const GOLD = "var(--color-gold)";
const RED = "var(--color-loss)";
const NEUTRAL = "var(--color-ink-dim)";

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

function SkylinePanel({
  finishes,
  label,
  sideColor,
}: {
  finishes: EraFinish[];
  label: string;
  sideColor: string;
}) {
  if (!finishes.length) return null;
  const titles = finishes.filter((f) => f.champion).length;
  const topPositions = finishes.filter((f) => f.topFlight && f.position != null).map((f) => f.position as number);
  const maxPos = Math.max(20, ...topPositions);
  // Inverted finish (1st ⇒ tallest); seasons outside the top flight become
  // stubs below the baseline, like the static skyline.
  const sy = scale([-3, maxPos], true);
  const zero = sy(0);
  const band = 100 / finishes.length;
  const gap = band * 0.1;

  const bars = finishes.map((f) => {
    const value = f.topFlight && f.position != null ? maxPos - f.position + 1 : -2;
    const color = value < 0
      ? RED
      : f.champion
        ? GOLD
        : f.topFlight && f.position != null && f.position >= maxPos - 2
          ? RED
          : NEUTRAL;
    return { f, value, color, opacity: value < 0 ? 0.8 : f.champion ? 1 : 0.85 };
  });

  const points: InspectPoint[] = finishes.map((f, i) => ({
    x: (i + 0.5) * band,
    x0: i * band,
    x1: (i + 1) * band,
    href: `/matches?season=${f.season}&sort=oldest`,
    tip: {
      title: f.season,
      value: f.champion ? "Champions" : f.topFlight ? (f.position != null ? ordinal(f.position) : "—") : "Outside the top flight",
      aside: f.ppg != null ? `${f.ppg.toFixed(2)} pts/game` : undefined,
    },
  }));

  const first = finishes[0].season.slice(5);
  const last = finishes[finishes.length - 1].season.slice(5);

  return (
    <div className="rounded-lg border border-line bg-pitch/40 p-3 sm:p-4">
      <div className="mb-1.5 flex items-baseline justify-between gap-2 text-xs">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[2px]" style={{ background: sideColor }} aria-hidden />
          <span className="font-medium text-ink">{label}</span>
        </span>
        <span className="text-ink-faint">
          <span className="stat-num text-gold">{titles}</span> {titles === 1 ? "title" : "titles"} ·{" "}
          <span className="stat-num text-ink-dim">{finishes.length}</span> seasons
        </span>
      </div>
      <div className="px-1 pt-2" style={{ height: 108 }}>
        <ChartInspector points={points} cursor="band" label={`League finishes, ${label}: ${titles} titles. Select a season to open its matches.`}>
          <div className="pointer-events-none absolute inset-x-0 border-t border-line" style={{ top: `${zero}%` }} aria-hidden />
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            {bars.map(({ f, value, color, opacity }, i) => {
              const top = sy(value);
              return (
                <div
                  key={f.season}
                  className={value < 0 ? "absolute" : "absolute rounded-t-[2px]"}
                  style={{
                    left: `${i * band + gap}%`,
                    width: `${band - gap * 2}%`,
                    top: `${Math.min(top, zero)}%`,
                    height: `${Math.abs(zero - top)}%`,
                    background: color,
                    opacity,
                  }}
                />
              );
            })}
          </div>
        </ChartInspector>
      </div>
      <div className="stat-num mt-1.5 flex justify-between px-1 text-[10px] text-ink-faint" aria-hidden>
        <span>&rsquo;{first}</span>
        <span>&rsquo;{last}</span>
      </div>
    </div>
  );
}

/**
 * Two eras as interactive league-finish skylines — titles in gold at the top,
 * mid-table neutral, relegation scrapes and seasons outside the top flight in
 * deep red. Each bar opens that season's matches.
 */
export function EraSkylineChart({
  a,
  b,
  labelA,
  labelB,
}: {
  a: EraFinish[];
  b: EraFinish[];
  labelA: string;
  labelB: string;
}) {
  return (
    <div className="w-full space-y-3">
      <SkylinePanel finishes={a} label={labelA} sideColor={A_COLOR} />
      <SkylinePanel finishes={b} label={labelB} sideColor={B_COLOR} />
      <p className="hidden text-center text-[11px] text-ink-faint pointer-coarse:block">Tap a bar to inspect · tap again to open</p>
      <p className="text-center text-[11px] text-ink-faint pointer-coarse:hidden">Click a bar to open that season&apos;s matches</p>
    </div>
  );
}
