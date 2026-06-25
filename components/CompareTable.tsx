import Link from "next/link";
import type { Comparison, CompareMetric, CompareSide, CompareSignature } from "@/lib/compare";
import { PlayerPortrait } from "@/components/PlayerPortrait";
import { CoverageNote } from "@/components/CoverageNote";
import { CareerArcDuel, TrophyCabinet, EraSkyline } from "@/components/CompareSignatures";
import { fmtNum } from "@/lib/format";

function fmtVal(v: number | null, fmt: CompareMetric["fmt"]): string {
  if (v == null) return "—";
  if (fmt === "pct") return `${v.toFixed(0)}%`;
  if (fmt === "dec1") return v.toFixed(1);
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

/** Compact numeric ledger of the shared measures — leader tinted, no competing
 *  bars. Secondary to the signature; carries the per-metric coverage caveats. */
function MeasuresStrip({ metrics }: { metrics: CompareMetric[] }) {
  return (
    <dl className="divide-y divide-line/60">
      {metrics.map((m) => {
        const leader = leaderOf(m);
        const tone = (side: "a" | "b") =>
          leader === side ? "text-win font-semibold" : leader ? "text-ink-dim" : "text-ink";
        return (
          <div key={m.label} className="py-2">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <span className={`stat-num text-right text-sm ${tone("a")}`}>
                {leader === "a" && <span className="mr-1 text-[10px] text-win">▲</span>}
                {fmtVal(m.a, m.fmt)}
              </span>
              <span className="text-center text-[11px] font-medium uppercase tracking-[0.1em] text-ink-faint">
                {m.label}
                {m.better === "lower" && <span className="ml-1 normal-case tracking-normal">(fewer better)</span>}
              </span>
              <span className={`stat-num text-left text-sm ${tone("b")}`}>
                {fmtVal(m.b, m.fmt)}
                {leader === "b" && <span className="ml-1 text-[10px] text-win">▲</span>}
              </span>
            </div>
            {m.note && <p className="mt-1 text-center text-[11px] text-ink-faint">{m.note}</p>}
          </div>
        );
      })}
    </dl>
  );
}

function Signature({ signature, a, b, metrics }: { signature: CompareSignature; a: CompareSide; b: CompareSide; metrics: CompareMetric[] }) {
  if (signature.kind === "career") {
    return <CareerArcDuel a={signature.a} b={signature.b} labelA={a.label} labelB={b.label} />;
  }
  if (signature.kind === "trophies") {
    const win = metrics.find((m) => m.label === "Win rate");
    return (
      <TrophyCabinet a={signature.a} b={signature.b} labelA={a.label} labelB={b.label} winA={win?.a ?? null} winB={win?.b ?? null} />
    );
  }
  const short = (s: string) => s.replace(/\s*\(.*\)$/, "");
  return <EraSkyline a={signature.a} b={signature.b} labelA={short(a.label)} labelB={short(b.label)} />;
}

/**
 * A versus comparison rendered as a match scoreboard, then the one artifact that
 * carries the story for its mode (career-arc duel / trophy cabinet / finish
 * skyline), with the shared measures kept as a compact numeric strip beneath.
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

  const verdict =
    comparison.headline ??
    (judged.length === 0
      ? "These records are too close to separate on these measures."
      : `Leads ${Math.max(leadsA, leadsB)}–${Math.min(leadsA, leadsB)} across ${judged.length} measures.`);

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
        <p className="mx-auto mt-5 max-w-xl text-center text-sm text-ink">{verdict}</p>
      </div>

      {/* The signature: the artifact that carries this mode's story. */}
      {comparison.signature && (
        <div className="px-4 pt-4 sm:px-5">
          <Signature signature={comparison.signature} a={comparison.a} b={comparison.b} metrics={comparison.metrics} />
        </div>
      )}

      {/* The measures, kept as a compact numeric ledger. */}
      <div className="px-4 py-4 sm:px-5">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">The measures</p>
        <MeasuresStrip metrics={comparison.metrics} />

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
