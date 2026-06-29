import { competitionTone, parseRound, type CompetitionTone } from "@/lib/format";
import { RoundMark } from "./RoundMark";

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

// Colour-coded text alone, for the `bare` chip: no pill or border, the tone
// carried by the text so it reads as a quiet label rather than a boxed widget.
const TEXT_TONE: Record<CompetitionTone, string> = {
  league: "text-ink-dim",
  cup: "text-gold",
  europe: "text-europe",
  muted: "text-ink-faint",
};

export function CompetitionChip({
  type,
  name,
  round,
  className = "",
  bare = false,
}: {
  type: string | null | undefined;
  name: string;
  round?: string | null;
  className?: string;
  /** Drop the pill/border and lean on colour-coded text alone (used in the
   *  match hero, where a boxed chip reads as heavy clutter). */
  bare?: boolean;
}) {
  const tone = competitionTone(type);
  const r = round ? parseRound(round) : null;
  const round_ = r ? (
    <span className="inline-flex items-center gap-1 opacity-70" title={round ?? undefined}>
      · {r.label}
      <RoundMark leg={r.leg} replay={r.replay} />
    </span>
  ) : null;
  if (bare) {
    return (
      <span className={`inline-flex items-center gap-1 text-sm font-medium leading-none ${TEXT_TONE[tone]} ${className}`}>
        {name}
        {round_}
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] leading-none ${CHIP_TONE[tone]} ${className}`}
    >
      {name}
      {round_}
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
