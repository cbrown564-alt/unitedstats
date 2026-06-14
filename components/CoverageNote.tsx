import { EvidenceLink } from "./EvidenceLink";

/**
 * Consistent slice/coverage footer for charts, tables, and modules.
 * Trust context belongs at the point of interpretation: say what slice the
 * numbers are computed from, how complete the underlying data is, and where
 * the evidence lives.
 */
export function CoverageNote({
  slice,
  coverage,
  evidenceHref,
  evidenceLabel,
  children,
  className = "",
}: {
  /** What the numbers are computed from ("all competitions per season"). */
  slice?: string;
  /** How complete the underlying data is ("4,839 of 6,028 matches"). */
  coverage?: string;
  evidenceHref?: string;
  evidenceLabel?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={`text-xs text-ink-dim mt-2 max-w-2xl ${className}`}>
      {slice && (
        <>
          <span className="font-medium text-ink">Slice:</span> {slice}{" "}
        </>
      )}
      {coverage && (
        <>
          <span className="font-medium text-ink">Coverage:</span> {coverage}{" "}
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
