import type { ManagerLongevityPoint } from "@/lib/trails";
import { fmtAxisNumber, fmtNum } from "@/lib/format";
import { ChartInspector, type InspectPoint } from "./ChartInspector";
import { PlotShell } from "./PlotShell";
import { niceTicks, scale } from "./plot";

const KIND_STYLE: Record<
  ManagerLongevityPoint["kind"],
  { fill: string; stroke: string; z: number; label?: boolean; opacity: number }
> = {
  ferguson: { fill: "var(--color-gold)", stroke: "var(--color-gold)", z: 140, label: true, opacity: 1 },
  busby: { fill: "var(--color-gold)", stroke: "var(--color-gold)", z: 110, label: true, opacity: 1 },
  since: { fill: "var(--color-europe)", stroke: "var(--color-europe)", z: 70, opacity: 0.85 },
  other: { fill: "var(--color-ink-dim)", stroke: "var(--color-ink-faint)", z: 40, opacity: 0.55 },
};

/** Every manager by matches in charge against points per game. */
export function ManagerLongevityChart({ points }: { points: ManagerLongevityPoint[] }) {
  if (points.length === 0) return null;

  const ferg = points.find((p) => p.kind === "ferguson");
  const maxMatches = Math.max(...points.map((p) => p.matches));
  const yMin = Math.floor(Math.min(...points.map((p) => p.ppg)) * 20) / 20 - 0.05;
  const yMax = Math.ceil(Math.max(...points.map((p) => p.ppg)) * 20) / 20 + 0.05;
  const sx = scale([0, maxMatches * 1.05]);
  const sy = scale([yMin, yMax], true);
  const yTicks = niceTicks([yMin, yMax], 4).map((v) => ({ at: sy(v), label: v.toFixed(2) }));
  const xTickValues = niceTicks([0, maxMatches * 1.05], 3);
  const xTicks = xTickValues.map((v) => ({ at: sx(v), label: fmtAxisNumber(v) }));

  const inspect: InspectPoint[] = points.map((p) => ({
    x: sx(p.matches),
    y: sy(p.ppg),
    href: p.href,
    tip: { title: p.label, value: `${p.ppg.toFixed(2)} ppg`, meta: `${fmtNum(p.matches)} official matches` },
  }));

  return (
    <div className="w-full space-y-1">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[11px] text-ink-dim">
        <span>Matches in charge →</span>
        <span>↑ points per game</span>
      </div>
      <PlotShell height={280} yAxisWidth={40} yTicks={yTicks} xTicks={xTicks} padTop={16} padRight={16} grid="dashed">
        <ChartInspector points={inspect} mode="xy" cursor="none" label="Manchester United managers by matches in charge and points per game. Select a manager to open their record.">
          <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            {xTickValues.map((v) => (
              <line key={v} x1={sx(v)} x2={sx(v)} y1={0} y2={100} stroke="var(--color-line)" strokeOpacity={0.35} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
            ))}
            {ferg && (
              <g stroke="var(--color-gold)" strokeOpacity={0.35} strokeDasharray="4 4">
                <line x1={sx(ferg.matches)} x2={sx(ferg.matches)} y1={0} y2={100} vectorEffect="non-scaling-stroke" />
                <line x1={0} x2={100} y1={sy(ferg.ppg)} y2={sy(ferg.ppg)} vectorEffect="non-scaling-stroke" />
              </g>
            )}
          </svg>
          {points.map((p) => {
            const style = KIND_STYLE[p.kind];
            const d = Math.sqrt(style.z) * 0.85 * 2;
            return (
              <div key={`${p.label}-${p.matches}`} aria-hidden className="pointer-events-none absolute" style={{ left: `${sx(p.matches)}%`, top: `${sy(p.ppg)}%` }}>
                <span
                  className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{
                    width: d,
                    height: d,
                    background: `color-mix(in srgb, ${style.fill} ${style.opacity * 100}%, transparent)`,
                    border: `${p.kind === "ferguson" ? 2 : 1}px solid color-mix(in srgb, ${style.stroke} ${p.kind === "ferguson" ? 100 : 70}%, transparent)`,
                  }}
                />
                {style.label && (
                  <span
                    className="absolute -translate-x-1/2 whitespace-nowrap text-[10px] font-medium leading-none text-ink pointer-coarse:hidden"
                    style={{ bottom: d / 2 + 6 }}
                  >
                    {p.label}
                  </span>
                )}
              </div>
            );
          })}
        </ChartInspector>
      </PlotShell>
      <p className="hidden text-center text-[11px] text-ink-faint pointer-coarse:block">Tap a point to inspect · tap again to open</p>
      <p className="text-center text-[11px] text-ink-faint pointer-coarse:hidden">Click a point to open that manager&apos;s record</p>
    </div>
  );
}
