/**
 * W/D/L distribution cue. Color is a supporting encoding only:
 * always render this next to the textual record, never instead of it.
 *
 * Variants:
 *  - "diverging" (default) — losses grow left, wins grow right from a centre
 *                  axis; makes "good vs bad record?" legible at a glance.
 *  - "stacked"   — left-anchored proportions, reads as a share bar. Supports
 *                  inline count labels (showLabels) on md/lg sizes.
 */

type WdlSize = "xs" | "sm" | "md" | "lg";
type WdlVariant = "stacked" | "diverging";

const HEIGHTS: Record<WdlSize, string> = {
  xs: "h-1", // 4px
  sm: "h-1.5", // 6px — the historical default
  md: "h-2.5", // 10px
  lg: "h-3.5", // 14px
};

// Label visibility threshold (segment must own at least this % of the bar).
const LABEL_MIN_PCT = 14;

export function WdlBar({
  w,
  d,
  l,
  className = "",
  size = "sm",
  variant = "diverging",
  showLabels = false,
  tooltip = true,
}: {
  w: number;
  d: number;
  l: number;
  className?: string;
  size?: WdlSize;
  variant?: WdlVariant;
  /** Render counts inside segments wide enough to hold them (md/lg only). */
  showLabels?: boolean;
  /** Styled hover tooltip. Disable inside `overflow-hidden` rows; falls back to a native title. */
  tooltip?: boolean;
}) {
  const total = w + d + l || 1;
  const wPct = (100 * w) / total;
  const dPct = (100 * d) / total;
  const lPct = (100 * l) / total;
  const winRate = Math.round((100 * w) / total);
  const aria = `${w} wins, ${d} draws, ${l} losses`;
  const height = HEIGHTS[size];
  const canLabel = showLabels && (size === "md" || size === "lg");

  const track = (
    <div
      className={`relative ${height} w-full overflow-hidden rounded-full bg-panel-2 shadow-[inset_0_1px_2px_rgba(0,0,0,0.45)] ring-1 ring-inset ring-white/[0.06] transition-[filter] duration-200 group-hover/wdl:brightness-110`}
      role="img"
      aria-label={aria}
      {...(tooltip ? {} : { title: `W${w} D${d} L${l} · ${winRate}% win` })}
    >
      {variant === "diverging" ? (
        <DivergingSegments wPct={wPct} dPct={dPct} lPct={lPct} />
      ) : (
        <StackedSegments
          w={w}
          d={d}
          l={l}
          wPct={wPct}
          dPct={dPct}
          lPct={lPct}
          canLabel={canLabel}
        />
      )}
      {/* glassy sheen for a touch of depth */}
      <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white/[0.12] to-transparent" />
    </div>
  );

  if (!tooltip) {
    return <div className={`w-full ${className}`}>{track}</div>;
  }

  return (
    <div className={`group/wdl relative w-full ${className}`}>
      {track}
      <WdlTooltip w={w} d={d} l={l} total={total} winRate={winRate} />
    </div>
  );
}

function StackedSegments({
  w,
  d,
  l,
  wPct,
  dPct,
  lPct,
  canLabel,
}: {
  w: number;
  d: number;
  l: number;
  wPct: number;
  dPct: number;
  lPct: number;
  canLabel: boolean;
}) {
  return (
    <div className="absolute inset-0 flex gap-px wdl-reveal">
      <Segment color="bg-win" pct={wPct} label={canLabel && wPct >= LABEL_MIN_PCT ? w : null} text="text-pitch/85" />
      <Segment color="bg-draw/60" pct={dPct} label={canLabel && dPct >= LABEL_MIN_PCT ? d : null} text="text-pitch/85" />
      <Segment color="bg-loss" pct={lPct} label={canLabel && lPct >= LABEL_MIN_PCT ? l : null} text="text-ink" />
    </div>
  );
}

function Segment({
  color,
  pct,
  label,
  text,
}: {
  color: string;
  pct: number;
  label: number | null;
  text: string;
}) {
  if (pct <= 0) return null;
  return (
    <div className={`relative h-full ${color}`} style={{ width: `${pct}%` }}>
      {label != null && (
        <span
          className={`absolute inset-0 flex items-center justify-center text-[10px] font-semibold leading-none tabular-nums ${text}`}
        >
          {label}
        </span>
      )}
    </div>
  );
}

function DivergingSegments({ wPct, dPct, lPct }: { wPct: number; dPct: number; lPct: number }) {
  // Each side is scaled to half the track, so the centre line is the neutral
  // axis: losses extend left, wins extend right, draws straddle the middle.
  const dHalf = dPct / 4;
  return (
    <div className="absolute inset-0 wdl-reveal-center">
      <div
        className="absolute inset-y-0 bg-loss"
        style={{ right: `${50 + dHalf}%`, width: `${lPct / 2}%` }}
      />
      <div
        className="absolute inset-y-0 left-1/2 -translate-x-1/2 bg-draw/60"
        style={{ width: `${dPct / 2}%` }}
      />
      <div className="absolute inset-y-0 bg-win" style={{ left: `${50 + dHalf}%`, width: `${wPct / 2}%` }} />
      {/* neutral centre tick */}
      <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-ink/25" />
    </div>
  );
}

function WdlTooltip({
  w,
  d,
  l,
  total,
  winRate,
}: {
  w: number;
  d: number;
  l: number;
  total: number;
  winRate: number;
}) {
  const rows: [string, string, number, number][] = [
    ["W", "bg-win", w, wPctOf(w, total)],
    ["D", "bg-draw", d, wPctOf(d, total)],
    ["L", "bg-loss", l, wPctOf(l, total)],
  ];
  return (
    <div
      className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-max -translate-x-1/2 rounded-md border border-line bg-panel-2 px-2.5 py-2 text-xs text-ink opacity-0 shadow-xl shadow-black/40 transition-opacity duration-150 group-hover/wdl:opacity-100"
      role="presentation"
    >
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-2.5 gap-y-1">
        {rows.map(([letter, dot, n, p]) => (
          <div key={letter} className="contents">
            <span className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-[2px] ${dot}`} />
              <span className="text-ink-dim">{letter}</span>
            </span>
            <span className="stat-num text-right font-semibold">{n}</span>
            <span className="stat-num text-right text-ink-faint">{p}%</span>
          </div>
        ))}
      </div>
      <div className="mt-1.5 border-t border-line pt-1.5 stat-num text-[11px] text-ink-faint">
        {total} played · {winRate}% win rate
      </div>
      <span className="absolute left-1/2 top-full -mt-1 h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-line bg-panel-2" />
    </div>
  );
}

function wPctOf(n: number, total: number) {
  return Math.round((100 * n) / total);
}
