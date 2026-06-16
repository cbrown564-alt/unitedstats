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
};

export function QuietAnalystTooltip({ active, payload }: QuietAnalystTooltipProps) {
  if (!active || !payload?.length) return null;

  const datum = payload[0]?.payload;
  if (!datum) return null;

  return (
    <div className="min-w-36 rounded-md border border-line bg-panel px-3 py-2 text-xs shadow-[0_10px_30px_rgb(0_0_0_/_0.35)]">
      <div className="text-ink-dim">{datum.label}</div>
      <div className="stat-num mt-0.5 text-base font-semibold text-ink">{datum.valueLabel}</div>
      {datum.movementLabel && (
        <div className="stat-num mt-0.5 text-[11px] text-devil-bright">{datum.movementLabel}</div>
      )}
      {datum.meta && <div className="mt-1 max-w-56 text-ink-faint">{datum.meta}</div>}
      {datum.href && <div className="mt-1 text-[11px] font-medium text-devil-bright">Click bar to open evidence</div>}
    </div>
  );
}
