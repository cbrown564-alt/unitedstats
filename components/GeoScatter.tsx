import type { LandRing } from "@/lib/geo/land";

/**
 * Server-rendered SVG dot map on an equirectangular projection — no tiles,
 * no client JS. Designed for away-ground footprints: dots scale with visit
 * count, the origin (Manchester) is marked, and the biggest dots are labeled.
 * A faded land layer (real coastlines, passed in already clipped to `bounds`)
 * sits behind the dots so the geography is recognisable at a glance.
 */
export interface GeoPoint {
  lat: number;
  lng: number;
  label: string;
  value: number;
}

export function GeoScatter({
  points,
  origin,
  bounds,
  land,
  width = 800,
  labelTop = 8,
  dotColor = "var(--color-devil)",
  dotLabel = "Opponent ground",
}: {
  points: GeoPoint[];
  /** Marked with a distinct symbol (Manchester). */
  origin?: { lat: number; lng: number; label: string };
  /** [latMin, latMax, lngMin, lngMax]; points outside are dropped. */
  bounds: [number, number, number, number];
  /** Coastline rings ([lng,lat]) pre-clipped to `bounds`, drawn faded behind the dots. */
  land?: LandRing[];
  width?: number;
  /** How many of the highest-value points get a text label. */
  labelTop?: number;
  dotColor?: string;
  /** Legend label for the dot colour (defaults to opponent ground). */
  dotLabel?: string;
}) {
  const [latMin, latMax, lngMin, lngMax] = bounds;
  const visible = points.filter(
    (p) => p.lat >= latMin && p.lat <= latMax && p.lng >= lngMin && p.lng <= lngMax,
  );
  if (visible.length === 0) return null;

  // keep distances roughly honest: shrink longitude by cos(mid-latitude)
  const midLat = ((latMin + latMax) / 2) * (Math.PI / 180);
  const aspect = ((lngMax - lngMin) * Math.cos(midLat)) / (latMax - latMin);
  const pad = 14;
  const height = Math.round((width - 2 * pad) / aspect) + 2 * pad;
  const X = (lng: number) => pad + ((lng - lngMin) / (lngMax - lngMin)) * (width - 2 * pad);
  const Y = (lat: number) => pad + ((latMax - lat) / (latMax - latMin)) * (height - 2 * pad);

  const maxV = Math.max(...visible.map((p) => p.value));
  const R = (v: number) => 2.5 + 9 * Math.sqrt(v / maxV);
  const labeled = new Set(
    [...visible].sort((a, b) => b.value - a.value).slice(0, labelTop).map((p) => p.label),
  );

  // Nudge top-N labels vertically when boxes would overlap.
  const labelBoxes: { x: number; y: number; w: number; h: number }[] = [];
  const labelPos = new Map<string, { x: number; y: number }>();
  const overlaps = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  const estW = (text: string) => Math.max(28, text.length * 5.8);
  const estH = 12;

  if (origin) {
    const ox = X(origin.lng) + 8;
    const oy = Y(origin.lat) + 4;
    labelBoxes.push({ x: ox, y: oy - estH, w: estW(origin.label), h: estH });
  }

  for (const p of [...visible].sort((a, b) => b.value - a.value)) {
    if (!labeled.has(p.label)) continue;
    const x = X(p.lng) + R(p.value) + 3;
    const y0 = Y(p.lat) + 3;
    const w = estW(p.label);
    const offsets = [0, -14, 14, -28, 28, -42, 42];
    let placed = false;
    for (const dy of offsets) {
      const box = { x, y: y0 + dy - estH + 3, w, h: estH };
      if (!labelBoxes.some((b) => overlaps(box, b))) {
        labelBoxes.push(box);
        labelPos.set(p.label, { x, y: y0 + dy });
        placed = true;
        break;
      }
    }
    if (!placed) labelPos.set(p.label, { x, y: y0 });
  }

  // sparse graticule so positions read as geography, not abstract scatter
  const latLines: number[] = [];
  for (let lat = Math.ceil(latMin / 5) * 5; lat < latMax; lat += 5) latLines.push(lat);
  const lngLines: number[] = [];
  for (let lng = Math.ceil(lngMin / 5) * 5; lng < lngMax; lng += 5) lngLines.push(lng);

  const landPath = (ring: LandRing) =>
    ring.map(([lng, lat], i) => `${i === 0 ? "M" : "L"}${X(lng).toFixed(1)},${Y(lat).toFixed(1)}`).join("") + "Z";

  return (
    <figure className="min-w-0">
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={`Away grounds map: dot size shows visit count, colour marks ${dotLabel.toLowerCase()}`}>
      {land && land.length > 0 && (
        <g aria-hidden>
          {land.map((ring, i) => (
            <path key={i} d={landPath(ring)} fill="var(--color-panel-2)" stroke="var(--color-line)" strokeWidth="0.6" strokeLinejoin="round" />
          ))}
        </g>
      )}
      {latLines.map((lat) => (
        <line key={`lat${lat}`} x1={0} x2={width} y1={Y(lat)} y2={Y(lat)}
          stroke="var(--color-line)" strokeWidth="0.5" strokeDasharray="2 6" />
      ))}
      {lngLines.map((lng) => (
        <line key={`lng${lng}`} x1={X(lng)} x2={X(lng)} y1={0} y2={height}
          stroke="var(--color-line)" strokeWidth="0.5" strokeDasharray="2 6" />
      ))}
      {[...visible].sort((a, b) => b.value - a.value).map((p) => (
        <g key={p.label}>
          <circle cx={X(p.lng)} cy={Y(p.lat)} r={R(p.value)} fill={dotColor} opacity="0.55">
            <title>{`${p.label}: ${p.value} away matches`}</title>
          </circle>
          {labeled.has(p.label) && (
            <text
              x={labelPos.get(p.label)?.x ?? X(p.lng) + R(p.value) + 3}
              y={labelPos.get(p.label)?.y ?? Y(p.lat) + 3}
              fontSize="10"
              fill="var(--color-ink-dim)"
            >
              {p.label}
            </text>
          )}
        </g>
      ))}
      {origin && (
        <g>
          <path
            d={`M${X(origin.lng)},${Y(origin.lat) - 6} L${X(origin.lng) + 5},${Y(origin.lat) + 4} L${X(origin.lng) - 5},${Y(origin.lat) + 4} Z`}
            fill="var(--color-gold)"
          />
          <text
            x={X(origin.lng) + 8}
            y={Y(origin.lat) + 4}
            fontSize="10"
            fontWeight="600"
            fill="var(--color-gold)"
          >
            {origin.label}
          </text>
        </g>
      )}
    </svg>
    <figcaption className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-faint">
      <span className="flex items-center gap-1.5">
        <span aria-hidden className="inline-flex items-center gap-0.5">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: dotColor, opacity: 0.55 }} />
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: dotColor, opacity: 0.55 }} />
        </span>
        Dot size = away visits
      </span>
      <span className="flex items-center gap-1.5">
        <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: dotColor, opacity: 0.55 }} />
        {dotLabel}
      </span>
      {origin && (
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="inline-block h-0 w-0 border-x-[5px] border-b-[6px] border-x-transparent border-b-gold" />
          {origin.label} (origin)
        </span>
      )}
    </figcaption>
    </figure>
  );
}
