/** Lightweight placeholder while a filtered /matches slice loads client-side. */
export function MatchesPageLoading() {
  return (
    <div className="space-y-7 motion-safe:animate-pulse" aria-busy="true" aria-label="Loading matches">
      <div className="h-36 rounded-xl border border-line bg-panel" />
      <div className="h-48 rounded-xl border border-line bg-panel" />
      <div className="h-8 w-48 rounded bg-panel-2" />
      <div className="space-y-2">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="h-14 rounded-lg border border-line/60 bg-panel-2/40" />
        ))}
      </div>
    </div>
  );
}
