/**
 * The match as a 90-minute timeline: United goals binned every 5 minutes, drawn
 * as a stepped ridge that the eye reads left-to-right like a match unfolding. The
 * closing minutes fill devil-red — the "Fergie time" climax — and a dashed line
 * marks the even-distribution baseline, so a bar standing above it is a genuine
 * surplus rather than just the shape of any distribution.
 *
 * Hybrid render (the seasons/skyline pattern): the ridge is a server-rendered SVG
 * that stretches to fill a fixed-height box (preserveAspectRatio="none" with
 * non-scaling strokes), while every label is real HTML positioned by percentage —
 * so the text stays crisp and legible however narrow the container, instead of
 * shrinking with the viewBox. No client JS.
 */
type Bin = { lo: number; hi: number; n: number };

const W = 1000; // virtual width; x stretches to the container
const PAD_L = 6;
const PAD_R = 6;
const PAD_T = 30; // top band reserved for the late-zone annotation
const PAD_B = 6; // small gap above the external minute axis

export function MinuteRidge({
  bins,
  height = 200,
  lateFrom = 75,
  lateLabel = "Fergie time",
  subject = "United",
}: {
  bins: Bin[];
  height?: number;
  /** Minute at which the closing "late" zone begins. */
  lateFrom?: number;
  /** Uppercase annotation over the late zone; pass null to hide (e.g. a single player). */
  lateLabel?: string | null;
  /** Whose goals these are, for the accessible label. */
  subject?: string;
}) {
  if (bins.length === 0) return null;
  const end = bins[bins.length - 1].hi; // 90
  const maxN = Math.max(...bins.map((b) => b.n), 1);
  const total = bins.reduce((a, b) => a + b.n, 0);
  const avg = total / bins.length;

  const plotH = height - PAD_T - PAD_B;
  const baseY = height - PAD_B;
  // viewBox-space mapping (x in 0..W units, y in px since the box is `height` tall)
  const X = (minute: number) => PAD_L + (minute / end) * (W - PAD_L - PAD_R);
  const Y = (n: number) => PAD_T + (1 - n / maxN) * plotH;
  // HTML-overlay mapping: x as a percent of width, y straight in px (1 unit = 1px).
  const leftPct = (minute: number) => (X(minute) / W) * 100;

  // Stepped silhouette: flat top across each 5-minute bin, dropping to the axis
  // at both ends so it reads as one continuous distribution.
  let d = `M ${X(0).toFixed(1)} ${baseY}`;
  for (const b of bins) {
    d += ` L ${X(b.lo).toFixed(1)} ${Y(b.n).toFixed(1)} L ${X(b.hi).toFixed(1)} ${Y(b.n).toFixed(1)}`;
  }
  d += ` L ${X(end).toFixed(1)} ${baseY} Z`;

  const lateStop = lateFrom / end; // gradient split point
  const avgY = Y(avg);
  const axisTicks = [0, 15, 30, 45, 60, 75, 90];
  // Goals falling in the closing window — the headline number for the annotation.
  const lateGoals = bins.filter((b) => b.lo >= lateFrom).reduce((a, b) => a + b.n, 0);

  return (
    <figure className="m-0" aria-label={`${subject} goals by match minute, with the closing minutes highlighted`}>
      <div className="relative w-full" style={{ height }}>
        <svg
          viewBox={`0 0 ${W} ${height}`}
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full overflow-visible"
          aria-hidden
        >
          <defs>
            {/* Horizontal split: calm gold through the match, devil-red once the late
                zone begins — the colour itself says "this is the dangerous window". */}
            <linearGradient id="ridge-fill" gradientUnits="userSpaceOnUse" x1={X(0)} y1="0" x2={X(end)} y2="0">
              <stop offset="0" stopColor="var(--color-gold)" stopOpacity="0.28" />
              <stop offset={lateStop - 0.001} stopColor="var(--color-gold)" stopOpacity="0.34" />
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
          <rect x={X(lateFrom)} y={PAD_T - 8} width={X(end) - X(lateFrom)} height={baseY - PAD_T + 8} fill="var(--color-devil)" opacity="0.08" />

          {/* half-time divider */}
          <line x1={X(45)} x2={X(45)} y1={PAD_T - 4} y2={baseY} stroke="var(--color-line)" strokeWidth="1" strokeDasharray="2 5" vectorEffect="non-scaling-stroke" />

          {/* the ridge */}
          <path d={d} fill="url(#ridge-fill)" />
          <path d={d} fill="none" stroke="url(#ridge-stroke)" strokeWidth="1.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />

          {/* even-distribution baseline */}
          <line x1={X(0)} x2={X(end)} y1={avgY} y2={avgY} stroke="var(--color-ink-dim)" strokeWidth="1" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" opacity="0.7" />

          {/* per-bin hover targets — kept in the SVG so the tooltips work */}
          {bins.map((b) => (
            <rect key={b.lo} x={X(b.lo)} y={PAD_T - 8} width={X(b.hi) - X(b.lo)} height={baseY - PAD_T + 8} fill="transparent">
              <title>{`${b.lo}–${b.hi === 90 ? "90+" : b.hi}′: ${b.n} goals`}</title>
            </rect>
          ))}
        </svg>

        {/* ── Labels as real HTML, so they stay legible at any width ── */}
        {/* Late-zone annotation, anchored top-right over the closing spike */}
        <div className="absolute right-0 top-0 text-right leading-tight">
          {lateLabel && (
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-devil-bright">
              {lateLabel}
            </div>
          )}
          <div className="stat-num text-[11px] text-ink-dim">
            <span className="font-semibold text-ink">{lateGoals}</span> late
          </div>
        </div>

        {/* even-spread label, left side just above the baseline so it never
            collides with the busy late zone on the right */}
        <div
          className="absolute left-0 text-[10px] text-ink-dim"
          style={{ top: avgY, transform: "translateY(-115%)" }}
        >
          even spread
        </div>

        {/* half-time marker */}
        <div
          className="absolute text-[10px] font-medium text-ink-faint"
          style={{ left: `${leftPct(45)}%`, top: PAD_T - 4, transform: "translateX(4px)" }}
        >
          HT
        </div>
      </div>

      {/* minute axis — HTML, so the ticks read clearly */}
      <div className="relative mt-1.5 h-3.5">
        {axisTicks.map((t) => (
          <span
            key={t}
            className="stat-num absolute text-[10px] text-ink-dim"
            style={{
              left: `${leftPct(t)}%`,
              transform: t === 0 ? "none" : t === end ? "translateX(-100%)" : "translateX(-50%)",
            }}
          >
            {t}&prime;
          </span>
        ))}
      </div>
    </figure>
  );
}
