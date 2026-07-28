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
  variant = "display",
  className = "",
}: {
  title: React.ReactNode;
  aside?: React.ReactNode;
  id?: string;
  variant?: "display" | "sentence";
  className?: string;
}) {
  return (
    <div
      id={id}
      className={`mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 ${className}`}
    >
      <h2
        className={
          variant === "display"
            ? "display text-xl"
            : "text-xl font-semibold tracking-[-0.015em] text-ink sm:text-2xl"
        }
      >
        {title}
      </h2>
      {aside != null && <span className="stat-num text-xs text-ink-faint">{aside}</span>}
    </div>
  );
}
