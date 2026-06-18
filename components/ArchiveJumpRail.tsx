import type { MatchRow } from "@/lib/queries";
import { JumpRail, type JumpChip } from "./JumpRail";

/** Most chips we'll show before stepping to a coarser grain. */
const TARGET = 14;

const startYear = (season: string) => Number(season.slice(0, 4));

/**
 * Derive the rail's chips from a match list (newest-first). Granularity steps
 * coarser only as far as it must to stay under {@link TARGET} chips: a season
 * each → five-year periods → decades. This kills the old cliff where a 16–25
 * season span collapsed straight to 2–4 near-useless decade chips. Each chip
 * anchors to the newest season in its span and carries every season it covers,
 * so the client can map a scrolled-to season back to its chip.
 */
function deriveJumpRail(matches: MatchRow[]): { label: string; chips: JumpChip[] } | null {
  const order: string[] = [];
  const count = new Map<string, number>();
  for (const m of matches) {
    if (!count.has(m.season)) order.push(m.season);
    count.set(m.season, (count.get(m.season) ?? 0) + 1);
  }
  if (order.length < 2) return null;

  // Few enough seasons: a chip each, straight to that season.
  if (order.length <= TARGET) {
    return {
      label: "Jump to a season",
      chips: order.map((s) => ({ key: s, label: s, anchor: s, n: count.get(s) ?? 0, seasons: [s] })),
    };
  }

  // Bucket seasons by their start year into spans `size` years wide.
  const bucket = (size: number, label: string, face: (floorYear: number) => string) => {
    const chips: JumpChip[] = [];
    const idx = new Map<number, number>();
    for (const m of matches) {
      const floorYear = Math.floor(startYear(m.season) / size) * size;
      let i = idx.get(floorYear);
      if (i === undefined) {
        i = chips.length;
        idx.set(floorYear, i);
        chips.push({ key: String(floorYear), label: face(floorYear), anchor: m.season, n: 0, seasons: [] });
      }
      chips[i].n++;
      if (chips[i].seasons[chips[i].seasons.length - 1] !== m.season) chips[i].seasons.push(m.season);
    }
    return { label, chips };
  };

  // Five-year periods, then decades as the final fallback (only a >140-year
  // span would overflow even that, which no single subject has).
  const periods = bucket(5, "Jump to a period", (y) => `${y}–${String(y + 4).slice(2)}`);
  if (periods.chips.length <= TARGET) return periods;
  return bucket(10, "Jump to a decade", (y) => `${y}s`);
}

/**
 * A jump rail into a season-grouped archive: each chip anchors to a season
 * `<section id="{idPrefix}-…">` (rendered by {@link MatchGroups} or the collapsed
 * season list in {@link MatchArchive}). Adapts its grain to the span and, on the
 * client, pins under the header (when `sticky`) and tracks the season you're
 * reading. Matches arrive newest-first.
 */
export function ArchiveJumpRail({
  matches,
  idPrefix = "season",
  sticky = false,
}: {
  matches: MatchRow[];
  /** Anchor id prefix; must match the grouped sections' ids (e.g. "scored", "apps"). */
  idPrefix?: string;
  /** Pin the rail under the site header while the archive scrolls beneath it. */
  sticky?: boolean;
}) {
  const rail = deriveJumpRail(matches);
  if (!rail) return null;
  return <JumpRail chips={rail.chips} label={rail.label} idPrefix={idPrefix} sticky={sticky} />;
}
