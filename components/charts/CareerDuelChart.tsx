"use client";

import { type MouseEvent as ReactMouseEvent, useId } from "react";
import { useRouter } from "next/navigation";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CareerChartMetric, CareerSeason } from "@/lib/compare";
import type { MouseHandlerDataParam } from "recharts";
import { fmtAxisNumber } from "@/lib/format";
import { useChartPin, useCoarsePointer } from "./useChartPin";

// Identity colours mirror CompareSignatures: side A is United red, side B a cool
// blue, so the pair stays separable and consistent with the rest of the comparison.
const A_COLOR = "var(--color-devil-bright)";
const B_COLOR = "var(--color-europe)";

interface DuelDatum {
  n: number;
  aSeason?: string;
  bSeason?: string;
  aApps?: number;
  bApps?: number;
  aStarts?: number;
  bStarts?: number;
  aGoals?: number;
  bGoals?: number;
  aMinutes?: number;
  bMinutes?: number;
  aPer90?: number | null;
  bPer90?: number | null;
  aCleanSheets?: number;
  bCleanSheets?: number;
  aCsPct?: number | null;
  bCsPct?: number | null;
  aHref?: string;
  bHref?: string;
}

function Swatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-[2px]" style={{ background: color }} aria-hidden />
      <span className="font-medium text-ink">{label}</span>
    </span>
  );
}

function csPct(cleanSheets: number, starts: number): number | null {
  return starts > 0 ? (100 * cleanSheets) / starts : null;
}

/** Merge two careers onto a shared career-season axis (n = 1..maxN). This is the
 *  frame that lets a generation-apart pair rhyme: Best's 4th season sits over
 *  Ronaldo's 4th, regardless of the decade. */
function merge(a: CareerSeason[], b: CareerSeason[], aId: string, bId: string): DuelDatum[] {
  const maxN = Math.max(a.length, b.length);
  const seasonHref = (id: string, season?: string) => (season ? `/matches?player=${id}&season=${season}` : undefined);
  const per90 = (goals?: number, minutes?: number) => (goals != null && minutes && minutes > 0 ? (goals * 90) / minutes : null);
  const out: DuelDatum[] = [];
  for (let n = 1; n <= maxN; n++) {
    const sa = a[n - 1];
    const sb = b[n - 1];
    out.push({
      n,
      aSeason: sa?.season,
      bSeason: sb?.season,
      aApps: sa?.apps,
      bApps: sb?.apps,
      aStarts: sa?.starts,
      bStarts: sb?.starts,
      aGoals: sa?.goals,
      bGoals: sb?.goals,
      aMinutes: sa?.minutes,
      bMinutes: sb?.minutes,
      aPer90: per90(sa?.goals, sa?.minutes),
      bPer90: per90(sb?.goals, sb?.minutes),
      aCleanSheets: sa?.cleanSheets,
      bCleanSheets: sb?.cleanSheets,
      aCsPct: sa ? csPct(sa.cleanSheets, sa.starts) : null,
      bCsPct: sb ? csPct(sb.cleanSheets, sb.starts) : null,
      aHref: seasonHref(aId, sa?.season),
      bHref: seasonHref(bId, sb?.season),
    });
  }
  return out;
}

function peakN(seasons: CareerSeason[], rate: boolean, chart: CareerChartMetric): number | null {
  if (!seasons.length) return null;
  const score =
    chart === "cleanSheets"
      ? (s: CareerSeason) => (rate ? csPct(s.cleanSheets, s.starts) ?? -1 : s.cleanSheets)
      : (s: CareerSeason) => (rate ? (s.minutes > 0 ? (s.goals * 90) / s.minutes : -1) : s.goals);
  const peak = seasons.reduce((m, s) => (score(s) > score(m) ? s : m), seasons[0]);
  return score(peak) > 0 ? peak.n : null;
}

