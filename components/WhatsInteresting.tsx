import Link from "next/link";
import type { ReactNode } from "react";
import { resultTone, venuePrefix } from "@/lib/format";
import type { WhatsInteresting as WhatsInterestingData } from "@/lib/now";

/** The three living surfaces, normalised to one shape so the strongest available
 *  find can take the lead slot and the rest fall in behind it. */
interface NowCard {
  key: string;
  href: string;
  eyebrow: string;
  /** The on-this-day card carries the "today" pulse — it's literally now. */
  live?: boolean;
  figure: string;
  figureTone: string;
  body: ReactNode;
  cta: string;
}

const eyebrowClass = "text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint";
const ctaClass = "mt-auto pt-3 text-[11px] font-semibold text-devil-bright transition-opacity";

function Eyebrow({ card }: { card: NowCard }) {
  return (
    <span className={`flex items-center gap-1.5 ${eyebrowClass}`}>
      {card.live && (
        <span className="relative flex h-1.5 w-1.5" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-devil-bright/70" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-devil-bright" />
        </span>
      )}
      {card.eyebrow}
    </span>
  );
}

/** The lead: a larger panel with the brand thread running down its edge, the
 *  find's figure given room to land. */
function LeadCard({ card }: { card: NowCard }) {
  return (
    <Link
      href={card.href}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-line bg-panel p-5 transition-colors hover:border-devil/60 hover:bg-panel-2/50 focus-ring sm:p-6"
    >
      <span
        className="pointer-events-none absolute inset-y-0 left-0 w-[3px] bg-[linear-gradient(to_bottom,transparent,var(--color-devil),transparent)]"
        aria-hidden
      />
      <Eyebrow card={card} />
      <span className={`stat-num display mt-3 text-4xl font-semibold leading-none sm:text-5xl ${card.figureTone}`}>
        {card.figure}
      </span>
      <p className="mt-3 max-w-md text-pretty text-sm leading-6 text-ink-dim group-hover:text-ink sm:text-[15px]">
        {card.body}
      </p>
      <span className={`${ctaClass} text-devil-bright`}>{card.cta} →</span>
    </Link>
  );
}

/** A support: compact, quiet, sized to ride beside the lead. */
function SupportCard({ card }: { card: NowCard }) {
  return (
    <Link
      href={card.href}
      className="group flex flex-col rounded-lg border border-line bg-panel p-3.5 transition-colors hover:border-devil/60 hover:bg-panel-2/60 focus-ring"
    >
      <Eyebrow card={card} />
      <p className="mt-2 text-pretty text-sm leading-6 text-ink-dim group-hover:text-ink">
        {card.figure && <span className={`stat-num mr-1.5 font-semibold ${card.figureTone}`}>{card.figure}</span>}
        {card.body}
      </p>
      <span className="mt-2.5 text-[11px] font-semibold text-ink-faint transition-colors group-hover:text-devil-bright">
        {card.cta} →
      </span>
    </Link>
  );
}

/**
 * "What's interesting right now" (Phase 18.3): the wanderer's serendipity strip,
 * weaving on-this-day, the freshest record change, and a day-rotating curated Cut.
 * Reshaped from a flat three-card row into a *lead + rail*: the strongest live
 * find (today's match, else the latest change) takes a featured panel with the
 * brand thread down its edge, the other two ride beside it. A demoted strip, not
 * a hero (the 18.1 decision); the rotation lives in `lib/now.ts`.
 */
export function WhatsInteresting({ data }: { data: WhatsInterestingData }) {
  const { today, change, cut } = data;
  const lead = today.lead;
  const headline = cut.result.headline;

  const cards: NowCard[] = [];

  if (lead) {
    cards.push({
      key: "on-this-day",
      href: "/on-this-day",
      eyebrow: `On this day · ${today.label}`,
      live: true,
      figure: lead.scoreline,
      figureTone: resultTone(lead.result),
      body: (
        <>
          <span className="stat-num text-ink-faint">{lead.year}</span>{" "}
          <span className="text-ink-faint">{venuePrefix(lead.venue)}</span> {lead.opponent}
          {lead.note ? ` — ${lead.note}` : ` · ${lead.competition}`}
        </>
      ),
      cta: "Today in United history",
    });
  }

  if (change) {
    cards.push({
      key: "just-changed",
      href: change.path,
      eyebrow: "The record updated",
      figure: change.score,
      figureTone: resultTone(change.result),
      body: (
        <>
          <span className="text-ink-faint">{venuePrefix(change.venue)}</span> {change.opponent} — {change.lead.text}
        </>
      ),
      cta: "What it moved",
    });
  }

  cards.push({
    key: "todays-cut",
    href: cut.href,
    eyebrow: `Today's cut · ${cut.cut.eyebrow}`,
    figure: headline?.figure ?? "",
    figureTone: "text-gold",
    body: headline ? (
      <>
        <span className="text-ink-dim">{headline.metric}</span> ·{" "}
        <span className="font-medium text-ink">{headline.subject}</span> — {headline.gloss}
      </>
    ) : (
      cut.cut.blurb
    ),
    cta: cut.cut.title,
  });

  // No United match falls on today's date: still acknowledge it, but never let
  // the empty card lead — it rides at the back of the rail.
  if (!lead) {
    cards.push({
      key: "on-this-day-empty",
      href: "/on-this-day",
      eyebrow: `On this day · ${today.label}`,
      live: true,
      figure: "",
      figureTone: "text-ink",
      body: "No United match falls on this date — see the nearest one in history.",
      cta: "Browse the calendar",
    });
  }

  const [leadCard, ...rest] = cards;
  const supports = rest.slice(0, 2);

  return (
    <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr]">
      <LeadCard card={leadCard} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 lg:content-center">
        {supports.map((c) => (
          <SupportCard key={c.key} card={c} />
        ))}
      </div>
    </div>
  );
}
