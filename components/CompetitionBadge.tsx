import { competitionMark } from "@/lib/competitionColors";

interface CompetitionBadgeProps {
  id: string;
  name: string;
  type?: string | null;
  size?: "sm" | "md";
}

const SIZES = {
  sm: "h-7 w-7 text-[9px]",
  md: "h-9 w-9 text-[11px]",
};

/** Nudge a hex colour toward white (amount > 0) or black (amount < 0). */
function shade(hex: string, amount: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const target = amount > 0 ? 255 : 0;
  const t = Math.abs(amount);
  const ch = (shift: number) => {
    const c = (n >> shift) & 0xff;
    return Math.round(c + (target - c) * t)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${ch(16)}${ch(8)}${ch(0)}`;
}

/**
 * A generated competition roundel: the competition's abbreviation struck on a
 * coloured enamel disc. Deliberately *circular* — a competition emblem
 * (UEFA-style roundel) reads distinct from the club's rounded-square monogram
 * crest ({@link ClubBadge}), so the two never get confused in a dense row.
 *
 * Stands in for a real logo we can't licence (see competitionColors.ts), so it
 * earns its keep on craft instead: a top-lit gradient struck from the base
 * colour, a beveled rim, and a glassy highlight give it the weight of an
 * enamelled badge rather than a flat dot.
 */
export function CompetitionBadge({ id, name, type, size = "md" }: CompetitionBadgeProps) {
  const { abbr, bg, fg = "#ffffff" } = competitionMark(id, name, type);
  const top = shade(bg, 0.22);
  const bottom = shade(bg, -0.28);
  return (
    <span
      aria-hidden="true"
      title={name}
      className={`${SIZES[size]} relative grid shrink-0 place-items-center rounded-full font-semibold leading-none tracking-tight`}
      style={{
        background: `linear-gradient(155deg, ${top} 0%, ${bg} 46%, ${bottom} 100%)`,
        color: fg,
        boxShadow:
          "0 1px 2px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.22), inset 0 -1px 2px rgba(0,0,0,0.35)",
      }}
    >
      {/* Glassy top highlight — sells the enamel/coin depth. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(115% 75% at 50% -12%, rgba(255,255,255,0.30), transparent 58%)",
        }}
      />
      {/* Fine beveled rim. */}
      <span aria-hidden className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/15" />
      <span className="relative" style={{ textShadow: "0 1px 1px rgba(0,0,0,0.45)" }}>
        {abbr}
      </span>
    </span>
  );
}
