"use client";

import { useId } from "react";
import { useRouter } from "next/navigation";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CareerSeason } from "@/lib/compare";
import { fmtAxisNumber } from "@/lib/format";

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
  aGoals?: number;
  bGoals?: number;
  aMinutes?: number;
  bMinutes?: number;
  aPer90?: number | null;
  bPer90?: number | null;
  aHref?: string;
  bHref?: string;
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
      aGoals: sa?.goals,
      bGoals: sb?.goals,
      aMinutes: sa?.minutes,
      bMinutes: sb?.minutes,
      aPer90: per90(sa?.goals, sa?.minutes),
      bPer90: per90(sb?.goals, sb?.minutes),
      aHref: seasonHref(aId, sa?.season),
      bHref: seasonHref(bId, sb?.season),
    });
  }
  return out;
}

function peakN(seasons: CareerSeason[], rate: boolean): number | null {
  if (!seasons.length) return null;
  const score = (s: CareerSeason) => (rate ? (s.minutes > 0 ? (s.goals * 90) / s.minutes : -1) : s.goals);
  const peak = seasons.reduce((m, s) => (score(s) > score(m) ? s : m), seasons[0]);
  return score(peak) > 0 ? peak.n : null;
}

function fmtVal(v: number | null | undefined, rate: boolean): string {
  if (v == null) return "—";
  return rate ? v.toFixed(2) : String(v);
}

function DuelTooltip({
  active,
  payload,
  labelA,
  labelB,
  rate,
}: {
  active?: boolean;
  payload?: { payload: DuelDatum }[];
  labelA: string;
  labelB: string;
  rate: boolean;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  const row = (
    name: string,
    season: string | undefined,
    value: number | null | undefined,
    apps: number | undefined,
    color: string,
  ) => (
    <div className="mt-1.5 first:mt-0">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-medium" style={{ color }}>{name}</span>
        <span className="stat-num text-sm font-semibold text-ink">
          {fmtVal(value, rate)}{rate ? " / 90" : " goals"}
        </span>
      </div>
      <div className="stat-num text-[11px] text-ink-faint">
        {season ?? "—"}{!rate && apps != null ? ` · ${apps} apps` : ""}
      </div>
    </div>
  );
  return (
    <div className="min-w-44 rounded-md border border-line bg-panel px-3 py-2 text-xs shadow-[0_10px_30px_rgb(0_0_0_/_0.35)]">
      <div className="text-ink-faint">Season {d.n}</div>
      {row(labelA, d.aSeason, rate ? d.aPer90 : d.aGoals, d.aApps, A_COLOR)}
      {row(labelB, d.bSeason, rate ? d.bPer90 : d.bGoals, d.bApps, B_COLOR)}
    </div>
  );
}

/**
 * Two scoring careers as overlaid curves on a shared career-season axis — peak,
 * longevity, and trajectory read at a glance, the thing two totals never show.
 * `rate` rescales the y-axis between total goals and goals-per-appearance, so a
 * short electric career holds its own against a long accumulator. Hover syncs
 * both series and links out to either player's matches for that season.
 */
export function CareerDuelChart({
  a,
  b,
  aId,
  bId,
  labelA,
  labelB,
  rate = false,
  height = 264,
}: {
  a: CareerSeason[];
  b: CareerSeason[];
  aId: string;
  bId: string;
  labelA: string;
  labelB: string;
  rate?: boolean;
  height?: number;
}) {
  const gid = useId().replace(/:/g, "");
  const router = useRouter();
  const data = merge(a, b, aId, bId);
  if (!data.length) return null;

  const aKey = rate ? "aPer90" : "aGoals";
  const bKey = rate ? "bPer90" : "bGoals";
  const maxN = data[data.length - 1].n;
  const values = data.flatMap((d) => [rate ? d.aPer90 : d.aGoals, rate ? d.bPer90 : d.bGoals]).filter((v): v is number => v != null);
  const yMax = values.length ? Math.max(...values) : 1;
  const peakA = peakN(a, rate);
  const peakB = peakN(b, rate);

  const dotFor = (series: "a" | "b") => {
    const peak = series === "a" ? peakA : peakB;
    const color = series === "a" ? A_COLOR : B_COLOR;
    function Dot(props: { cx?: number; cy?: number; payload?: DuelDatum }) {
      const { cx, cy, payload } = props;
      if (cx == null || cy == null || !payload) return <g />;
      const href = series === "a" ? payload.aHref : payload.bHref;
      const isPeak = payload.n === peak;
      return (
        <g>
          {/* Generous transparent hit target so any point opens that player's
              season; the cursor is the affordance. Visible only at the peak. */}
          <circle
            cx={cx}
            cy={cy}
            r={9}
            fill="transparent"
            className={href ? "cursor-pointer" : undefined}
            onClick={() => href && router.push(href)}
          />
          {isPeak && (
            <circle cx={cx} cy={cy} r={4.5} fill={color} stroke="var(--color-panel)" strokeWidth={1.5} />
          )}
        </g>
      );
    }
    return Dot;
  };

  return (
    <div className="flex h-auto w-full flex-col" style={{ height }}>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
        {rate ? "Goals per 90 by career season" : "Goals by career season"}
      </p>
      <div className="flex min-h-0 flex-1">
        {/* Y-axis title lives in an HTML gutter, not as Recharts SVG <text>, so the
            chart's SVG can't clip it at the top/bottom. Reads bottom-to-top.
            translateY centres it on the plot (which sits above the x-axis-title
            margin) rather than on plot+margin. */}
        <div className="flex w-4 shrink-0 items-center justify-center">
          <span
            className="mt-1 text-center text-[10px] text-ink-faint"
            style={{ writingMode: "vertical-rl", transform: "translateY(-10px) rotate(180deg)" }}
          >
            {rate ? "Goals per 90" : "Goals"}
          </span>
        </div>
        <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 800, height }}>
          <AreaChart data={data} margin={{ top: 12, right: 12, bottom: 24, left: 0 }} accessibilityLayer aria-label={`Goals per season: ${labelA} vs ${labelB}`}>
          {/* Matches InspectableBarChart: a <title> surfaces the click affordance
              on hover, complementing the cursor change on each point. */}
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
            tickFormatter={(v) => (rate ? (v as number).toFixed(1) : fmtAxisNumber(v, ""))}
            allowDecimals={rate}
          />
          <Tooltip
            content={<DuelTooltip labelA={labelA} labelB={labelB} rate={rate} />}
            cursor={{ stroke: "var(--color-ink-dim)", strokeOpacity: 0.4, strokeWidth: 1 }}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey={aKey}
            name={labelA}
            stroke={A_COLOR}
            strokeWidth={2}
            fill={`url(#duel-a-${gid})`}
            dot={dotFor("a")}
            activeDot={{ r: 4, stroke: A_COLOR, strokeWidth: 2, fill: "var(--color-panel)" }}
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
            activeDot={{ r: 4, stroke: B_COLOR, strokeWidth: 2, fill: "var(--color-panel)" }}
            connectNulls
            isAnimationActive={false}
          />
        </AreaChart>
        </ResponsiveContainer>
        </div>
      </div>
      <p className="mt-1 text-center text-[11px] text-ink-faint">
        Click a point to open that player&apos;s matches for the season
      </p>
    </div>
  );
}
