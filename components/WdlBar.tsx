export function WdlBar({ w, d, l, className = "" }: { w: number; d: number; l: number; className?: string }) {
  const total = w + d + l || 1;
  return (
    <div className={`flex h-1.5 rounded-full overflow-hidden bg-panel-2 ${className}`} title={`W${w} D${d} L${l}`}>
      <div className="bg-win" style={{ width: `${(100 * w) / total}%` }} />
      <div className="bg-draw/60" style={{ width: `${(100 * d) / total}%` }} />
      <div className="bg-loss" style={{ width: `${(100 * l) / total}%` }} />
    </div>
  );
}
