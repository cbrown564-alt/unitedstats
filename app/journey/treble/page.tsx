import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TrebleSpinoff, type TrebleDecider } from "@/components/journey/TrebleSpinoff";
import { JourneyBeat, JourneySourceLink, JourneyThreadAnchor } from "@/components/journey/JourneyBeat";
import { JourneyChapterNav } from "@/components/journey/JourneyChapterNav";
import { ResultSpine } from "@/components/charts/ResultSpine";
import { TrophyIcon } from "@/components/CampaignIcons";
import { MatchFlow } from "@/components/MatchFlow";
import { FormationPitch, Bench } from "@/components/FormationPitch";
import { matchesSequence } from "@/lib/trails";
import { matchReceipt, subGoals, unbeatenTail, type MatchReceipt, type SubGoal } from "@/lib/journey";
import { familyName } from "@/lib/names";

export const revalidate = 86400;
export const metadata: Metadata = {
  title: "Journey — the Treble",
  description:
    "1998–99: sixty-three games, then three trophies in eleven days — the title from behind, the Cup, and Barcelona in stoppage time. In all three, a substitute scored.",
  robots: { index: false, follow: false },
};

const SEASON = "1998-99";
const LEAGUE_DECIDER = "1999-05-16-tottenham-hotspur-h";
const CUP_FINAL = "1999-05-22-newcastle-united-n";
const EURO_FINAL = "1999-05-26-bayern-munich-n";

const NUM_WORDS = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight",
  "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen",
];
const MONTHS_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function numWord(n: number, capitalize = false): string {
  const w = NUM_WORDS[n] ?? String(n);
  return capitalize ? w.charAt(0).toUpperCase() + w.slice(1) : w;
}

/** "1998-12-19" → "19 December" — the headline's day, no year (the stage set it). */
function dayMonth(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS_FULL[m - 1]}`;
}

/** "1999-05-16" → "16 May". */
function dayMonthShort(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS_FULL[m - 1].slice(0, 3)}`;
}

