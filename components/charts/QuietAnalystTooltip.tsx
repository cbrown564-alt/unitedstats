"use client";

type QuietAnalystTooltipDatum = {
  label: string;
  valueLabel: string;
  meta?: string;
  movementLabel?: string;
  href?: string;
};

type QuietAnalystTooltipProps = {
  active?: boolean;
  payload?: { payload: QuietAnalystTooltipDatum }[];
  /** Pinned callout below the chart — shows a dismiss hint instead of hover chrome. */
  pinned?: boolean;
};

export function QuietAnalystTooltip({ active, payload, pinned = false }: QuietAnalystTooltipProps) {
  if ((!active && !pinned) || !payload?.length) return null;

  const datum = payload[0]?.payload;
  if (!datum) return null;

  return (
    <div
      className={`min-w-36 rounded-md border bg-panel px-3 py-2 text-xs shadow-[0_10px_30px_rgb(0_0_0_/_0.35)] ${
        pinned ? "border-devil/40 ring-1 ring-devil/15" : "border-line"
      }`}
      role={pinned ? "status" : undefined}
      aria-live={pinned ? "polite" : undefined}
    >
      <div className="text-ink-dim">{datum.label}</div>
      <div className="stat-num mt-0.5 text-base font-semibold text-ink">{datum.valueLabel}</div>
      {datum.movementLabel && (
        <div className="stat-num mt-0.5 text-[11px] text-devil-bright">{datum.movementLabel}</div>
      )}
      {datum.meta && <div className="mt-1 max-w-56 text-ink-faint">{datum.meta}</div>}
      {datum.href && !pinned && (
        <div className="mt-1 text-[11px] font-medium text-devil-bright">Click bar to open evidence</div>
      )}
      {datum.href && pinned && (
        <div className="mt-1 text-[11px] font-medium text-devil-bright">Tap again on the bar to open evidence</div>
      )}
      {pinned && !datum.href && (
        <div className="mt-1 text-[11px] text-ink-faint">Tap elsewhere to dismiss</div>
      )}
    </div>
  );
}
