import Link from "next/link";
import type { Comparison, CompareMetric, CompareSide } from "@/lib/compare";
import { PlayerPortrait } from "@/components/PlayerPortrait";
import { CoverageNote } from "@/components/CoverageNote";
import { fmtNum } from "@/lib/format";

function fmtVal(v: number | null, fmt: CompareMetric["fmt"]): string {
  if (v == null) return "—";
  if (fmt === "pct") return `${v.toFixed(1)}%`;
  if (fmt === "dec2") return v.toFixed(2);
  return fmtNum(Math.round(v));
}

/** Which side leads a metric, honouring its direction. Null = tie or un-judged. */
function leaderOf(m: CompareMetric): "a" | "b" | null {
  if (!m.better || m.a == null || m.b == null || m.a === m.b) return null;
  if (m.better === "higher") return m.a > m.b ? "a" : "b";
  return m.a < m.b ? "a" : "b";
}

/**
 * One side of the scoreboard: the count of measures it leads (its "score"), over
 * its portrait and name. The leader's score is tinted win-yellow; the other side
 * dims, so the result reads at a glance like a floodlit fixture board.
 */
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
      {/* Portraits crowd the names on a phone, so they only join the board at sm+. */}
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

/**
 * A versus comparison rendered as a match scoreboard: a hero that tallies how many
 * measures each side leads (with a plain-language verdict), over a column of those
 * measures as mirrored bars growing from a central axis. Each side scales to the
 * pair's larger value and the leading value is tinted; the bar always encodes raw
 * magnitude — even for "fewer is better" metrics, where the leader is the shorter
 * bar — so a long bar never silently means "worse". The label carries the
 * direction, the tint carries who leads.
 */
export function CompareTable({ comparison }: { comparison: Comparison }) {
  const withThumb = comparison.mode !== "eras";

  // The scoreline is the count of judged measures each side leads (ties excluded).
  const judged = comparison.metrics.filter((m) => leaderOf(m) !== null);
  const leadsA = judged.filter((m) => leaderOf(m) === "a").length;
  const leadsB = judged.filter((m) => leaderOf(m) === "b").length;
  const winner: "a" | "b" | null = leadsA > leadsB ? "a" : leadsB > leadsA ? "b" : null;
  const stateOf = (side: "a" | "b"): "win" | "lose" | "level" =>
    winner === side ? "win" : winner ? "lose" : "level";

  const winnerSide = winner ? comparison[winner] : null;
  const verdict =
    judged.length === 0
      ? "These two are too close to separate on the measures here."
      : winnerSide
        ? `${winnerSide.label} leads ${Math.max(leadsA, leadsB)}–${Math.min(leadsA, leadsB)} across ${judged.length} measures.`
        : `Honours even — ${leadsA}–${leadsB} across ${judged.length} measures.`;

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-panel">
      {/* Scoreboard hero — the answer first: who leads, by how much. */}
      <div className="border-b border-line bg-panel-2/40 px-4 py-5 sm:px-6 sm:py-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-3 sm:gap-6">
          <ScoreSide side={comparison.a} score={leadsA} state={stateOf("a")} align="right" withThumb={withThumb} />
          <div className="flex flex-col items-center gap-1 pt-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-faint">leads</span>
            <span className="h-8 w-px bg-line sm:h-10" aria-hidden />
            <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-ink-faint">vs</span>
          </div>
          <ScoreSide side={comparison.b} score={leadsB} state={stateOf("b")} align="left" withThumb={withThumb} />
        </div>
        <p className="mt-5 text-center text-sm text-ink-dim">{verdict}</p>
      </div>

      {/* The measures. */}
      <div className="px-4 py-4 sm:px-5">
        <dl className="divide-y divide-line/60">
          {comparison.metrics.map((m) => {
            const leader = leaderOf(m);
            const max = Math.max(m.a ?? 0, m.b ?? 0) || 1;
            const aFrac = Math.max(0, (m.a ?? 0) / max);
            const bFrac = Math.max(0, (m.b ?? 0) / max);
            const valTone = (side: "a" | "b") =>
              leader === side ? "text-win font-semibold" : leader ? "text-ink-dim" : "text-ink";
            const barTone = (side: "a" | "b") =>
              leader === side ? "bg-win" : leader ? "bg-ink-faint/40" : "bg-devil/50";
            return (
              <div key={m.label} className="py-2.5">
                <dt className="mb-1.5 text-center text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">
                  {m.label}
                  {m.better === "lower" && (
                    <span className="ml-1 normal-case tracking-normal text-ink-faint">(fewer better)</span>
                  )}
                </dt>
                <dd className="grid grid-cols-[3.5rem_minmax(0,1fr)_3.5rem] items-center gap-2 sm:grid-cols-[4.5rem_minmax(0,1fr)_4.5rem] sm:gap-3">
                  <span className={`stat-num text-right text-sm ${valTone("a")}`}>{fmtVal(m.a, m.fmt)}</span>
                  <div className="flex h-2.5 items-center" aria-hidden>
                    <div className="flex h-full flex-1 justify-end">
                      <div className={`h-full rounded-l-[2px] ${barTone("a")}`} style={{ width: `${aFrac * 100}%` }} />
                    </div>
                    <div className="h-3.5 w-px shrink-0 bg-ink-faint/50" />
                    <div className="flex h-full flex-1 justify-start">
                      <div className={`h-full rounded-r-[2px] ${barTone("b")}`} style={{ width: `${bFrac * 100}%` }} />
                    </div>
                  </div>
                  <span className={`stat-num text-left text-sm ${valTone("b")}`}>{fmtVal(m.b, m.fmt)}</span>
                </dd>
                {m.note && <p className="mt-1 text-center text-[11px] text-ink-faint">{m.note}</p>}
              </div>
            );
          })}
        </dl>

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
