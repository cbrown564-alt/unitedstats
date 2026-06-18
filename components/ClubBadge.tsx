import { clubColor, clubMonogram } from "@/lib/clubColors";

interface ClubBadgeProps {
  id: string;
  name: string;
  size?: "sm" | "md" | "lg";
}

const SIZES = {
  sm: { box: "h-7 w-7 text-[10px]", radius: "rounded-md" },
  md: { box: "h-10 w-10 text-xs", radius: "rounded-lg" },
  lg: { box: "h-28 w-28 text-4xl sm:h-32 sm:w-32 sm:text-5xl", radius: "rounded-2xl" },
};

/**
 * A generated crest-style token: the club's monogram on a chip in its primary
 * colour. Stands in for a real badge (which we can't source under a free
 * licence) while staying consistent and on-brand across every club.
 */
export function ClubBadge({ id, name, size = "sm" }: ClubBadgeProps) {
  const { bg, fg = "#ffffff" } = clubColor(id, name);
  const config = SIZES[size];

  return (
    <span
      aria-hidden="true"
      title={name}
      className={`${config.box} ${config.radius} grid shrink-0 place-items-center font-semibold leading-none tracking-tight shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]`}
      style={{ backgroundColor: bg, color: fg }}
    >
      {clubMonogram(name)}
    </span>
  );
}
