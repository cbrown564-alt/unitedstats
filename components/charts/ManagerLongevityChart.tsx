"use client";

import { useRouter } from "next/navigation";
import {
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import type { ManagerLongevityPoint } from "@/lib/trails";
import type { MouseHandlerDataParam } from "recharts";
import { fmtAxisNumber, fmtNum } from "@/lib/format";
import { QuietAnalystTooltip } from "./QuietAnalystTooltip";
import { useChartPin, useCoarsePointer } from "./useChartPin";

const KIND_STYLE: Record<
  ManagerLongevityPoint["kind"],
  { fill: string; stroke: string; z: number; label?: boolean }
> = {
  ferguson: { fill: "var(--color-gold)", stroke: "var(--color-gold)", z: 140, label: true },
  busby: { fill: "var(--color-gold)", stroke: "var(--color-gold)", z: 110, label: true },
  since: { fill: "var(--color-europe)", stroke: "var(--color-europe)", z: 70 },
  other: { fill: "var(--color-ink-dim)", stroke: "var(--color-ink-faint)", z: 40 },
};

type ChartDatum = ManagerLongevityPoint & {
  valueLabel: string;
  meta: string;
};

function toChartDatum(p: ManagerLongevityPoint): ChartDatum {
  return {
    ...p,
    valueLabel: `${p.ppg.toFixed(2)} ppg`,
    meta: `${fmtNum(p.matches)} official matches`,
  };
}

function LongevityDot({
  cx,
  cy,
  payload,
}: {
  cx?: number;
  cy?: number;
  payload?: ChartDatum;
}) {
  if (cx == null || cy == null || !payload) return null;
  const style = KIND_STYLE[payload.kind];
  const r = Math.sqrt(style.z) * 0.85;
  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={style.fill}
        fillOpacity={payload.kind === "other" ? 0.55 : payload.kind === "since" ? 0.85 : 1}
        stroke={style.stroke}
        strokeWidth={payload.kind === "ferguson" ? 2 : 1}
        strokeOpacity={payload.kind === "ferguson" ? 1 : 0.7}
      />
      {style.label && (
        <text
          x={cx}
          y={cy - r - 6}
          textAnchor="middle"
          className="fill-ink text-[10px] font-medium"
          style={{ fontSize: 10 }}
        >
          {payload.label}
        </text>
      )}
    </g>
  );
}

export function ManagerLongevityChart({ points }: { points: ManagerLongevityPoint[] }) {
  const router = useRouter();
  const coarse = useCoarsePointer();
  const { pinned, pin, rootRef } = useChartPin<ChartDatum>();

  if (points.length === 0) return null;

  const data = points.map(toChartDatum);
  const ferg = data.find((p) => p.kind === "ferguson");
  const maxMatches = Math.max(...data.map((p) => p.matches));
  const yMin = Math.floor(Math.min(...data.map((p) => p.ppg)) * 20) / 20 - 0.05;
  const yMax = Math.ceil(Math.max(...data.map((p) => p.ppg)) * 20) / 20 + 0.05;

  const onActivate = (d: ChartDatum) => {
    if (coarse) {
      pin(d);
      return;
    }
    router.push(d.href);
  };

  const onDotClick = (d: ChartDatum) => {
    if (coarse && pinned === d && d.href) {
      router.push(d.href);
      return;
    }
    onActivate(d);
  };

  const onChartClick = (state: MouseHandlerDataParam) => {
    if (!coarse) return;
    const idx = state.activeIndex ?? state.activeTooltipIndex;
    if (typeof idx === "number" && data[idx]) onDotClick(data[idx]);
  };

  return (
    <div ref={rootRef} className="space-y-1">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[11px] text-ink-dim">
        <span>Matches in charge →</span>
        <span>↑ points per game</span>
      </div>
      <div style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <ScatterChart
            margin={{ top: 16, right: 8, bottom: 4, left: 0 }}
            accessibilityLayer
            aria-label="Manchester United managers by matches in charge and points per game"
            onClick={onChartClick}
          >
            <CartesianGrid stroke="var(--color-line)" strokeOpacity={0.35} strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="matches"
              domain={[0, maxMatches * 1.05]}
              tickLine={false}
              axisLine={false}
              stroke="var(--color-ink-faint)"
              fontSize={10}
              tickFormatter={(v) => fmtAxisNumber(v)}
            />
            <YAxis
              type="number"
              dataKey="ppg"
              domain={[yMin, yMax]}
              tickLine={false}
              axisLine={false}
              stroke="var(--color-ink-faint)"
              fontSize={10}
              width={36}
              tickFormatter={(v) => v.toFixed(2)}
            />
            {ferg && (
              <>
                <ReferenceLine
                  x={ferg.matches}
                  stroke="var(--color-gold)"
                  strokeDasharray="4 4"
                  strokeOpacity={0.35}
                />
                <ReferenceLine
                  y={ferg.ppg}
                  stroke="var(--color-gold)"
                  strokeDasharray="4 4"
                  strokeOpacity={0.35}
                />
              </>
            )}
            {!coarse && (
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                content={({ active, payload }) => (
                  <QuietAnalystTooltip
                    active={active}
                    payload={payload as unknown as { payload: ChartDatum }[] | undefined}
                  />
                )}
                isAnimationActive={false}
              />
            )}
            <Scatter
              data={data}
              isAnimationActive={false}
              shape={(props) => <LongevityDot {...props} />}
              onClick={(point) => {
                if (point && typeof point === "object" && "href" in point) onDotClick(point as unknown as ChartDatum);
              }}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      {coarse && pinned && (
        <QuietAnalystTooltip active pinned payload={[{ payload: pinned }]} />
      )}
      <p className="text-center text-[11px] text-ink-faint sm:hidden">Tap a point to inspect · tap again to open</p>
      <p className="hidden text-center text-[11px] text-ink-faint sm:block">Click a point to open that manager&apos;s record</p>
    </div>
  );
}
