/**
 * A running stitch for short waits: the thread's stitches travel along it
 * while something loads. Static under reduced motion. Pair it with visible
 * text; the stitch itself is decorative.
 */
export function StitchLoader({ className }: { className?: string }) {
  return (
    <svg
      width="28"
      height="8"
      viewBox="0 0 28 8"
      aria-hidden
      className={["tg-stitch-loader", className].filter(Boolean).join(" ")}
    >
      <path className="tg-stitch-loader__ground" d="M1 4H27" />
      <path className="tg-stitch-loader__thread" d="M1 4H27" />
    </svg>
  );
}
