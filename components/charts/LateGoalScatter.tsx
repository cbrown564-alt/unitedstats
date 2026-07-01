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

  const positions = points.map((p) => ({
    p,
    x: xFor(p.date),
    y: yFor(p.clock),
    key: `${p.matchId}:${p.minute}:${p.added ?? 0}`,
  }));

  const annPositions = annotated.map((a) => ({
    a,
    x: xFor(a.date),
    y: yFor(a.clock),
  }));

  return (
    <figure className="m-0">
      <div className="relative w-full" style={{ height }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-full w-full overflow-visible"
          role="img"
          aria-label={`${points.length} United goals after the 85th minute since ${new Date(xMin).getFullYear()}, with ${annotated.length} nights labelled`}
        >
          {/* Ferguson era band */}
          <rect
            x={fergX0}
            y={PAD_T}
            width={Math.max(0, fergX1 - fergX0)}
            height={plotH}
            fill="var(--color-devil-bright)"
            opacity={0.04}
          />

          {/* Regulation closing minutes */}
          <rect
            x={PAD_L}
            y={y86}
            width={width - PAD_L - PAD_R}
            height={y90 - y86}
            fill="var(--color-gold)"
            opacity={0.07}
          />
          {/* Stoppage / extra-time band */}
          <rect
            x={PAD_L}
            y={PAD_T}
            width={width - PAD_L - PAD_R}
            height={y90 - PAD_T}
            fill="var(--color-devil-bright)"
            opacity={0.05}
          />

          {/* Y-axis ticks — clock-correct: 90+3 ≠ 90+6 */}
          {[86, 90, 93, 96, 99].map((tick) => {
            const y = yFor(tick);
            const label =
              tick === 90 ? "90′" : tick > 90 ? `${tick}′` : `${tick}′`;
            return (
              <g key={tick}>
                <line
                  x1={PAD_L - 4}
                  x2={width - PAD_R}
                  y1={y}
                  y2={y}
                  stroke="var(--color-line)"
                  strokeWidth={0.5}
                  strokeDasharray={tick === 90 ? "none" : "3 3"}
                  opacity={0.45}
                />
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
            Shaded band = Ferguson era · {annotated.length} nights labelled
          </span>
        )}
      </figcaption>
    </figure>
  );
}
