"use client";

import { useRouter } from "next/navigation";
import {
  Bar,
  BarChart,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { EraFinish } from "@/lib/compare";
import type { MouseHandlerDataParam } from "recharts";
import { useChartPin, useCoarsePointer } from "./useChartPin";

// Identity colours mirror the static signature and the career duel: side A is
// United red, side B a cool blue; gold is reserved for a title.
const A_COLOR = "var(--color-devil-bright)";
const B_COLOR = "var(--color-europe)";
const GOLD = "var(--color-gold)";
const RED = "var(--color-loss)";
const NEUTRAL = "var(--color-ink-dim)";

interface SkylineDatum {
  season: string;
  tickLabel: string;
  /** Inverted finish (1st ⇒ tallest); negative for seasons outside the top flight,
   *  so they read as stubs below the baseline like the static skyline. */
  value: number;
  position: number | null;
  champion: boolean;
  topFlight: boolean;
  ppg: number | null;
  href: string;
}

/** Turn a finish trajectory into chart data, inverting position so taller is
 *  better and pushing non-top-flight seasons below the baseline. */
function toData(finishes: EraFinish[]): SkylineDatum[] {
  const topPositions = finishes.filter((f) => f.topFlight && f.position != null).map((f) => f.position as number);
  const maxPos = Math.max(20, ...topPositions);
  return finishes.map((f, i) => {
    const shortYear = `'${f.season.slice(5)}`;
    const first = i === 0;
    const last = i === finishes.length - 1;
    return {
      season: f.season,
      tickLabel: first || last ? shortYear : "",
      value: f.topFlight && f.position != null ? maxPos - f.position + 1 : -2,
      position: f.position,
      champion: f.champion,
      topFlight: f.topFlight,
      ppg: f.ppg,
      href: `/matches?season=${f.season}&sort=oldest`,
    };
  });
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

function SkylineTooltip({
  active,
  payload,
  pinned = false,
}: {
  active?: boolean;
  payload?: { payload: SkylineDatum }[];
  label?: string;
  pinned?: boolean;
}) {
  if ((!active && !pinned) || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  const finishLine = d.champion
    ? "Champions"
    : d.topFlight
      ? d.position != null ? ordinal(d.position) : "—"
      : "Outside the top flight";
  return (
    <div
      className={`min-w-40 rounded-md border bg-panel px-3 py-2 text-xs shadow-[0_10px_30px_rgb(0_0_0_/_0.35)] ${
        pinned ? "border-devil/40 ring-1 ring-devil/15" : "border-line"
      }`}
      role={pinned ? "status" : undefined}
    >
      <div className="text-ink-faint">{d.season}</div>
      <div className="mt-1 flex items-baseline justify-between gap-3">
        <span className="font-semibold text-ink">{finishLine}</span>
        {d.ppg != null && <span className="stat-num text-ink-dim">{d.ppg.toFixed(2)} pts/game</span>}
      </div>
      {pinned && <div className="mt-1 text-[11px] text-ink-faint">Tap again to open that season · tap elsewhere to dismiss</div>}
    </div>
  );
}

function SkylinePanel({
  finishes,
  label,
  sideColor,
}: {
  finishes: EraFinish[];
  label: string;
  sideColor: string;
}) {
  const router = useRouter();
  const coarse = useCoarsePointer();
  const { pinned, pin, rootRef } = useChartPin<SkylineDatum>();
  const data = toData(finishes);
  if (!data.length) return null;
  const titles = finishes.filter((f) => f.champion).length;
  const topPositions = finishes.filter((f) => f.topFlight && f.position != null).map((f) => f.position as number);
  const maxPos = Math.max(20, ...topPositions);

  const onBarClick = (d: SkylineDatum) => {
    if (coarse && pinned === d) {
      router.push(d.href);
      return;
    }
    if (coarse) {
      pin(d);
      return;
    }
    router.push(d.href);
  };

  const onChartClick = (state: MouseHandlerDataParam) => {
    if (!coarse) return;
    const idx = state.activeIndex ?? state.activeTooltipIndex;
    if (typeof idx === "number" && data[idx]) onBarClick(data[idx]);
  };

  return (
    <div ref={rootRef} className="rounded-lg border border-line bg-pitch/40 p-3 sm:p-4">
      <div className="mb-1.5 flex items-baseline justify-between gap-2 text-xs">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[2px]" style={{ background: sideColor }} aria-hidden />
          <span className="font-medium text-ink">{label}</span>
        </span>
        <span className="text-ink-faint">
          <span className="stat-num text-gold">{titles}</span> {titles === 1 ? "title" : "titles"} ·{" "}
          <span className="stat-num text-ink-dim">{finishes.length}</span> seasons
        </span>
      </div>
      <div style={{ height: 132 }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 800, height: 132 }}>
          <BarChart
            data={data}
            margin={{ top: 8, right: 4, bottom: 0, left: 0 }}
            accessibilityLayer
            aria-label={`League finishes, ${label}: ${titles} titles`}
            onClick={onChartClick}
          >
            <title>Click a bar to open that season&apos;s matches</title>
            {/* The baseline: top-flight finishes rise above it, lower-division seasons sit below. */}
            <ReferenceLine y={0} stroke="var(--color-line)" />
            <XAxis
              dataKey="season"
              tickLine={false}
              axisLine={false}
              tickMargin={6}
              interval="preserveStartEnd"
              minTickGap={4}
              stroke="var(--color-ink-faint)"
              fontSize={10}
              tickFormatter={(_v, i) => data[i]?.tickLabel ?? ""}
            />
            <YAxis hide domain={[-3, maxPos]} />
            {!coarse && (
              <Tooltip content={<SkylineTooltip />} cursor={{ fill: "rgb(255 255 255 / 0.035)" }} isAnimationActive={false} />
            )}
            <Bar dataKey="value" isAnimationActive={false} radius={[2, 2, 0, 0]}>
              {data.map((d, i) => {
                const fill = d.value < 0
                  ? RED
                  : d.champion
                    ? GOLD
                    : d.topFlight && d.position != null && d.position >= maxPos - 2
                      ? RED
                      : NEUTRAL;
                return (
                  <Cell
                    key={`${d.season}-${i}`}
                    className="cursor-pointer"
                    fill={fill}
                    fillOpacity={d.value < 0 ? 0.8 : d.champion ? 1 : 0.85}
                    onClick={() => onBarClick(d)}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {coarse && pinned && (
        <div className="mt-2">
          <SkylineTooltip active pinned payload={[{ payload: pinned }]} />
        </div>
      )}
    </div>
  );
}

/**
 * Two eras as interactive league-finish skylines — titles in gold at the top,
 * mid-table neutral, relegation scrapes and seasons outside the top flight in
 * deep red. Each bar opens that season's matches. The static {@link EraSkyline}
 * stays for the SSR /explore preview where a client chart would flash blank.
 */
export function EraSkylineChart({
  a,
  b,
  labelA,
  labelB,
}: {
  a: EraFinish[];
  b: EraFinish[];
  labelA: string;
  labelB: string;
}) {
  return (
    <div className="space-y-3">
      <SkylinePanel finishes={a} label={labelA} sideColor={A_COLOR} />
      <SkylinePanel finishes={b} label={labelB} sideColor={B_COLOR} />
      <p className="text-center text-[11px] text-ink-faint sm:hidden">Tap a bar to inspect · tap again to open</p>
      <p className="hidden text-center text-[11px] text-ink-faint sm:block">Click a bar to open that season&apos;s matches</p>
    </div>
  );
}
