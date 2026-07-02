import type { Comparison, CompareMode } from "@/lib/compare";
import { CompareSignature } from "@/components/explore/CompareSignature";
import { FeatureSlide } from "@/components/explore/FeatureSlide";

const MODE_EYEBROW: Record<CompareMode, string> = {
  players: "Player vs player",
  managers: "Manager vs manager",
  eras: "Era vs era",
};

/**
 * A curated debate as a feature slide in the Asking strip — the extensible
 * "who was better than who at X?" question. Lighter than the /compare scoreboard
 * by design (the curation gradient): the verdict and the signature visual, then a
 * jump to the full comparison. `title` is the curated short label ("Rooney vs
 * Charlton"); `c.headline` is the plain-language verdict.
 */
export function ComparisonHero({ c, href, title }: { c: Comparison; href: string; title: string }) {
  return (
    <FeatureSlide href={href} ariaLabel={`${title} — open the comparison`} visual={<CompareSignature c={c} />}>
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-devil-bright/80">
        {MODE_EYEBROW[c.mode]}
      </span>
      <h3 className="display mt-1.5 text-balance text-2xl leading-tight text-ink group-hover:text-devil-bright sm:text-3xl">
        {title}
      </h3>
      {c.headline && <p className="mt-4 max-w-sm text-pretty text-sm leading-6 text-ink-dim">{c.headline}</p>}
      <span className="mt-5 inline-block text-xs font-semibold text-devil-bright transition-transform group-hover:translate-x-0.5">
        Compare the records →
      </span>
    </FeatureSlide>
  );
}
