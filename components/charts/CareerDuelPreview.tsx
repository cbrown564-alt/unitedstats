import type { CareerChartMetric, CareerSeason } from "@/lib/compare";
import { fmtAxisNumber } from "@/lib/format";

// Identity colours mirror the full compare scoreboard: side A is United red,
// side B a cool blue — warm vs cool so the pair is always separable.
const A_COLOR = "var(--color-devil-bright)";
const B_COLOR = "var(--color-europe)";

const PAD_L = 44;
const PAD_R = 16;
const PAD_T = 20;
const PAD_B = 36;

function Swatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-[2px]" style={{ background: color }} aria-hidden />
      <span className="font-medium text-ink">{label}</span>
    </span>
  );
}

function seasonValue(s: CareerSeason, chart: CareerChartMetric): number {
  return chart === "cleanSheets" ? s.cleanSheets : s.goals;
}

function peakSeason(seasons: CareerSeason[], chart: CareerChartMetric): CareerSeason | null {
  if (!seasons.length) return null;
  return seasons.reduce((m, s) => (seasonValue(s, chart) > seasonValue(m, chart) ? s : m), seasons[0]);
}

function chartCopy(chart: CareerChartMetric) {
  if (chart === "cleanSheets") {
    return {
      title: "Clean sheets per season",
      yAxis: "Clean sheets",
      aria: "Clean sheets per season",
      suffix: "",
    };
  }
  return {
    title: "Goals per season",
    yAxis: "Goals",
    aria: "Goals per season",
    suffix: "",
  };
}

/** Monotone cubic Hermite through discrete season points — the same smooth read
 *  as the interactive Recharts curve, without a client bundle. */
function monotonePath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  const n = points.length;
  const dys: number[] = [];
  const dxs: number[] = [];
  const ms: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const dx = points[i + 1].x - points[i].x;
    const dy = points[i + 1].y - points[i].y;
    dxs.push(dx);
    dys.push(dy);
    ms.push(dy / (dx || 1));
  }
  const tangents = [ms[0]];
  for (let i = 1; i < n - 1; i++) {
    const m0 = ms[i - 1];
    const m1 = ms[i];
    tangents.push(m0 * m1 <= 0 ? 0 : (m0 + m1) / 2);
  }
  tangents.push(ms[n - 2]);

  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const dx = dxs[i] / 3;
    const cp1x = p0.x + dx;
    const cp1y = p0.y + tangents[i] * dx;
    const cp2x = p1.x - dx;
    const cp2y = p1.y - tangents[i + 1] * dx;
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
  }
  return d;
}

function Series({
  seasons,
  color,
  gid,
  xOf,
  yOf,
  baseY,
  chart,
}: {
  seasons: CareerSeason[];
  color: string;
  gid: string;
  xOf: (n: number) => number;
  yOf: (v: number) => number;
  baseY: number;
  chart: CareerChartMetric;
}) {
  if (!seasons.length) return null;
  const pts = seasons.map((s) => ({ x: xOf(s.n), y: yOf(seasonValue(s, chart)) }));
  const line = monotonePath(pts);
  const area = `${line} L ${xOf(seasons[seasons.length - 1].n).toFixed(1)} ${baseY.toFixed(1)} L ${xOf(seasons[0].n).toFixed(1)} ${baseY.toFixed(1)} Z`;
  const peak = peakSeason(seasons, chart);
  const peakVal = peak ? seasonValue(peak, chart) : 0;

  return (
    <g>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2.25" strokeLinejoin="round" strokeLinecap="round" />
      {peak && peakVal > 0 && (
        <>
          <circle
            cx={xOf(peak.n)}
            cy={yOf(peakVal)}
            r="4.5"
            fill={color}
            stroke="var(--color-panel)"
            strokeWidth="1.5"
          />
          <text
            x={xOf(peak.n)}
            y={yOf(peakVal) - 8}
            textAnchor="middle"
            className="fill-ink"
            style={{ fontSize: 11, fontWeight: 600 }}
          >
            {peakVal}
          </text>
        </>
      )}
    </g>
  );
}

