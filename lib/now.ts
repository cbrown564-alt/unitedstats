import { onThisDay, type OnThisDayEntry } from "./onThisDay";
import { recentHistoryDigests, type RecentDigestCard } from "./historyDigests";
import {
  CURATED_CUTS, cutHref, curatedCut, runCut, isChronological,
  type CuratedCut, type CutResult,
} from "./cut";

interface InterestingCut {
  cut: CuratedCut;
  href: string;
  result: CutResult;
}

/**
 * "What's interesting right now" (Phase 18.3): the three living surfaces woven
 * into one demoted entry point for the wanderer — what happened *on this date*,
 * what the latest result *changed* in the all-time record, and a curated Cut that
 * *rotates* through the set so the strip is never the same twice in a week.
 *
 * The rotation is deterministic (day-of-year), not behavioural — the static
 * guardrail holds. It is a strip, not a hero: the 18.1 decision demoted the
 * serendipity feed below the answer-first surfaces.
 */
export interface WhatsInteresting {
  today: OnThisDayEntry;
  change: RecentDigestCard | null;
  cut: InterestingCut;
}

/** UTC month-day key ("MM-DD") for a date — matches the on-this-day routing. */
function monthDayOf(d: Date): string {
  return `${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

/** Zero-based day index within the UTC year, for the deterministic cut rotation. */
function dayOfYear(d: Date): number {
  const start = Date.UTC(d.getUTCFullYear(), 0, 0);
  const today = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return Math.floor((today - start) / 86_400_000);
}

export function whatsInteresting(now = new Date()): WhatsInteresting {
  const today = onThisDay(monthDayOf(now));
  const change = recentHistoryDigests(1)[0] ?? null;

  const c = CURATED_CUTS[dayOfYear(now) % CURATED_CUTS.length];
  const spec = curatedCut(c);
  const cut: InterestingCut = {
    cut: c,
    href: cutHref(spec),
    result: runCut(spec, isChronological(spec.dimension) ? 200 : 8),
  };

  return { today, change, cut };
}
