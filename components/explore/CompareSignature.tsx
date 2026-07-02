import type { Comparison } from "@/lib/compare";
import { CareerDuelPreview } from "@/components/charts/CareerDuelPreview";
import { TrophyCabinet, EraSkyline } from "@/components/CompareSignatures";

/**
 * The one signature visual that fills each compare slide in the Explore Asking
 * strip. A preview of the duel, not its depth: one chart or cabinet per debate,
 * deliberately lighter than the full /compare scoreboard (the jump target).
 *
 * Reuses the same signature data as CompareTable — career arcs, trophy cabinets,
 * era skylines — with explore-tuned compact rendering.
 */
export function CompareSignature({ c }: { c: Comparison }) {
  const s = c.signature;
  if (!s) return null;

  if (s.kind === "career") {
    return (
      <CareerDuelPreview
        compact
        a={s.a}
        b={s.b}
        labelA={c.a.label}
        labelB={c.b.label}
        chart={s.chart}
      />
    );
  }

  if (s.kind === "trophies") {
    const win = c.metrics.find((m) => m.label === "Win rate");
    return (
      <TrophyCabinet
        compact
        a={s.a}
        b={s.b}
        labelA={c.a.label}
        labelB={c.b.label}
        winA={win?.a ?? null}
        winB={win?.b ?? null}
      />
    );
  }

  const short = (x: string) => x.replace(/\s*\(.*\)$/, "");
  return <EraSkyline a={s.a} b={s.b} labelA={short(c.a.label)} labelB={short(c.b.label)} />;
}
