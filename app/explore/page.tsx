import type { Metadata } from "next";
import { QUESTIONS } from "@/lib/questions";
import { questionHeadlines } from "@/lib/questionHeadlines";
import {
  CURATED_DEBATES, comparePlayers, compareManagers, compareRailFigure,
  type CompareMode, type Comparison, type CompareRailTone,
} from "@/lib/compare";

type ExploreCompareMode = Extract<CompareMode, "players" | "managers">;
import { queryString } from "@/lib/url";
import { PageHeader } from "@/components/PageHeader";
import { SectionHead } from "@/components/SectionHead";
import { QuestionSignature } from "@/components/explore/QuestionSignature";
import { FeatureCarousel } from "@/components/explore/FeatureCarousel";
import { FeatureSlide } from "@/components/explore/FeatureSlide";
import { ComparisonHero } from "@/components/explore/ComparisonHero";
import { RailCard } from "@/components/explore/RailCard";
import { listSeo, seoMetadata } from "@/lib/seo";

const STAT_TONE: Record<"devil" | "gold" | "win", string> = {
  devil: "text-devil-bright",
  gold: "text-gold",
  win: "text-win",
};

const COMPARE_STAT_TONE: Record<CompareRailTone, string> = STAT_TONE;

export const metadata: Metadata = seoMetadata(listSeo.explore.title, listSeo.explore.description, {
  alternates: { canonical: "/explore" },
});

export default function ExplorePage() {
  const headlines = questionHeadlines();

  const debateHref = (mode: ExploreCompareMode, d: { a: string; b: string }) =>
    `/compare${queryString({ mode, a: d.a, b: d.b })}`;

  // The Asking strip features three flagship duels — the top scorer race, the
  // two dynasty-builders, and the European champions between the posts. Both the
  // carousel and its rail show just these three, keeping the middle lane lighter
  // than the top (the curation gradient); the full curated set lives one click
  // away in /compare.
  const EXPLORE_DEBATES: { mode: ExploreCompareMode; index: number }[] = [
    { mode: "players", index: 0 },
    { mode: "managers", index: 0 },
    { mode: "players", index: 1 },
  ];
  const flagships = EXPLORE_DEBATES.flatMap(({ mode, index }) => {
    const d = CURATED_DEBATES[mode][index];
    const c: Comparison | null =
      mode === "players" ? comparePlayers(d.a, d.b) : compareManagers(d.a, d.b);
    return c ? [{ c, label: d.label, hook: d.hook, href: debateHref(mode, d) }] : [];
  });

  return (
    <div className="space-y-12">
      <PageHeader eyebrow="Questions · comparisons" title="Discover" deferOnMobile>
        Authored questions and head-to-heads, each with a route back to the matches.
      </PageHeader>

      {/* The Answering strip (the most curated of the three). A full-bleed feature
          carousel — one near-full-view answer hero per question, each leading with
          its live finding and a signature visual — over a summary rail so the set is
          skimmable without swiping. Both jump to the full page at /questions/[slug];
          the strip previews, it does not reproduce the depth. */}
      <section className="space-y-4">
        <SectionHead
          title="Questions"
          aside={<span className="text-ink-faint">{QUESTIONS.length} questions</span>}
        />

        <FeatureCarousel label="Questions — swipe across the answers">
          {QUESTIONS.map((q) => {
            const h = headlines[q.slug];
            return (
              <FeatureSlide
                key={q.slug}
                href={`/questions/${q.slug}`}
                ariaLabel={`${q.question} — open the answer`}
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
                  Open the answer →
                </span>
              </FeatureSlide>
            );
          })}
        </FeatureCarousel>

        {/* The summary rail — every question at a glance, so you can jump straight
            in without swiping the strip. Each card leads with the question, then
            answers it with the figure and what that figure means. */}
        <ul aria-label="All curated questions" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {QUESTIONS.map((q) => {
            const h = headlines[q.slug];
            return (
              <li key={q.slug}>
                <RailCard
                  href={`/questions/${q.slug}`}
                  lead={q.question}
                  stat={h?.stat}
                  statTone={h ? STAT_TONE[h.tone] : undefined}
                  detail={h?.gloss}
                />
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
          title="Curated debates"
          aside={<span className="text-ink-faint">Player and manager</span>}
        />

        <FeatureCarousel label="Flagship debates — comparing players and managers">
          {flagships.map((cmp) => (
            <ComparisonHero key={cmp.href} c={cmp.c} href={cmp.href} title={cmp.label} />
          ))}
        </FeatureCarousel>

        <ul aria-label="Flagship debates" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {flagships.map((cmp) => {
            const figure = compareRailFigure(cmp.c);
            return (
              <li key={cmp.href}>
                <RailCard
                  href={cmp.href}
                  lead={cmp.label}
                  stat={figure?.stat}
                  statTone={figure ? COMPARE_STAT_TONE[figure.tone] : undefined}
                  detail={cmp.hook}
                />
              </li>
            );
          })}
        </ul>

        <p className="text-xs text-ink-faint">
          Compare players and managers on shared, coverage-aware measures chosen for the role and era.
        </p>
      </section>
    </div>
  );
}
