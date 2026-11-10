"use client";

import { useState, type ReactNode } from "react";
import {
  CORD_CHROME,
  CORD_RECORD,
  CORD_SECTIONS,
  CORD_SPECS,
  CordGlyph,
  type CordGlyphId,
} from "@/components/glyphs/cord/CordGlyph";
import { CoverageNote } from "@/components/CoverageNote";
import { FacetIcon } from "@/components/FacetIcon";
import { MedalIcon, TrophyGlyphFilled, TrophyIcon, TROPHY_CAT_TONE } from "@/components/CampaignIcons";
import { ThreadSignalKnot } from "@/components/ThreadSignalKnot";
import {
  CordLoader,
  CoverageWeave,
  FormCord,
  MatchThread,
  SeasonLap,
  type ThreadGoal,
} from "@/components/glyphs/cord/DataGlyphs";
import { opticalStroke } from "@/components/glyphs/cord/primitives";

type Result = "W" | "D" | "L";

export interface GalleryMatch {
  id: string;
  title: string;
  gf: number;
  ga: number;
  aet: boolean;
  result: Result;
  goals: ThreadGoal[];
  form: Result[];
}

export interface GalleryLap {
  season: string;
  results: Result[];
  position: number | null;
  competition: string;
  w: number;
  d: number;
  l: number;
}

const SIZES = [16, 20, 24, 32, 48, 80, 128];

/** A replay counter: 0 means never played, so nothing animates on load. */
function useReplay() {
  const [n, setN] = useState(0);
  return { key: n, now: n > 0 ? "cd-now" : "", play: () => setN((v) => v + 1) };
}

function Section({ title, lead, children }: { title: string; lead: string; children: ReactNode }) {
  return (
    <section className="space-y-5 border-t border-line pt-8">
      <div className="max-w-2xl space-y-1.5">
        <h2 className="text-xl font-bold tracking-tight text-ink">{title}</h2>
        <p className="text-sm leading-relaxed text-ink-dim">{lead}</p>
      </div>
      {children}
    </section>
  );
}

function PlayButton({ onClick, children = "Play" }: { onClick: () => void; children?: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-line bg-panel-2 px-3 py-1 text-xs font-semibold text-ink transition-colors hover:border-devil-bright hover:text-devil-bright focus-visible:outline-2 focus-visible:outline-devil-bright"
    >
      {children}
    </button>
  );
}

// ------------------------------------------------------------------- hero

function Hero({ match }: { match: GalleryMatch }) {
  const r = useReplay();
  return (
    <figure className="cord-stage space-y-4 rounded-2xl px-4 py-6 sm:px-8 sm:py-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <figcaption className="space-y-0.5">
          <p className="text-sm font-semibold text-ink">{match.title}</p>
          <p className="text-xs text-ink-dim">
            United {match.gf}–{match.ga}. The thread is the score state: under the line from 6′, level at 90+1′, ahead at 90+3′. Stoppage time is widened here so the last three minutes can be read.
          </p>
        </figcaption>
        <PlayButton onClick={r.play}>Play the night</PlayButton>
      </div>
      <MatchThread
        key={r.key}
        goals={match.goals}
        aet={match.aet}
        result={match.result}
        width={1200}
        stoppageZoom={0.24}
        axis
        className={`cd-lit ${r.now ? "cd-play" : ""}`}
        label={`${match.title}: United ${match.gf}–${match.ga}, drawn as score state over time`}
      />
    </figure>
  );
}

// ------------------------------------------------------------------- set

function Tile({ id }: { id: CordGlyphId }) {
  const r = useReplay();
  const spec = CORD_SPECS[id];
  return (
    <button
      type="button"
      onClick={r.play}
      className="cord-host group grid content-start gap-3 rounded-xl border border-line bg-panel p-4 text-left transition-colors hover:border-[#5a4d46] focus-visible:outline-2 focus-visible:outline-devil-bright"
    >
      <span className="cord-tile-stage grid h-28 place-items-center rounded-lg">
        <CordGlyph key={r.key} id={id} size={72} className={`cd-lit ${r.now}`} />
      </span>
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-ink">{id}</span>
        <span className="font-mono text-[11px] text-ink-faint">{spec.motion ?? "sew"}</span>
      </span>
      <span className="text-xs leading-snug text-ink-dim">{spec.says}</span>
      <span className="flex items-center gap-3 text-ink-faint" aria-hidden>
        <CordGlyph id={id} size={16} />
        <CordGlyph id={id} size={20} />
        <CordGlyph id={id} size={24} />
      </span>
    </button>
  );
}

