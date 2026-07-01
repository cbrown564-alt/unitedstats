import { competitionMark } from "@/lib/competitionColors";

interface CompetitionBadgeProps {
  id: string;
  name: string;
  type?: string | null;
  size?: "sm" | "md";
}

const SIZES = {
  sm: "h-7 min-w-7 px-1 text-[9px] rounded-md",
  md: "h-8 min-w-8 px-1.5 text-[10px] rounded-md",
};

/**
 * A generated competition token: the competition's abbreviation on a flat colour
 * chip. Rounded-square (not circular like {@link ClubBadge}'s crest) so the two
 * never get confused in a dense row — but deliberately plain: no enamel gradient,
 * no bevel, just the competition colour and initials.
 */
export function CompetitionBadge({ id, name, type, size = "md" }: CompetitionBadgeProps) {
  const { abbr, bg, fg = "#ffffff" } = competitionMark(id, name, type);
  return (
    <span
      aria-hidden="true"
      title={name}
      className={`${SIZES[size]} relative inline-grid shrink-0 place-items-center font-semibold leading-none tracking-tight shadow-[inset_0_0_0_1px_rgba(255,255,255,0.10)]`}
      style={{ backgroundColor: bg, color: fg }}
    >
      {abbr}
    </span>
  );
}
