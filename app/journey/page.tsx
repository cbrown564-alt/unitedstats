import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RhymeMorph, type RhymeMorphSide } from "@/components/journey/RhymeMorph";
import { JourneyBeat } from "@/components/journey/JourneyBeat";
import { CareerDuelChartLazy } from "@/components/charts/lazy";
import { EuropeFinalsTimeline, type EuropeFinal } from "@/components/charts/EuropeFinalsTimeline";
import { MatchFlow } from "@/components/MatchFlow";
import { FormationPitch } from "@/components/FormationPitch";
import { comparePlayers, type CareerSeason } from "@/lib/compare";
import { europeanFinals } from "@/lib/trails";
import { finalReceipt, type FinalReceipt } from "@/lib/journey";
import { familyName } from "@/lib/names";

export const revalidate = 86400;
export const metadata: Metadata = {
  title: "Journey — Ronaldo vs Best",
  description: "Two No. 7s, forty years apart. Same fifth season, same European Cup, each scoring in the final.",
  robots: { index: false, follow: false },
};

const RONALDO = "cristiano-ronaldo";
const BEST = "george-best";
const FINAL_1968 = "1968-05-29-benfica-n";
const FINAL_2008 = "2008-05-21-chelsea-n";

/** The premier European trophy only — European Cup, rebranded Champions League in
 *  1992. Keeps the spine to the trophy both No. 7s lifted (and the '99 win between
 *  them), not every European final United ever reached. */
const EUROPEAN_CUP_NAMES = new Set(["European Cup", "UEFA Champions League"]);

function peakGoals(arc: CareerSeason[]): { goals: number; apps: number } | null {
  if (!arc.length) return null;
  const peak = arc.reduce((m, s) => (s.goals > m.goals ? s : m), arc[0]);
  return peak.goals > 0 ? { goals: peak.goals, apps: peak.apps } : null;
}

/** Calendar year for a season label like 1967-68 → 1968 (the year the campaign ends). */
function seasonEndYear(season: string): number {
  const m = /^(\d{4})-(\d{2})$/.exec(season);
  if (!m) return Number(season.slice(0, 4)) || 0;
  const century = Number(m[1].slice(0, 2));
  return century * 100 + Number(m[2]);
}

/** The scorer's own minute in a final — pulled from the receipt so the climax
 *  copy is DB-derived, not asserted. */
function heroMinute(receipt: FinalReceipt, playerId: string): number | null {
  const g = receipt.unitedGoals.find((e) => e.player_id === playerId && e.minute != null);
  return g?.minute ?? null;
}

/** One final, told with the real /match surfaces: the flow bar carrying the goal,
 *  over the ghosted teamsheet with the scorer's shirt marked. */
function FinalCard({ receipt, heading }: { receipt: FinalReceipt; heading: string }) {
  return (
    <div className="flex flex-col">
      <div className="flex items-baseline justify-center gap-3">
        <span className="stat-num text-lg font-bold text-ink">{receipt.year}</span>
        <span className="text-sm text-ink-dim">v {receipt.opponent}</span>
        <span className="stat-num text-sm text-gold">{receipt.score}</span>
      </div>
      <p className="mt-1 text-center text-[11px] uppercase tracking-[0.16em] text-ink-faint">{heading}</p>

      <div className="mt-7">
        <MatchFlow
          unitedGoals={receipt.unitedGoals}
          opponentGoals={receipt.opponentGoals}
          aet={receipt.aet}
        />
      </div>

      {/* The teamsheet, ghosted to atmosphere behind the flow — the scorer's shirt
         carries its goal mark, so the No. 7 reads without extra chrome. */}
      <div
        className="pointer-events-none mt-6 opacity-60 [mask-image:linear-gradient(to_bottom,#000_62%,transparent)]"
        aria-hidden
      >
        <FormationPitch starters={receipt.starters} decade={receipt.decade} marks={receipt.marks} />
      </div>
    </div>
  );
}

/**
 * Throwaway journey lab — Ronaldo ↔ Best, the trophy-rhyme arc.
 * Scoped in docs/JOURNEY.md §4; not linked from nav; noindex. Beat 0 is the
 * opening morph; beats 1–3 each showcase a different app surface carrying a new
 * rhyming fact; beat 4 is the door into the living product.
 */
