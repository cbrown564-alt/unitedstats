/**
 * The standard section header rhythm used across detail surfaces: a display
 * title on the left, a small stat-num qualifier (slice / count / unit) baseline-
 * aligned on the right. Keeps the "title + quiet right-hand label" pattern
 * consistent rather than re-inlining the flex each time.
 */
export function SectionHead({
  title,
  aside,
  id,
  className = "",
}: {
  title: React.ReactNode;
  aside?: React.ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <div
      id={id}
      className={`mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 ${className}`}
    >
      <h2 className="display text-xl">{title}</h2>
      {aside != null && <span className="stat-num text-xs text-ink-faint">{aside}</span>}
    </div>
  );
}
