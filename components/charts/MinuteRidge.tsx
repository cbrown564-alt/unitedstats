/**
 * The match as a 90-minute timeline: United goals binned every 5 minutes, drawn
 * as a stepped ridge that the eye reads left-to-right like a match unfolding. The
 * closing minutes (76–90+) fill devil-red — the "Fergie time" climax — and a
 * dashed line marks the even-distribution baseline, so a bar standing above it is
 * a genuine surplus rather than just the shape of any distribution.
 *
 * Server-rendered SVG: no client JS, scales to its container.
 */
type Bin = { lo: number; hi: number; n: number };

const W = 1000; // virtual width; the SVG scales to its container via viewBox
const PAD_L = 6;
const PAD_R = 6;
const PAD_T = 26;
const PAD_B = 22;

export function MinuteRidge({
  bins,
  height = 200,
  lateFrom = 75,
}: {
  bins: Bin[];
  height?: number;
  /** Minute at which the closing "late" zone begins. */
  lateFrom?: number;
}) {
  if (bins.length === 0) return null;
  const end = bins[bins.length - 1].hi; // 90
  const maxN = Math.max(...bins.map((b) => b.n), 1);
  const total = bins.reduce((a, b) => a + b.n, 0);
  const avg = total / bins.length;

  const plotH = height - PAD_T - PAD_B;
  const baseY = height - PAD_B;
  const X = (minute: number) => PAD_L + (minute / end) * (W - PAD_L - PAD_R);
  const Y = (n: number) => PAD_T + (1 - n / maxN) * plotH;

  // Stepped silhouette: flat top across each 5-minute bin, dropping to the axis
  // at both ends so it reads as one continuous distribution.
  let d = `M ${X(0).toFixed(1)} ${baseY}`;
  for (const b of bins) {
    d += ` L ${X(b.lo).toFixed(1)} ${Y(b.n).toFixed(1)} L ${X(b.hi).toFixed(1)} ${Y(b.n).toFixed(1)}`;
  }
  d += ` L ${X(end).toFixed(1)} ${baseY} Z`;

  const lateX = X(lateFrom);
  const lateStop = lateFrom / end; // gradient split point
  const axisTicks = [0, 15, 30, 45, 60, 75, 90];
  // The tallest bin carries the headline — annotate it so the spike has a number.
  const peak = bins.reduce((p, b) => (b.n > p.n ? b : p), bins[0]);

  return (
    <svg
      viewBox={`0 0 ${W} ${height}`}
      className="w-full h-auto"
      role="img"
      aria-label="United goals by match minute, with the closing 15 minutes highlighted"
    >
      <defs>
        {/* Horizontal split: calm gold through the match, devil-red once the late
            zone begins — the colour itself says "this is the dangerous window". */}
        <linearGradient id="ridge-fill" gradientUnits="userSpaceOnUse" x1={X(0)} y1="0" x2={X(end)} y2="0">
          <stop offset="0" stopColor="var(--color-gold)" stopOpacity="0.32" />
          <stop offset={lateStop - 0.001} stopColor="var(--color-gold)" stopOpacity="0.32" />
          <stop offset={lateStop} stopColor="var(--color-devil)" stopOpacity="0.85" />
          <stop offset="1" stopColor="var(--color-devil-bright)" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id="ridge-stroke" gradientUnits="userSpaceOnUse" x1={X(0)} y1="0" x2={X(end)} y2="0">
          <stop offset="0" stopColor="var(--color-gold)" />
          <stop offset={lateStop - 0.001} stopColor="var(--color-gold)" />
          <stop offset={lateStop} stopColor="var(--color-devil-bright)" />
          <stop offset="1" stopColor="var(--color-devil-bright)" />
        </linearGradient>
      </defs>

      {/* late-zone wash behind the ridge */}
      <rect
        x={lateX}
        y={PAD_T - 6}
        width={X(end) - lateX}
        height={baseY - PAD_T + 6}
        fill="var(--color-devil)"
        opacity="0.06"
      />

      {/* half-time divider */}
      <line x1={X(45)} x2={X(45)} y1={PAD_T - 2} y2={baseY} stroke="var(--color-line)" strokeWidth="1" strokeDasharray="2 5" />
      <text x={X(45) + 4} y={PAD_T + 6} fontSize="9" fill="var(--color-ink-faint)">HT</text>

      {/* the ridge */}
      <path d={d} fill="url(#ridge-fill)" />
      <path d={d} fill="none" stroke="url(#ridge-stroke)" strokeWidth="1.5" strokeLinejoin="round" />

      {/* even-distribution baseline */}
      <line x1={X(0)} x2={X(end)} y1={Y(avg)} y2={Y(avg)} stroke="var(--color-ink-faint)" strokeWidth="1" strokeDasharray="3 3" />
      <text x={X(end)} y={Y(avg) - 4} fontSize="9" fill="var(--color-ink-faint)" textAnchor="end">
        even spread
      </text>

      {/* climax annotation over the late zone */}
      <text
        x={(lateX + X(end)) / 2}
        y={PAD_T - 12}
        fontSize="10"
        fontWeight="700"
        letterSpacing="0.08em"
        fill="var(--color-devil-bright)"
        textAnchor="middle"
      >
        FERGIE TIME
      </text>
      {/* peak callout */}
      <text x={X((peak.lo + peak.hi) / 2)} y={Y(peak.n) - 5} fontSize="10" fill="var(--color-ink)" textAnchor="middle" className="stat-num">
        {peak.n}
      </text>

      {/* minute axis */}
      {axisTicks.map((t) => (
        <text key={t} x={X(t)} y={baseY + 14} fontSize="10" fill="var(--color-ink-faint)" textAnchor={t === 0 ? "start" : t === 90 ? "end" : "middle"} className="stat-num">
          {t}&prime;
        </text>
      ))}

      {/* per-bin hover targets */}
      {bins.map((b) => (
        <rect key={b.lo} x={X(b.lo)} y={PAD_T - 6} width={X(b.hi) - X(b.lo)} height={baseY - PAD_T + 6} fill="transparent">
          <title>{`${b.lo}–${b.hi === 90 ? "90+" : b.hi}′: ${b.n} goals`}</title>
        </rect>
      ))}
    </svg>
  );
}
