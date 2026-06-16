import { competitionTone, fmtRound, type CompetitionTone } from "@/lib/format";

/**
 * Competition identity, used as a secondary grouping cue (NN/g: colour supports,
 * text labels carry the meaning). Three categories — league, cup, Europe — keep
 * the dark match-night palette restrained while making fixture type scannable.
 */

const CHIP_TONE: Record<CompetitionTone, string> = {
  league: "border-line bg-panel-2/60 text-ink-dim",
  cup: "border-gold/35 bg-gold/10 text-gold",
  europe: "border-europe/45 bg-europe/10 text-europe",
  muted: "border-line/70 bg-transparent text-ink-faint",
};

const DOT_TONE: Record<CompetitionTone, string> = {
  league: "bg-ink-faint",
  cup: "bg-gold",
  europe: "bg-europe",
  muted: "bg-ink-faint/50",
};

export function CompetitionChip({
  type,
  name,
  round,
  className = "",
}: {
  type: string | null | undefined;
  name: string;
  round?: string | null;
  className?: string;
}) {
  const tone = competitionTone(type);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] leading-none ${CHIP_TONE[tone]} ${className}`}
    >
      {name}
      {round ? <span className="opacity-70">· {fmtRound(round)}</span> : null}
    </span>
  );
}

/** Tiny category cue for dense rows where a full chip would crowd the layout. */
export function CompetitionDot({
  type,
  className = "",
}: {
  type: string | null | undefined;
  className?: string;
}) {
  const tone = competitionTone(type);
  return (
    <span
      aria-hidden
      className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${DOT_TONE[tone]} ${className}`}
    />
  );
}
