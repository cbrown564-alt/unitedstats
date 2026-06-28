import Link from "next/link";
import type { Comparison, CompareMetric, CompareSide, CompareSignature } from "@/lib/compare";
import { PlayerPortrait } from "@/components/PlayerPortrait";
import { CoverageNote } from "@/components/CoverageNote";
import { CareerDuelChartLazy } from "@/components/charts/lazy";
import { TrophyCabinet, EraSkyline } from "@/components/CompareSignatures";
import { fmtNum } from "@/lib/format";

/** The active-mode values/label/fmt for a metric: its rate form when the toggle
 *  is on and the metric has one, its total form otherwise. */
function resolveMetric(m: CompareMetric, rate: boolean) {
  if (rate && m.rate) return { label: m.rate.label, a: m.rate.a, b: m.rate.b, fmt: m.rate.fmt };
  return { label: m.label, a: m.a, b: m.b, fmt: m.fmt };
}

function fmtVal(v: number | null, fmt: CompareMetric["fmt"]): string {
  if (v == null) return "—";
  if (fmt === "pct") return `${v.toFixed(0)}%`;
  if (fmt === "dec1") return v.toFixed(1);
  if (fmt === "dec2") return v.toFixed(2);
  return fmtNum(Math.round(v));
}

/** Which side leads a metric, honouring its direction, the active rate mode, and
 *  coverage. Null when not comparable, un-judged, tied, or missing data. */
function leaderOf(m: CompareMetric, rate: boolean): "a" | "b" | null {
  if (m.comparable === false) return null;
  if (!m.better) return null;
  const { a, b } = resolveMetric(m, rate);
  if (a == null || b == null || a === b) return null;
  return m.better === "higher" ? (a > b ? "a" : "b") : (a < b ? "a" : "b");
}

function ScoreSide({
  side,
  score,
  state,
  align,
  withThumb,
}: {
  side: CompareSide;
  score: number;
  state: "win" | "lose" | "level";
  align: "left" | "right";
  withThumb: boolean;
}) {
  const scoreTone = state === "win" ? "text-win" : state === "lose" ? "text-ink-faint" : "text-ink-dim";
  const toCentre = align === "right" ? "flex-row-reverse" : "flex-row";
  const ident = (
    <span className={`flex min-w-0 items-center gap-2.5 ${toCentre}`}>
      {withThumb && (
        <span className="hidden sm:block">
          <PlayerPortrait name={side.label} src={side.thumb ?? null} size="md" />
        </span>
      )}
      <span className={`min-w-0 ${align === "right" ? "text-right" : "text-left"}`}>
        <span className="display block text-sm leading-tight text-ink group-hover:text-devil-bright sm:text-lg">
          {side.label}
        </span>
        {side.sublabel && <span className="stat-num block truncate text-xs text-ink-faint">{side.sublabel}</span>}
      </span>
    </span>
  );
  return (
    <div className={`flex flex-col gap-2 ${align === "right" ? "items-end" : "items-start"}`}>
      <span className={`stat-num text-4xl font-semibold leading-none sm:text-6xl ${scoreTone}`}>{score}</span>
      {side.href ? (
        <Link href={side.href} className="group block max-w-full focus-ring">
          {ident}
        </Link>
      ) : (
        <div className="max-w-full">{ident}</div>
      )}
    </div>
  );
}

/** Segmented Total / rate toggle. URL-driven (the page passes a href builder),
 *  so the whole comparison — scoreline, chart, measures — re-renders consistently
 *  and the rate choice is shareable. The rate label is mode-aware: per 90 for
 *  players (minutes-derived), per game for managers/eras (team-level). Hidden
 *  when no metric has a rate form. */
function RateToggle({ rate, rateLabel, hrefFor }: { rate: boolean; rateLabel: string; hrefFor: (perGame: boolean) => string }) {
  const pillCls = (on: boolean) =>
    `rounded-full px-3 py-1 text-xs font-semibold transition-colors focus-ring ${
      on ? "bg-devil/15 text-devil-bright" : "text-ink-dim hover:bg-panel-2 hover:text-ink"
    }`;
  return (
    <div className="flex items-center justify-center gap-1">
      <span className="mr-1 text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">View</span>
      <Link href={hrefFor(false)} aria-current={!rate ? "true" : undefined} className={pillCls(!rate)}>Total</Link>
      <Link href={hrefFor(true)} aria-current={rate ? "true" : undefined} className={pillCls(rate)}>{rateLabel}</Link>
    </div>
  );
}