function SetGroup({ title, ids }: { title: string; ids: CordGlyphId[] }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-ink-dim">{title}</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {ids.map((id) => (
          <Tile key={id} id={id} />
        ))}
      </div>
    </div>
  );
}

// ------------------------------------------------------------- optical ramp

function Ramp() {
  return (
    <div className="cord-stage rounded-2xl px-4 py-6 sm:px-8">
      <div className="flex flex-wrap items-end gap-x-8 gap-y-6 sm:gap-x-12">
        {SIZES.map((s) => (
          <figure key={s} className="cord-host grid justify-items-center gap-2">
            <CordGlyph id="journey" size={s} className="cd-lit" />
            <figcaption className="font-mono text-[11px] text-ink-faint">
              {s}px <span className="text-ink-dim">{opticalStroke(s)}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- record

function NightRow({ m }: { m: GalleryMatch }) {
  const r = useReplay();
  return (
    <div className="grid gap-3 rounded-xl border border-line bg-panel p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
      <div className="space-y-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm font-semibold text-ink">
            {m.title} <span className="font-mono text-ink-dim">{m.gf}–{m.ga}{m.aet ? " aet" : ""}</span>
          </p>
          <PlayButton onClick={r.play} />
        </div>
        <MatchThread
          key={r.key}
          goals={m.goals}
          aet={m.aet}
          result={m.result}
          width={520}
          className={`cd-lit h-auto w-full ${r.now ? "cd-play" : ""}`}
          label={`${m.title}, drawn as score state over time`}
        />
      </div>
      <div className="space-y-1 md:border-l md:border-line md:pl-4">
        <p className="text-xs text-ink-faint">Form going in</p>
        <FormCord key={r.key} results={m.form} height={22} className={`cd-lit ${r.now ? "cd-tally" : ""}`} label={`Previous results: ${m.form.join(" ")}`} />
        <p className="font-mono text-[11px] text-ink-faint">{m.form.join(" ")}</p>
      </div>
    </div>
  );
}

function Lap({ lap }: { lap: GalleryLap }) {
  const r = useReplay();
  const champions = lap.position === 1;
  return (
    <button
      type="button"
      onClick={r.play}
      className="cord-host grid justify-items-center gap-2 rounded-xl border border-line bg-panel p-4 text-center focus-visible:outline-2 focus-visible:outline-devil-bright"
    >
      <span className="relative grid place-items-center">
        <SeasonLap
          key={r.key}
          results={lap.results}
          champions={champions}
          size={180}
          className={`cd-lit ${r.now ? "cd-play" : ""}`}
          label={`${lap.season} league season as a lap of results`}
        />
        <span className="absolute font-mono text-sm font-semibold text-ink">{lap.season}</span>
      </span>
      <span className="font-mono text-[11px] text-ink-dim">
        W{lap.w} D{lap.d} L{lap.l}
        {lap.position ? `, finished ${ordinal(lap.position)}` : ""}
      </span>
      <span className="text-[11px] text-ink-faint">{lap.competition}</span>
    </button>
  );
}

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

const FACETS = [
  "shield", "suit", "person", "target", "margin", "arrow", "trophy", "tag",
  "flag", "hourglass", "home", "stadium", "pin", "calendar", "stopwatch",
];

function ProductMarks() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-5 rounded-xl border border-line bg-panel p-4">
        <figure className="grid justify-items-center gap-2 text-gold">
          <span className="flex items-end gap-2">
            <TrophyIcon className="h-3 w-3" />
            <TrophyIcon className="h-8 w-8" />
          </span>
          <figcaption className="font-mono text-[11px] text-ink-faint">won</figcaption>
        </figure>
        <figure className="grid justify-items-center gap-2 text-silver">
          <span className="flex items-end gap-2">
            <MedalIcon className="h-3 w-3" />
            <MedalIcon className="h-8 w-8" />
          </span>
          <figcaption className="font-mono text-[11px] text-ink-faint">runners-up</figcaption>
        </figure>
        <figure className="grid justify-items-center gap-2">
          <span className="flex items-end gap-1">
            {Object.entries(TROPHY_CAT_TONE).map(([k, tone]) => (
              <TrophyGlyphFilled key={k} style={{ color: tone }} />
            ))}
          </span>
          <figcaption className="font-mono text-[11px] text-ink-faint">cabinet tones</figcaption>
        </figure>
        <figure className="grid justify-items-center gap-2">
          <ThreadSignalKnot />
          <figcaption className="font-mono text-[11px] text-ink-faint">rediscovery</figcaption>
        </figure>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-8">
        {FACETS.map((f) => (
          <figure key={f} className="grid justify-items-center gap-2 rounded-xl border border-line bg-panel px-2 py-3 text-ink-dim">
            <span className="flex items-end gap-2">
              <FacetIcon name={f} className="h-4 w-4" />
              <FacetIcon name={f} className="h-8 w-8 text-ink" />
            </span>
            <figcaption className="font-mono text-[11px] text-ink-faint">{f}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

const WEAVE_FRACTIONS = [0, 0.1, 0.35, 0.5, 0.8, 0.97, 1];

function Weaves() {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {WEAVE_FRACTIONS.map((f) => (
          <figure key={f} className="grid w-24 justify-items-center gap-2 rounded-xl border border-line bg-panel px-2 py-3">
            <span className="flex items-center gap-3">
              <CoverageWeave fraction={f} className="cd-lit" />
              <CoverageWeave fraction={f} size={40} className="cd-lit" />
            </span>
            <figcaption className="font-mono text-[11px] text-ink-faint">{Math.round(f * 100)}%</figcaption>
          </figure>
        ))}
      </div>
      <div className="max-w-xl rounded-xl border border-line bg-panel p-4">
        <CoverageNote
          slice="all competitions, per season"
          count={{ covered: 13, total: 17, noun: "seasons carry lineup coverage", note: "empty cells are coverage gaps, not zero" }}
        />
      </div>
      <p className="max-w-xl text-xs leading-relaxed text-ink-faint">
        A coverage weave is one cord woven through the record for exactly the share that is covered; the rest is left
        open. Only complete coverage ends on a gold knot. Coverage notes show it at 14px beside a graded count.
      </p>
    </div>
  );
}

// ------------------------------------------------------------ motion library

type Curve = [number, number, number, number] | "linear";

interface MotionEntry {
  name: string;
  does: string;
  token: string;
  curve: Curve;
  where: string;
  demo: (r: ReturnType<typeof useReplay>, on: boolean) => ReactNode;
  toggle?: boolean;
}

const MOTIONS: MotionEntry[] = [
  {
    name: "sew",
    does: "A cord draws in behind a needle head.",
    token: "--m-sew 420ms, --ease-draw",
    curve: [0.3, 0.7, 0.2, 1],
    where: "Every glyph, on hover",
    demo: (r) => <CordGlyph key={r.key} id="journey" size={56} className={`cd-lit ${r.now}`} />,
  },
  {
    name: "cinch",
    does: "Beads are pulled tight once the cord reaches them.",
    token: "--m-cinch 220ms, --ease-cinch",
    curve: [0.2, 0.9, 0.3, 1],
    where: "Every bead, after its sew",
    demo: (r) => <CordGlyph key={r.key} id="analytics" size={56} className={`cd-lit ${r.now}`} />,
  },
  {
    name: "run",
    does: "A gold bead travels the length of the cord.",
    token: "--m-run 760ms, --ease-run",
    curve: [0.55, 0, 0.25, 1],
    where: "Search, discover, share, on this day",
    demo: (r) => <CordGlyph key={r.key} id="search" size={56} className={`cd-lit ${r.now}`} />,
  },
  {
    name: "pull",
    does: "Slack thread is drawn taut.",
    token: "--m-pull 360ms, --ease-taut",
    curve: [0.4, 0, 0, 1],
    where: "More, expanders, anything that opens",
    toggle: true,
    demo: (_r, on) => <CordGlyph id="more" size={56} className={`cd-lit ${on ? "cd-taut" : ""}`} />,
  },
  {
    name: "slide",
    does: "Beads move along their strings.",
    token: "--m-pull 360ms, --ease-taut",
    curve: [0.4, 0, 0, 1],
    where: "Filters, switches",
    toggle: true,
    demo: (_r, on) => <CordGlyph id="filter" size={56} className={`cd-lit ${on ? "cd-slid" : ""}`} />,
  },
  {
    name: "unravel",
    does: "The cord is pulled out through its end and threaded again.",
    token: "--m-sew × 1.6, --ease-draw",
    curve: [0.3, 0.7, 0.2, 1],
    where: "Close, clear, reset",
    demo: (r) => <CordGlyph key={r.key} id="close" size={56} className={`cd-lit ${r.now}`} />,
  },
  {
    name: "knot",
    does: "Sewn, cinched, and the knot sends out one ring.",
    token: "--m-sew + 520ms ring",
    curve: [0, 0, 0.58, 1],
    where: "Copied, saved, corrected",
    demo: (r) => <CordGlyph key={r.key} id="sewn" size={56} className={`cd-lit ${r.now}`} />,
  },
  {
    name: "play",
    does: "A data cord is drawn at match pace; beads land when the needle reaches them.",
    token: "--m-play 2600ms, linear",
    curve: "linear",
    where: "Match threads, season laps",
    demo: () => null,
  },
  {
    name: "tally",
    does: "Beads are counted on, one by one.",
    token: "--m-cinch 220ms, 42ms stagger",
    curve: [0.2, 0.9, 0.3, 1],
    where: "Form, counts, records",
    demo: (r) => (
      <FormCord key={r.key} results={["W", "W", "D", "L", "W", "W"]} height={28} className={`cd-lit ${r.now ? "cd-tally" : ""}`} />
    ),
  },
  {
    name: "orbit",
    does: "The needle runs round a closed loop while something waits.",
    token: "--m-loop 1100ms, --ease-run, infinite",
    curve: [0.55, 0, 0.25, 1],
    where: "Loading search and filters",
    demo: () => <CordLoader size={40} className="cd-lit" />,
  },
];

function EaseCurve({ curve }: { curve: Curve }) {
  const S = 40;
  const [x1, y1, x2, y2] = curve === "linear" ? [0, 0, 1, 1] : curve;
  const d = `M0 ${S}C${x1 * S} ${S - y1 * S} ${x2 * S} ${S - y2 * S} ${S} 0`;
  return (
    <svg width={44} height={44} viewBox="-2 -2 44 44" className="cd cd-lit" style={{ ["--cd-sw" as string]: 1.6 }} aria-hidden>
      <path className="cd-strand cd-strand--dashed" d={`M0 ${S}H${S}V0`} />
      <path className="cd-cord" d={d} />
      <circle className="cd-b cd-b--gold" cx={S} cy={0} r={2.4} />
    </svg>
  );
}

function MotionBench({ entry, play }: { entry: MotionEntry; play: GalleryMatch | undefined }) {
  const r = useReplay();
  const [on, setOn] = useState(false);
  const demo =
    entry.name === "play" && play ? (
      <MatchThread key={r.key} goals={play.goals} aet={play.aet} result={play.result} width={180} className={`cd-lit ${r.now ? "cd-play" : ""}`} />
    ) : (
      entry.demo(r, on)
    );
  const continuous = entry.name === "orbit";
  return (
    <div className="cord-host grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3 rounded-xl border border-line bg-panel p-4 sm:grid-cols-[7.5rem_minmax(0,1fr)_auto] sm:items-center">
      <div className="cord-tile-stage row-span-2 grid h-24 w-24 place-items-center rounded-lg sm:row-span-1 sm:w-full">{demo}</div>
      <div className="min-w-0 space-y-1">
        <p className="font-mono text-sm font-semibold text-ink">{entry.name}</p>
        <p className="text-sm text-ink-dim">{entry.does}</p>
        <p className="text-xs text-ink-faint">{entry.where}</p>
      </div>
      <div className="col-start-2 flex items-center gap-3 sm:col-start-3">
        <EaseCurve curve={entry.curve} />
        <div className="grid justify-items-start gap-1.5">
          <code className="font-mono text-[11px] text-ink-faint">{entry.token}</code>
          {!continuous && (
            <PlayButton onClick={() => (entry.toggle ? setOn((v) => !v) : r.play())}>
              {entry.toggle ? (on ? "Release" : "Pull") : "Replay"}
            </PlayButton>
          )}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------- grounds

const GROUNDS: { name: string; cls: string }[] = [
  { name: "Film frame", cls: "bg-black" },
  { name: "Sidebar glass", cls: "cord-glass" },
  { name: "Pitch", cls: "bg-pitch" },
  { name: "Panel 2", cls: "bg-panel-2" },
];

function Grounds() {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {GROUNDS.map((g) => (
        <div key={g.name} className={`${g.cls} space-y-3 rounded-xl border border-line p-4`}>
          <p className="text-xs text-ink-faint">{g.name}</p>
          <div className="flex flex-wrap gap-4 text-ink-faint">
            {CORD_SECTIONS.map((id, i) => (
              <span key={id} className={`cord-host ${i === 2 ? "cd-lit" : ""}`}>
                <CordGlyph id={id} size={20} />
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ------------------------------------------------------------------- page

export function CordGallery({ matches, laps }: { matches: GalleryMatch[]; laps: GalleryLap[] }) {
  const [hero, ...rest] = matches;
  return (
    <div className="space-y-10 py-6">
      <header className="max-w-2xl space-y-3">
        <h1 className="display text-3xl sm:text-4xl">Cord glyphs</h1>
        <p className="text-base leading-relaxed text-ink-dim">
          Cord replaced the hairline thread icons, which were drawn for a near-black page and read thin on the lifted
          charcoal. It gives them mass: a tonal plate for the record, one weighted red cord that does the moving, and beads where
          something is proven. Some of them are drawn straight from the record.
        </p>
      </header>

      {hero && <Hero match={hero} />}

      <Section
        title="The set"
        lead="Every shipped id, redrawn. The large glyph is lit; the row beneath is the idle glyph at 16, 20 and 24px. Hover or tap a tile to run its motion."
      >
        <SetGroup title="Sections" ids={CORD_SECTIONS} />
        <SetGroup title="Chrome" ids={CORD_CHROME} />
        <SetGroup title="Record" ids={CORD_RECORD} />
      </Section>

      <Section
        title="Optical sizes"
        lead="Cord weight is set by rendered size, so a nav icon and a page-sized mark read as the same object. The number is the stroke in grid units."
      >
        <Ramp />
      </Section>

      <Section
        title="Drawn from the record"
        lead="Data glyphs take real values and draw nothing the record does not state. A match thread rises when United score and falls when they concede; its height is the score state. Form sits a bead above the line for a win, on it for a draw, below for a loss."
      >
        <div className="space-y-3">
          {matches.map((m) => (
            <NightRow key={m.id} m={m} />
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {laps.map((lap) => (
            <Lap key={lap.season} lap={lap} />
          ))}
        </div>
        <p className="max-w-xl text-xs leading-relaxed text-ink-faint">
          A season lap runs clockwise from the top, one bead per league match: outside the ring for a win, on it for a
          draw, inside for a loss. A title-winning lap ends on a gold bead. Tap a lap to play it.
        </p>
        <Weaves />
      </Section>

      <Section
        title="Product marks"
        lead="The small marks the surfaces lean on, redrawn in the same grammar: campaign outcomes, filter facets and the rediscovery knot. They stay monochrome in currentColor so each host's tone carries through."
      >
        <ProductMarks />
      </Section>

      <Section
        title="Motion library"
        lead="Every motion is something a thread can do, timed from one set of tokens in app/cord.css. Nothing runs on load, nothing blocks the control, and under reduced motion each one rests on its final frame."
      >
        <div className="grid gap-3 xl:grid-cols-2">
          {MOTIONS.map((m) => (
            <MotionBench key={m.name} entry={m} play={rest[rest.length - 1] ?? hero} />
          ))}
        </div>
      </Section>

      <Section
        title="On every ground"
        lead="The set where it will actually sit: over film, on the sidebar glass, on the canvas and on raised panels."
      >
        <Grounds />
      </Section>
    </div>
  );
}
