import Link from "next/link";
import { JOURNEY_CHAPTERS } from "@/lib/journey";
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

  // Three starting points; the complete reviewed set lives in /compare.
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
      <PageHeader eyebrow="Stories · questions · comparisons" title="Discover" deferOnMobile>
        Choose a story to read, a question to investigate, or two careers to compare. Each leads back to the matches.
      </PageHeader>

      <nav aria-label="Choose how to explore" className="flex flex-wrap gap-3 text-sm text-devil-bright">{[["stories", "Read a story"], ["questions", "Find an answer"], ["comparisons", "Compare careers"]].map(([id, label]) => <a key={id} href={`#${id}`} className="min-h-11 rounded-full border border-line px-4 py-3 focus-ring">{label}</a>)}</nav>
      <section id="stories" className="scroll-mt-24 space-y-4"><SectionHead title="Stories" aside={<Link href="/stories" className="text-devil-bright">The story collection →</Link>} /><ul className="grid gap-3 sm:grid-cols-2">{JOURNEY_CHAPTERS.map(chapter => <li key={chapter.slug}><Link href={chapter.href} data-analytics-event="related_content_click" className="block h-full rounded-xl border border-line bg-panel p-5 hover:border-devil focus-ring"><h2 className="display text-xl">{chapter.title}</h2><p className="mt-2 text-sm text-ink-dim">{chapter.description}</p><span className="mt-4 block text-sm text-devil-bright">Read the story →</span></Link></li>)}</ul></section>

      <section id="questions" className="scroll-mt-24 space-y-4">
        <SectionHead
          title="Questions"
          aside={<span className="text-ink-faint">{QUESTIONS.length} questions</span>}
        />


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

      <section id="comparisons" className="scroll-mt-24 space-y-4">
        <SectionHead
          title="Curated debates"
          aside={<span className="text-ink-faint">Player and manager</span>}
        />


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
