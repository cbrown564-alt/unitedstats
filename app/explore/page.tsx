import Link from "next/link";
import type { Metadata } from "next";
import { getMeta, allTimeRecord } from "@/lib/queries";
import { QUESTIONS } from "@/lib/questions";
import { questionHeadlines } from "@/lib/questionHeadlines";
import {
  CURATED_DEBATES, comparePlayers, compareManagers, compareEras,
  type CompareMode, type Comparison,
} from "@/lib/compare";
import { CURATED_CUTS, cutHref, curatedCut, runCut, isChronological } from "@/lib/cut";
import { fmtNum } from "@/lib/format";
import { queryString } from "@/lib/url";
import { PageHeader } from "@/components/PageHeader";
import { SearchCommand } from "@/components/SearchCommand";
import { SectionHead } from "@/components/SectionHead";
import { QuestionSignature } from "@/components/explore/QuestionSignature";
import { FeatureCarousel } from "@/components/explore/FeatureCarousel";
import { FeatureSlide } from "@/components/explore/FeatureSlide";
import { ComparisonHero } from "@/components/explore/ComparisonHero";
import { CutHero } from "@/components/explore/CutHero";
import { RailCard } from "@/components/explore/RailCard";

const STAT_TONE: Record<"devil" | "gold" | "win", string> = {
  devil: "text-devil-bright",
  gold: "text-gold",
  win: "text-win",
};

export const metadata: Metadata = {
  title: "Discover",
  description:
    "Start with an answer — the curated questions tested against United’s record, then compare careers or eras and explore curated cuts of the whole record.",
  alternates: { canonical: "/explore" },
};

export default function ExplorePage() {
  const meta = getMeta();
  const rec = allTimeRecord();
  const firstYear = meta.first_match?.slice(0, 4) ?? "1886";
  const years = new Date().getFullYear() - Number(firstYear);

  const headlines = questionHeadlines();

  const COMPARE_MODES: CompareMode[] = ["players", "managers", "eras"];
  const debateHref = (mode: CompareMode, d: { a: string; b: string }) =>
    `/compare${queryString({ mode, a: d.a, b: d.b })}`;

  // The Asking strip features one flagship duel per mode — a player, a manager, an
  // era — for flavour, not the whole set. Both the carousel and its rail show just
  // these three, keeping the middle lane lighter than the top (the curation
  // gradient); the full curated set lives one click away in /compare.
  const flagships = COMPARE_MODES.flatMap((mode) => {
    const d = CURATED_DEBATES[mode][0];
    const c: Comparison | null =
      mode === "players" ? comparePlayers(d.a, d.b)
      : mode === "managers" ? compareManagers(d.a, d.b)
      : compareEras(d.a, d.b);
    return c ? [{ c, label: d.label, hook: d.hook, href: debateHref(mode, d) }] : [];
  });

  // The Exploring strip previews each curated cut as the same CutChart the /cut
  // page draws. Categorical ladders cap to a tidy top set; chronological cuts
  // (decade columns, a season line) keep their whole arc.
  const cutPreviews = CURATED_CUTS.map((c) => {
    const spec = curatedCut(c);
    return {
      c,
      href: cutHref(spec),
      result: runCut(spec, isChronological(spec.dimension) ? 200 : 8),
    };
  });

  return (
    <div className="space-y-12">
      <PageHeader eyebrow="Questions · comparisons · cuts" title="Discover" deferOnMobile>
        Myths tested against the full record. Compare careers, slice the archive, or search.
      </PageHeader>

      {/* The front door: the question field plus a one-line trust strip. */}
      <section className="space-y-2">
        <SearchCommand autoFocusKey={false} />
        <p className="text-xs text-ink-faint">
          <span className="stat-num text-ink-dim">{fmtNum(rec.p)}</span> official matches across{" "}
          <span className="stat-num text-ink-dim">{years}</span> years — every figure links to its matches.{" "}
          <Link href="/surprise" prefetch={false} className="text-devil-bright hover:underline">
            Surprise me
          </Link>{" "}
          with a random finding.
        </p>
      </section>

      {/* The Answering strip (the most curated of the three). A full-bleed feature
          carousel — one near-full-view answer hero per question, each leading with
          its live finding and a signature visual — over a summary rail so the set is
          skimmable without swiping. Both jump to the full page at /questions/[slug];
          the strip previews, it does not reproduce the depth. */}
      <section className="space-y-4">
        <SectionHead
          title="Tested myths"
          aside={<span className="text-ink-faint">{QUESTIONS.length} tested myths</span>}
        />

        <FeatureCarousel label="Tested myths — swipe across the findings">
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
                  Go to the full thread →
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
          aside={<span className="text-ink-faint">Player, manager, and era</span>}
        />

        <FeatureCarousel label="Flagship debates — comparing players, managers, and eras">
          {flagships.map((cmp) => (
            <ComparisonHero key={cmp.href} c={cmp.c} href={cmp.href} title={cmp.label} />
          ))}
        </FeatureCarousel>

        <ul aria-label="Flagship debates" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {flagships.map((cmp) => (
            <li key={cmp.href}>
              <RailCard href={cmp.href} lead={cmp.label} detail={cmp.hook} />
            </li>
          ))}
        </ul>

        <p className="text-xs text-ink-faint">
          Compare players, managers, and eras side by side on shared, coverage-aware metrics — or build a
          custom matchup.
        </p>
      </section>

      {/* The Exploring strip (Strip 3). The curated cuts reorder the whole record
          by a dimension, ranked by a lens — each slide previews a cut with the very
          chart the /cut page draws, then links through to its full standings ladder. */}
      <section className="space-y-4">
        <SectionHead
          title="Curated cuts"
          aside={<span className="text-ink-faint">Reordered by dimension and lens</span>}
        />

        <FeatureCarousel label="Curated cuts — group and rank the record">
          {cutPreviews.map(({ c, result, href }) => (
            <CutHero key={c.slug} cut={c} result={result} href={href} />
          ))}
        </FeatureCarousel>

        <ul aria-label="All curated cuts" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {cutPreviews.map(({ c, result, href }) => (
            <li key={c.slug}>
              <RailCard
                href={href}
                lead={c.title}
                stat={result.headline?.figure}
                statTone="text-gold"
                detail={
                  result.headline && (
                    <>
                      <span className="font-medium text-ink-dim">{result.headline.subject}</span> — {result.headline.gloss}
                    </>
                  )
                }
              />
            </li>
          ))}
        </ul>

        <p className="text-xs text-ink-faint">
          Each cut reorders the whole record as a standings ladder — every group links to its matches, with a
          coverage grade showing the completeness of the source records.
        </p>
      </section>

    </div>
  );
}