export default function JourneyPage() {
  const c = comparePlayers(RONALDO, BEST);
  if (!c || c.signature?.kind !== "career") notFound();

  // c.a is Ronaldo (side A), c.b is Best (side B) — the /compare convention.
  const ronaldo = c.a;
  const best = c.b;
  const ronaldoArc = c.signature.a;
  const bestArc = c.signature.b;
  const bestPeak = peakGoals(bestArc);
  const ronaldoPeak = peakGoals(ronaldoArc);
  if (!bestPeak || !ronaldoPeak) notFound();

  const bestYear = seasonEndYear(bestArc.reduce((m, s) => (s.goals > m.goals ? s : m), bestArc[0]).season);
  const ronaldoYear = seasonEndYear(ronaldoArc.reduce((m, s) => (s.goals > m.goals ? s : m), ronaldoArc[0]).season);

  const morphA: RhymeMorphSide = { id: best.id, name: best.label, peakYear: bestYear };
  const morphB: RhymeMorphSide = { id: ronaldo.id, name: ronaldo.label, peakYear: ronaldoYear };

  const finals: EuropeFinal[] = europeanFinals().filter((f) => EUROPEAN_CUP_NAMES.has(f.competition_name));

  const r1968 = finalReceipt(FINAL_1968);
  const r2008 = finalReceipt(FINAL_2008);
  if (!r1968 || !r2008) notFound();

  const bestMinute = heroMinute(r1968, best.id);
  const ronaldoMinute = heroMinute(r2008, ronaldo.id);

  const bestName = familyName(best.label);
  const ronaldoName = familyName(ronaldo.label);
  const compareHref = `/compare?mode=players&a=${RONALDO}&b=${BEST}`;

  return (
    <>
      {/* Hide the app chrome before first paint so the immersive stage never
         flashes the sidebar/footer on load. RhymeMorph keeps it in sync for
         client-side navigation and restores the chrome on the way out. */}
      <script dangerouslySetInnerHTML={{ __html: `document.documentElement.dataset.chrome="off"` }} />

      {/* Beat 0 — the opening morph (its own sticky runway). */}
      <RhymeMorph a={morphA} b={morphB} />

      {/* Beats 1–4 — the thread runs on down the floodlit field. */}
      <div className="full-bleed-viewport relative bg-pitch">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_60%_at_50%_0%,rgba(255,238,210,0.06),transparent_45%)]"
          aria-hidden
        />
        <div className="relative mx-auto w-full max-w-5xl px-4">
          {/* Beat 1 — the peak (CareerDuelChart, both peaks on season 5). */}
          <JourneyBeat
            step={1}
            eyebrow="The peak"
            headline="Each man's best season was his fifth."
            sub={`${bestName}, ${bestPeak.goals} in ${bestPeak.apps} games. ${ronaldoName}, ${ronaldoPeak.goals} in ${ronaldoPeak.apps}.`}
          >
            <div className="mx-auto max-w-2xl">
              <CareerDuelChartLazy
                a={ronaldoArc}
                b={bestArc}
                aId={ronaldo.id}
                bId={best.id}
                labelA={ronaldo.label}
                labelB={best.label}
                height={300}
              />
            </div>
          </JourneyBeat>

          {/* Beat 2 — the turn (European Cup finals; '99 sits between the rhymes). */}
          <JourneyBeat
            step={2}
            eyebrow="The turn"
            headline="And both lifted the European Cup that year."
            sub={`${bestName}'s Benfica, ${r1968.score}. ${ronaldoName}'s Chelsea, on penalties.`}
          >
            <div className="mx-auto max-w-sm text-left">
              <EuropeFinalsTimeline finals={finals} />
            </div>
          </JourneyBeat>

          {/* Beat 3 — the climax (each scored in the final). */}
          <JourneyBeat
            step={3}
            eyebrow="The final whistle"
            headline="And each one scored in the final."
            sub={
              bestMinute != null && ronaldoMinute != null
                ? `${bestName}, ${bestMinute} minutes. ${ronaldoName}, ${ronaldoMinute}.`
                : "Best and Ronaldo, on the scoresheet in the game that crowned the season."
            }
            gold
          >
            {/* Stacked at the flow's designed width — 1968's three late goals
               (Best 92′, Kidd 93′, Charlton 99′) need the same room the /match
               page gives them, or their labels smear; side-by-side halves that
               width, so the receipts breathe one above the other instead. */}
            <div className="mx-auto flex max-w-4xl flex-col gap-y-20">
              <FinalCard receipt={r1968} heading="European Cup Final" />
              <FinalCard receipt={r2008} heading="Champions League Final" />
            </div>
          </JourneyBeat>

          {/* Beat 4 — the door. */}
          <JourneyBeat
            step={4}
            eyebrow="The door"
            headline="One thread, forty years."
            sub="Same shirt, same fifth season, same European Cup — each scoring in the final. Now it's yours to pull."
            gold
          >
            <div className="flex flex-col items-center gap-6 pb-16">
              <Link
                href={compareHref}
                className="inline-flex items-center gap-2 rounded-full border border-devil-bright/60 bg-devil/15 px-6 py-3 text-sm font-semibold text-ink shadow-[0_0_30px_-6px_rgba(255,59,31,0.6)] transition hover:border-devil-bright hover:bg-devil/25 focus-ring"
              >
                Open the full duel →
              </Link>
              <div className="flex items-center gap-6 text-xs font-medium uppercase tracking-[0.18em] text-ink-faint">
                <Link href={`/match/${FINAL_1968}`} className="transition hover:text-gold focus-ring">
                  1968 final →
                </Link>
                <Link href={`/match/${FINAL_2008}`} className="transition hover:text-gold focus-ring">
                  2008 final →
                </Link>
              </div>
            </div>
          </JourneyBeat>
        </div>
      </div>
    </>
  );
}