function ord(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

/** 1-based day within the eleven-day window ("day one", "day seven", "day eleven"). */
function windowDay(date: string, first: string): string {
  const n = Math.round((Date.parse(date) - Date.parse(first)) / 86_400_000) + 1;
  return numWord(n);
}

/** Goal clock as the receipts print it — stoppage stays "90+3". */
function clockLabel(minute: number, added: number | null): string {
  return added ? `${minute}+${added}` : `${minute}`;
}

/**
 * One decider, told with the real /match surfaces. The gold line above the flow
 * names the substitute the beat is about — minute on, minute scored — read from
 * `match_lineups.sub_on` and `match_events`, never asserted.
 */
function DeciderCard({
  receipt,
  heading,
  goals,
}: {
  receipt: MatchReceipt;
  heading: string;
  goals: SubGoal[];
}) {
  return (
    <div className="flex flex-col">
      <div className="flex items-baseline justify-center gap-3">
        <span className="stat-num text-lg font-bold text-ink">{dayMonthShort(receipt.date)}</span>
        <span className="text-sm text-ink-dim">v {receipt.opponent}</span>
        <span className="stat-num text-sm text-gold">{receipt.score}</span>
      </div>
      <p className="mt-1 text-center text-[11px] uppercase tracking-[0.16em] text-ink-faint">{heading}</p>
      <div className="mt-3 flex flex-col items-center gap-1">
        {goals.map((g) => (
          <p key={`${g.playerId}-${g.minute}-${g.added ?? 0}`} className="text-center text-xs font-medium text-ink-dim">
            <span className="stat-num mr-2 text-gold">{g.subOn != null ? `on ${g.subOn}′` : "sub"}</span>
            {familyName(g.name)} · scored {clockLabel(g.minute, g.added)}′
          </p>
        ))}
      </div>

      <div className="mt-7">
        <MatchFlow
          unitedGoals={receipt.unitedGoals}
          opponentGoals={receipt.opponentGoals}
          aet={receipt.aet}
          focusPlayerIds={goals.map((g) => g.playerId)}
        />
      </div>
    </div>
  );
}

/**
 * Journey chapter 2 — the Treble as the spin-off verb (docs/JOURNEY.md §4b).
 * Beat 0 is the pocket morph; beat 1 the season's shape; beats 2–4 the three
 * deciders with the bench through-line rising; beat 5 the door. Sibling of
 * /journey (the loop); not linked from nav; noindex.
 */
export default function TrebleJourneyPage() {
  const seq = matchesSequence({ season: SEASON });
  const tail = unbeatenTail(seq);
  if (seq.length === 0 || !tail) notFound();

  const league = matchReceipt(LEAGUE_DECIDER);
  const cup = matchReceipt(CUP_FINAL);
  const euro = matchReceipt(EURO_FINAL);
  if (!league || !cup || !euro) notFound();

  const leagueSubs = subGoals(league);
  const cupSubs = subGoals(cup);
  const euroSubs = subGoals(euro);

  const deciders: TrebleDecider[] = [league, cup, euro].map((r) => ({
    id: r.id,
    date: r.date,
    competition: r.competition.replace(/^UEFA /, ""),
  }));
  const spanDays =
    Math.round((Date.parse(euro.date) - Date.parse(league.date)) / 86_400_000) + 1;
  const seasonLabel = SEASON.replace("-", "–");

  // The comeback's cast, read off the receipts. Copy falls back to plainer lines
  // if a re-ingest ever changes the shapes (the golden test pins them meanwhile).
  const leagueOppGoal = league.opponentGoals[0];
  const leagueLeveller = league.unitedGoals.find((g) => !leagueSubs.some((s) => s.playerId === g.player_id));
  const leagueWinner = leagueSubs[0];
  const cupOpener = cupSubs[0];
  const cupSecond = cup.unitedGoals.find((g) => !cupSubs.some((s) => s.playerId === g.player_id));
  const euroOppGoal = euro.opponentGoals[0];

  const leagueSub =
    leagueOppGoal?.minute != null && leagueLeveller?.minute != null && leagueWinner
      ? `${familyName(leagueOppGoal.player_display_name ?? "")} put ${league.opponent} ahead on ${leagueOppGoal.minute}. ${familyName(leagueLeveller.player_display_name ?? "")} levelled on ${leagueLeveller.minute}; ${familyName(leagueWinner.name)} — on at half-time — turned it on ${leagueWinner.minute}.`
      : `Behind at the break, ${league.score} at the end.`;
  const cupSub =
    cupOpener?.subOn != null && cupSecond?.minute != null
      ? `${familyName(cupOpener.name)} came on in the ${ord(cupOpener.subOn)} minute and scored in the ${ord(cupOpener.minute)}. ${familyName(cupSecond.player_display_name ?? "")} made it ${cup.score} on ${cupSecond.minute}.`
      : `${cup.score} against ${cup.opponent}.`;
  const euroSub =
    euroOppGoal?.minute != null && euroSubs.length === 2
      ? `${familyName(euroOppGoal.player_display_name ?? "")} put ${euro.opponent} ahead on ${euroOppGoal.minute}. Ninety minutes gone: ${familyName(euroSubs[0].name)}, ${clockLabel(euroSubs[0].minute, euroSubs[0].added)}. ${familyName(euroSubs[1].name)}, ${clockLabel(euroSubs[1].minute, euroSubs[1].added)}.`
      : `${euro.score} against ${euro.opponent}, from behind.`;

  return (
    <>
      {/* Hide the app chrome before first paint so the immersive stage never
         flashes the sidebar/footer on load. The stage hook keeps it in sync for
         client-side navigation and restores the chrome on the way out. */}
      <script dangerouslySetInnerHTML={{ __html: `document.documentElement.dataset.chrome="off"` }} />

      {/* Beat 0 — the spin-off (its own sticky runway). */}
      <TrebleSpinoff
        seasonLabel={seasonLabel}
        games={seq.length}
        deciders={deciders}
        axisEndYear={new Date().getFullYear()}
      />

      {/* Beats 1–5 — down the floodlit field. */}
      <div className="journey-floodlit full-bleed-viewport relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_60%_at_50%_0%,rgba(255,238,210,0.06),transparent_45%)]"
          aria-hidden
        />
        <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-8">
          {/* Beat 1 — the season's shape (ResultSpine, the /seasons surface). */}
          <JourneyBeat
            step={1}
            headline={<>After {dayMonth(tail.lastLoss ?? seq[0].date)}, United <JourneyThreadAnchor>didn&apos;t lose again.</JourneyThreadAnchor></>}
            sub={`${tail.games} games — ${tail.w} won, ${tail.d} drawn — to the end of the season.`}
            source={<JourneySourceLink href={`/seasons/${SEASON}`} label={`Season ${seasonLabel}`} />}
            align="left"
          >
            <div className="relative mx-auto max-w-5xl overflow-hidden bg-pitch bg-[radial-gradient(65%_95%_at_50%_100%,rgba(216,33,13,0.16),transparent_72%)] px-3 py-8 sm:px-10 sm:py-12">
              <span className="pointer-events-none absolute bottom-0 right-[4%] stat-num text-[10rem] font-bold leading-none text-devil-bright/[0.06] sm:text-[15rem]" aria-hidden>{tail.games}</span>
              <ResultSpine
                matches={seq}
                markers={[
                  { id: league.id, label: `${dayMonthShort(league.date)} — Premier League, final day: ${league.score} v ${league.opponent}` },
                  { id: cup.id, label: `${dayMonthShort(cup.date)} — FA Cup final: ${cup.score} v ${cup.opponent}` },
                  { id: euro.id, label: `${dayMonthShort(euro.date)} — Champions League final: ${euro.score} v ${euro.opponent}` },
                ]}
                height={120}
                xLabel="month"
                markerGlyph={<TrophyIcon className="h-4 w-4" />}
                hrefForMatch={(id) => `/match/${id}`}
              />
            </div>
          </JourneyBeat>

          {/* Beat 2 — day one: the league, from behind. */}
          <JourneyBeat
            step={2}
            headline={<>Day {windowDay(league.date, league.date)}: the title, <JourneyThreadAnchor>won from behind.</JourneyThreadAnchor></>}
            sub={leagueSub}
            source={<JourneySourceLink href={`/match/${LEAGUE_DECIDER}`} label={`${dayMonthShort(league.date)} · ${league.opponent}`} />}
            align="right"
          >
            <div className="relative mx-auto max-w-5xl overflow-hidden bg-pitch bg-[radial-gradient(70%_65%_at_50%_8%,rgba(216,33,13,0.14),transparent_72%)] px-1 py-8 sm:px-8 sm:py-12">
              <span className="pointer-events-none absolute right-[6%] top-0 stat-num text-8xl font-bold text-ink/[0.035] sm:text-[10rem]" aria-hidden>16</span>
              <DeciderCard receipt={league} heading="Premier League — final day" goals={leagueSubs} />
            </div>
          </JourneyBeat>

          {/* Beat 3 — day seven: the Cup, opened from the bench. */}
          <JourneyBeat
            step={3}
            headline={<>Day {windowDay(cup.date, league.date)}: <JourneyThreadAnchor>a substitute</JourneyThreadAnchor> opened the Cup final.</>}
            sub={cupSub}
            source={<JourneySourceLink href={`/match/${CUP_FINAL}`} label={`${dayMonthShort(cup.date)} · ${cup.opponent}`} />}
            align="left"
          >
            <div className="relative mx-auto max-w-5xl overflow-hidden bg-pitch bg-[radial-gradient(70%_65%_at_50%_8%,rgba(245,197,24,0.1),transparent_72%)] px-1 py-8 sm:px-8 sm:py-12">
              <span className="pointer-events-none absolute right-[6%] top-0 stat-num text-8xl font-bold text-ink/[0.035] sm:text-[10rem]" aria-hidden>22</span>
              <DeciderCard receipt={cup} heading="FA Cup final" goals={cupSubs} />
            </div>
          </JourneyBeat>

          {/* Beat 4 — day eleven: the climax. The teamsheet is the proof: no goal
             mark on any starter; both marks sit in the substitutes column with
             their minute on. */}
          <JourneyBeat
            step={4}
            headline={<>Day {windowDay(euro.date, league.date)}: <JourneyThreadAnchor>both goals came off the bench.</JourneyThreadAnchor></>}
            sub={euroSub}
            source={<JourneySourceLink href={`/match/${EURO_FINAL}`} label={`${dayMonthShort(euro.date)} · ${euro.opponent}`} />}
            align="center"
          >
            <div className="relative mx-auto max-w-5xl overflow-hidden bg-pitch bg-[radial-gradient(70%_65%_at_50%_8%,rgba(111,159,224,0.14),transparent_72%)] px-1 py-8 sm:px-8 sm:py-12">
              <span className="pointer-events-none absolute right-[6%] top-0 stat-num text-8xl font-bold text-ink/[0.035] sm:text-[10rem]" aria-hidden>26</span>
              <DeciderCard receipt={euro} heading="Champions League final" goals={euroSubs} />
              <div className="mx-auto mt-10 grid max-w-4xl gap-8 sm:grid-cols-[3fr_2fr] sm:gap-10">
                <div className="mx-auto w-full max-w-[26rem]">
                  <FormationPitch
                    starters={euro.starters}
                    decade={euro.decade}
                    marks={euro.marks}
                  />
                </div>
                <div className="self-center">
                  <Bench used={euro.usedSubs} unused={[]} decade={euro.decade} marks={euro.marks} />
                  <p className="mt-3 max-w-[24rem] text-xs leading-5 text-ink-dim">
                    The starting eleven carries no goal mark. Both sit in the
                    substitutes column — {familyName(euroSubs[0]?.name ?? "")} on{" "}
                    {euroSubs[0]?.subOn}′, {familyName(euroSubs[1]?.name ?? "")} on{" "}
                    {euroSubs[1]?.subOn}′.
                  </p>
                </div>
              </div>
            </div>
          </JourneyBeat>

          {/* Beat 5 — the door. */}
          <JourneyBeat
            step={5}
            headline={`${numWord(spanDays, true)} days. ${numWord(deciders.length, true)} trophies.`}
            sub="In all three, a substitute scored. Now run the season back."
            className="min-h-[65vh] justify-center"
          >
            <div className="flex flex-col items-center gap-6 pb-16">
              <Link
                href="/questions/treble"
                className="inline-flex items-center gap-2 rounded-full border border-devil-bright/60 bg-devil/15 px-6 py-3 text-sm font-semibold text-ink shadow-[0_0_30px_-6px_rgba(255,59,31,0.6)] transition hover:border-devil-bright hover:bg-devil/25 focus-ring"
              >
                How United won it →
              </Link>
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium uppercase tracking-[0.18em] text-ink-faint">
                <Link href={`/match/${LEAGUE_DECIDER}`} className="transition hover:text-gold focus-ring">
                  {dayMonthShort(league.date)} · the league →
                </Link>
                <Link href={`/match/${CUP_FINAL}`} className="transition hover:text-gold focus-ring">
                  {dayMonthShort(cup.date)} · the Cup →
                </Link>
                <Link href={`/match/${EURO_FINAL}`} className="transition hover:text-gold focus-ring">
                  {dayMonthShort(euro.date)} · Europe →
                </Link>
              </div>
              <JourneyChapterNav current="/journey/treble" />
            </div>
          </JourneyBeat>
        </div>
      </div>
    </>
  );
}
