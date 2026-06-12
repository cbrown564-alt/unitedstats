/** Lightweight server-rendered SVG charts — no client JS, no chart library. */

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

export function Bars({
  data,
  width = 800,
  height = 180,
  color = "var(--color-devil)",
  labelEvery = 1,
  highlightLabel,
  highlightColor = "var(--color-gold)",
}: {
  data: { label: string; value: number }[];
  width?: number;
  height?: number;
  color?: string;
  labelEvery?: number;
  /** Bar with this label is drawn in highlightColor and always labeled. */
  highlightLabel?: string;
  highlightColor?: string;
}) {
  if (data.length === 0) return null;
  const pad = { t: 8, b: 18 };
  const max = Math.max(...data.map((d) => d.value)) || 1;
  const bw = width / data.length;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img">
      {data.map((d, i) => {
        const h = ((height - pad.t - pad.b) * d.value) / max;
        const highlighted = highlightLabel !== undefined && d.label === highlightLabel;
        return (
          <g key={i}>
            <rect
              x={i * bw + bw * 0.12}
              y={height - pad.b - h}
              width={bw * 0.76}
              height={h}
              rx="1.5"
              fill={highlighted ? highlightColor : color}
              opacity={0.9}
            >
              <title>{`${d.label}: ${d.value}`}</title>
            </rect>
            {(i % labelEvery === 0 || highlighted) && (
              <text
                x={i * bw + bw / 2}
                y={height - 5}
                fontSize="10"
                fill={highlighted ? highlightColor : "var(--color-ink-faint)"}
                fontWeight={highlighted ? 600 : undefined}
                textAnchor="middle"
              >
                {d.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function Sparkline({
  values,
  width = 120,
  height = 32,
  stroke = "var(--color-devil-bright)",
}: {
  values: number[];
  width?: number;
  height?: number;
  stroke?: string;
}) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const path = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = 2 + (1 - (v - min) / (max - min || 1)) * (height - 4);
      return `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join("");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      <path d={path} fill="none" stroke={stroke} strokeWidth="1.5" />
    </svg>
  );
}
