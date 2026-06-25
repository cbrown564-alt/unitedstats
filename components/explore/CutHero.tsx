import type { CuratedCut, CutResult } from "@/lib/cut";
import { CutChart } from "@/components/cut/CutChart";
import { FeatureSlide } from "@/components/explore/FeatureSlide";

/**
 * A curated cut as a feature slide in the Exploring strip — the third discovery
 * strip, the same full-view shell as Answering and Asking. The visual is the
 * exact {@link CutChart} the /cut page draws (form follows the dimension: decade
 * columns, a season line, or a ranked-bar ladder, grey field with the standout in
 * gold), so the preview and the page never diverge. The text column leads with the
 * cut's live standout finding and jumps to the full, forkable cut.
 *
 * The cut is run by the page (the data orchestrator) and passed in, so the rail
 * below the carousel can reuse the same headline without a second query.
 */
export function CutHero({ cut, result, href }: { cut: CuratedCut; result: CutResult; href: string }) {
  const { headline, groups, baseline } = result;
  return (
    <FeatureSlide
      href={href}
      ariaLabel={`${cut.title} — open the cut`}
      visual={
        <CutChart
          groups={groups}
          metric={cut.metric}
          dimension={cut.dimension}
          baseline={baseline}
          standoutKey={headline?.key}
        />
      }
    >
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-devil-bright/80">
        {cut.eyebrow}
      </span>
      <h3 className="display mt-1.5 text-balance text-2xl leading-tight text-ink group-hover:text-devil-bright sm:text-3xl">
        {cut.title}
      </h3>
      {headline ? (
        <p className="mt-4 max-w-sm text-pretty text-sm leading-6 text-ink-dim">
          <span className="stat-num mr-2 align-baseline text-4xl font-semibold text-gold">
            {headline.figure}
          </span>
          <span className="font-medium text-ink">{headline.subject}</span> — {headline.gloss}.
        </p>
      ) : (
        <p className="mt-4 max-w-sm text-pretty text-sm leading-6 text-ink-dim">{cut.blurb}</p>
      )}
      <span className="mt-5 inline-block text-xs font-semibold text-devil-bright transition-transform group-hover:translate-x-0.5">
        Go to the full cut →
      </span>
    </FeatureSlide>
  );
}
