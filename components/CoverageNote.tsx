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

  return (
    <p className={`text-xs text-ink-dim mt-2 max-w-2xl ${className}`}>
      {slice && (
        <>
          <span className="font-medium text-ink">Slice:</span> {slice}{" "}
        </>
      )}
      {coverageText && (
        <>
          <span className="font-medium text-ink">Coverage:</span> {coverageText}{" "}
        </>
      )}
      {children}
      {evidenceHref && (
        <>
          {" "}
          <EvidenceLink href={evidenceHref} label={evidenceLabel} />
        </>
      )}
    </p>
  );
}
