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

/**
 * A generated competition roundel: the competition's abbreviation on a disc in
 * its colour. Deliberately *circular* — a competition emblem (UEFA-style
 * roundel) reads distinct from the club's rounded-square monogram crest
 * ({@link ClubBadge}), so the two never get confused in a dense row. Stands in
 * for a real logo we can't licence; see competitionColors.ts.
 */
export function CompetitionBadge({ id, name, type, size = "md" }: CompetitionBadgeProps) {
  const { abbr, bg, fg = "#ffffff" } = competitionMark(id, name, type);
  return (
    <span
      aria-hidden="true"
      title={name}
      className={`${SIZES[size]} grid shrink-0 place-items-center rounded-full font-semibold leading-none tracking-tight ring-1 ring-inset ring-white/15 shadow-[0_1px_2px_rgba(0,0,0,0.45)]`}
      style={{ backgroundColor: bg, color: fg }}
    >
      {abbr}
    </span>
  );
}
