import Link from "next/link";
import { fmtDate } from "@/lib/format";
import type { AnnotatedLateGoal, LateGoalPoint } from "@/lib/trails";

const PAD_L = 44;
const PAD_R = 16;
const PAD_T = 24;
const PAD_B = 32;
const Y_MIN = 85;
const Y_MAX = 100;

function clockLabel(minute: number, added: number | null): string {
  if (minute === 90 && added != null && added > 0) return `90+${added}`;
  if (minute > 90) return `${minute}′`;
  return `${minute}′`;
}

function surname(name: string | null): string {
  if (!name) return "goal";
  const parts = name.replace(/^(Sir|Dr\.?|Mr\.?)\s+/, "").split(" ");
  return parts[parts.length - 1] ?? name;
}

function plotClock(clock: number): number {
  return Math.min(Y_MAX, Math.max(Y_MIN, clock));
}

/** Stable ±1 jitter from a key — same point always lands in the same place. */
function jitter01(key: string, salt: number): number {
  let h = salt;
  for (let i = 0; i < key.length; i++) h = (Math.imul(31, h) + key.charCodeAt(i)) | 0;
  return ((h >>> 0) % 1000) / 1000;
}

function jitterXY(key: string, ySpread: number, xSpread: number): { dx: number; dy: number } {
  return {
    dx: (jitter01(key, 1) - 0.5) * 2 * xSpread,
    dy: (jitter01(key, 2) - 0.5) * 2 * ySpread,
  };
}

