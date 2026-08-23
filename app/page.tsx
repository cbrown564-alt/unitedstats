import type { Metadata } from "next";
import Link from "next/link";
import {
  allTimeRecord, getMeta, recentMatches, recordByCompetitionType,
  seasonAggregates, championSeasons,
} from "@/lib/queries";
import { fmtNum, pct, COMPETITION_TYPE_LABELS } from "@/lib/format";
import { featuredLaunchQuestion } from "@/lib/questions";
import { MatchList } from "@/components/MatchList";
import { WdlBar } from "@/components/WdlBar";
import { SearchCommand } from "@/components/SearchCommand";
import { MobileSearchPrompt } from "@/components/mobile/MobileSearchPrompt";
import { SectionHead } from "@/components/SectionHead";
import { PageHeader } from "@/components/PageHeader";
import { HistorySkyline } from "@/components/charts/HistorySkyline";
import { TonightHero } from "@/components/TonightHero";
import { HomeThreadFilm } from "@/components/HomeThreadFilm";
import { greatNights, homepageNightCatalog } from "@/lib/greatNights";

// The front door is the gate (CONTEXT.md §6): its whole job is to fire the spark.
// The export prerenders today's night; the hero re-selects on the client after
// hydration so the spark stays current without ISR.

const HOME_DESCRIPTION =
  "Evidence-backed Manchester United history: every match, every competition, every goal — from Newton Heath to today.";

export const metadata: Metadata = {
  title: { absolute: "Red Thread — every Manchester United match since 1886" },
  description: HOME_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    title: "Red Thread — every Manchester United match since 1886",
    description: HOME_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Red Thread — every Manchester United match since 1886",
    description: HOME_DESCRIPTION,
  },
};

export default function Home() {
  const meta = getMeta();
  const rec = allTimeRecord();
  const byType = recordByCompetitionType();
  const recent = recentMatches(8);
  const { nights, seed } = greatNights();
  const nightCatalog = homepageNightCatalog();
  const featured = featuredLaunchQuestion();
  const firstYear = meta.first_match?.slice(0, 4) ?? "1886";
  const years = new Date().getFullYear() - Number(firstYear);
  const lastDate = meta.last_match ?? "";

  // The hero object: the whole record as one breathing skyline — every season a
  // bar of matches played, stacked W/D/L, championship years gold-capped.
  const skyline = seasonAggregates().filter((s) => s.p > 0);
  const champs = new Set(championSeasons());

  // All-time record by competition as stacked W/D/L bars; matches played rides a
  // √-scaled volume lane under each (so League dwarfs the cups without distorting the
  // bar). Only the four major competitions earn a place on the homepage; the shields,
  // super cups, world finals and old test matches are dropped.
  const RECORD_TYPES = new Set(["league", "domestic-cup", "league-cup", "european"]);
  const recordRows = byType.filter((t) => RECORD_TYPES.has(t.type));
  const recordPMax = Math.max(1, ...recordRows.map((t) => t.p));

  return (
    <div className="space-y-10 sm:space-y-14 lg:space-y-16">
      {/* The front door, fused into one piece (CONTEXT.md §§2,6): the film, the spark,
          and the foundation they belong to. The film runs straight into the served
          match-night; the record plate pulls up over the thread's foot. */}
      <div>
        {/* 1. THE THREAD — one authored connection from the full film, played once. */}
        <section
          id="red-thread-film"
          className="full-bleed-viewport stories-film stories-film--home -mt-8 sm:-mt-10"
          aria-labelledby="home-film-title"
        >
          <span className="stories-film-knot" aria-hidden />
          <div className="stories-film-heading">
            <h2 id="home-film-title" className="display">Every United match since 1886</h2>
            <p>Twenty seconds. One connection across forty years. Then follow the thread to every match, player and moment.</p>
          </div>
          <HomeThreadFilm />
        </section>

        {/* 2. THE SPARK — a single served match-night, chosen for you, the Red Thread
            its spine. */}
        <section id="the-spark" aria-label="Tonight's match">
          <TonightHero
            nights={nights}
            seed={seed}
            catalog={nightCatalog}
            servedDay={new Date().toISOString().slice(0, 10)}
          />
        </section>

        {/* 2. THE FOUNDATION (CONTEXT.md §2) — the whole record the night belongs to:
            every season as a breathing skyline, the scope, the search. Pulled up so
            the thread runs into it and disappears behind its top edge — the spark and
            the record read as one continuous piece. The negative margin is the knob
            for how far the thread sinks behind the plate. */}
        <section id="the-record" className="relative z-10 -mt-10 scroll-mt-24 overflow-hidden rounded-xl border border-line bg-panel shadow-[0_22px_44px_rgb(0_0_0_/0.22)] sm:-mt-12">
          <div className="hero-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden />
          <div
            className="pointer-events-none absolute -right-24 -top-28 h-72 w-2/3 rounded-full opacity-[0.12] blur-3xl"
            style={{ backgroundColor: "var(--color-devil)" }}
            aria-hidden
          />
          <div className="relative p-4 sm:p-5 lg:p-7">
            <PageHeader eyebrow="From Newton Heath to today" title="Manchester United, match by match">
              {fmtNum(rec.p)} matches across {years} years of league, cup, and European football.
            </PageHeader>
            <div className="mt-6 max-w-2xl hidden lg:block">
              <SearchCommand />
              <p className="text-xs text-ink-faint mt-1.5">
                Press <kbd className="stat-num border border-line rounded px-1">/</kbd> to search
                {" "}— players, matches, seasons; anything.
              </p>
            </div>
            <MobileSearchPrompt />

            <div className="mt-8">
              <HistorySkyline seasons={skyline} champions={champs} />
            </div>
          </div>
        </section>
      </div>

      {/* ── Movement: start a trail. One featured myth, day-rotated through the
          launch set — a single deepening door into the record. ── */}
      <section>
        <SectionHead
          title="Start with a question"
          aside={<Link href="/explore" className="text-devil-bright hover:underline">Discover all →</Link>}
        />
        <Link
          href={`/questions/${featured.slug}`}
          className="group flex flex-col rounded-xl border border-line bg-panel p-5 transition-colors hover:border-devil/60 hover:bg-panel-2/60 focus-ring sm:p-6"
        >
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-devil-bright/80">
            {featured.label}
          </span>
          <span className="display mt-1 text-balance text-xl leading-tight text-ink group-hover:text-devil-bright sm:text-2xl">
            {featured.question}
          </span>
          <span className="mt-2 max-w-2xl text-pretty text-sm text-ink-dim">{featured.summary}</span>
          <span className="mt-4 text-xs text-devil-bright">Open the answer →</span>
        </Link>
        <p className="mt-2 text-xs text-ink-faint">
          Myths fans repeat, each tested against the record — open one for the finding and the matches behind it.
        </p>
      </section>

      <section className="grid lg:grid-cols-[1fr_20rem] gap-10">
        <div>
          <SectionHead
            title="Latest results"
            aside={<Link href="/matches" className="text-devil-bright hover:underline">All matches →</Link>}
          />
          <MatchList matches={recent} accentResult />
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
    </div>
  );
}
