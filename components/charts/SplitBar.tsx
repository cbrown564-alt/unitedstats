/**
 * A proportional split bar: segments sized by share of the total, each able to
 * carry an inline count when it owns enough of the bar. Encodes a one-vs-other
 * balance — league goals vs cup goals — directly in the object, so the longer
 * gold run *is* the cup lean.
 */
export function SplitBar({
  segments,
  height = 16,
}: {
  segments: { value: number; color: string; label?: string; textColor?: string }[];
  height?: number;
}) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  return (
    <div
      className="flex w-full overflow-hidden rounded-full bg-panel-2 ring-1 ring-inset ring-line"
      style={{ height }}
      role="img"
      aria-label={segments.map((s) => `${s.label ?? ""} ${s.value}`).join(", ")}
    >
      {segments.map((s, i) => {
        const pct = (100 * s.value) / total;
        if (pct <= 0) return null;
        const showLabel = s.label && pct >= 7;
        return (
          <div
            key={i}
            className="relative flex h-full items-center justify-center"
            style={{ width: `${pct}%`, background: s.color }}
            title={s.label && !showLabel ? `${s.label}: ${s.value}` : undefined}
          >
            {showLabel && (
              <span
                className={`stat-num truncate px-0.5 font-semibold leading-none ${pct >= 11 ? "text-[10px]" : "text-[9px]"}`}
                style={{ color: s.textColor ?? "var(--color-pitch)" }}
              >
                {s.label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