export function LateGoalScatter({
  points,
  annotated,
  compact = false,
}: {
  points: LateGoalPoint[];
  annotated: AnnotatedLateGoal[];
  /** Explore signature — fewer labels, shorter height. */
  compact?: boolean;
}) {
  if (points.length === 0) return null;

  const dates = points.map((p) => Date.parse(p.date));
  const xMin = Math.min(...dates);
  const xMax = Math.max(...dates);
  const span = xMax - xMin || 1;

  const width = 1000;
  const plotH = compact ? 160 : 220;
  const height = PAD_T + plotH + PAD_B;

  const xFor = (date: string) => {
    const pad = 0.03;
    return PAD_L + (pad + ((Date.parse(date) - xMin) / span) * (1 - 2 * pad)) * (width - PAD_L - PAD_R);
  };

  const yFor = (clock: number) => {
    const c = plotClock(clock);
    const t = (c - Y_MIN) / (Y_MAX - Y_MIN);
    return PAD_T + plotH - t * plotH;
  };

  const y86 = yFor(86);
  const y90 = yFor(90);
  const fergX0 = xFor("1986-11-08");
  const fergX1 = xFor("2013-05-19");
  const yJitter = compact ? 4 : 5.5;
  const xJitter = compact ? 2.5 : 3.5;

  const annotatedKeys = new Set(
    annotated.map((a) => `${a.matchId}:${a.minute}:${a.added ?? 0}`),
  );

  const yearTicks = (() => {
    const start = Math.ceil(new Date(xMin).getFullYear() / 10) * 10;
    const end = new Date(xMax).getFullYear();
    const ticks: number[] = [];
    for (let y = start; y <= end; y += compact ? 20 : 10) ticks.push(y);
    return ticks;
  })();

  const positions = points.map((p) => {
    const key = `${p.matchId}:${p.minute}:${p.added ?? 0}`;
    const { dx, dy } = jitterXY(key, yJitter, xJitter);
    return {
      p,
      x: xFor(p.date) + dx,
      y: yFor(p.clock) + dy,
      key,
    };
  });

  const annPositions = annotated.map((a) => {
    const key = `${a.matchId}:${a.minute}:${a.added ?? 0}`;
    return {
      a,
      x: xFor(a.date),
      y: yFor(a.clock),
      key,
    };
  });

  return (
    <figure className="m-0">
      <div className="relative w-full" style={{ height }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-full w-full overflow-visible"
          role="img"
          aria-label={`${points.length} United goals after the 85th minute since ${new Date(xMin).getFullYear()}, with ${annotated.length} nights labelled`}
        >
          {/* Era and threshold guides — lines only, no fill */}
          <line
            x1={fergX0}
            x2={fergX0}
            y1={PAD_T}
            y2={PAD_T + plotH}
            stroke="var(--color-devil-bright)"
            strokeWidth={0.75}
            strokeDasharray="4 4"
            opacity={0.45}
          />
          <line
            x1={fergX1}
            x2={fergX1}
            y1={PAD_T}
            y2={PAD_T + plotH}
            stroke="var(--color-devil-bright)"
            strokeWidth={0.75}
            strokeDasharray="4 4"
            opacity={0.45}
          />
          <line
            x1={PAD_L}
            x2={width - PAD_R}
            y1={y90}
            y2={y90}
            stroke="var(--color-line)"
            strokeWidth={0.85}
            opacity={0.65}
          />
          <line
            x1={PAD_L}
            x2={width - PAD_R}
            y1={y86}
            y2={y86}
            stroke="var(--color-line)"
            strokeWidth={0.5}
            strokeDasharray="3 4"
            opacity={0.35}
          />

          {/* Y-axis ticks — clock-correct: 90+3 ≠ 90+6 */}
          {[86, 90, 93, 96, 99].map((tick) => {
            const y = yFor(tick);
            const label = tick === 90 ? "90′" : `${tick}′`;
            const isThreshold = tick === 90;
            return (
              <g key={tick}>
                {!isThreshold && (
                  <line
                    x1={PAD_L}
                    x2={width - PAD_R}
                    y1={y}
                    y2={y}
                    stroke="var(--color-line)"
                    strokeWidth={0.5}
                    strokeDasharray="3 3"
                    opacity={0.25}
                  />
                )}
                <text x={PAD_L - 8} y={y + 3} textAnchor="end" fill="var(--color-ink-faint)" style={{ fontSize: 10 }}>
                  {label}
                </text>
              </g>
            );
          })}

          {/* Scatter cloud */}
          {positions.map(({ p, x, y, key }) => {
            if (annotatedKeys.has(key)) return null;
            return (
              <circle
                key={key}
                cx={x}
                cy={y}
                r={2.2}
                fill={p.stoppage ? "var(--color-devil-bright)" : "var(--color-gold)"}
                opacity={0.22}
              >
                <title>{`${fmtDate(p.date)} ${clockLabel(p.minute, p.added)}${p.scorer ? ` ${p.scorer}` : ""} v ${p.opponent}`}</title>
              </circle>
            );
          })}

          {/* Annotated markers */}
          {annPositions.map(({ a, x, y }) => (
            <g key={`${a.matchId}:${a.minute}:${a.added ?? 0}`}>
              <circle
                cx={x}
                cy={y}
                r={compact ? 4.5 : 5.5}
                fill={a.stoppage ? "var(--color-devil-bright)" : "var(--color-gold)"}
                stroke="var(--color-panel)"
                strokeWidth={1.5}
              >
                <title>{`${a.tag} — ${fmtDate(a.date)} ${clockLabel(a.minute, a.added)} ${a.scorer ?? ""} v ${a.opponent}`}</title>
              </circle>
            </g>
          ))}

          {/* X-axis decades */}
          {yearTicks.map((year) => {
            const x = xFor(`${year}-07-01`);
            if (x < PAD_L || x > width - PAD_R) return null;
            return (
              <text key={year} x={x} y={height - 8} textAnchor="middle" fill="var(--color-ink-faint)" style={{ fontSize: 10 }}>
                {year}
              </text>
            );
          })}
        </svg>

        {!compact && (
          <div className="pointer-events-none absolute inset-0">
            {annPositions.map(({ a, x, y }, i) => {
              const leftPct = (x / width) * 100;
              const topPct = (y / height) * 100;
              const above = y < height * 0.38 || i % 2 === 0;
              return (
                <Link
                  key={`${a.matchId}:${a.minute}`}
                  href={`/match/${a.matchId}`}
                  className="pointer-events-auto absolute text-[10px] leading-tight transition-colors hover:text-devil-bright focus-ring"
                  style={{
                    left: `${leftPct}%`,
                    top: `${topPct}%`,
                    transform: `translate(-50%, ${above ? "-125%" : "75%"})`,
                  }}
                >
                  <span className={`block font-medium ${a.stoppage ? "text-devil-bright" : "text-gold"}`}>
                    {surname(a.scorer)}
                  </span>
                  <span className="stat-num block text-ink-faint">{clockLabel(a.minute, a.added)}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <figcaption className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-ink-faint">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-gold opacity-40" aria-hidden />
          {points.length} goals after 85′
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-gold" aria-hidden />
          86–90′
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-devil-bright" aria-hidden />
          Stoppage / extra time
        </span>
        {!compact && (
          <span className="text-ink-dim">
            Dashed verticals = Ferguson era · solid line = 90′ whistle · {annotated.length} nights labelled
          </span>
        )}
      </figcaption>
    </figure>
  );
}
