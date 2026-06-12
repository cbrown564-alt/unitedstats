import { CoverageNote } from "./CoverageNote";

/**
 * Standard framed panel for a chart or analytics module: title above,
 * content in a bordered panel, slice/coverage note at the point of reading.
 */
export function ChartPanel({
  title,
  slice,
  coverage,
  evidenceHref,
  evidenceLabel,
  note,
  children,
}: {
  title?: string;
  slice?: string;
  coverage?: string;
  evidenceHref?: string;
  evidenceLabel?: string;
  /** Extra note content rendered inside the CoverageNote. */
  note?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      {title && <h2 className="display text-xl mb-3">{title}</h2>}
      <div className="border border-line rounded-lg bg-panel p-4">
        {children}
        {(slice || coverage || note || evidenceHref) && (
          <CoverageNote
            slice={slice}
            coverage={coverage}
            evidenceHref={evidenceHref}
            evidenceLabel={evidenceLabel}
          >
            {note}
          </CoverageNote>
        )}
      </div>
    </div>
  );
}
