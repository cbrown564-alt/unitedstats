/**
 * A quiet two-letter position tag beside each player's name: GK / DF / MF / FW,
 * the player's primary position collapsed to four buckets. Dimmed and fixed-width
 * so a column of them stays aligned and never competes with the goals-red or
 * peak-gold figures alongside; the exact position rides in the title/aria, and an
 * unknown position renders as reserved empty space rather than a guess.
 *
 * Position comes from Wikidata P413 (see the players CoverageNote), collapsed to
 * four buckets upstream.
 */
const ZONES: Record<string, { short: string; label: string }> = {
  GK: { short: "GK", label: "Goalkeeper" },
  DEF: { short: "DF", label: "Defender" },
  MID: { short: "MF", label: "Midfielder" },
  FWD: { short: "FW", label: "Forward" },
};

export function PositionTag({ bucket, title }: { bucket: string | null; title?: string | null }) {
  const zone = bucket ? ZONES[bucket] : undefined;
  // Keep the column aligned whether or not a position is known.
  if (!zone) return <span className="inline-block w-6 shrink-0" aria-hidden />;

  const label = title?.trim() || zone.label;
  return (
    <span
      className="inline-block w-6 shrink-0 text-center text-[10px] font-semibold uppercase tracking-wide text-ink-faint"
      role="img"
      aria-label={label}
      title={label}
    >
      {zone.short}
    </span>
  );
}
