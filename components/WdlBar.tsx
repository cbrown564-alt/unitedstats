/**
 * W/D/L distribution cue. Color is a supporting encoding only:
 * always render this next to the textual record, never instead of it.
 *
 * Variants:
 *  - "stacked" (default) — left-anchored W|D|L proportions on a muted track; the
 *                  shared record glyph across the app. Supports inline count
 *                  labels (showLabels, e.g. "199 W") on md/lg sizes.
 *  - "diverging" — losses grow left, wins grow right from a shared centre axis,
 *                  seated on a track with squared ends — an alternative centre-pivot
 *                  rendering for "good vs bad?" at a glance.
 *
 * Pass `volume` to hang a thin √-scaled rule beneath the bar that runs to the games
 * played (labelled at its end), so sample size reads without distorting the bar.
 */

type WdlSize = "xs" | "sm" | "md" | "lg";
type WdlVariant = "stacked" | "diverging";

const HEIGHTS: Record<WdlSize, string> = {
  xs: "h-2", // 8px
  sm: "h-3", // 12px — list rows
  md: "h-4", // 16px — detail headers
  lg: "h-5", // 20px
};

// Whether a segment owning `pct`% of the bar can hold its count plus the W/D/L tag.
// Server-side we can't measure pixels, so approximate from the glyph count and *hide*
// (never clip) when it won't fit — a lone draw in a 30-game record stays blank.
function labelFits(pct: number, value: number): boolean {
  const glyphs = String(value).length + 1; // digits + the trailing W/D/L letter
  return pct >= 3.2 * glyphs + 3;
}

export function WdlBar({
  w,
  d,
  l,
  className = "",
  size = "sm",
  heightPx,
  variant = "stacked",
  showLabels = false,
  tooltip = true,
  volume,
}: {
  w: number;
  d: number;
  l: number;
  className?: string;
  size?: WdlSize;
  /** Explicit track height in px, overriding `size`. Lets a caller encode a second
   *  variable (e.g. games played) as bar thickness on a continuous scale. */
  heightPx?: number;
  variant?: WdlVariant;
  /** Render counts inside segments wide enough to hold them (stacked, md/lg only). */
  showLabels?: boolean;
  /** Styled hover tooltip. Disable inside `overflow-hidden` rows; falls back to a native title. */
  tooltip?: boolean;
  /** Hang a √-scaled "volume lane" under the bar: a rule of width `fraction` (0–1,
   *  shared across a sibling group) with `games` labelled at its end. */
  volume?: { fraction: number; games: number };
}) {
  const total = w + d + l || 1;
  const wPct = (100 * w) / total;
  const dPct = (100 * d) / total;
  const lPct = (100 * l) / total;
  const winRate = Math.round((100 * w) / total);
  const aria = `${w} wins, ${d} draws, ${l} losses`;
  const height = heightPx != null ? "" : HEIGHTS[size];
  const diverging = variant === "diverging";
  const canLabel = showLabels && (size === "md" || size === "lg");

  const track = (
    <div
      className={
        diverging
          ? `relative ${height} w-full overflow-hidden rounded-[2px] bg-panel-2`
          : `relative ${height} w-full overflow-hidden rounded-[3px] bg-panel-2`
      }
      style={heightPx != null ? { height: `${heightPx}px` } : undefined}
      role="img"
      aria-label={aria}
      {...(tooltip ? {} : { title: `W${w} D${d} L${l} · ${winRate}% win` })}
    >
      {diverging ? (
        <DivergingSegments wPct={wPct} dPct={dPct} lPct={lPct} />
      ) : (
        <StackedSegments w={w} d={d} l={l} wPct={wPct} dPct={dPct} lPct={lPct} canLabel={canLabel} />
      )}
    </div>
  );

  const lane =
    volume != null ? (
      <div className="mt-1.5 flex items-center gap-2">
        <div className="relative h-[3px] flex-1" aria-hidden>
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-ink-dim/55"
            style={{ width: `${Math.max(0, Math.min(1, volume.fraction)) * 100}%` }}
          />
        </div>
        <span className="shrink-0 whitespace-nowrap text-[10px] leading-none text-ink-faint">
          <span className="stat-num">{volume.games.toLocaleString("en-US")}</span> games
        </span>
      </div>
    ) : null;

  if (!tooltip) {
    return (
      <div className={`w-full ${className}`}>
        {track}
        {lane}
      </div>
    );
  }

  return (
    <div className={`group/wdl relative w-full ${className}`}>
      {track}
      {lane}
      <WdlTooltip w={w} d={d} l={l} total={total} winRate={winRate} />
    </div>
  );
}

function DivergingSegments({ wPct, dPct, lPct }: { wPct: number; dPct: number; lPct: number }) {
  // Each side is scaled to half the track, so the centre line is the neutral
  // axis: losses extend left, wins extend right, draws straddle the middle.
  const dHalf = dPct / 4;
  return (
    <div className="absolute inset-0 wdl-reveal-center">
      {lPct > 0 && (
        <div
          className="absolute inset-y-0 rounded-l-[2px] bg-loss"
          style={{ left: `${50 - dHalf - lPct / 2}%`, width: `${lPct / 2}%` }}
        />
      )}
      {dPct > 0 && (
        <div
          className="absolute inset-y-0 bg-draw/70"
          style={{ left: `${50 - dHalf}%`, width: `${dPct / 2}%` }}
        />
      )}
      {wPct > 0 && (
        <div
          className="absolute inset-y-0 rounded-r-[2px] bg-win"
          style={{ left: `${50 + dHalf}%`, width: `${wPct / 2}%` }}
        />
      )}
      {/* centre fulcrum — the neutral axis the bar pivots around */}
      <div className="absolute inset-y-0 left-1/2 z-10 w-px -translate-x-1/2 bg-ink-faint/50" />
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
      <Segment color="bg-win" pct={wPct} label={canLabel && labelFits(wPct, w) ? w : null} letter="W" text="text-pitch/85" />
      <Segment color="bg-draw/60" pct={dPct} label={canLabel && labelFits(dPct, d) ? d : null} letter="D" text="text-pitch/85" />
      <Segment color="bg-loss" pct={lPct} label={canLabel && labelFits(lPct, l) ? l : null} letter="L" text="text-ink" />
    </div>
  );
}

function Segment({
  color,
  pct,
  label,
  letter,
  text,
}: {
  color: string;
  pct: number;
  label: number | null;
  /** Short W/D/L tag rendered after the count, for clarity. */
  letter: string;
  text: string;
}) {
  if (pct <= 0) return null;
  return (
    <div className={`relative h-full overflow-hidden ${color}`} style={{ width: `${pct}%` }}>
      {label != null && (
        <span
          className={`absolute inset-0 flex items-center justify-center gap-0.5 text-[10px] font-semibold leading-none tabular-nums ${text}`}
        >
          {label}
          <span className="text-[9px] font-bold opacity-75">{letter}</span>
        </span>
      )}
    </div>
  );
}

/** W–D–L record with each figure tinted to match the bar colours. */
export function WdlRecord({
  w,
  d,
  l,
  className = "",
}: {
  w: number;
  d: number;
  l: number;
  className?: string;
}) {
  return (
    <span className={`stat-num whitespace-nowrap ${className}`}>
      <span className="text-win">{w}</span>
      <span className="text-ink-faint">–</span>
      <span className="text-draw">{d}</span>
      <span className="text-ink-faint">–</span>
      <span className="text-loss">{l}</span>
    </span>
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
