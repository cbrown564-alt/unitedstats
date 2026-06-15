/** Shared chart data contracts plus lightweight server-rendered SVG fallbacks. */

export type ChartDatum = {
  x: number;
  y: number;
  label: string;
  valueLabel: string;
  meta?: string;
  movementLabel?: string;
  href?: string;
};

export type ChartBarDatum = {
  label: string;
  tickLabel?: string;
  value: number;
  valueLabel: string;
  meta?: string;
  href?: string;
};

export function AreaChart({
  points,
  width = 800,
  height = 220,
  stroke = "var(--color-devil-bright)",
  fill = "rgb(216 33 13 / 0.12)",
  baseline,
  labels,
}: {
  points: { x: number; y: number }[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
  baseline?: number;
  labels?: { x: number; text: string }[];
}) {
  if (points.length < 2) return null;
  const pad = { t: 10, r: 6, b: 18, l: 6 };
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const X = (x: number) => pad.l + ((x - xMin) / (xMax - xMin || 1)) * (width - pad.l - pad.r);
  const Y = (y: number) => pad.t + (1 - (y - yMin) / (yMax - yMin || 1)) * (height - pad.t - pad.b);
  const path = points.map((p, i) => `${i ? "L" : "M"}${X(p.x).toFixed(1)},${Y(p.y).toFixed(1)}`).join("");
  const area = `${path}L${X(xMax).toFixed(1)},${height - pad.b}L${X(xMin).toFixed(1)},${height - pad.b}Z`;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img">
      {baseline !== undefined && baseline >= yMin && baseline <= yMax && (
        <line x1={pad.l} x2={width - pad.r} y1={Y(baseline)} y2={Y(baseline)}
          stroke="var(--color-line)" strokeDasharray="4 4" />
      )}
      <path d={area} fill={fill} />
      <path d={path} fill="none" stroke={stroke} strokeWidth="1.75" />
      {labels?.map((l) => (
        <text key={l.x} x={X(l.x)} y={height - 4} fontSize="10" fill="var(--color-ink-faint)" textAnchor="middle">
          {l.text}
        </text>
      ))}
    </svg>
  );
}
