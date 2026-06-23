import Link from "next/link";
import type { Metadata } from "next";
import { getMeta, allTimeRecord } from "@/lib/queries";
import { QUESTIONS } from "@/lib/questions";
import { questionHeadlines } from "@/lib/questionHeadlines";
import { CURATED_DEBATES, type CompareMode } from "@/lib/compare";
import { fmtNum } from "@/lib/format";
import { queryString } from "@/lib/url";
import { PageHeader } from "@/components/PageHeader";
import { SearchCommand } from "@/components/SearchCommand";
import { SectionHead } from "@/components/SectionHead";
import { CuratedCarousel, type CarouselCard } from "@/components/CuratedCarousel";

const STAT_TONE: Record<"devil" | "gold" | "win", string> = {
  devil: "text-devil-bright",
  gold: "text-gold",
  win: "text-win",
};

export const metadata: Metadata = {
  title: "Explore",
  description:
    "Start with an answer: the curated questions tested against United's record, then compare two careers or eras and group the whole record your own way.",
  alternates: { canonical: "/explore" },
};

// One flagship debate per compare mode, so the Compare launcher shows the range
// (a player duel, a manager duel, an era duel) rather than three of one kind.
const COMPARE_PICKS: { mode: CompareMode; eyebrow: string }[] = [
  { mode: "players", eyebrow: "Player vs player" },
  { mode: "managers", eyebrow: "Manager vs manager" },
  { mode: "eras", eyebrow: "Era vs era" },
];

// "Group the record" — honest launchers into the aggregate surfaces that already
// exist, framed as dimensions you can slice the whole record by. (The general
// group-by-anything engine is Phase 12's Cut/fork work; this section points at the
// real grouped views we already ship rather than shipping a half-baked builder.)
const GROUPINGS: [eyebrow: string, title: string, blurb: string, href: string][] = [
  ["By season", "Every season, 1886 to today", "The record laid out chronologically — played, won, finished, champions gold-capped.", "/seasons"],
  ["By opponent", "Head-to-head with every club", "Each opponent's all-time record against United, home, away, and by competition.", "/opponents"],
  ["By manager", "Mangnall to now", "Every reign on win rate, points, and silverware, from the first secretary-manager on.", "/managers"],
  ["By the long arc", "Analytics & the all-time records", "Elo across 140 years, win rate, attendance, goal timing, and the records that hold.", "/analytics"],
];

export default function ExplorePage() {
  const meta = getMeta();
  const rec = allTimeRecord();
  const firstYear = meta.first_match?.slice(0, 4) ?? "1886";
  const years = new Date().getFullYear() - Number(firstYear);

  const headlines = questionHeadlines();

  const compareCards: CarouselCard[] = COMPARE_PICKS.map(({ mode, eyebrow }) => {
    const d = CURATED_DEBATES[mode][0];
    return {
      href: `/compare${queryString({ mode, a: d.a, b: d.b })}`,
      eyebrow,
      title: d.label,
      blurb: d.hook,
      cta: "Open the comparison →",
    };
  });

  return (
    <div className="space-y-12">
      <PageHeader eyebrow="Discovery" title="Explore">
        Start with an answer. The questions below are tested against the canonical record — each
        opens its full finding, the slice it&apos;s drawn from, the coverage behind it, and the
        matches that produced it. Compare and grouping follow once you have a thread to pull.
      </PageHeader>

      {/* The front door: the question field plus a one-line trust strip. */}
      <section className="space-y-2">
        <SearchCommand autoFocusKey={false} />
        <p className="text-xs text-ink-faint">
          <span className="stat-num text-ink-dim">{fmtNum(rec.p)}</span> matches across{" "}
          <span className="stat-num text-ink-dim">{years}</span> years — every figure links to the
          matches behind it, with a coverage grade where the record is still growing. Search names,
          seasons, or shaped questions like &ldquo;record away at Arsenal&rdquo;.
        </p>
      </section>

      {/* Answer layer: every curated question with its live finding up front. The
          full set as a grid (this is the questions hub, not a homepage tease), each
          card leading with the figure that answers it and linking to the full page. */}
      <section>
        <SectionHead
          title="Questions, answered"
          aside={<Link href="/questions" className="text-devil-bright hover:underline">All questions →</Link>}
        />
        <ul aria-label="Curated questions, answered" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QUESTIONS.map((q) => {
            const h = headlines[q.slug];
            return (
              <li key={q.slug}>
                <Link
                  href={`/questions/${q.slug}`}
                  className="group flex h-full flex-col rounded-xl border border-line bg-panel p-4 transition-colors hover:border-devil/60 hover:bg-panel-2/60 focus-ring"
                >
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-devil-bright/80">
                    {q.label}
                  </span>
                  <span className="display mt-1 text-balance text-base leading-tight text-ink group-hover:text-devil-bright">
                    {q.question}
                  </span>
                  {h && (
                    <span className={`stat-num mt-3 text-3xl font-semibold leading-none ${STAT_TONE[h.tone]}`}>
                      {h.stat}
                    </span>
                  )}
                  <span className="mt-1.5 text-pretty text-sm text-ink-dim">{h ? h.gloss : q.summary}</span>
                  <span className="mt-auto pt-3 text-xs text-devil-bright opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                    See the full finding →
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Exploratory follow-on 1: compare. */}
      <section>
        <SectionHead
          title="Compare two of anything"
          aside={<Link href="/compare" className="text-devil-bright hover:underline">All debates →</Link>}
        />
        <CuratedCarousel cards={compareCards} label="Great debates" />
        <p className="mt-2 text-xs text-ink-faint">
          Players, managers, and eras side by side on shared, coverage-aware metrics — or build your
          own pairing in <Link href="/compare" className="text-devil-bright hover:underline">Compare</Link>.
        </p>
      </section>

      {/* Exploratory follow-on 2: group. */}
      <section>
        <SectionHead title="Group the record" />
        <div className="grid gap-3 sm:grid-cols-2">
          {GROUPINGS.map(([eyebrow, title, blurb, href]) => (
            <Link
              key={href}
              href={href}
              className="group flex flex-col rounded-xl border border-line bg-panel p-4 transition-colors hover:border-devil/60 hover:bg-panel-2/60 focus-ring"
            >
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-devil-bright/80">{eyebrow}</span>
              <span className="display mt-1 text-balance text-lg leading-tight text-ink group-hover:text-devil-bright">{title}</span>
              <span className="mt-1.5 text-pretty text-sm text-ink-dim">{blurb}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
