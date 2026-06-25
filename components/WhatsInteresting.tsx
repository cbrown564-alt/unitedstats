import Link from "next/link";
import { resultTone, venuePrefix } from "@/lib/format";
import type { WhatsInteresting as WhatsInterestingData } from "@/lib/now";

const cardClass =
  "group flex h-full flex-col rounded-lg border border-line bg-panel p-3.5 transition-colors hover:border-devil/60 hover:bg-panel-2/60 focus-ring";

const eyebrowClass = "text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint";

/**
 * "What's interesting right now" (Phase 18.3): the wanderer's serendipity door,
 * weaving on-this-day, the freshest record change, and a rotating curated Cut
 * into one living strip — plus a "surprise me" pill that lands on any curated
 * surface. A demoted strip, not a hero (the 18.1 decision). The data, including
 * the deterministic daily rotation, comes from `lib/now.ts`; this is pure render.
 */
export function WhatsInteresting({ data }: { data: WhatsInterestingData }) {
  const { today, change, cut } = data;
  const lead = today.lead;
  const headline = cut.result.headline;

  return (
    <ul className="grid gap-2 sm:grid-cols-3">
      {/* On this day — the nostalgic's jog, anchored to today's date. */}
      <li>
        <Link href="/on-this-day" className={cardClass}>
          <span className={eyebrowClass}>On this day · {today.label}</span>
          {lead ? (
            <p className="mt-2 text-pretty text-sm leading-6 text-ink-dim group-hover:text-ink">
              <span className="stat-num text-ink-dim">{lead.year}</span> —{" "}
              <span className={`stat-num font-semibold ${resultTone(lead.result)}`}>{lead.scoreline}</span>{" "}
              <span className="text-ink-faint">{venuePrefix(lead.venue)}</span> {lead.opponent}
              {lead.note ? <span className="text-ink-faint"> · {lead.note}</span> : null}
            </p>
          ) : (
            <p className="mt-2 text-pretty text-sm leading-6 text-ink-dim group-hover:text-ink">
              No United match falls on this date — see the nearest one in history.
            </p>
          )}
          <span className="mt-auto pt-3 text-[11px] font-semibold text-devil-bright opacity-0 transition-opacity group-hover:opacity-100">
            Today in United history →
          </span>
        </Link>
      </li>

      {/* What the record just gained — the freshest digest, one card. */}
      {change && (
        <li>
          <Link href={change.path} className={cardClass}>
            <span className={eyebrowClass}>Just changed</span>
            <p className="mt-2 text-pretty text-sm leading-6 text-ink-dim group-hover:text-ink">
              <span className={`stat-num font-semibold ${resultTone(change.result)}`}>{change.score}</span>{" "}
              <span className="text-ink-faint">{venuePrefix(change.venue)}</span> {change.opponent} — {change.lead.text}
            </p>
            <span className="mt-auto pt-3 text-[11px] font-semibold text-devil-bright opacity-0 transition-opacity group-hover:opacity-100">
              What it moved →
            </span>
          </Link>
        </li>
      )}

      {/* Today's cut — the rotating curated Cut, its standout group. */}
      <li>
        <Link href={cut.href} className={cardClass}>
          <span className={eyebrowClass}>Today&apos;s cut · {cut.cut.eyebrow}</span>
          <p className="mt-2 text-pretty text-sm leading-6 text-ink-dim group-hover:text-ink">
            {headline ? (
              <>
                <span className="stat-num font-semibold text-gold">{headline.figure}</span>{" "}
                <span className="font-medium text-ink">{headline.subject}</span> — {headline.gloss}
              </>
            ) : (
              cut.cut.blurb
            )}
          </p>
          <span className="mt-auto pt-3 text-[11px] font-semibold text-devil-bright opacity-0 transition-opacity group-hover:opacity-100">
            {cut.cut.title} →
          </span>
        </Link>
      </li>
    </ul>
  );
}