/**
 * Static career-arc duel for Explore preview slides — the same story as
 * CareerDuelChart (shared career-season axis, peak markers, identity colours)
 * without a client chart bundle or hydration flash.
 */
export function CareerDuelPreview({
  a,
  b,
  labelA,
  labelB,
  chart = "goals",
  compact = false,
}: {
  a: CareerSeason[];
  b: CareerSeason[];
  labelA: string;
  labelB: string;
  chart?: CareerChartMetric;
  /** Explore signature — shorter plot, fewer axis ticks. */
  compact?: boolean;
}) {
  const width = 1000;
  const plotH = compact ? 168 : 210;
  const height = PAD_T + plotH + PAD_B;
  const maxN = Math.max(a.at(-1)?.n ?? 1, b.at(-1)?.n ?? 1, 1);
  const maxVal = Math.max(
    1,
    ...a.map((s) => seasonValue(s, chart)),
    ...b.map((s) => seasonValue(s, chart)),
  );
  const plotW = width - PAD_L - PAD_R;
  const baseY = PAD_T + plotH;
  const xOf = (n: number) => PAD_L + (maxN <= 1 ? 0 : (n - 1) / (maxN - 1)) * plotW;
  const yOf = (v: number) => PAD_T + (1 - v / maxVal) * plotH;
  const labels = chartCopy(chart);
  const yTicks = compact ? [0, maxVal] : [0, Math.round(maxVal / 2), maxVal].filter((v, i, arr) => arr.indexOf(v) === i);

  return (
    <figure className="rounded-lg border border-line bg-pitch/40 p-3 sm:p-4">
      <figcaption className="mb-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-ink-dim">
        <span className="font-semibold uppercase tracking-[0.12em] text-ink-faint">{labels.title}</span>
        <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="inline-flex items-center gap-1.5">
            <Swatch color={A_COLOR} label={labelA} />
            <span className="stat-num text-ink-faint">· {a.length} seasons</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Swatch color={B_COLOR} label={labelB} />
            <span className="stat-num text-ink-faint">· {b.length} seasons</span>
          </span>
        </span>
      </figcaption>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label={`${labels.aria}: ${labelA} vs ${labelB}`}
      >
        <defs>
          <linearGradient id="duelPreviewA" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={A_COLOR} stopOpacity="0.28" />
            <stop offset="100%" stopColor={A_COLOR} stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="duelPreviewB" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={B_COLOR} stopOpacity="0.24" />
            <stop offset="100%" stopColor={B_COLOR} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {yTicks.map((tick) => {
          const y = yOf(tick);
          return (
            <g key={tick}>
              <line x1={PAD_L} y1={y} x2={width - PAD_R} y2={y} stroke="var(--color-line)" strokeOpacity="0.65" strokeDasharray={tick === maxVal ? "2 4" : undefined} />
              <text x={PAD_L - 8} y={y + 4} textAnchor="end" className="fill-ink-faint" style={{ fontSize: 10 }}>
                {fmtAxisNumber(tick, "")}
              </text>
            </g>
          );
        })}

        <line x1={PAD_L} y1={baseY} x2={width - PAD_R} y2={baseY} stroke="var(--color-line)" />

        <Series seasons={a} color={A_COLOR} gid="duelPreviewA" xOf={xOf} yOf={yOf} baseY={baseY} chart={chart} />
        <Series seasons={b} color={B_COLOR} gid="duelPreviewB" xOf={xOf} yOf={yOf} baseY={baseY} chart={chart} />

        <text x={PAD_L} y={height - 8} textAnchor="start" className="fill-ink-faint" style={{ fontSize: 10 }}>
          Season 1
        </text>
        <text x={width - PAD_R} y={height - 8} textAnchor="end" className="fill-ink-faint" style={{ fontSize: 10 }}>
          {maxN}
        </text>
        <text
          x={(PAD_L + width - PAD_R) / 2}
          y={height - 8}
          textAnchor="middle"
          className="fill-ink-faint"
          style={{ fontSize: 10 }}
        >
          Career season
        </text>
      </svg>
    </figure>
  );
}