/** One metric as a two-sided diverging bar — a tug-of-war, not a table row. The
 *  leader's bar carries win-yellow; an un-judged or coverage-asymmetric metric
 *  renders both halves neutral with a "coverage differs" pill so a figure is
 *  never mistaken for a fair fight. */
function MeasureRow({ m, rate }: { m: CompareMetric; rate: boolean }) {
  const { a, b, fmt, label } = resolveMetric(m, rate);
  const comparable = m.comparable !== false;
  const leader = leaderOf(m, rate);
  const max = Math.max(a ?? 0, b ?? 0, 1e-9);
  const pct = (v: number | null) => (v == null || v <= 0 ? 0 : Math.max(6, (v / max) * 100));
  const aTone = !comparable ? "bg-ink-dim/40" : leader === "a" ? "bg-win" : "bg-ink-dim/30";
  const bTone = !comparable ? "bg-ink-dim/40" : leader === "b" ? "bg-win" : "bg-ink-dim/30";
  const aTextTone = !comparable ? "text-ink-dim" : leader === "a" ? "text-win font-semibold" : "text-ink-dim";
  const bTextTone = !comparable ? "text-ink-dim" : leader === "b" ? "text-win font-semibold" : "text-ink-dim";

  return (
    <div className="py-2.5">
      <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_minmax(0,1fr)_2.5rem] items-center gap-2">
        <span className={`stat-num text-right text-sm ${aTextTone}`}>{fmtVal(a, fmt)}</span>
        <div className="flex h-2.5 justify-end">
          <div className={`h-full rounded-l-full transition-all ${aTone}`} style={{ width: `${pct(a)}%` }} />
        </div>
        <div className="flex h-2.5 justify-start">
          <div className={`h-full rounded-r-full transition-all ${bTone}`} style={{ width: `${pct(b)}%` }} />
        </div>
        <span className={`stat-num text-left text-sm ${bTextTone}`}>{fmtVal(b, fmt)}</span>
      </div>
      <div className="mt-1 flex items-center justify-center gap-2 text-center">
        <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-ink-faint">
          {label}
          {m.better === "lower" && <span className="ml-1 normal-case tracking-normal">(fewer better)</span>}
        </span>
        {!comparable && (
          <span className="rounded-full border border-line bg-panel-2 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-ink-faint">
            coverage differs
          </span>
        )}
      </div>
      {m.note && <p className="mt-0.5 text-center text-[11px] text-ink-faint">{m.note}</p>}
    </div>
  );
}

function MeasuresStrip({ metrics, rate }: { metrics: CompareMetric[]; rate: boolean }) {
  return <dl className="divide-y divide-line/60">{metrics.map((m) => <MeasureRow key={m.label} m={m} rate={rate} />)}</dl>;
}

/** The career convergences — a counterpoint to the scoreboard's "who leads".
 *  Only the data actually carries: shared shirt, same peak season, overlap. */
