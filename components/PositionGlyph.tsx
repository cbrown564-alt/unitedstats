/**
 * A whisper-quiet position marker: a faint vertical pitch lane with a single dash
 * at the player's line — goalkeeper low, defence/midfield/attack rising — so the
 * dash reads as a formation line and a column of them shows a squad's shape at a
 * glance. Monochrome and faded on purpose (it must not compete with the goals-red
 * or peak-gold next to it); the exact position rides in the title/aria, and an
 * unknown position renders as reserved empty space rather than a guess.
 *
 * Position comes from Wikidata P413 (see the players CoverageNote), collapsed to
 * four buckets upstream.
 */
const ZONES: Record<string, { frac: number; label: string }> = {
  GK: { frac: 0.08, label: "Goalkeeper" },
  DEF: { frac: 0.36, label: "Defender" },
  MID: { frac: 0.64, label: "Midfielder" },
  FWD: { frac: 0.92, label: "Forward" },
};

export function PositionGlyph({ bucket, title }: { bucket: string | null; title?: string | null }) {
  const zone = bucket ? ZONES[bucket] : undefined;
  // Keep the column aligned whether or not a position is known.
  if (!zone) return <span className="inline-block w-3.5 shrink-0" aria-hidden />;

  const label = title?.trim() || zone.label;
  return (
    <span className="relative inline-block h-5 w-3.5 shrink-0" role="img" aria-label={label} title={label}>
      <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-ink/25" aria-hidden />
      <span
        className="absolute left-1/2 h-[2px] w-3 -translate-x-1/2 rounded-full bg-ink-dim"
        style={{ bottom: `${zone.frac * 100}%` }}
        aria-hidden
      />
    </span>
  );
}
