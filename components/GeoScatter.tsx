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

  // sparse graticule so positions read as geography, not abstract scatter
  const latLines: number[] = [];
  for (let lat = Math.ceil(latMin / 5) * 5; lat < latMax; lat += 5) latLines.push(lat);
  const lngLines: number[] = [];
  for (let lng = Math.ceil(lngMin / 5) * 5; lng < lngMax; lng += 5) lngLines.push(lng);

  const landPath = (ring: LandRing) =>
    ring.map(([lng, lat], i) => `${i === 0 ? "M" : "L"}${X(lng).toFixed(1)},${Y(lat).toFixed(1)}`).join("") + "Z";

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img">
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
              x={X(p.lng) + R(p.value) + 3}
              y={Y(p.lat) + 3}
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
  );
}