function Rhymes({ rhymes }: { rhymes: { label: string; detail: string }[] }) {
  return (
    <div className="border-y border-line bg-panel-2/30 px-4 py-3 sm:px-5">
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Where they rhymed</p>
      <ul className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
        {rhymes.map((r) => (
          <li key={r.label} className="text-sm">
            <span className="font-semibold text-ink">{r.label}.</span>{" "}
            <span className="text-ink-dim">{r.detail}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Signature({
  signature,
  a,
  b,
  metrics,
  rate,
}: {
  signature: CompareSignature;
  a: CompareSide;
  b: CompareSide;
  metrics: CompareMetric[];
  rate: boolean;
}) {
  if (signature.kind === "career") {
    return (
      <CareerDuelChartLazy
        a={signature.a}
        b={signature.b}
        aId={a.id}
        bId={b.id}
        labelA={a.label}
        labelB={b.label}
        rate={rate}
      />
    );
  }
  if (signature.kind === "trophies") {
    const win = metrics.find((m) => m.label === "Win rate");
    return (
      <TrophyCabinet
        a={signature.a}
        b={signature.b}
        labelA={a.label}
        labelB={b.label}
        winA={win?.a ?? null}
        winB={win?.b ?? null}
      />
    );
  }
  const short = (s: string) => s.replace(/\s*\(.*\)$/, "");
  return <EraSkyline a={signature.a} b={signature.b} labelA={short(a.label)} labelB={short(b.label)} />;
}

/**
 * A versus comparison rendered as a match scoreboard, then the one artifact that
 * carries the story for its mode (career-arc duel / trophy cabinet / finish
 * skyline), with the shared measures kept as diverging bars beneath. A Total /
 * Per-game toggle rescales every rate-able metric — and the scoreline with it.
 */
export function CompareTable({
  comparison,
  rate = false,
  rateHref,
}: {
  comparison: Comparison;
  rate?: boolean;
  /** Builds the toggle's href for a given mode. Supplied by the page from its
   *  search params; when absent the toggle is hidden (no rate metrics to flip). */
  rateHref?: (perGame: boolean) => string;
}) {
  const withThumb = comparison.mode !== "eras";
  const hasRate = comparison.metrics.some((m) => m.rate);
  // Players rate by minutes (per 90); managers and eras rate by matches (per game).
  const rateLabel = comparison.mode === "players" ? "Per 90" : "Per game";
  const rateTag = comparison.mode === "players" ? "per 90" : "per game";

  const judged = comparison.metrics.filter((m) => leaderOf(m, rate) !== null);
  const leadsA = judged.filter((m) => leaderOf(m, rate) === "a").length;
  const leadsB = judged.filter((m) => leaderOf(m, rate) === "b").length;
  const winner: "a" | "b" | null = leadsA > leadsB ? "a" : leadsB > leadsA ? "b" : null;
  const stateOf = (side: "a" | "b"): "win" | "lose" | "level" =>
    winner === side ? "win" : winner ? "lose" : "level";

  // The crafted headline is a total-mode story (e.g. "out-scored 253–249"); under
  // per-game it would contradict the rate-aware scoreline, so fall back to the
  // measures summary there.
  const verdict =
    !rate && comparison.headline
      ? comparison.headline
      : judged.length === 0
        ? "These records are too close to separate on these measures."
        : winner
          ? `Leads ${Math.max(leadsA, leadsB)}–${Math.min(leadsA, leadsB)} across ${judged.length} measures.`
          : `Level at ${leadsA}–${leadsB} across ${judged.length} measures.`;

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-panel">
      {hasRate && rateHref && (
        <div className="border-b border-line bg-panel-2/30 px-4 py-2 sm:px-5">
          <RateToggle rate={rate} rateLabel={rateLabel} hrefFor={rateHref} />
        </div>
      )}

      <div className="border-b border-line bg-panel-2/40 px-4 py-5 sm:px-6 sm:py-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-3 sm:gap-6">
          <ScoreSide side={comparison.a} score={leadsA} state={stateOf("a")} align="right" withThumb={withThumb} />
          <div className="flex flex-col items-center gap-1 pt-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-faint">leads</span>
            <span className="h-8 w-px bg-line sm:h-10" aria-hidden />
            <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-ink-faint">
              {rate ? rateTag : "total"}
            </span>
          </div>
          <ScoreSide side={comparison.b} score={leadsB} state={stateOf("b")} align="left" withThumb={withThumb} />
        </div>
        <p className="mx-auto mt-5 max-w-xl text-center text-sm text-ink">{verdict}</p>
      </div>

      {comparison.rhymes && comparison.rhymes.length > 0 && <Rhymes rhymes={comparison.rhymes} />}

      {comparison.signature && (
        <div className="px-4 pt-4 sm:px-5">
          <Signature signature={comparison.signature} a={comparison.a} b={comparison.b} metrics={comparison.metrics} rate={rate} />
        </div>
      )}

      <div className="px-4 py-4 sm:px-5">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">The measures</p>
        <MeasuresStrip metrics={comparison.metrics} rate={rate} />

        {(comparison.coverage || comparison.evidence) && (
          <div className="mt-3 border-t border-line/60 pt-3">
            <CoverageNote coverage={comparison.coverage} />
            {comparison.evidence && (
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                {comparison.evidence.map((e) => (
                  <Link key={e.href + e.label} href={e.href} className="text-xs text-devil-bright hover:underline">
                    {e.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