function chartKeys(chart: CareerChartMetric, rate: boolean): { aKey: keyof DuelDatum; bKey: keyof DuelDatum } {
  if (chart === "cleanSheets") {
    return rate ? { aKey: "aCsPct", bKey: "bCsPct" } : { aKey: "aCleanSheets", bKey: "bCleanSheets" };
  }
  return rate ? { aKey: "aPer90", bKey: "bPer90" } : { aKey: "aGoals", bKey: "bGoals" };
}

function chartLabels(chart: CareerChartMetric, rate: boolean) {
  if (chart === "cleanSheets") {
    return {
      title: rate ? "Clean sheet % by career season" : "Clean sheets by career season",
      yAxis: rate ? "Clean sheet %" : "Clean sheets",
      aria: "Clean sheets per season",
      suffix: rate ? "%" : " clean sheets",
      context: "starts",
    };
  }
  return {
    title: rate ? "Goals per 90 by career season" : "Goals by career season",
    yAxis: rate ? "Goals per 90" : "Goals",
    aria: "Goals per season",
    suffix: rate ? " / 90" : " goals",
    context: "apps",
  };
}

function fmtVal(v: number | null | undefined, rate: boolean, chart: CareerChartMetric): string {
  if (v == null) return "—";
  if (chart === "cleanSheets" && rate) return `${v.toFixed(0)}%`;
  return rate ? v.toFixed(2) : String(v);
}

