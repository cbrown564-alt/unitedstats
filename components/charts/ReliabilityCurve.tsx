import type { CalibrationBucket } from "@/lib/predict";

/**
 * A reliability curve for the closed-universe Elo: does the rating's pre-match
 * win expectancy actually come true? Each expectancy decile is a point at
 * (expected, observed) against the dashed **perfect-forecast diagonal** — the
 * baseline encoded into the geometry rather than asserted in prose. The red
 * points-share dots hug the line when the ratings are honest; the gold win-rate
 * dots sit lower, and the grey band between them is exactly where draws live (it
 * fattens in the middle, where evenly-matched games draw most). Win-rate is gold,
 * not the win token: here colour distinguishes two forecast series, so it must
 * read apart from the devil-red points-share rather than carry result-state.
 *
 * Bespoke: it's the one object that makes "the ratings are calibrated" *visible*,
 * which a W/D/L table can only state. Static SVG, no inspection layer needed —
 * the diagonal and the bow carry the whole reading.
 */
export function ReliabilityCurve({ buckets }: { buckets: CalibrationBucket[] }) {
  const pts = buckets
    .filter((b) => b.p > 0)
    .map((b) => ({
      mid: (b.lo + b.hi) / 2,
      win: b.w / b.p,
      share: (b.w + 0.5 * b.d) / b.p,
      p: b.p,
    }));
  const maxP = Math.max(...pts.map((p) => p.p), 1);

  // Plot geometry, in viewBox units. Square plot so the diagonal reads at 45°.
  const padL = 40, padT = 16, plot = 208, padR = 16, padB = 36;
  const W = padL + plot + padR;
  const H = padT + plot + padB;
  const x = (v: number) => padL + v * plot;
  const y = (v: number) => padT + (1 - v) * plot;
  const r = (p: number) => 3 + 5 * Math.sqrt(p / maxP);
  const grid = [0, 0.25, 0.5, 0.75, 1];

  const shareC = pts.map((p) => [x(p.mid), y(p.share)] as const);
  const winC = pts.map((p) => [x(p.mid), y(p.win)] as const);
  const poly = (c: readonly (readonly [number, number])[]) => c.map((p) => p.join(",")).join(" ");
  const band =
    `M ${shareC.map((p) => p.join(",")).join(" L ")}` +
    ` L ${[...winC].reverse().map((p) => p.join(",")).join(" L ")} Z`;

  return (
    <figure className="mx-auto max-w-sm">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label="Reliability curve: observed result rate against pre-match win expectancy, with a perfect-forecast diagonal"
      >
        {/* grid + axis ticks */}
        {grid.map((g) => (
          <g key={g}>
            <line x1={x(g)} y1={y(0)} x2={x(g)} y2={y(1)} stroke="var(--color-line)" strokeWidth={0.5} opacity={0.5} />
            <line x1={x(0)} y1={y(g)} x2={x(1)} y2={y(g)} stroke="var(--color-line)" strokeWidth={0.5} opacity={0.5} />
            <text x={x(g)} y={y(0) + 12} textAnchor="middle" fontSize={8.5} fill="var(--color-ink-faint)" className="stat-num">
              {g * 100}
            </text>
            <text x={x(0) - 6} y={y(g) + 3} textAnchor="end" fontSize={8.5} fill="var(--color-ink-faint)" className="stat-num">
              {g * 100}
            </text>
          </g>
        ))}

        {/* perfect-forecast diagonal — the baseline */}
        <line
          x1={x(0)} y1={y(0)} x2={x(1)} y2={y(1)}
          stroke="var(--color-ink-faint)" strokeWidth={1} strokeDasharray="3 3"
        />
        <text
          x={x(0.78)} y={y(0.78) - 5} fontSize={8} fill="var(--color-ink-faint)"
          transform={`rotate(-45 ${x(0.78)} ${y(0.78) - 5})`}
        >
          perfect forecast
        </text>

        {/* the draw band: gap between points-share and win-rate, the draws live here */}
        <path d={band} fill="var(--color-draw)" opacity={0.12} />

        {/* win rate — hollow gold, sits below the line; the gap is draws */}
        <polyline points={poly(winC)} fill="none" stroke="var(--color-gold)" strokeWidth={1} opacity={0.5} />
        {winC.map((c, i) => (
          <circle key={i} cx={c[0]} cy={c[1]} r={3} fill="var(--color-pitch)" stroke="var(--color-gold)" strokeWidth={1.3} />
        ))}

        {/* points share — solid red, hugs the diagonal when calibrated */}
        <polyline points={poly(shareC)} fill="none" stroke="var(--color-devil-bright)" strokeWidth={1.4} />
        {pts.map((p, i) => (
          <circle key={i} cx={shareC[i][0]} cy={shareC[i][1]} r={r(p.p)} fill="var(--color-devil-bright)" opacity={0.92} />
        ))}

        {/* axis titles */}
        <text x={padL + plot / 2} y={H - 4} textAnchor="middle" fontSize={9} fill="var(--color-ink-dim)">
          Pre-match win expectancy (%)
        </text>
        <text
          x={12} y={padT + plot / 2} textAnchor="middle" fontSize={9} fill="var(--color-ink-dim)"
          transform={`rotate(-90 12 ${padT + plot / 2})`}
        >
          Observed rate (%)
        </text>
      </svg>

      <figcaption className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-faint">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-2 w-2 rounded-full bg-devil-bright" /> Points share — on the diagonal means the ratings land where they aim
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-2 w-2 rounded-full border border-gold bg-pitch" /> Win rate — the gap up to the line is where draws live
        </span>
      </figcaption>
    </figure>
  );
}
