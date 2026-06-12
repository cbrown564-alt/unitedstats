/**
 * Compact W/D/L distribution cue. Color is a supporting encoding only:
 * always render this next to the textual record, never instead of it.
 */
export function WdlBar({ w, d, l, className = "" }: { w: number; d: number; l: number; className?: string }) {
  const total = w + d + l || 1;
  return (
    <div
      className={`flex h-1.5 rounded-full overflow-hidden bg-panel-2 ${className}`}
      title={`W${w} D${d} L${l}`}
      role="img"
      aria-label={`${w} wins, ${d} draws, ${l} losses`}
    >
      <div className="bg-win" style={{ width: `${(100 * w) / total}%` }} />
      <div className="bg-draw/60" style={{ width: `${(100 * d) / total}%` }} />
      <div className="bg-loss" style={{ width: `${(100 * l) / total}%` }} />
    </div>
  );
}
