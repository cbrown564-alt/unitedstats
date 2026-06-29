import Link from "next/link";
import {
  allTimeRecord, getMeta, recentMatches, recordByCompetitionType,
  topScorers, seasonAggregates, championSeasons,
} from "@/lib/queries";
import { clubRecords } from "@/lib/trails";
import {
  fmtNum, pct, fmtDate, fmtMonthYear, scoreline, venuePrefix, COMPETITION_TYPE_LABELS,
} from "@/lib/format";
import { QUESTIONS } from "@/lib/questions";
import { MatchList } from "@/components/MatchList";
import { WdlBar } from "@/components/WdlBar";
import { SearchCommand } from "@/components/SearchCommand";
import { CuratedCarousel, type CarouselCard } from "@/components/CuratedCarousel";
import { SectionHead } from "@/components/SectionHead";
import { EntryChips } from "@/components/EntryChips";
import { entryStrip } from "@/lib/entryPoints";
import { PlayerPortrait } from "@/components/PlayerPortrait";
import { RecordCards, type RecordCard } from "@/components/RecordCards";
import { HistorySkyline } from "@/components/charts/HistorySkyline";
import { TonightHero } from "@/components/TonightHero";
import { greatNights } from "@/lib/greatNights";

// The front door is the gate (CONTEXT.md §6): its whole job is to fire the spark.
// The served night is resolved per request so on-this-day reflects the real date
// and the latest record — like /surprise and /on-this-day.
export const dynamic = "force-dynamic";

