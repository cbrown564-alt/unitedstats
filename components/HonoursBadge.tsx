import { TrophyIcon } from "@/components/CampaignIcons";

/** Compact gold trophy + count for index rows (managers, etc.). */
export function HonoursBadge({
  count,
  title,
  className = "",
}: {
  count: number;
  title?: string;
  className?: string;
}) {
  if (count <= 0) return null;
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-0.5 text-gold ${className}`}
      title={title ?? `${count} ${count === 1 ? "trophy" : "trophies"} won`}
    >
      <TrophyIcon className="h-3 w-3" />
      <span className="stat-num text-[11px] font-semibold leading-none">{count}</span>
    </span>
  );
}

/** Rounded honours chip for decade/season summaries. */
export function HonoursChip({
  children,
  tone = "gold",
}: {
  children: React.ReactNode;
  tone?: "gold" | "quiet";
}) {
  const styles =
    tone === "gold"
      ? "border-gold/50 bg-gold/15 text-gold"
      : "border-line bg-panel-2/70 font-medium text-ink-dim";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-none ${styles}`}
    >
      <TrophyIcon className={`h-3 w-3 ${tone === "quiet" ? "text-silver" : ""}`} />
      {children}
    </span>
  );
}
