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

function SideHeader({ side, align, withThumb }: { side: CompareSide; align: "left" | "right"; withThumb: boolean }) {
  const inner = (
    <>
      {withThumb && <PlayerPortrait name={side.label} src={side.thumb ?? null} size="sm" />}
      <span className="min-w-0">
        <span className="block truncate font-semibold text-ink group-hover:text-devil-bright">{side.label}</span>
        {side.sublabel && <span className="stat-num block truncate text-xs text-ink-faint">{side.sublabel}</span>}
      </span>
    </>
  );
  const cls = `group flex min-w-0 items-center gap-2.5 ${align === "right" ? "flex-row-reverse text-right" : "text-left"}`;
  return side.href ? (
    <Link href={side.href} className={`${cls} focus-ring`}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

/**
 * A versus comparison: two side headers over a column of shared metrics, each
 * metric a mirrored bar growing out from a central axis (each side scaled to the
 * pair's larger value) with the leading value tinted. The bar always encodes raw
 * magnitude — even for "fewer is better" metrics, where the leader is the shorter
 * bar — so a long bar never silently means "worse"; the label carries the
 * direction and the tint carries who leads.
 */
export function CompareTable({ comparison }: { comparison: Comparison }) {
  const withThumb = comparison.mode !== "eras";
  return (
    <div className="rounded-lg border border-line bg-panel p-4 sm:p-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 border-b border-line pb-4">
        <SideHeader side={comparison.a} align="right" withThumb={withThumb} />
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faint">vs</span>
        <SideHeader side={comparison.b} align="left" withThumb={withThumb} />
      </div>

      <dl className="mt-1 divide-y divide-line/60">
        {comparison.metrics.map((m) => {
          const leader = leaderOf(m);
          const max = Math.max(m.a ?? 0, m.b ?? 0) || 1;
          const aFrac = Math.max(0, (m.a ?? 0) / max);
          const bFrac = Math.max(0, (m.b ?? 0) / max);
          const valTone = (side: "a" | "b") =>
            leader === side ? "text-win font-semibold" : leader ? "text-ink-dim" : "text-ink";
          const barTone = (side: "a" | "b") => (leader === side ? "bg-win" : leader ? "bg-ink-faint/40" : "bg-devil/50");
          return (
            <div key={m.label} className="py-2.5">
              <dt className="mb-1.5 text-center text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">
                {m.label}
                {m.better === "lower" && <span className="ml-1 normal-case tracking-normal text-ink-faint">(fewer better)</span>}
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
  );
}
