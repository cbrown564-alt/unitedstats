import { EvidenceLink } from "./EvidenceLink";
import { fmtNum } from "@/lib/format";

/**
 * Consistent slice/coverage footer for charts, tables, and modules.
 *
 * Coverage is *graded*: pass `count` and the note computes its own line from
 * the real counts, rendering it only when the facet is less than complete for
 * the range shown and staying silent when the data is whole. Absence of a
 * coverage line therefore reliably means "complete data", never "forgotten" —
 * so complete-data notes should not be authored as prose. Free-text `coverage`
 * remains for partial-data nuance a simple covered/total cannot express.
 */
export function CoverageNote({
  slice,
  coverage,
  count,
  evidenceHref,
  evidenceLabel,
  children,
  className = "",
}: {
  /** What the numbers are computed from ("all competitions per season"). */
  slice?: string;
  /** Free-text completeness prose, for partial data a count cannot capture. */
  coverage?: string;
  /** Graded coverage: rendered only when covered < total, silent when complete. */
  count?: { covered: number; total: number; noun: string; note?: string };
  evidenceHref?: string;
  evidenceLabel?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  // Computed grade: a partial facet states its real counts; a complete one is silent.
  const graded =
    count && count.covered < count.total
      ? `${fmtNum(count.covered)} of ${fmtNum(count.total)} ${count.noun}${count.note ? `; ${count.note}` : ""}`
      : undefined;
  const coverageText = coverage ?? graded;

  // Nothing to say (e.g. a complete facet with no slice) renders nothing at all.
  if (!slice && !coverageText && !children && !evidenceHref) return null;

  // Each labelled field and the free-text elaboration become their own line, so
  // "Slice: …" and "Coverage: …" stack as a tidy footnote rather than running
  // together into one paragraph that wraps mid-sentence. The evidence link
  // trails the last line, keeping a source next to the data it cites.
  const lines: React.ReactNode[] = [];
  if (slice) {
    lines.push(
      <>
        <span className="font-medium text-ink">Slice:</span> {slice}
      </>,
    );
  }
  if (coverageText) {
    lines.push(
      <>
        <span className="font-medium text-ink">Coverage:</span> {coverageText}
      </>,
    );
  }
  if (children) lines.push(children);

  const evidence = evidenceHref ? <EvidenceLink href={evidenceHref} label={evidenceLabel} /> : null;

  return (
    <div className={`text-xs text-ink-dim mt-2 max-w-xl space-y-1 ${className}`}>
      {lines.map((line, i) => (
        <p key={i}>
          {line}
          {evidence && i === lines.length - 1 && <> {evidence}</>}
        </p>
      ))}
      {evidence && lines.length === 0 && <p>{evidence}</p>}
    </div>
  );
}
