import Link from "next/link";
import type { Metadata } from "next";
import { getMeta, allTimeRecord } from "@/lib/queries";
import { QUESTIONS } from "@/lib/questions";
import { questionHeadlines } from "@/lib/questionHeadlines";
import {
  CURATED_DEBATES, comparePlayers, compareManagers, compareEras,
  type CompareMode, type Comparison,
} from "@/lib/compare";
import { fmtNum } from "@/lib/format";
import { queryString } from "@/lib/url";
import { PageHeader } from "@/components/PageHeader";
import { SearchCommand } from "@/components/SearchCommand";
import { SectionHead } from "@/components/SectionHead";
import { QuestionSignature } from "@/components/explore/QuestionSignature";
import { FeatureCarousel } from "@/components/explore/FeatureCarousel";
import { FeatureSlide } from "@/components/explore/FeatureSlide";
import { ComparisonHero } from "@/components/explore/ComparisonHero";

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

  const COMPARE_MODES: CompareMode[] = ["players", "managers", "eras"];
  const debateHref = (mode: CompareMode, d: { a: string; b: string }) =>
    `/compare${queryString({ mode, a: d.a, b: d.b })}`;

  // The carousel features one flagship duel per mode — a player, a manager, an era —
  // for flavour, not the whole set. Built through the same engine /compare uses.
  const flagships = COMPARE_MODES.flatMap((mode) => {
    const d = CURATED_DEBATES[mode][0];
    const c: Comparison | null =
      mode === "players" ? comparePlayers(d.a, d.b)
      : mode === "managers" ? compareManagers(d.a, d.b)
      : compareEras(d.a, d.b);
    return c ? [{ c, label: d.label, href: debateHref(mode, d) }] : [];
  });

  // The rail carries the full curated set, so debates the carousel doesn't feature
  // are still one click away (no comparison computed — labels and links only).
  const allDebates = COMPARE_MODES.flatMap((mode) =>
    CURATED_DEBATES[mode].map((d) => ({ label: d.label, hook: d.hook, href: debateHref(mode, d) })),
  );

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

      {/* The Answering strip (the most curated of the three). A full-bleed feature
          carousel — one near-full-view answer hero per question, each leading with
          its live finding and a signature visual — over a summary rail so the set is
          skimmable without swiping. Both jump to the full page at /questions/[slug];
          the strip previews, it does not reproduce the depth. */}
      <section className="space-y-4">
        <SectionHead
          title="Questions, answered"
          aside={<span className="text-ink-faint">Answering · {QUESTIONS.length} curated</span>}
        />

        <FeatureCarousel label="Curated questions — swipe across the answers">
          {QUESTIONS.map((q) => {
            const h = headlines[q.slug];
            return (
              <FeatureSlide
                key={q.slug}
                href={`/questions/${q.slug}`}
                ariaLabel={`${q.question} — see the full finding`}
                visual={<QuestionSignature slug={q.slug} />}
              >
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-devil-bright/80">
                  {q.label}
                </span>
                <h3 className="display mt-1.5 text-balance text-2xl leading-tight text-ink group-hover:text-devil-bright sm:text-3xl">
                  {q.question}
                </h3>
                {h && (
                  <p className="mt-4 max-w-sm text-pretty text-sm leading-6 text-ink-dim">
                    <span className={`stat-num mr-2 align-baseline text-4xl font-semibold ${STAT_TONE[h.tone]}`}>
                      {h.stat}
                    </span>
                    {h.gloss}
                  </p>
                )}
                <span className="mt-5 inline-block text-xs font-semibold text-devil-bright transition-transform group-hover:translate-x-0.5">
                  See the full finding →
                </span>
              </FeatureSlide>
            );
          })}
        </FeatureCarousel>

        {/* The summary rail — every question at a glance, so you can jump straight
            in without swiping the strip. */}
        <ul aria-label="All curated questions" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {QUESTIONS.map((q) => {
            const h = headlines[q.slug];
            return (
              <li key={q.slug}>
                <Link
                  href={`/questions/${q.slug}`}
                  className="group flex items-baseline gap-3 rounded-lg border border-line bg-panel px-3 py-2.5 transition-colors hover:border-devil/60 hover:bg-panel-2/60 focus-ring"
                >
                  {h && (
                    <span className={`stat-num shrink-0 text-base font-semibold leading-none ${STAT_TONE[h.tone]}`}>
                      {h.stat}
                    </span>
                  )}
                  <span className="min-w-0 text-sm text-ink-dim group-hover:text-ink">{q.question}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* The Asking strip — the extensible "who was better than who at X?". Same
          feature-carousel + summary-rail shape as Answering, a touch lighter (the
          curation gradient): each debate's verdict and signature visual, jumping to
          the full /compare scoreboard, where any pairing can be built. */}
      <section className="space-y-4">
        <SectionHead
          title="Who was better?"
          aside={<span className="text-ink-faint">Asking · player, manager &amp; era</span>}
        />

        <FeatureCarousel label="Flagship debates — a player, a manager, an era">
          {flagships.map((cmp) => (
            <ComparisonHero key={cmp.href} c={cmp.c} href={cmp.href} title={cmp.label} />
          ))}
        </FeatureCarousel>

        <ul aria-label="All curated debates" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {allDebates.map((cmp) => (
            <li key={cmp.href}>
              <Link
                href={cmp.href}
                className="group flex items-baseline gap-2 truncate rounded-lg border border-line bg-panel px-3 py-2.5 transition-colors hover:border-devil/60 hover:bg-panel-2/60 focus-ring"
              >
                <span className="truncate text-sm text-ink-dim group-hover:text-ink">
                  <span className="font-medium text-ink">{cmp.label}</span>
                  <span className="text-ink-faint"> — {cmp.hook}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <p className="text-xs text-ink-faint">
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
