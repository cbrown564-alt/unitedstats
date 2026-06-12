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
  kicker,
  children,
}: {
  title?: string;
  kicker?: string;
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
      {title && (
        <div className="mb-3">
          {kicker && <p className="text-xs font-semibold uppercase tracking-[0.16em] text-devil-bright">{kicker}</p>}
          <h2 className="display text-xl">{title}</h2>
        </div>
      )}
      <div className="border border-line rounded-lg bg-panel p-4 shadow-[0_1px_0_rgb(255_255_255_/_0.025)_inset]">
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
