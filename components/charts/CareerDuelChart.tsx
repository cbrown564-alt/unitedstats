import { useId } from "react";
import type { CareerChartMetric, CareerSeason } from "@/lib/compare";
import { fmtAxisNumber } from "@/lib/format";
import { ChartInspector, type InspectPoint } from "./ChartInspector";
import { PlotShell } from "./PlotShell";
import { areaPath, monotonePath, niceTicks, scale } from "./plot";

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
  const gid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const data = merge(a, b, aId, bId);
  if (!data.length) return null;

  const { aKey, bKey } = chartKeys(chart, rate);
  const labels = chartLabels(chart, rate);
  const maxN = data[data.length - 1].n;
  const values = data.flatMap((d) => [d[aKey], d[bKey]]).filter((v): v is number => v != null);
  const yMax = (values.length ? Math.max(...values) : 1) || 1;
  const sx = scale([1, Math.max(2, maxN)]);
  const sy = scale([0, yMax * 1.1], true);
  const xAt = (n: number) => (maxN > 1 ? sx(n) : 50);
  const yTicks = niceTicks([0, yMax * 1.1], 4).map((v) => ({
    at: sy(v),
    label: rate ? v.toFixed(chart === "cleanSheets" ? 0 : 1) : fmtAxisNumber(v, ""),
  }));
  const xTicks = (maxN > 1 ? [1, maxN] : [1]).map((n) => ({ at: xAt(n), label: String(n) }));

  const sides = [
    { key: aKey, color: A_COLOR, label: labelA, peak: peakN(a, rate, chart), href: (d: DuelDatum) => d.aHref, grad: `duel-a-${gid}`, top: 0.26 },
    { key: bKey, color: B_COLOR, label: labelB, peak: peakN(b, rate, chart), href: (d: DuelDatum) => d.bHref, grad: `duel-b-${gid}`, top: 0.22 },
  ].map((side) => {
    const pts = data.flatMap((d): [number, number][] => {
      const v = d[side.key] as number | null | undefined;
      return v == null ? [] : [[xAt(d.n), sy(v)]];
    });
    return { ...side, pts, line: monotonePath(pts) };
  });

  const tipFor = (d: DuelDatum) => ({
    title: `Season ${d.n}`,
    rows: [
      { name: labelA, color: A_COLOR, season: d.aSeason, value: d[aKey], context: chart === "cleanSheets" ? d.aStarts : d.aApps },
      { name: labelB, color: B_COLOR, season: d.bSeason, value: d[bKey], context: chart === "cleanSheets" ? d.bStarts : d.bApps },
    ].map((row) => ({
      name: row.name,
      color: row.color,
      value: `${fmtVal(row.value as number | null | undefined, rate, chart)}${labels.suffix}`,
      note: `${row.season ?? "—"}${!rate && row.context != null ? ` · ${row.context} ${labels.context}` : ""}`,
    })),
  });

  const points: InspectPoint[] = sides.flatMap((side) =>
    data.flatMap((d) => {
      const v = d[side.key] as number | null | undefined;
      if (v == null) return [];
      const y = sy(v);
      return [{
        x: xAt(d.n),
        y,
        href: side.href(d),
        tip: tipFor(d),
        markers: showTooltip ? [{ y, color: side.color }] : undefined,
      }];
    }),
  );

  return (
    <div className="flex h-auto w-full flex-col" style={{ height }}>
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
        <div className="min-h-0 min-w-0 flex-1">
          <PlotShell fill yAxisWidth={36} yTicks={yTicks} xTicks={xTicks} padTop={12} padRight={12} xAxisLabel="Career season">
            <ChartInspector
              points={points}
              mode="xy"
              hitRadius={28}
              showTip={showTooltip}
              label={`${labels.aria}: ${labelA} vs ${labelB}. Select a point to open that player's matches for the season.`}
            >
              {emphasisSeason != null && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 bg-gold/10"
                  style={{ left: `${xAt(emphasisSeason - 0.24)}%`, width: `${xAt(emphasisSeason + 0.24) - xAt(emphasisSeason - 0.24)}%` }}
                />
              )}
              <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
                <defs>
                  {sides.map((side) => (
                    <linearGradient key={side.grad} id={side.grad} x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor={side.color} stopOpacity={side.top} />
                      <stop offset="100%" stopColor={side.color} stopOpacity={0.02} />
                    </linearGradient>
                  ))}
                </defs>
                {sides.map((side) => (
                  <g key={side.grad}>
                    <path d={areaPath(side.line, side.pts)} fill={`url(#${side.grad})`} />
                    <path d={side.line} fill="none" stroke={side.color} strokeWidth={2} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                  </g>
                ))}
              </svg>
              {sides.flatMap((side) =>
                data.flatMap((d) => {
                  const v = d[side.key] as number | null | undefined;
                  const isPeak = d.n === side.peak;
                  const isEmphasized = d.n === emphasisSeason;
                  if (v == null || (!isPeak && !isEmphasized)) return [];
                  const pos = { left: `${xAt(d.n)}%`, top: `${sy(v)}%` };
                  return [
                    isEmphasized && (
                      <span key={`${side.grad}-e-${d.n}`} aria-hidden className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-gold bg-pitch" style={pos} />
                    ),
                    isPeak && (
                      <span
                        key={`${side.grad}-p-${d.n}`}
                        aria-hidden
                        className={`pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full ring-[1.5px] ring-panel ${isEmphasized ? "h-[11px] w-[11px]" : "h-[9px] w-[9px]"}`}
                        style={{ ...pos, background: side.color }}
                      />
                    ),
                  ];
                }),
              )}
            </ChartInspector>
          </PlotShell>
        </div>
      </div>
      <p className="mt-1 hidden text-center text-[11px] text-ink-faint pointer-coarse:block">Tap a point to inspect</p>
      <p className="mt-1 text-center text-[11px] text-ink-faint pointer-coarse:hidden">
        Click a point to open that player&apos;s matches for the season
      </p>
    </div>
  );
}
