import type { ChartBarDatum } from "@/components/charts";
import { fmtAxisNumber } from "@/lib/format";
import { ChartInspector, type InspectPoint } from "./ChartInspector";
import { PlotShell } from "./PlotShell";
import { niceDomain, niceTicks, scale, type Domain } from "./plot";

type InspectableBarChartProps = {
  data: ChartBarDatum[];
  height?: number;
  color?: string;
  highlightLabel?: string;
  highlightColor?: string;
  /** Opacity for bars that are not `highlightLabel`. Defaults to 0.9. */
  dimOpacity?: number;
  labelEvery?: number;
  chartLabel?: string;
  yTickSuffix?: string;
  /**
   * Optional comparison line drawn across the plot — the "what would random look
   * like" baseline. Encodes the contrast on the object instead of in prose.
   */
  baseline?: { value: number; label?: string };
  /** Fixed y-axis domain (e.g. `[0, 100]` for percentages). */
  yDomain?: [number, number];
  /**
   * Fill the parent's height instead of using a fixed `height`. The parent must
   * supply a definite height (e.g. a flex-1 cell) — lets the chart match the
   * height of a sibling such as a match list.
   */
  fill?: boolean;
  /**
   * Draw each datum's `value2` as a second segment stacked above `value`, filled
   * with `color`/`label`. Turns the bars into a two-part total so the parts can be
   * read against each other (e.g. a flat regulation base with a growing stoppage
   * cap), rather than collapsing them into one height.
   */
  stack?: { color: string; label?: string };
  /** Angle season/year labels for dense categorical axes. */
  slantXLabels?: boolean;
};

/**
 * Categorical bars drawn as HTML columns over a shared frame, so they stay
 * crisp at any width and render on the server. Inspection, tap-to-pin and
 * evidence links come from {@link ChartInspector}.
 */
export function InspectableBarChart({
  data,
  height = 180,
  color = "var(--color-devil)",
  highlightLabel,
  highlightColor = "var(--color-gold)",
  dimOpacity = 0.9,
  labelEvery = 1,
  chartLabel = "Bar chart",
  yTickSuffix = "",
  baseline,
  yDomain,
  fill = false,
  stack,
  slantXLabels = false,
}: InspectableBarChartProps) {
  if (data.length === 0) return null;

  const totals = data.map((d) => (d.gap || d.value == null ? 0 : d.value + (stack ? d.value2 ?? 0 : 0)));
  const domain: Domain = yDomain ?? niceDomain([
    Math.min(0, ...totals, baseline?.value ?? 0),
    Math.max(0, ...totals, baseline?.value ?? 0),
  ]);
  const y = scale(domain, true);
  const zero = y(Math.max(domain[0], Math.min(domain[1], 0)));
  const yTicks = niceTicks(domain, 4).map((v) => ({ at: y(v), label: fmtAxisNumber(v, yTickSuffix) }));

  const band = 100 / data.length;
  const gap = band * 0.1;
  // Labels are HTML and can't measure themselves on the server, so dense slanted
  // axes keep at most ~16 ticks (Recharts used to drop overlapping ones).
  const every = Math.max(1, labelEvery, slantXLabels ? Math.ceil(data.length / 16) : 1);
  const xTicks = data.flatMap((d, i) =>
    i % every === 0 ? [{ at: (i + 0.5) * band, label: d.tickLabel ?? d.label }] : [],
  );

  const points: InspectPoint[] = data.flatMap((d, i) =>
    d.gap || d.value == null
      ? []
      : [{
          x: (i + 0.5) * band,
          x0: i * band,
          x1: (i + 1) * band,
          href: d.href,
          tip: { title: d.label, value: d.valueLabel, meta: d.meta },
        }],
  );
  const hasLinks = points.some((p) => p.href);

  return (
    <div className={fill ? "h-full w-full min-w-0" : "w-full min-w-0"}>
      <PlotShell height={height} fill={fill} yTicks={yTicks} xTicks={xTicks} slantX={slantXLabels} xAxisHeight={30}>
        <ChartInspector points={points} cursor="band" label={hasLinks ? `${chartLabel}. Select a bar to open its evidence.` : chartLabel}>
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            {data.map((d, i) => {
              if (d.gap || d.value == null) return null;
              const highlighted = d.label === highlightLabel;
              const baseTop = y(d.value);
              const capTop = stack ? y(d.value + (d.value2 ?? 0)) : baseTop;
              const left = `${i * band + gap}%`;
              const width = `${band - gap * 2}%`;
              return (
                <div key={`${d.label}-${i}`}>
                  <div
                    className={stack && (d.value2 ?? 0) > 0 ? "absolute" : "absolute rounded-t-[2px]"}
                    style={{
                      left,
                      width,
                      top: `${Math.min(baseTop, zero)}%`,
                      height: `${Math.abs(zero - baseTop)}%`,
                      minHeight: 2,
                      background: highlighted ? highlightColor : color,
                      opacity: highlighted ? 1 : dimOpacity,
                    }}
                  />
                  {stack && (d.value2 ?? 0) > 0 && (
                    <div
                      className="absolute rounded-t-[2px]"
                      style={{ left, width, top: `${capTop}%`, height: `${baseTop - capTop}%`, background: stack.color }}
                    />
                  )}
                </div>
              );
            })}
          </div>
          {baseline && (
            <div className="pointer-events-none absolute inset-x-0" style={{ top: `${y(baseline.value)}%` }} aria-hidden>
              <div className="border-t border-dashed border-ink-faint" />
              {baseline.label && (
                <span className="absolute bottom-1 left-1.5 text-[10px] leading-none text-ink-dim">{baseline.label}</span>
              )}
            </div>
          )}
        </ChartInspector>
      </PlotShell>
      <TapHint noun="bar" />
    </div>
  );
}

/** Shown only on touch devices, where hover is unavailable. */
export function TapHint({ noun, text }: { noun?: string; text?: string }) {
  return (
    <p className="mt-1.5 hidden text-center text-[11px] text-ink-faint pointer-coarse:block">
      {text ?? `Tap a ${noun} to inspect`}
    </p>
  );
}