export default function Home() {
  const meta = getMeta();
  const rec = allTimeRecord();
  const byType = recordByCompetitionType();
  const recent = recentMatches(8);
  const { nights, seed } = greatNights();
  const entries = entryStrip();
  const scorers = topScorers(8);
  const firstYear = meta.first_match?.slice(0, 4) ?? "1886";
  const years = new Date().getFullYear() - Number(firstYear);
  const lastDate = meta.last_match ?? "";

  // The hero object: the whole record as one breathing skyline — every season a
  // bar of matches played, stacked W/D/L, championship years gold-capped.
  const skyline = seasonAggregates().filter((s) => s.p > 0);
  const champs = new Set(championSeasons());

  // The trail the homepage leads with: three all-time peaks as answer-objects,
  // each a clickable figure-with-a-fixture rather than a metric tile. Built only
  // from records that exist, with three distinct units (a scoreline, a crowd, a
  // goal tally) so the teaser shows the family's range.
  const cr = clubRecords();
  const teaser: RecordCard[] = [];
  if (cr.biggestWin) {
    const m = cr.biggestWin;
    teaser.push({
      eyebrow: "Biggest win", figure: scoreline(m.gf, m.ga), tone: "win",
      detail: `${venuePrefix(m.venue)} ${m.opponent_name}`,
      meta: `${fmtDate(m.date)} · ${m.competition_name}`, href: `/match/${m.id}`,
    });
  }
  if (cr.recordCrowd?.attendance != null) {
    const m = cr.recordCrowd;
    teaser.push({
      eyebrow: "Record crowd", figure: fmtNum(m.attendance), tone: "gold",
      detail: `${venuePrefix(m.venue)} ${m.opponent_name} · ${scoreline(m.gf, m.ga)}`,
      meta: `${fmtDate(m.date)} · ${m.competition_name}`, href: `/match/${m.id}`,
    });
  }
  if (cr.longestUnbeaten) {
    const r = cr.longestUnbeaten;
    teaser.push({
      eyebrow: "Longest unbeaten run", figure: String(r.length), unit: "matches", tone: "devil",
      detail: `${fmtMonthYear(r.from)}–${fmtMonthYear(r.to)}`,
      meta: "wins and draws, official matches", href: `/matches?from=${r.from}&to=${r.to}`,
    });
  }

  // The curated-cut launcher: the nine myth-tested questions as a peek-carousel,
  // each card opening its full answer page (Phase 10 per-question routes). This is
  // the answer-first front door — it launches findings, it does not reproduce them.
  const questionCards: CarouselCard[] = QUESTIONS.map((q) => ({
    href: `/questions/${q.slug}`,
    eyebrow: q.label,
    title: q.question,
    blurb: q.summary,
  }));

  // All-time record by competition as stacked W/D/L bars; matches played rides a
  // √-scaled volume lane under each (so League dwarfs the cups without distorting the
  // bar). Only the four major competitions earn a place on the homepage; the shields,
  // super cups, world finals and old test matches are dropped.
  const RECORD_TYPES = new Set(["league", "domestic-cup", "league-cup", "european"]);
  const recordRows = byType.filter((t) => RECORD_TYPES.has(t.type));
  const recordPMax = Math.max(1, ...recordRows.map((t) => t.p));

  return (
    <div className="space-y-14 sm:space-y-16">
      {/* 1. THE SPARK (CONTEXT.md §6) — the front door is the gate, and its whole
          job is to fire the nostalgic jolt in the first seconds. A single served
          match-night, chosen for you, is the entire first screen; the re-roll deals
          another, and the steer beneath is for the reader who arrives with a name
          rather than a mood. The skyline-and-scope hero that used to lead is now the
          foundation beat below. */}
      <TonightHero nights={nights} seed={seed}>
        <p className="mb-2 text-xs uppercase tracking-[0.18em] text-ink-faint">
          Or follow a name — a player, a rival, an era
        </p>
        <EntryChips points={entries} />
      </TonightHero>

      {/* 2. THE FOUNDATION (CONTEXT.md §2) — the whole record the night belongs to:
          every season as a breathing skyline, the scope, the search. The spark is
          why you came; this is why the jolt is honest and why you stay. Demoted from
          h1 to a second-beat plate now that the night leads. */}
      <section className="relative overflow-hidden rounded-xl border border-line bg-panel shadow-[0_22px_44px_rgb(0_0_0_/0.22)]">
        <div className="hero-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden />
        <div
          className="pointer-events-none absolute -right-24 -top-28 h-72 w-2/3 rounded-full opacity-[0.12] blur-3xl"
          style={{ backgroundColor: "var(--color-devil)" }}
          aria-hidden
        />
        <div className="relative p-5 sm:p-7">
          <p className="text-xs uppercase tracking-[0.25em] text-devil-bright font-semibold mb-3">
            From Newton Heath to today
          </p>
          <h2 className="display text-3xl sm:text-4xl leading-[0.97] text-balance max-w-3xl">
            One thread through{" "}
            <span className="text-devil-bright">Manchester United’s</span> history
          </h2>
          <p className="mt-4 text-ink-dim max-w-2xl text-sm sm:text-base">
            {fmtNum(rec.p)} matches across {years} years of league, cup, and European football —
            the night above is one of them, traced back to the fixture record.
          </p>
          <div className="mt-6 max-w-2xl">
            <SearchCommand autoFocusKey={false} />
            <p className="text-xs text-ink-faint mt-1.5">
              <span className="sm:hidden">Search</span>
              <span className="hidden sm:inline">
                Press <kbd className="stat-num border border-line rounded px-1">/</kbd> to search
              </span>
              {" "}— names, seasons, or questions like &ldquo;record away at Arsenal&rdquo;.
            </p>
          </div>

          <div className="mt-8">
            <HistorySkyline seasons={skyline} champions={champs} />
          </div>
        </div>
      </section>

      {/* ── Movement: start a trail. The curated-cut launcher leads (answer
          first), then the wow-records and the live demonstrated question. ── */}
      <div className="space-y-10">
        <section>
          <SectionHead
            title="Start with a question"
            aside={<Link href="/explore" className="text-devil-bright hover:underline">Discover all →</Link>}
          />
          <CuratedCarousel cards={questionCards} label="Curated questions" />
          <p className="mt-2 text-xs text-ink-faint">
            Myths fans repeat, each tested against the record — open one for its finding, the slice it
            is drawn from, the coverage behind it, and the matches that produced it.
          </p>
        </section>

        {teaser.length > 0 && (
          <section>
            <SectionHead
              title="All-time peaks"
              aside={<Link href="/analytics" className="text-devil-bright hover:underline">All records →</Link>}
            />
            <RecordCards records={teaser} />
            <p className="text-xs text-ink-faint mt-2">
              All-time peaks across official competitions, each card opening the match or run that holds it.
            </p>
          </section>
        )}
      </div>

      <section className="grid lg:grid-cols-[1fr_20rem] gap-10">
        <div>
          <SectionHead
            title="Latest results"
            aside={<Link href="/matches" className="text-devil-bright hover:underline">All matches →</Link>}
          />
          <MatchList matches={recent} showSeason />
        </div>
        <div className="space-y-6">
          <h2 className="display text-xl">All-time record</h2>
          <div className="space-y-4">
            {recordRows.map((t) => (
              <div key={t.type}>
                <div className="flex justify-between text-sm mb-1.5">
                  <Link href={`/matches?type=${t.type}`} className="text-ink-dim hover:text-ink">
                    {COMPETITION_TYPE_LABELS[t.type] ?? t.type}
                  </Link>
                  <span className="stat-num text-xs text-ink-faint">
                    <span className="text-ink">{pct(t.w, t.p)}</span> W
                  </span>
                </div>
                <WdlBar
                  w={t.w}
                  d={t.d}
                  l={t.l}
                  size="md"
                  showLabels
                  volume={{ fraction: Math.sqrt(t.p / recordPMax), games: t.p }}
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-ink-faint">
            The win, draw, and loss share of official matches; the underline scales with volume,
            so the League matches are in proportion. Through{" "}
            <span className="stat-num">{lastDate}</span>, updated after every match — each
            row links to its matches, and the{" "}
            <Link href="/data" className="text-devil-bright hover:underline">coverage ledger</Link> shows what is
            sourced and what is still growing.
          </p>
        </div>
      </section>

      {/* ── The quiet browse close: the all-time scorers, set off by a divider so
          the eye registers the shift into the people behind the record. ── */}
      <div className="space-y-8 border-t border-line/60 pt-10">
        {scorers.length > 0 && (
          <section>
            <SectionHead
              title="Top goalscorers"
              aside={<Link href="/players" className="text-devil-bright hover:underline">All players →</Link>}
            />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-line border border-line rounded-lg overflow-hidden">
              {scorers.map((p, i) => (
                <Link key={p.player_id} href={`/player/${p.player_id}`} className="bg-panel px-4 py-3 hover:bg-panel-2 transition-colors">
                  <div className="flex items-center gap-3">
                    <PlayerPortrait name={p.name} src={p.player_thumb_url ?? p.player_image_url} />
                    <div className="min-w-0">
                      <div className="stat-num text-2xl font-semibold leading-none text-devil-bright">{p.goals}</div>
                      <div className="mt-1 truncate text-sm">{p.name}</div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-ink-faint stat-num">
                    #{i + 1}
                    {p.first_date ? ` · ${p.first_date.slice(0, 4)}–${p.last_date?.slice(0, 4)}` : ""}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