function DuelTooltip({
  active,
  payload,
  labelA,
  labelB,
  rate,
  chart,
  pinned = false,
}: {
  active?: boolean;
  payload?: { payload: DuelDatum }[];
  labelA: string;
  labelB: string;
  rate: boolean;
  chart: CareerChartMetric;
  pinned?: boolean;
}) {
  if ((!active && !pinned) || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  const { aKey, bKey } = chartKeys(chart, rate);
  const labels = chartLabels(chart, rate);
  const row = (
    name: string,
    season: string | undefined,
    value: number | null | undefined,
    context: number | undefined,
    color: string,
  ) => (
    <div className="mt-1.5 first:mt-0">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-medium" style={{ color }}>{name}</span>
        <span className="stat-num text-sm font-semibold text-ink">
          {fmtVal(value, rate, chart)}{labels.suffix}
        </span>
      </div>
      <div className="stat-num text-[11px] text-ink-faint">
        {season ?? "—"}{!rate && context != null ? ` · ${context} ${labels.context}` : ""}
      </div>
    </div>
  );
  return (
    <div
      className={`min-w-44 rounded-md border bg-panel px-3 py-2 text-xs shadow-[0_10px_30px_rgb(0_0_0_/_0.35)] ${
        pinned ? "border-devil/40 ring-1 ring-devil/15" : "border-line"
      }`}
      role={pinned ? "status" : undefined}
    >
      <div className="text-ink-faint">Season {d.n}</div>
      {row(labelA, d.aSeason, d[aKey] as number | null | undefined, chart === "cleanSheets" ? d.aStarts : d.aApps, A_COLOR)}
      {row(labelB, d.bSeason, d[bKey] as number | null | undefined, chart === "cleanSheets" ? d.bStarts : d.bApps, B_COLOR)}
      {pinned && (
        <div className="mt-1 text-[11px] text-ink-faint">Tap a point again to open matches · tap elsewhere to dismiss</div>
      )}
    </div>
  );
}

/**
 * Two careers as overlaid curves on a shared career-season axis — peak, longevity,
 * and trajectory at a glance. Outfield pairs plot goals; defensive pairs plot clean
 * sheets. `rate` rescales between totals and per-90 / clean-sheet %.
 */
export function CareerDuelChart({
  a,
  b,
  aId,
  bId,
  labelA,
  labelB,
  rate = false,
  chart = "goals",
  height = 264,
  emphasisSeason,
  emphasisLabel,
  showTooltip = true,
}: {
  a: CareerSeason[];
  b: CareerSeason[];
  aId: string;
  bId: string;
  labelA: string;
  labelB: string;
  rate?: boolean;
  chart?: CareerChartMetric;
  height?: number;
  /** A chapter can make one shared career season the visual subject. */
  emphasisSeason?: number;
  emphasisLabel?: string;
  /** Story charts can reserve hover for direct point navigation. */
  showTooltip?: boolean;
}) {
  const gid = useId().replace(/:/g, "");
  const router = useRouter();
  const coarse = useCoarsePointer();
  const { pinned, pin, rootRef } = useChartPin<DuelDatum>();
  const data = merge(a, b, aId, bId);
  if (!data.length) return null;

  const { aKey, bKey } = chartKeys(chart, rate);
  const labels = chartLabels(chart, rate);
  const maxN = data[data.length - 1].n;
  const values = data.flatMap((d) => [d[aKey], d[bKey]]).filter((v): v is number => v != null);
  const yMax = values.length ? Math.max(...values) : 1;
  const peakA = peakN(a, rate, chart);
  const peakB = peakN(b, rate, chart);

  const dotFor = (series: "a" | "b") => {
    const peak = series === "a" ? peakA : peakB;
    const color = series === "a" ? A_COLOR : B_COLOR;
    const hitRadius = coarse ? 14 : 9;
    function Dot(props: { cx?: number; cy?: number; payload?: DuelDatum }) {
      const { cx, cy, payload } = props;
      if (cx == null || cy == null || !payload) return <g />;
      const href = series === "a" ? payload.aHref : payload.bHref;
      const isPeak = payload.n === peak;
      const isEmphasized = payload.n === emphasisSeason;
      // The peak/emphasis circles are painted above the generous transparent
      // hit target. Bind the activation to their shared group so clicking the
      // visible marker opens its season too, rather than falling through to the
      // chart's coarse-pointer inspection handler.
      const onActivate = (event: ReactMouseEvent<SVGGElement>) => {
        event.stopPropagation();
        if (coarse && pinned === payload && href) {
          router.push(href);
          return;
        }
        if (coarse) {
          pin(payload);
          return;
        }
        if (href) router.push(href);
      };
      return (
        <g className={href ? "cursor-pointer" : undefined} onClick={href ? onActivate : undefined}>
          <circle
            cx={cx}
            cy={cy}
            r={hitRadius}
            fill="transparent"
          />
          {isEmphasized && (
            <circle
              cx={cx}
              cy={cy}
              r={10}
              fill="var(--color-pitch)"
              stroke="var(--color-gold)"
              strokeWidth={2}
              pointerEvents="none"
            />
          )}
          {isPeak && (
            <circle
              cx={cx}
              cy={cy}
              r={isEmphasized ? 5.5 : 4.5}
              fill={color}
              stroke="var(--color-panel)"
              strokeWidth={1.5}
              pointerEvents="none"
            />
          )}
        </g>
      );
    }
    return Dot;
  };

  const onChartClick = (state: MouseHandlerDataParam) => {
    if (!coarse) return;
    const idx = state.activeIndex ?? state.activeTooltipIndex;
    if (typeof idx === "number" && data[idx]) pin(data[idx]);
  };

  return (
    <div ref={rootRef} className="flex h-auto w-full flex-col" style={{ height }}>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <div className="flex items-center gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
            {labels.title}
          </p>
          {emphasisSeason != null && (
            <span className="stat-num text-[10px] font-semibold uppercase tracking-[0.14em] text-gold">
              {emphasisLabel ?? `Season ${emphasisSeason}`}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-dim">
          <Swatch color={A_COLOR} label={labelA} />
          <Swatch color={B_COLOR} label={labelB} />
        </div>
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="flex w-4 shrink-0 items-center justify-center">
          <span
            className="mt-1 text-center text-[10px] text-ink-faint"
            style={{ writingMode: "vertical-rl", transform: "translateY(-10px) rotate(180deg)" }}
          >
            {labels.yAxis}
          </span>
        </div>
        <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 800, height }}>
          <AreaChart
            data={data}
            margin={{ top: 12, right: 12, bottom: 24, left: 0 }}
            accessibilityLayer
            aria-label={`${labels.aria}: ${labelA} vs ${labelB}`}
            onClick={onChartClick}
          >
          <title>Click a point to open that player&apos;s matches for the season</title>
          <defs>
            <linearGradient id={`duel-a-${gid}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={A_COLOR} stopOpacity={0.26} />
              <stop offset="100%" stopColor={A_COLOR} stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id={`duel-b-${gid}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={B_COLOR} stopOpacity={0.22} />
              <stop offset="100%" stopColor={B_COLOR} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          {emphasisSeason != null && (
            <ReferenceArea
              x1={emphasisSeason - 0.24}
              x2={emphasisSeason + 0.24}
              fill="var(--color-gold)"
              fillOpacity={0.1}
              ifOverflow="extendDomain"
            />
          )}
          <CartesianGrid stroke="var(--color-line)" strokeOpacity={0.6} vertical={false} />
          <XAxis
            dataKey="n"
            type="number"
            domain={[1, maxN]}
            ticks={maxN > 1 ? [1, maxN] : [1]}
            tickMargin={8}
            axisLine={false}
            tickLine={false}
            stroke="var(--color-ink-faint)"
            fontSize={11}
            label={{
              value: "Career season",
              position: "insideBottom",
              offset: -4,
              style: { fill: "var(--color-ink-faint)", fontSize: 11, textAnchor: "middle" },
            }}
          />
          <YAxis
            type="number"
            domain={[0, yMax * 1.1]}
            axisLine={false}
            tickLine={false}
            tickMargin={6}
            width={36}
            stroke="var(--color-ink-faint)"
            fontSize={11}
            tickFormatter={(v) => (rate ? (v as number).toFixed(chart === "cleanSheets" ? 0 : 1) : fmtAxisNumber(v, ""))}
            allowDecimals={rate}
          />
          {!coarse && showTooltip && (
            <Tooltip
              content={<DuelTooltip labelA={labelA} labelB={labelB} rate={rate} chart={chart} />}
              cursor={{ stroke: "var(--color-ink-dim)", strokeOpacity: 0.4, strokeWidth: 1 }}
              isAnimationActive={false}
            />
          )}
          <Area
            type="monotone"
            dataKey={aKey}
            name={labelA}
            stroke={A_COLOR}
            strokeWidth={2}
            fill={`url(#duel-a-${gid})`}
            dot={dotFor("a")}
            activeDot={showTooltip ? { r: coarse ? 7 : 4, stroke: A_COLOR, strokeWidth: 2, fill: "var(--color-panel)" } : false}
            connectNulls
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey={bKey}
            name={labelB}
            stroke={B_COLOR}
            strokeWidth={2}
            fill={`url(#duel-b-${gid})`}
            dot={dotFor("b")}
            activeDot={showTooltip ? { r: coarse ? 7 : 4, stroke: B_COLOR, strokeWidth: 2, fill: "var(--color-panel)" } : false}
            connectNulls
            isAnimationActive={false}
          />
        </AreaChart>
        </ResponsiveContainer>
        </div>
      </div>
      {coarse && pinned && (
        <div className="mt-2">
          <DuelTooltip active pinned payload={[{ payload: pinned }]} labelA={labelA} labelB={labelB} rate={rate} chart={chart} />
        </div>
      )}
      <p className="mt-1 text-center text-[11px] text-ink-faint sm:hidden">Tap a point to inspect</p>
      <p className="mt-1 hidden text-center text-[11px] text-ink-faint sm:block">
        Click a point to open that player&apos;s matches for the season
      </p>
    </div>
  );
}
