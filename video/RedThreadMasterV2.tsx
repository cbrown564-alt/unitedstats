import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import generated from "./generated-master-data.json";
import { lerp, smoothstep, windowed } from "./math";

const C = {
  pitch: "#0c0b0a",
  ink: "#f3ede8",
  dim: "#a89c94",
  faint: "#6f645d",
  line: "#2c2522",
  red: "#ff3b1f",
  redDeep: "#d8210d",
  gold: "#f5c518",
  cream: "#fff4d4",
  draw: "#9a8d83",
};

const SANS = "ArchivoMaster, Arial, sans-serif";
const MONO = "PlexMaster, Consolas, monospace";
const FPS = 30;
/** Hybrid spine: four opening cards → v5 rhyme/Treble/Fergie middle → Fortress → receipt. */
export const MASTER_DURATION_SECONDS = 90;
/** Opening composition length — four signatures in the lean 18s window. */
export const OPENING_DURATION_FRAMES = 540;

/**
 * Global act windows (frames). Local scene clocks subtract the *LocalOrigin.
 * Opening stays on the current match-card run; rhyme→Fergie restores the v5
 * middle timings (shifted so the loop still begins as the 2008 card settles).
 * Fergie holds the stories/fergie-time shared countdown before the late-goal bloom.
 */
const ACT = {
  openingUntil: OPENING_DURATION_FRAMES,
  rhymeFrom: 480,
  rhymeLocalOrigin: 510,
  rhymeUntil: 1140,
  trebleFrom: 1140,
  trebleLocalOrigin: 1140,
  trebleUntil: 1680,
  fergieFrom: 1590,
  fergieLocalOrigin: 1590,
  fergieUntil: 2230,
  fortressFrom: 2170,
  fortressLocalOrigin: 2190,
  fortressUntil: 2550,
  recordFrom: 2470,
  recordLocalOrigin: 2490,
} as const;

type MatchPoint = {
  id: string;
  date: string;
  result: "W" | "D" | "L";
  venue: string;
  competitionType: string;
};

type LateGoal = {
  key: string;
  matchId: string;
  date: string;
  opponent: string;
  minute: number;
  added: number | null;
  clock: number;
  scorer: string | null;
  stoppage: boolean;
};

type Echo = {
  id: string;
  date: string;
  opponent: string;
  score: string;
  deficit: { united: number; opponent: number; score: string; when: string };
  lateGoals: { name: string; minute: number; added: number | null; playerId?: string | null }[];
};

type FortressGame = {
  id: string;
  date: string;
  result: string;
  opponent: string;
  riskMinute: number | null;
  worst: number;
};

type FeaturedEvent = {
  seq: number;
  type: string;
  playerId: string | null;
  player: string | null;
  side: "united" | "opponent";
  minute: number | null;
  added: number | null;
};

type FeaturedLineupPlayer = {
  playerId: string | null;
  name: string;
  side: "united" | "opponent";
  shirt: number | null;
  role: string | null;
  careerBand: string | null;
  started: boolean;
  bench: boolean;
  subOn: number | null;
  subOff: number | null;
};

type FeaturedPlayer = {
  id: string;
  name: string;
  image: string | null;
  apps: number;
  goals: number;
  firstYear: number | null;
  lastYear: number | null;
};

type FeaturedMatch = {
  matchId: string;
  year: number;
  x: number;
  start: number;
  visualMode: "first-xi" | "score-storm" | "extra-time-burst" | "bench-reversal" | "penalty-constellation";
  eyebrow: string;
  headline: string;
  match: {
    id: string;
    date: string;
    opponent: string;
    venue: "H" | "A" | "N";
    stadium: string | null;
    competition: string;
    round: string | null;
    gf: number;
    ga: number;
    aet: boolean;
    penGf: number | null;
    penGa: number | null;
    eventsComplete: boolean;
    hasLineup: boolean;
  };
  events: FeaturedEvent[];
  lineup: FeaturedLineupPlayer[];
  featuredPlayers: FeaturedPlayer[];
};

type MasterData = {
  counts: { matches: number; events: number; lineups: number };
  firstMatch: { id: string; date: string; opponent: string; score: string; clubName: string };
  matches: MatchPoint[];
  featuredMatches: FeaturedMatch[];
  lateGoals: LateGoal[];
  fergieEchoes: Echo[];
  fortress: {
    games: FortressGame[];
    w: number;
    d: number;
    lastLoss: { date: string; opponent: string; gf: number; ga: number };
    cracks: { id: string; date: string; opponent: string; ft: string; worst: number }[];
  };
};

const DATA = generated as MasterData;

function alpha(value: number): string {
  return Math.max(0, Math.min(1, value)).toFixed(3);
}

function yearOf(date: string): number {
  return Number(date.slice(0, 4));
}

function hash(value: string): number {
  let out = 2166136261;
  for (let index = 0; index < value.length; index++) {
    out ^= value.charCodeAt(index);
    out = Math.imul(out, 16777619);
  }
  return out >>> 0;
}

function pointPath<T>(
  rows: readonly T[],
  locate: (row: T, index: number) => { x: number; y: number },
  radius = 1.15,
): string {
  return rows
    .map((row, index) => {
      const { x, y } = locate(row, index);
      return `M ${(x - radius).toFixed(1)} ${y.toFixed(1)} a ${radius} ${radius} 0 1 0 ${(radius * 2).toFixed(1)} 0 a ${radius} ${radius} 0 1 0 ${(-radius * 2).toFixed(1)} 0`;
    })
    .join(" ");
}

const matchPaths = {
  W: pointPath(DATA.matches.filter((match) => match.result === "W"), (match) => ({
    x: 110 + ((yearOf(match.date) - 1886) / 140) * 1700,
    y: 205 + (hash(match.id) % 690),
  }), 1.05),
  D: pointPath(DATA.matches.filter((match) => match.result === "D"), (match) => ({
    x: 110 + ((yearOf(match.date) - 1886) / 140) * 1700,
    y: 205 + (hash(match.id) % 690),
  }), 1.05),
  L: pointPath(DATA.matches.filter((match) => match.result === "L"), (match) => ({
    x: 110 + ((yearOf(match.date) - 1886) / 140) * 1700,
    y: 205 + (hash(match.id) % 690),
  }), 1.05),
};

const LATE_GOAL_YEAR_FROM = 1950;
const LATE_GOAL_YEAR_SPAN = Math.max(1, yearOf(DATA.lateGoals.at(-1)?.date ?? "2026") - LATE_GOAL_YEAR_FROM);

function lateGoalXY(goal: Pick<LateGoal, "date" | "clock" | "key">): { x: number; y: number } {
  return {
    x: 150 + ((yearOf(goal.date) - LATE_GOAL_YEAR_FROM) / LATE_GOAL_YEAR_SPAN) * 1620,
    y: 775 - Math.min(14, Math.max(0, goal.clock - 85)) * 38 + (hash(goal.key) % 25),
  };
}

const lateGoalPath = pointPath(DATA.lateGoals, (goal) => lateGoalXY(goal), 2.2);

function displayClock(minute: number, added: number | null): string {
  return minute === 90 && added ? `90+${added}′` : `${minute}′`;
}

const ECHO_ANNOTATIONS = DATA.fergieEchoes.map((echo) => {
  const goals = DATA.lateGoals.filter((goal) => goal.matchId === echo.id);
  const marker = goals.at(-1) ?? goals[0];
  if (!marker) return null;
  const shortOpponent = echo.opponent.replace(/^FC\s+/i, "").replace(/\s+United$/i, "").replace(/\s+Hotspur$/i, "");
  return {
    echo,
    marker,
    point: lateGoalXY(marker),
    clocks: echo.lateGoals.map((goal) => displayClock(goal.minute, goal.added)).join(" · "),
    label: `${echo.date.slice(0, 4)} · ${shortOpponent}`,
  };
}).filter((row): row is NonNullable<typeof row> => row != null);

function familyLabel(fullName: string): string {
  const parts = fullName.replace(/^Sir\s+/i, "").trim().split(/\s+/).filter(Boolean);
  return parts[parts.length - 1] ?? fullName;
}

function absoluteMinute(minute: number, added: number | null): number {
  return minute === 90 && added != null && added > 0 ? 90 + added : minute;
}

const STOPPAGE_CLOCK_START = 86;
const STOPPAGE_CLOCK_END = 97;
const STOPPAGE_CLOCK_RANGE = STOPPAGE_CLOCK_END - STOPPAGE_CLOCK_START;

function stoppageClockFace(minute: number): string {
  return minute <= 90 ? `${minute}:00` : `90+${String(minute - 90).padStart(2, "0")}`;
}

function stoppageRailPct(minute: number): number {
  return ((minute - STOPPAGE_CLOCK_START) / STOPPAGE_CLOCK_RANGE) * 100;
}

function stoppageGoalPct(minute: number): number {
  return stoppageRailPct(Math.min(minute, STOPPAGE_CLOCK_END - 0.9));
}

function FlapDigit({ value }: { value: 0 | 1 | 2 }) {
  return (
    <div style={{ position: "relative", height: 52, width: 40, overflow: "hidden", borderRadius: 2, border: "1px solid rgba(243,237,232,.18)", background: "#0b0c0f", boxShadow: "inset 0 1px rgba(255,255,255,.08), 0 3px 9px rgba(0,0,0,.38)" }}>
      <div style={{ transform: `translateY(-${(value * 100) / 3}%)` }}>
        {([0, 1, 2] as const).map((digit) => (
          <div key={digit} style={{ height: 52, display: "grid", placeItems: "center", fontFamily: MONO, fontSize: 38, fontWeight: 700, letterSpacing: "-0.08em", color: "currentColor" }}>{digit}</div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 1, background: "rgba(0,0,0,.9)", boxShadow: "0 1px rgba(255,255,255,.08)" }} />
    </div>
  );
}

function FlipScore({ state }: { state: "0–1" | "1–1" | "2–1" }) {
  const united = Number(state[0]) as 0 | 1 | 2;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4, color: "inherit" }}>
      <FlapDigit value={united} />
      <span style={{ fontFamily: MONO, fontSize: 34, color: C.faint }}>–</span>
      <FlapDigit value={1} />
    </div>
  );
}

/** Frame-driven port of stories/fergie-time `StoppageEcho` — one clock, six strikes. */
function FilmStoppageEcho({ frame, sweep }: { frame: number; sweep: number }) {
  const enter = smoothstep(0, 22, frame);
  const clockMinute = Math.min(STOPPAGE_CLOCK_END, STOPPAGE_CLOCK_START + Math.floor(sweep * STOPPAGE_CLOCK_RANGE));
  const clockPosition = sweep * 100;
  const nights = DATA.fergieEchoes.map((echo) => ({
    id: echo.id,
    year: echo.date.slice(0, 4),
    opponent: echo.opponent.replace(/^FC\s+/i, ""),
    deficitAt: `${echo.deficit.score} ${echo.deficit.when}`,
    goals: echo.lateGoals.map((goal) => ({
      name: familyLabel(goal.name),
      clock: displayClock(goal.minute, goal.added),
      absoluteMinute: absoluteMinute(goal.minute, goal.added),
    })),
  }));

  return (
    <div style={{
      position: "absolute",
      left: 110,
      right: 110,
      top: 118,
      bottom: 72,
      opacity: enter,
      transform: `translateY(${lerp(28, 0, enter)}px)`,
      overflow: "hidden",
      border: "1px solid rgba(243,237,232,.16)",
      background: "linear-gradient(115deg,#0c1f31 0%,#101827 53%,#170d10 100%)",
      boxShadow: "0 28px 90px rgba(0,0,0,.48)",
    }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.28, backgroundImage: "repeating-linear-gradient(90deg,transparent 0,transparent calc(9.09% - 1px),rgba(231,240,249,.14) calc(9.09% - 1px),rgba(231,240,249,.14) 9.09%)" }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(72% 115% at 50% 110%,rgba(216,33,13,.22),transparent 64%)" }} />

      <div style={{ position: "relative", height: "100%", padding: "36px 48px 28px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, paddingBottom: 22, borderBottom: "1px solid rgba(243,237,232,.16)" }}>
          <div>
            <div style={{ fontFamily: MONO, fontSize: 13, letterSpacing: "0.28em", color: C.red }}>ONE SHARED COUNTDOWN</div>
            <div style={{ marginTop: 10, fontFamily: SANS, fontSize: 36, fontWeight: 600, letterSpacing: "-0.035em", color: C.ink }}>Eleven minutes. Six goals. Three turnarounds.</div>
          </div>
          <div style={{ minWidth: 168, borderLeft: `2px solid ${C.red}`, paddingLeft: 16, textAlign: "right" }}>
            <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.22em", color: C.faint }}>LIVE CLOCK</div>
            <div style={{ marginTop: 6, fontFamily: MONO, fontSize: 52, fontWeight: 700, letterSpacing: "-0.07em", lineHeight: 1, color: C.ink }}>{stoppageClockFace(clockMinute)}</div>
          </div>
        </div>

        <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "210px 1fr 110px", gap: 18, alignItems: "end", fontFamily: MONO, fontSize: 12, letterSpacing: "0.14em", color: C.faint }}>
          <span>MATCH</span>
          <div style={{ position: "relative", height: 18 }}>
            {[86, 88, 90, 93, 97].map((mark) => (
              <span key={mark} style={{ position: "absolute", bottom: 0, left: `${stoppageRailPct(mark)}%`, transform: "translateX(-50%)" }}>
                {mark <= 90 ? `${mark}′` : `90+${mark - 90}`}
              </span>
            ))}
          </div>
          <span style={{ textAlign: "right" }}>SCORE</span>
        </div>

        <div style={{ marginTop: 8, flex: 1, display: "flex", flexDirection: "column", borderTop: "1px solid rgba(243,237,232,.14)", borderBottom: "1px solid rgba(243,237,232,.14)" }}>
          {nights.map((night) => {
            const [first, second] = night.goals;
            if (!first || !second) return null;
            const firstAt = (first.absoluteMinute - STOPPAGE_CLOCK_START) / STOPPAGE_CLOCK_RANGE;
            const secondAt = (second.absoluteMinute - STOPPAGE_CLOCK_START) / STOPPAGE_CLOCK_RANGE;
            const firstHit = firstAt === 1 ? sweep === 1 : sweep >= firstAt + 0.022;
            const secondHit = secondAt === 1 ? sweep === 1 : sweep >= secondAt + 0.022;
            const state = (secondHit ? "2–1" : firstHit ? "1–1" : "0–1") as "0–1" | "1–1" | "2–1";
            const scoreColor = secondHit ? C.gold : firstHit ? C.ink : C.dim;

            return (
              <div key={night.id} style={{ flex: 1, display: "grid", gridTemplateColumns: "210px 1fr 110px", gap: 18, alignItems: "center", borderBottom: "1px solid rgba(243,237,232,.1)", minHeight: 0 }}>
                <div>
                  <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, letterSpacing: "0.2em", color: C.red }}>{night.year}</div>
                  <div style={{ marginTop: 6, fontFamily: SANS, fontSize: 22, fontWeight: 600, lineHeight: 1.15, color: C.ink }}>{night.opponent}</div>
                  <div style={{ marginTop: 6, fontFamily: SANS, fontSize: 14, color: C.faint }}>{night.deficitAt}</div>
                </div>

                <div style={{ position: "relative", height: 88 }}>
                  <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 1, background: "rgba(243,237,232,.18)", transform: "translateY(-50%)" }} />
                  <div style={{ position: "absolute", top: 0, bottom: 0, left: `${stoppageRailPct(90)}%`, width: 1, background: "rgba(245,197,24,.35)", boxShadow: "0 0 22px rgba(245,197,24,.2)", transform: "translateX(-50%)" }} />
                  <div style={{ position: "absolute", left: 0, top: "50%", height: 3, width: `${clockPosition}%`, background: C.red, boxShadow: "0 0 18px rgba(255,59,31,.8)", transform: "translateY(-50%)" }} />
                  <div style={{ position: "absolute", top: "50%", left: `${clockPosition}%`, width: 2, height: 42, background: C.ink, boxShadow: "0 0 18px rgba(255,255,255,.75)", transform: "translate(-50%, -50%)" }} />

                  {[first, second].map((goal, index) => {
                    const eventAt = (goal.absoluteMinute - STOPPAGE_CLOCK_START) / STOPPAGE_CLOCK_RANGE;
                    const reveal = eventAt === 1 ? (sweep === 1 ? 1 : 0) : clamp01((sweep - eventAt) / 0.025);
                    const hit = reveal >= 1;
                    const final = index === 1;
                    const flash = sweep < eventAt ? 0 : clamp01(1 - (sweep - eventAt) / 0.075);
                    const glow = final ? "245,197,24" : "245,242,238";
                    return (
                      <div key={`${goal.name}-${goal.clock}`} style={{ position: "absolute", top: "50%", left: `${stoppageGoalPct(goal.absoluteMinute)}%`, transform: "translate(-50%, -50%)" }}>
                        <div style={{
                          width: 44,
                          height: 44,
                          display: "grid",
                          placeItems: "center",
                          borderRadius: 3,
                          border: `1px solid ${hit ? (final ? C.gold : "#f5f2ee") : "rgba(243,237,232,.2)"}`,
                          background: hit ? (final ? C.gold : "#f5f2ee") : C.pitch,
                          color: hit ? C.pitch : C.faint,
                          fontFamily: MONO,
                          fontSize: 13,
                          fontWeight: 700,
                          opacity: 0.34 + reveal * 0.66,
                          transform: `scale(${0.76 + reveal * 0.24})`,
                          boxShadow: `0 0 ${4 + flash * 28}px rgba(${glow},${0.12 + flash * 0.62})`,
                        }}>
                          {final ? "2–1" : "1–1"}
                        </div>
                        <div style={{ position: "absolute", left: "50%", top: 50, transform: "translateX(-50%)", textAlign: "center", whiteSpace: "nowrap", opacity: 0.3 + reveal * 0.7 }}>
                          <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: C.ink }}>{goal.name}</div>
                          <div style={{ marginTop: 2, fontFamily: MONO, fontSize: 13, fontWeight: 700, color: C.gold }}>{goal.clock}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ color: scoreColor }}><FlipScore state={state} /></div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 18, textAlign: "center", fontFamily: MONO, fontSize: 13, letterSpacing: "0.2em", color: C.faint }}>
          THREE CLOCKS. ONE FINAL SCORE: 2–1.
        </div>
      </div>
    </div>
  );
}


function sceneOpacity(local: number, duration: number, fade = 34): number {
  return smoothstep(0, fade, local) * (1 - smoothstep(duration - fade, duration, local));
}

const THREAD_TRAVEL_EASE = Easing.bezier(0.77, 0, 0.175, 1);

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function travelState(frame: number): { x: number; energy: number; anticipation: number; settle: number } {
  let x = DATA.featuredMatches[0].x;
  let anticipation = 0;
  let settle = 0;

  for (let index = 1; index < DATA.featuredMatches.length; index++) {
    const previous = DATA.featuredMatches[index - 1];
    const next = DATA.featuredMatches[index];
    const travelStart = next.start - 48;
    const travelEnd = next.start - 14;
    anticipation = Math.max(anticipation, windowed(frame, travelStart - 10, travelStart - 4, travelStart, travelStart + 5));
    settle = Math.max(settle, windowed(frame, travelEnd - 2, travelEnd + 3, travelEnd + 10, travelEnd + 20));

    if (frame < travelStart) return { x, energy: 0, anticipation, settle };
    if (frame <= travelEnd) {
      const linear = clamp01((frame - travelStart) / (travelEnd - travelStart));
      const eased = THREAD_TRAVEL_EASE(linear);
      return {
        x: lerp(previous.x, next.x, eased),
        energy: Math.sin(linear * Math.PI),
        anticipation,
        settle,
      };
    }

    x = next.x;
  }

  return { x, energy: 0, anticipation, settle };
}

function featuredMatchMotion(frame: number, match: FeaturedMatch, end: number) {
  const firstMatch = match.matchId === DATA.featuredMatches[0].matchId;
  const enter = smoothstep(match.start - (firstMatch ? 18 : 42), match.start + 5, frame);
  const exit = smoothstep(end - 48, end - 12, frame);

  return {
    enter,
    exit,
    presence: enter * (1 - exit),
  };
}

const MUSIC_LEVEL = 0.82;
const MUSIC_TAIL_FROM = 83.4 * FPS;
const MUSIC_TAIL_SOURCE = 77.4 * FPS;

function musicHeadVolume(frame: number): number {
  return MUSIC_LEVEL * (1 - smoothstep(MUSIC_TAIL_FROM, MUSIC_TAIL_FROM + 24, frame));
}

function musicTailVolume(frame: number): number {
  const enter = smoothstep(0, 24, frame);
  const exit = 1 - smoothstep(150, 198, frame);
  return MUSIC_LEVEL * enter * exit;
}

function Fonts() {
  return (
    <style>{`
      @font-face { font-family: ArchivoMaster; src: url('${staticFile("video/fonts/archivo-400.ttf")}'); font-weight: 400; }
      @font-face { font-family: ArchivoMaster; src: url('${staticFile("video/fonts/archivo-600.ttf")}'); font-weight: 600; }
      @font-face { font-family: ArchivoMaster; src: url('${staticFile("video/fonts/archivo-800.ttf")}'); font-weight: 800; }
      @font-face { font-family: PlexMaster; src: url('${staticFile("video/fonts/plexmono-600.ttf")}'); font-weight: 600; }
      * { box-sizing: border-box; }
    `}</style>
  );
}

function Field({ energy = 0.5 }: { energy?: number }) {
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: C.pitch }}>
      <AbsoluteFill
        style={{
          background: [
            `radial-gradient(72% 62% at 50% 45%, rgba(216,33,13,${0.08 + energy * 0.18}), transparent 71%)`,
            "radial-gradient(112% 72% at 50% -15%, rgba(255,232,204,0.12), transparent 54%)",
            "linear-gradient(180deg, #100b09 0%, #160906 48%, #0d0a09 100%)",
          ].join(","),
        }}
      />
      <AbsoluteFill style={{ background: "radial-gradient(110% 118% at 50% 54%, transparent 34%, rgba(0,0,0,0.86) 100%)" }} />
      <svg width="1920" height="1080" style={{ position: "absolute", inset: 0, opacity: 0.085 }}>
        <filter id="master-grain"><feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="2" seed="68" stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter>
        <rect width="1920" height="1080" filter="url(#master-grain)" opacity="0.28" />
      </svg>
    </AbsoluteFill>
  );
}

function FilmKicker({ frame }: { frame: number }) {
  const finalFade = 1 - smoothstep(2160, 2220, frame);
  return (
    <div style={{ position: "absolute", left: 74, top: 56, display: "flex", alignItems: "center", gap: 16, opacity: finalFade, fontFamily: MONO, fontSize: 15, letterSpacing: "0.24em", color: C.faint }}>
      <span style={{ width: 8, height: 8, borderRadius: 20, background: C.red, boxShadow: `0 0 16px ${C.red}` }} />
      RED THREAD&nbsp;&nbsp;/&nbsp;&nbsp;1886—NOW
    </div>
  );
}

const familyName = (name: string | null) => name?.trim().split(/\s+/).at(-1) ?? "Goal";

const goalEvents = (match: FeaturedMatch) => match.events.filter((event) =>
  ["goal", "pen-goal", "own-goal-for", "opp-goal", "own-goal-against"].includes(event.type) && event.minute != null,
);

function playerImage(player: FeaturedPlayer | undefined): string | null {
  if (!player?.image) return null;
  return staticFile(player.image.replace(/^\//, ""));
}

function FilmPortrait({ player, side = "right", opacity = 0.34 }: { player: FeaturedPlayer | undefined; side?: "left" | "right"; opacity?: number }) {
  const src = playerImage(player);
  if (!src) return null;
  return (
    <div style={{ position: "absolute", top: -36, bottom: -18, [side]: -10, width: 470, opacity, WebkitMaskImage: `linear-gradient(to ${side === "right" ? "left" : "right"},#000 10%,#000 48%,transparent 96%),linear-gradient(to top,transparent 0%,#000 24%,#000 86%,transparent 100%)`, maskComposite: "intersect" }}>
      <Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 32%", filter: "grayscale(1) contrast(1.35) brightness(.72)" }} />
      <AbsoluteFill style={{ background: `linear-gradient(to ${side === "right" ? "left" : "right"},rgba(216,33,13,.66),transparent 76%)`, mixBlendMode: "color" }} />
    </div>
  );
}

function MatchScore({ match, compact = false }: { match: FeaturedMatch; compact?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
      <span style={{ fontFamily: MONO, fontSize: compact ? 56 : 82, lineHeight: 0.9, letterSpacing: "-0.08em", color: C.ink }}>{match.match.gf}–{match.match.ga}</span>
      <span style={{ maxWidth: 330, fontFamily: SANS, fontSize: compact ? 19 : 22, lineHeight: 1.2, color: C.dim }}>{match.match.opponent}</span>
    </div>
  );
}

function FirstXiSignature({ match, progress }: { match: FeaturedMatch; progress: number }) {
  const starters = match.lineup.filter((player) => player.side === "united" && player.started && !player.bench).sort((a, b) => (a.shirt ?? 99) - (b.shirt ?? 99));
  const positions = [
    [50, 84], [34, 68], [66, 68], [22, 50], [50, 50], [78, 50],
    [10, 25], [30, 20], [50, 18], [70, 20], [90, 25],
  ];
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", left: 18, top: 0, width: 520 }}>
        <div style={{ fontFamily: MONO, fontSize: 14, letterSpacing: "0.2em", color: C.gold }}>NEWTON HEATH · 1886</div>
        <div style={{ marginTop: 15, fontFamily: SANS, fontSize: 52, fontWeight: 600, letterSpacing: "-0.04em", color: C.ink }}>The first recorded XI.</div>
        <div style={{ marginTop: 14, fontFamily: SANS, fontSize: 22, color: C.dim }}>One match opens the archive.</div>
        <div style={{ marginTop: 19 }}><MatchScore match={match} compact /></div>
      </div>
      <div style={{ position: "absolute", right: 0, top: -18, width: 405, height: 360, border: "1px solid rgba(243,237,232,.12)", background: "rgba(12,11,10,.42)", clipPath: "polygon(7% 0,100% 0,100% 100%,0 100%,0 9%)" }}>
        <svg width="405" height="360" style={{ position: "absolute", inset: 0, opacity: 0.42 }}>
          <g fill="none" stroke={C.line} strokeWidth="1.2"><line x1="0" y1="180" x2="405" y2="180" /><circle cx="202.5" cy="180" r="46" /><rect x="102" y="0" width="201" height="62" /><rect x="102" y="298" width="201" height="62" /></g>
        </svg>
        {starters.slice(0, 11).map((player, index) => {
          const [x, y] = positions[index] ?? [50, 50];
          const arrive = smoothstep(index * 0.045, index * 0.045 + 0.26, progress);
          const scored = player.playerId === "jack-doughty";
          return (
            <div key={`${player.playerId}-${index}`} style={{ position: "absolute", left: `${x}%`, top: `${y}%`, width: 86, transform: `translate(-50%,-50%) scale(${lerp(0.7, scored ? 1.1 : 1, arrive)})`, opacity: arrive * (scored ? 1 : 0.68), textAlign: "center" }}>
              <div style={{ width: scored ? 21 : 15, height: scored ? 21 : 15, margin: "0 auto", borderRadius: 30, background: scored ? C.gold : C.red, boxShadow: scored ? `0 0 24px ${C.gold}` : `0 0 12px rgba(255,59,31,.45)`, border: `1px solid ${C.cream}` }} />
              <div style={{ marginTop: 5, fontFamily: MONO, fontSize: 10, letterSpacing: "0.03em", color: scored ? C.ink : C.dim }}>{familyName(player.name)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ScoreStormSignature({ match, progress }: { match: FeaturedMatch; progress: number }) {
  const events = goalEvents(match);
  let united = 0;
  let opponent = 0;
  const states = [{ minute: 0, lead: 0 }];
  for (const event of events) {
    if (event.side === "united") united += 1;
    else opponent += 1;
    states.push({ minute: event.minute ?? 0, lead: united - opponent });
  }
  states.push({ minute: 90, lead: united - opponent });
  const x = (minute: number) => 45 + (Math.min(90, minute) / 90) * 760;
  const y = (lead: number) => 225 - lead * 48;
  const path = states.map((state, index) => `${index === 0 ? "M" : "L"} ${x(state.minute)} ${y(state.lead)}`).join(" ");
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <FilmPortrait player={match.featuredPlayers[0]} opacity={0.26} />
      <div style={{ position: "absolute", left: 18, top: 0 }}>
        <div style={{ fontFamily: MONO, fontSize: 14, letterSpacing: "0.2em", color: C.gold }}>STAMFORD BRIDGE · 1954</div>
        <div style={{ marginTop: 12, fontFamily: SANS, fontSize: 48, fontWeight: 600, letterSpacing: "-0.045em", color: C.ink }}>Eleven goals. One night.</div>
      </div>
      <svg width="870" height="330" style={{ position: "absolute", left: 0, bottom: -18, overflow: "visible" }}>
        <line x1="45" x2="805" y1="225" y2="225" stroke={C.faint} strokeOpacity="0.4" />
        <path d={path} fill="none" stroke={C.red} strokeWidth="28" strokeOpacity="0.12" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - progress} />
        <path d={path} fill="none" stroke={C.ink} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - progress} />
        {events.map((event, index) => {
          const reveal = smoothstep(index / events.length - 0.04, index / events.length + 0.1, progress);
          const minute = event.minute ?? 0;
          const previous = states[index];
          const current = states[index + 1];
          const isViollet = event.playerId === "dennis-viollet";
          return (
            <g key={event.seq} opacity={reveal}>
              <line x1={x(minute)} x2={x(minute)} y1={y(previous.lead)} y2={y(current.lead)} stroke={event.side === "united" ? C.gold : C.draw} strokeWidth={isViollet ? 5 : 3} />
              <circle cx={x(minute)} cy={y(current.lead)} r={isViollet ? 8 : 5} fill={event.side === "united" ? C.gold : C.draw} />
              {isViollet && <text x={x(minute)} y={y(current.lead) - 16} textAnchor="middle" fill={C.gold} style={{ fontFamily: MONO, fontSize: 11 }}>{minute}′</text>}
            </g>
          );
        })}
        <text x="45" y="266" fill={C.faint} style={{ fontFamily: MONO, fontSize: 12 }}>0′</text><text x="805" y="266" textAnchor="end" fill={C.faint} style={{ fontFamily: MONO, fontSize: 12 }}>90′</text>
      </svg>
      <div style={{ position: "absolute", right: 18, top: 48 }}><MatchScore match={match} compact /></div>
      <div style={{ position: "absolute", right: 34, bottom: 18, textAlign: "right", fontFamily: MONO, color: C.gold }}><div style={{ fontSize: 42 }}>15′ · 41′ · 57′</div><div style={{ marginTop: 5, fontSize: 13, letterSpacing: "0.18em" }}>DENNIS VIOLLET · HAT-TRICK</div></div>
    </div>
  );
}

function PenaltyConstellationSignature({ match, progress }: { match: FeaturedMatch; progress: number }) {
  const won = match.match.penGf ?? 0;
  const lost = match.match.penGa ?? 0;
  const total = won + lost;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <FilmPortrait player={match.featuredPlayers[0]} side="left" opacity={0.4} />
      <div style={{ position: "absolute", right: 10, top: 0, width: 510 }}>
        <div style={{ fontFamily: MONO, fontSize: 14, letterSpacing: "0.2em", color: C.gold }}>MOSCOW · 2008</div>
        <div style={{ marginTop: 13, fontFamily: SANS, fontSize: 48, lineHeight: 1.02, fontWeight: 600, letterSpacing: "-0.05em", color: C.ink }}>Won on penalties.</div>
      </div>
      <div style={{ position: "absolute", right: 55, bottom: 0, width: 430, height: 235 }}>
        {Array.from({ length: total }, (_, index) => {
          const angle = (-145 + index * (290 / Math.max(1, total - 1))) * Math.PI / 180;
          const x = 215 + Math.cos(angle) * 170;
          const y = 126 + Math.sin(angle) * 92;
          const reveal = smoothstep(index / total * 0.66, index / total * 0.66 + 0.2, progress);
          const united = index < won;
          return <div key={index} style={{ position: "absolute", left: x, top: y, width: united ? 22 : 16, height: united ? 22 : 16, borderRadius: 30, background: united ? C.gold : C.draw, opacity: reveal * (united ? 1 : 0.62), transform: `translate(-50%,-50%) scale(${lerp(0.4, 1, reveal)})`, boxShadow: united ? `0 0 18px rgba(245,197,24,.45)` : "none" }} />;
        })}
        <div style={{ position: "absolute", inset: "66px 0 auto", textAlign: "center" }}><div style={{ fontFamily: MONO, fontSize: 72, lineHeight: 1, color: C.ink }}>{won}–{lost}</div><div style={{ marginTop: 8, fontFamily: MONO, fontSize: 11, letterSpacing: "0.18em", color: C.faint }}>SHOOT-OUT · ON PENALTIES</div></div>
      </div>
      <div style={{ position: "absolute", left: 18, bottom: 25 }}><MatchScore match={match} compact /></div>
      <div style={{ position: "absolute", left: 18, top: 20, width: 360, textAlign: "center", fontFamily: MONO, color: C.gold }}><div style={{ fontSize: 17 }}>25′ · RONALDO</div><div style={{ marginTop: 6, fontSize: 11, letterSpacing: "0.18em", color: C.faint }}>UNITED’S NO. 7 SCORES</div></div>
    </div>
  );
}

function ExtraTimeSignature({ match, progress }: { match: FeaturedMatch; progress: number }) {
  const extra = goalEvents(match).filter((event) => (event.minute ?? 0) > 90 && event.side === "united");
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <FilmPortrait player={match.featuredPlayers[0]} opacity={0.43} />
      <div style={{ position: "absolute", left: 18, top: 0, width: 520 }}>
        <div style={{ fontFamily: MONO, fontSize: 14, letterSpacing: "0.2em", color: C.gold }}>WEMBLEY · 1968</div>
        <div style={{ marginTop: 13, fontFamily: SANS, fontSize: 52, lineHeight: 1.02, fontWeight: 600, letterSpacing: "-0.05em", color: C.ink }}>Level after 90.<br />Three goals in seven minutes.</div>
      </div>
      <div style={{ position: "absolute", left: 10, right: 35, bottom: 22, height: 126 }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 78, height: 2, background: C.line }} />
        <div style={{ position: "absolute", left: 5, top: 55, fontFamily: MONO, fontSize: 54, color: C.faint }}>90′</div>
        {extra.map((event, index) => {
          const x = 320 + ((event.minute ?? 90) - 90) / 10 * 510;
          const reveal = smoothstep(0.28 + index * 0.16, 0.48 + index * 0.16, progress);
          return (
            <div key={event.seq} style={{ position: "absolute", left: x, top: lerp(80, 4 + index * 12, reveal), width: 150, opacity: reveal, transform: "translateX(-50%)", textAlign: "center" }}>
              <div style={{ fontFamily: MONO, fontSize: 30, color: C.gold }}>{event.minute}′</div>
              <div style={{ marginTop: 5, fontFamily: SANS, fontSize: 16, fontWeight: 600, color: C.ink }}>{familyName(event.player)}</div>
              <div style={{ width: 3, height: 38 + index * 10, margin: "8px auto 0", background: C.gold, boxShadow: `0 0 20px ${C.gold}` }} />
            </div>
          );
        })}
        <div style={{ position: "absolute", right: 0, top: 76, fontFamily: MONO, fontSize: 13, color: C.faint }}>100′</div>
      </div>
      <div style={{ position: "absolute", right: 18, top: 56 }}><MatchScore match={match} compact /></div>
    </div>
  );
}

function BenchReversalSignature({ match, progress }: { match: FeaturedMatch; progress: number }) {
  const scorers = match.featuredPlayers;
  const starters = match.lineup.filter((player) => player.side === "united" && player.started && !player.bench);
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", left: 18, top: 0, width: 520 }}>
        <div style={{ fontFamily: MONO, fontSize: 14, letterSpacing: "0.2em", color: C.gold }}>CAMP NOU · 1999</div>
        <div style={{ marginTop: 13, fontFamily: SANS, fontSize: 52, lineHeight: 1.02, fontWeight: 600, letterSpacing: "-0.05em", color: C.ink }}>Two substitutes changed the final.</div>
      </div>
      <div style={{ position: "absolute", left: 20, bottom: 12, width: 470, height: 150, opacity: 0.42 }}>
        {starters.map((player, index) => {
          const x = 20 + (index % 6) * 76;
          const y = 20 + Math.floor(index / 6) * 68;
          return <div key={`${player.playerId}-${index}`} style={{ position: "absolute", left: x, top: y, width: 58, textAlign: "center" }}><div style={{ width: 10, height: 10, margin: "0 auto", borderRadius: 20, background: C.faint }} /><div style={{ marginTop: 5, fontFamily: MONO, fontSize: 8.5, color: C.faint }}>{familyName(player.name)}</div></div>;
        })}
      </div>
      <div style={{ position: "absolute", right: 12, top: 20, width: 430, height: 330, borderLeft: "1px solid rgba(243,237,232,.14)", paddingLeft: 34 }}>
        <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: "0.2em", color: C.faint }}>SCORING SUBSTITUTES</div>
        {scorers.map((player, index) => {
          const reveal = smoothstep(0.2 + index * 0.22, 0.48 + index * 0.22, progress);
          const event = match.events.find((candidate) => candidate.playerId === player.id && candidate.side === "united");
          const lineupPlayer = match.lineup.find((candidate) => candidate.playerId === player.id);
          return (
            <div key={player.id} style={{ position: "absolute", left: lerp(34, 4, reveal), top: 58 + index * 116, display: "flex", alignItems: "center", gap: 18, opacity: 0.3 + reveal * 0.7 }}>
              <div style={{ width: 70, height: 70, display: "grid", placeItems: "center", clipPath: "polygon(20% 5%,38% 0,50% 10%,62% 0,80% 5%,100% 23%,87% 37%,78% 31%,78% 100%,22% 100%,22% 31%,13% 37%,0 23%)", background: "linear-gradient(180deg,#ff3b1f,#8f170b)", boxShadow: `0 0 ${20 * reveal}px rgba(245,197,24,.6)`, fontFamily: MONO, fontSize: 24, color: C.cream }}>
                {lineupPlayer?.shirt ?? "·"}
              </div>
              <div><div style={{ fontFamily: SANS, fontSize: 25, fontWeight: 600, color: C.ink }}>{familyName(player.name)}</div><div style={{ marginTop: 4, fontFamily: MONO, fontSize: 20, color: C.gold }}>{event ? displayClock(event.minute ?? 90, event.added) : "GOAL"}</div></div>
            </div>
          );
        })}
        <div style={{ position: "absolute", left: 34, right: 0, bottom: 10, height: 3, background: `linear-gradient(90deg,${C.red},${C.gold})`, transform: `scaleX(${smoothstep(0.32, 0.88, progress)})`, transformOrigin: "left" }} />
      </div>
      <div style={{ position: "absolute", left: 20, bottom: 165 }}><MatchScore match={match} compact /></div>
    </div>
  );
}

function FeaturedMatchSignature({ match, frame, end }: { match: FeaturedMatch; frame: number; end: number }) {
  const { enter, exit, presence } = featuredMatchMotion(frame, match, end);
  // Finish the signature animation before travel/exit begins so the card can be read.
  const progressEnd = Math.min(end - 52, match.start + 90);
  const progress = smoothstep(match.start - 8, progressEnd, frame);
  const translateX = lerp(58, 0, enter) + lerp(0, -72, exit);
  const translateY = lerp(18, 0, enter) + lerp(0, -8, exit);
  const scale = lerp(0.985, 1, enter) - exit * 0.012;
  const blur = (1 - enter) * 3.5 + exit * 2.5;
  const bodyDepthX = lerp(22, 0, enter) + lerp(0, -26, exit);
  const bodyDepthY = lerp(7, 0, enter) + lerp(0, -5, exit);
  const footerDepthX = lerp(8, 0, enter) + lerp(0, -11, exit);
  const body = match.visualMode === "first-xi" ? <FirstXiSignature match={match} progress={progress} />
    : match.visualMode === "score-storm" ? <ScoreStormSignature match={match} progress={progress} />
    : match.visualMode === "extra-time-burst" ? <ExtraTimeSignature match={match} progress={progress} />
    : match.visualMode === "bench-reversal" ? <BenchReversalSignature match={match} progress={progress} />
    : <PenaltyConstellationSignature match={match} progress={progress} />;
  return (
    <div style={{ position: "absolute", left: match.x - 480, top: 184, width: 960, height: 430, opacity: presence, filter: `blur(${blur.toFixed(2)}px)`, transform: `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`, transformOrigin: "50% 100%" }}>
      <div style={{ position: "absolute", inset: 0, transform: `translate3d(${bodyDepthX}px, ${bodyDepthY}px, 0)` }}>{body}</div>
      <div style={{ position: "absolute", left: 18, right: 18, bottom: -34, display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: MONO, fontSize: 11, letterSpacing: "0.14em", color: C.faint, transform: `translateX(${footerDepthX}px)` }}>
        <span>{match.eyebrow}</span><span>/match/{match.match.id}</span>
      </div>
    </div>
  );
}

function HistoricalTimeline({ frame }: { frame: number }) {
  const duration = ACT.openingUntil;
  const opacity = sceneOpacity(frame, duration, 36);
  // One travelling thread head drives the camera through four match cards.
  const travel = travelState(frame);
  const cameraX = 960 - travel.x + travel.anticipation * 11 - travel.settle * 5;
  const draw = interpolate(
    frame,
    [0, 50, 110, 160, 210, 280, 340, 400, 460, 540],
    [0.025, 0.08, 0.22, 0.48, 0.54, 0.68, 0.76, 0.88, 0.94, 0.97],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: THREAD_TRAVEL_EASE },
  );
  const worldScale = 1 - travel.anticipation * 0.006 + travel.energy * 0.012 + travel.settle * 0.003 + smoothstep(300, 460, frame) * 0.012;
  return (
    <AbsoluteFill style={{ opacity }}>
      <div style={{ position: "absolute", inset: 0, transform: `translate3d(${cameraX}px, 0, 0) scale(${worldScale})`, transformOrigin: `${travel.x}px 665px` }}>
        <svg width="4200" height="1080" style={{ position: "absolute", inset: 0 }}>
          <defs>
            <linearGradient id="history-filament" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor={C.red} /><stop offset="0.62" stopColor="#ff7046" /><stop offset="1" stopColor={C.gold} />
            </linearGradient>
            <filter id="history-glow" x="-10%" y="-500%" width="120%" height="1100%"><feGaussianBlur stdDeviation="11" /></filter>
          </defs>
          <path d="M 74 676 C 520 645, 960 698, 1390 660 S 2210 632, 2680 675 S 3370 632, 4040 660" fill="none" stroke={C.red} strokeWidth="28" strokeOpacity={0.16 * draw} pathLength="1" strokeDasharray="1" strokeDashoffset={1 - draw} filter="url(#history-glow)" />
          <path d="M 74 676 C 520 645, 960 698, 1390 660 S 2210 632, 2680 675 S 3370 632, 4040 660" fill="none" stroke="url(#history-filament)" strokeWidth="3.4" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - draw} />
          {DATA.featuredMatches.map((event, index) => {
            const arrived = smoothstep(event.start - 24, event.start + 8, frame);
            const end = DATA.featuredMatches[index + 1]?.start ?? ACT.openingUntil;
            const motion = featuredMatchMotion(frame, event, end);
            const european = event.match.competition.toLowerCase().includes("europe") || event.match.competition.toLowerCase().includes("champions");
            return (
              <g key={event.year} opacity={0.22 + arrived * 0.78}>
                <line x1={event.x} x2={event.x} y1="606" y2="656" stroke={european ? C.gold : C.cream} strokeWidth="1.5" strokeOpacity={motion.presence * 0.34} pathLength="1" strokeDasharray="1" strokeDashoffset={1 - motion.enter} />
                {european && <circle cx={event.x} cy="665" r="26" fill={C.gold} fillOpacity="0.1" stroke={C.gold} strokeOpacity="0.42" />}
                <circle cx={event.x} cy="665" r={european ? 8 : 5.5} fill={european ? C.gold : C.cream} />
                <line x1={event.x} x2={event.x} y1="636" y2="700" stroke={european ? C.gold : C.ink} strokeOpacity="0.32" />
                <text x={event.x} y="744" textAnchor="middle" fill={european ? C.gold : C.faint} style={{ fontFamily: MONO, fontSize: european ? 23 : 18, letterSpacing: "0.08em" }}>{event.year}</text>
                {european && <text x={event.x} y="784" textAnchor="middle" fill={C.faint} style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, letterSpacing: "0.2em" }}>EUROPEAN CUP</text>}
              </g>
            );
          })}
          <g opacity={0.72 + travel.energy * 0.28}>
            <circle cx={travel.x} cy="665" r={22 + travel.energy * 13} fill={C.red} fillOpacity={0.08 + travel.energy * 0.08} filter="url(#history-glow)" />
            <circle cx={travel.x} cy="665" r={5.5 + travel.energy * 2.5} fill={travel.energy > 0.08 ? C.gold : C.cream} />
          </g>
        </svg>
        {DATA.featuredMatches.map((event, index) => <FeaturedMatchSignature key={event.matchId} match={event} frame={frame} end={DATA.featuredMatches[index + 1]?.start ?? ACT.openingUntil} />)}
      </div>
      <AbsoluteFill style={{ opacity: travel.energy, background: "radial-gradient(46% 52% at 50% 61%, transparent 18%, rgba(3,2,2,.09) 56%, rgba(3,2,2,.28) 100%)" }} />
      <AbsoluteFill style={{ opacity: travel.settle, background: "radial-gradient(34% 40% at 50% 61%, rgba(245,197,24,.055), transparent 74%)" }} />
      <div style={{ position: "absolute", right: 64, bottom: 46, opacity: smoothstep(420, 500, frame), fontFamily: MONO, fontSize: 14, letterSpacing: "0.18em", color: C.faint }}>1886&nbsp;&nbsp;→&nbsp;&nbsp;2008</div>
    </AbsoluteFill>
  );
}

function Portrait({ side, src, opacity, scale = 1 }: { side: "left" | "right"; src: string; opacity: number; scale?: number }) {
  const left = side === "left";
  return (
    <div style={{ position: "absolute", top: 82, bottom: 34, [left ? "left" : "right"]: -28, width: 740, opacity, transform: `scale(${scale})`, transformOrigin: left ? "left center" : "right center", WebkitMaskImage: left ? "linear-gradient(to right,#000 0%,#000 48%,transparent 96%),linear-gradient(to top,transparent 0%,#000 30%,#000 76%,transparent 100%)" : "linear-gradient(to left,#000 0%,#000 48%,transparent 96%),linear-gradient(to top,transparent 0%,#000 30%,#000 76%,transparent 100%)", maskComposite: "intersect" }}>
      <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: left ? "50% 34%" : "48% 34%", filter: "grayscale(1) contrast(1.22) brightness(0.8)" }} />
      <AbsoluteFill style={{ background: left ? "linear-gradient(to right,rgba(216,33,13,.7),rgba(216,33,13,.15) 60%,transparent)" : "linear-gradient(to left,rgba(216,33,13,.7),rgba(216,33,13,.15) 60%,transparent)", mixBlendMode: "color" }} />
    </div>
  );
}

function RhymeFinalEvidence({ frame, opacity }: { frame: number; opacity: number }) {
  const finals = [
    { matchId: "1968-05-29-benfica-n", focusId: "george-best", label: "1968 · BEST · 92′" },
    { matchId: "2008-05-21-chelsea-n", focusId: "cristiano-ronaldo", label: "2008 · RONALDO · 25′" },
  ] as const;

  return (
    <div style={{ position: "absolute", left: 500, right: 500, top: 270, height: 350, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 34, opacity }}>
      {finals.map((final, finalIndex) => {
        const match = DATA.featuredMatches.find((candidate) => candidate.matchId === final.matchId);
        if (!match) return null;
        const starters = match.lineup.filter((player) => player.side === "united" && player.started && !player.bench);
        const bands = {
          FWD: starters.filter((player) => player.careerBand === "FWD"),
          MID: starters.filter((player) => player.careerBand === "MID"),
          DEF: starters.filter((player) => player.careerBand === "DEF"),
          GK: starters.filter((player) => player.careerBand === "GK"),
        };
        const events = match.events.filter((event) => event.minute != null && ["goal", "opp-goal", "own-goal-for", "own-goal-against"].includes(event.type));
        const maxMinute = match.match.aet ? 120 : 90;
        const reveal = smoothstep(292 + finalIndex * 7, 326 + finalIndex * 7, frame);

        return (
          <div key={final.matchId} style={{ position: "relative", overflow: "hidden", border: "1px solid rgba(243,237,232,.1)", background: "rgba(8,7,6,.46)", opacity: reveal, clipPath: finalIndex === 0 ? "polygon(3% 0,100% 0,100% 100%,0 100%,0 3%)" : "polygon(0 0,97% 0,100% 3%,100% 100%,0 100%)" }}>
            <div style={{ padding: "16px 18px 0", fontFamily: MONO, fontSize: 12, fontWeight: 700, letterSpacing: "0.16em", color: C.gold }}>{final.label}</div>
            <div style={{ position: "relative", height: 62, margin: "3px 18px 0" }}>
              <div style={{ position: "absolute", left: 0, right: 0, top: 32, height: 2, background: "rgba(243,237,232,.14)" }} />
              {events.map((event) => {
                const focused = event.playerId === final.focusId;
                const x = Math.min(100, ((event.minute ?? 0) / maxMinute) * 100);
                return (
                  <div key={event.seq} style={{ position: "absolute", left: `${x}%`, top: 32, transform: "translate(-50%,-50%)" }}>
                    <div style={{ width: focused ? 13 : 7, height: focused ? 13 : 7, borderRadius: 20, background: focused ? C.gold : event.side === "united" ? C.red : C.draw, opacity: focused ? 1 : 0.46, boxShadow: focused ? `0 0 18px ${C.gold}` : "none", border: focused ? `1px solid ${C.cream}` : "none" }} />
                    {focused && <div style={{ position: "absolute", left: "50%", top: -24, transform: "translateX(-50%)", whiteSpace: "nowrap", fontFamily: MONO, fontSize: 10, color: C.gold }}>{event.minute}′</div>}
                  </div>
                );
              })}
              <span style={{ position: "absolute", left: 0, top: 43, fontFamily: MONO, fontSize: 8, color: C.faint }}>0′</span>
              <span style={{ position: "absolute", right: 0, top: 43, fontFamily: MONO, fontSize: 8, color: C.faint }}>{maxMinute}′</span>
            </div>
            <div style={{ position: "absolute", left: 18, right: 18, top: 100, bottom: 16, border: "1px solid rgba(243,237,232,.08)", background: "rgba(0,0,0,.12)" }}>
              <svg width="100%" height="100%" viewBox="0 0 410 222" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, opacity: 0.28 }}>
                <line x1="0" x2="410" y1="111" y2="111" stroke={C.faint} />
                <circle cx="205" cy="111" r="28" fill="none" stroke={C.faint} />
                <rect x="142" y="0" width="126" height="32" fill="none" stroke={C.faint} />
                <rect x="142" y="190" width="126" height="32" fill="none" stroke={C.faint} />
              </svg>
              {(Object.entries(bands) as [keyof typeof bands, FeaturedLineupPlayer[]][]).flatMap(([band, players]) => players.map((player, index) => {
                const focused = player.playerId === final.focusId;
                const y = band === "FWD" ? 18 : band === "MID" ? 43 : band === "DEF" ? 70 : 91;
                const x = ((index + 1) / (players.length + 1)) * 100;
                return (
                  <div key={`${final.matchId}-${player.playerId}`} style={{ position: "absolute", left: `${x}%`, top: `${y}%`, width: 68, transform: "translate(-50%,-50%)", textAlign: "center", opacity: focused ? 1 : 0.2 }}>
                    <div style={{ width: focused ? 23 : 16, height: focused ? 23 : 16, margin: "0 auto", display: "grid", placeItems: "center", clipPath: "polygon(20% 5%,38% 0,50% 10%,62% 0,80% 5%,100% 23%,87% 37%,78% 31%,78% 100%,22% 100%,22% 31%,13% 37%,0 23%)", background: focused ? C.red : C.redDeep, color: C.cream, fontFamily: MONO, fontSize: focused ? 10 : 8, boxShadow: focused ? `0 0 20px ${C.gold}` : "none" }}>{player.shirt}</div>
                    <div style={{ marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", fontFamily: SANS, fontSize: focused ? 10 : 8, fontWeight: focused ? 700 : 400, color: focused ? C.ink : C.dim, whiteSpace: "nowrap" }}>{familyName(player.name)}</div>
                  </div>
                );
              }))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const RHYME_FACTS = [
  { start: 205, label: "CHAMPIONS OF EUROPE", left: "1968 · CHAMPIONS", right: "2008 · CHAMPIONS", headline: "Both became champions of Europe." },
  { start: 292, label: "THE FINAL", left: "BEST · 92′", right: "RONALDO · 25′", headline: "Both scored in the final." },
  { start: 382, label: "BALLON D’OR", left: "BEST · 1968", right: "RONALDO · 2008", headline: "Both won the Ballon d’Or." },
  { start: 474, label: "SEASON FIVE", left: "32 GOALS · 53 GAMES", right: "42 GOALS · 49 GAMES", headline: "Both peaked in season five." },
];

function RhymeLoop({ frame }: { frame: number }) {
  const duration = 630;
  const opacity = sceneOpacity(frame, duration, 42);
  const circleDraw = smoothstep(60, 356, frame);
  const exitDraw = smoothstep(540, 620, frame);
  const bestArrival = smoothstep(154, 215, frame);
  const ronaldoArrival = smoothstep(0, 54, frame);
  const finalFact = smoothstep(474, 548, frame);
  const handoff = smoothstep(0, 78, frame);
  const contentFade = 1 - smoothstep(532, 580, frame);
  const worldX = lerp(-530, 0, handoff);
  const baseY = 696;
  const circlePath = "M 1490 696 C 1490 420, 1253 196, 960 196 C 667 196, 430 420, 430 696 C 430 972, 667 996, 960 996 C 1253 996, 1490 972, 1490 696";
  const exitPath = "M 1490 696 C 1360 660, 1190 674, 980 696";
  const activeFact = [...RHYME_FACTS].reverse().find((fact) => frame >= fact.start) ?? null;
  const titleOpacity = frame < 205 ? windowed(frame, 28, 60, 168, 204) : 0;
  const finalEvidence = windowed(frame, 292, 318, 365, 382) * contentFade;
  return (
    <AbsoluteFill style={{ opacity }}>
      <div style={{ position: "absolute", inset: 0, transform: `translateX(${worldX}px)` }}>
      <Portrait side="right" src="media/journey/cristiano-ronaldo.webp" opacity={0.31 * ronaldoArrival * contentFade} />
      <Portrait side="left" src="media/journey/george-best.webp" opacity={0.31 * bestArrival * contentFade} />
      <svg width="1920" height="1080" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="back-thread" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stopColor={C.gold} /><stop offset="0.42" stopColor="#ff7149" /><stop offset="1" stopColor={C.red} /></linearGradient>
          <filter id="back-glow" x="-30%" y="-80%" width="160%" height="260%"><feGaussianBlur stdDeviation="12" /></filter>
        </defs>
        <g opacity={contentFade * smoothstep(45, 90, frame)}>
        <path d={`M 430 ${baseY} C 720 674, 1190 718, 1490 ${baseY}`} fill="none" stroke={C.red} strokeOpacity="0.38" strokeWidth="3" />
        {[{ year: 1968, x: 430 }, { year: 1999, x: 980 }, { year: 2008, x: 1490 }].map((item) => (
          <g key={item.year}>
            <circle cx={item.x} cy={baseY} r={item.year === 1999 ? 7 : 9} fill={item.year === 1999 ? C.gold : C.cream} />
            <text x={item.x} y={baseY + 54} textAnchor="middle" fill={item.year === 1999 ? C.gold : C.ink} style={{ fontFamily: MONO, fontSize: 29 }}>{item.year}</text>
            {item.year === 1999 && <text x={item.x} y={baseY + 84} textAnchor="middle" fill={C.faint} style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, letterSpacing: "0.18em" }}>ELEVEN DAYS IN MAY</text>}
          </g>
        ))}
        <path d={circlePath} fill="none" stroke={C.red} strokeWidth="32" strokeOpacity={0.17 * circleDraw} strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - circleDraw} filter="url(#back-glow)" />
        <path d={circlePath} fill="none" stroke="url(#back-thread)" strokeWidth="4" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - circleDraw} />
        </g>
        <path d={exitPath} fill="none" stroke={C.red} strokeWidth="28" strokeOpacity={0.14 * exitDraw} strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - exitDraw} filter="url(#back-glow)" />
        <path d={exitPath} fill="none" stroke="url(#back-thread)" strokeWidth="4" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - exitDraw} />
        <circle cx="430" cy={baseY} r={lerp(0, 32, bestArrival)} fill={C.gold} fillOpacity={0.18 * contentFade} />
        <circle cx="1490" cy={baseY} r={lerp(0, 24, ronaldoArrival)} fill={C.gold} fillOpacity={0.14 * contentFade} />
        <circle cx="980" cy={baseY} r={lerp(7, 30, smoothstep(560, 618, frame))} fill="none" stroke={C.gold} strokeOpacity={1 - smoothstep(590, 630, frame)} />
        <circle cx="980" cy={baseY} r="7" fill={C.gold} opacity={smoothstep(540, 580, frame)} />
      </svg>
      </div>

      <RhymeFinalEvidence frame={frame} opacity={finalEvidence} />

      <div style={{ position: "absolute", top: 122, insetInline: 0, textAlign: "center", opacity: titleOpacity }}>
        <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: "0.26em", color: C.dim }}>1968&nbsp;&nbsp;↔&nbsp;&nbsp;2008</div>
        <div style={{ marginTop: 18, fontFamily: SANS, fontSize: 62, fontWeight: 600, letterSpacing: "-0.04em" }}>Two No. 7s. Forty years apart.</div>
      </div>

      {activeFact && (
        <div style={{ position: "absolute", top: 105, left: 570, right: 570, textAlign: "center", opacity: smoothstep(activeFact.start, activeFact.start + 26, frame) * contentFade, transform: `translateY(${lerp(24, 0, smoothstep(activeFact.start, activeFact.start + 26, frame))}px)` }}>
          <div style={{ fontFamily: MONO, fontSize: 15, letterSpacing: "0.25em", color: C.gold }}>{activeFact.label}</div>
          <div style={{ marginTop: 15, fontFamily: SANS, fontSize: 54, fontWeight: 600, letterSpacing: "-0.04em", color: C.ink }}>{activeFact.headline}</div>
        </div>
      )}

      <div style={{ position: "absolute", left: 210, right: 210, bottom: 90, display: "grid", gridTemplateColumns: "1fr 120px 1fr", alignItems: "center", gap: 24, opacity: smoothstep(192, 226, frame) * contentFade }}>
        <RhymeLedger side="left" frame={frame} />
        <div style={{ textAlign: "center", fontFamily: SANS, fontSize: 166, fontWeight: 800, color: `rgba(255,59,31,${alpha(0.1 + finalFact * 0.05)})` }}>7</div>
        <RhymeLedger side="right" frame={frame} />
      </div>
    </AbsoluteFill>
  );
}

function RhymeLedger({ side, frame }: { side: "left" | "right"; frame: number }) {
  const left = side === "left";
  return (
    <div style={{ textAlign: left ? "right" : "left" }}>
      <div style={{ fontFamily: MONO, color: C.red, fontSize: 17, letterSpacing: "0.15em" }}>{left ? "1968 · BEST" : "2008 · RONALDO"}</div>
      {RHYME_FACTS.map((fact) => (
        <div key={fact.label} style={{ marginTop: 9, paddingTop: 9, borderTop: `1px solid rgba(243,237,232,${alpha(smoothstep(fact.start, fact.start + 24, frame) * 0.18)})`, opacity: smoothstep(fact.start, fact.start + 24, frame), fontFamily: left ? MONO : MONO, fontSize: 17, color: C.dim }}>
          {left ? fact.left : fact.right}
        </div>
      ))}
    </div>
  );
}

const TREBLE_BEATS = [
  {
    start: 62, end: 190, day: "DAY 1 · 16 MAY", place: "PREMIER LEAGUE", interval: "",
    danger: "0–1", dangerLabel: "BEHIND AFTER 26′", player: "COLE", arrival: "ON 46′",
    intervention: "WINNER · 48′", result: "2–1", coda: "FROM BEHIND.",
    image: "media/journey/pl-celebration.webp",
  },
  {
    start: 178, end: 306, day: "DAY 7 · 22 MAY", place: "FA CUP", interval: "SIX DAYS LATER",
    danger: "0–0", dangerLabel: "NINTH MINUTE", player: "SHERINGHAM", arrival: "ON 9′",
    intervention: "SCORED · 11′", result: "2–0", coda: "FROM THE BENCH. AGAIN.",
    image: "media/journey/fa-cup-lift.webp",
  },
  {
    start: 294, end: 450, day: "DAY 11 · 26 MAY", place: "CHAMPIONS LEAGUE", interval: "FOUR DAYS LATER",
    danger: "0–1", dangerLabel: "90 MINUTES GONE", player: "SHERINGHAM + SOLSKJÆR", arrival: "BOTH SUBSTITUTES",
    intervention: "90+1′ · 90+3′", result: "2–1", coda: "TWO SUBSTITUTES. TWO GOALS.",
    image: "media/journey/barcelona-climax.webp",
  },
] as const;

function TreblePressureRail({ frame }: { frame: number }) {
  const draw = smoothstep(10, 414, frame);
  const points = [530, 965, 1390];
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 58, height: 112 }}>
      <svg width="1920" height="112" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="treble-fuse" x1="0" x2="1"><stop offset="0" stopColor={C.red} /><stop offset="0.72" stopColor="#ff7149" /><stop offset="1" stopColor={C.gold} /></linearGradient>
          <filter id="treble-fuse-glow" x="-20%" y="-800%" width="140%" height="1700%"><feGaussianBlur stdDeviation="8" /></filter>
        </defs>
        <path d="M 350 47 C 650 45, 1110 54, 1570 47" fill="none" stroke={C.red} strokeWidth="24" strokeOpacity={0.14 * draw} pathLength="1" strokeDasharray="1" strokeDashoffset={1 - draw} filter="url(#treble-fuse-glow)" />
        <path d="M 350 47 C 650 45, 1110 54, 1570 47" fill="none" stroke="url(#treble-fuse)" strokeWidth="3.5" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - draw} />
        {TREBLE_BEATS.map((beat, index) => {
          const arrival = smoothstep(beat.start, beat.start + 26, frame);
          const settled = frame >= beat.end - 18;
          return (
            <g key={beat.day} opacity={0.18 + arrival * 0.82}>
              <circle cx={points[index]} cy="49" r={settled ? 24 : 17} fill={C.gold} fillOpacity={0.12 + arrival * 0.1} />
              <circle cx={points[index]} cy="49" r="7" fill={arrival > 0.5 ? C.gold : C.red} stroke={arrival > 0.5 ? C.cream : C.red} strokeWidth="1.4" />
              <text x={points[index]} y="91" textAnchor="middle" fill={arrival > 0.5 ? C.ink : C.faint} style={{ fontFamily: MONO, fontSize: 16, letterSpacing: "0.12em" }}>{["16 MAY", "22 MAY", "26 MAY"][index]}</text>
            </g>
          );
        })}
        <text x="748" y="29" textAnchor="middle" fill={C.faint} opacity={smoothstep(170, 205, frame)} style={{ fontFamily: MONO, fontSize: 12, letterSpacing: "0.16em" }}>6 DAYS</text>
        <text x="1178" y="29" textAnchor="middle" fill={C.faint} opacity={smoothstep(286, 320, frame)} style={{ fontFamily: MONO, fontSize: 12, letterSpacing: "0.16em" }}>4 DAYS</text>
      </svg>
    </div>
  );
}

function TrebleNight({ frame, index }: { frame: number; index: number }) {
  const beat = TREBLE_BEATS[index];
  const local = frame - beat.start;
  const intro = smoothstep(0, 24, local);
  const intervention = smoothstep(index === 2 ? 78 : 56, index === 2 ? 96 : 72, local);
  const result = smoothstep(index === 2 ? 104 : 86, index === 2 ? 130 : 108, local);
  const leave = 1 - smoothstep(beat.end - beat.start - 24, beat.end - beat.start, local);
  const opacity = intro * leave;
  const dangerOpacity = 1 - smoothstep(index === 2 ? 68 : 44, index === 2 ? 82 : 58, local);
  const resultPulse = smoothstep(0, 18, local - (index === 2 ? 110 : 92));
  return (
    <div style={{ position: "absolute", inset: 0, opacity }}>
      <div style={{ position: "absolute", left: 130, top: 120, width: 420, transform: `translateX(${lerp(-34, 0, intro)}px)` }}>
        {beat.interval && <div style={{ marginBottom: 16, fontFamily: MONO, fontSize: 15, letterSpacing: "0.2em", color: C.red }}>{beat.interval}</div>}
        <div style={{ fontFamily: MONO, fontSize: 18, letterSpacing: "0.18em", color: C.gold }}>{beat.day}</div>
        <div style={{ marginTop: 15, fontFamily: SANS, fontSize: 46, fontWeight: 600, letterSpacing: "-0.035em", color: C.ink }}>{beat.place}</div>
      </div>

      <div style={{ position: "absolute", left: 610, right: 150, top: 145, bottom: 210, borderLeft: "1px solid rgba(243,237,232,.14)", paddingLeft: 86 }}>
        <div style={{ position: "absolute", left: 86, top: 34, opacity: dangerOpacity }}>
          <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: "0.2em", color: C.red }}>{beat.dangerLabel}</div>
          <div style={{ marginTop: 8, fontFamily: MONO, fontSize: 154, lineHeight: 0.9, letterSpacing: "-0.08em", color: C.ink }}>{beat.danger}</div>
        </div>

        <div style={{ position: "absolute", left: 86, top: 18, opacity: intervention, transform: `translateY(${lerp(26, 0, intervention)}px)` }}>
          <div style={{ fontFamily: MONO, fontSize: 15, letterSpacing: "0.2em", color: C.gold }}>{beat.arrival}</div>
          <div style={{ marginTop: 14, fontFamily: SANS, fontSize: index === 2 ? 48 : 58, fontWeight: 600, letterSpacing: "-0.04em", color: C.ink }}>{beat.player}</div>
          <div style={{ marginTop: 16, fontFamily: MONO, fontSize: 26, color: C.gold }}>{beat.intervention}</div>
        </div>

        <div style={{ position: "absolute", right: 30, top: 36, width: 350, textAlign: "right", opacity: result, transform: `scale(${lerp(1.08, 1, resultPulse)})`, transformOrigin: "right top" }}>
          <div style={{ fontFamily: MONO, fontSize: 152, lineHeight: 0.9, letterSpacing: "-0.08em", color: C.gold }}>{beat.result}</div>
          <div style={{ marginTop: 18, fontFamily: SANS, fontSize: 24, fontWeight: 600, letterSpacing: "0.08em", color: C.ink }}>{beat.coda}</div>
        </div>
      </div>
    </div>
  );
}

function TreblePocket({ frame }: { frame: number }) {
  const duration = 540;
  const opacity = sceneOpacity(frame, duration, 40);
  const land = smoothstep(438, 478, frame);
  const intro = windowed(frame, 4, 24, 48, 68);
  return (
    <AbsoluteFill style={{ opacity }}>
      {TREBLE_BEATS.map((beat, index) => {
        const visible = windowed(frame, beat.start - 12, beat.start + 22, beat.end - 34, beat.end + 2);
        const photoReveal = smoothstep(beat.start + (index === 2 ? 72 : 50), beat.start + (index === 2 ? 104 : 82), frame);
        const zoom = lerp(1.055, 1.015, smoothstep(beat.start, beat.end, frame));
        return (
          <div key={beat.day} style={{ position: "absolute", inset: 0, opacity: visible * photoReveal * (index === 2 ? 0.42 : 0.32), transform: `scale(${zoom})`, WebkitMaskImage: "linear-gradient(to left,#000 0%,#000 38%,transparent 86%),linear-gradient(to top,transparent 0%,#000 30%,#000 82%,transparent 100%)", maskComposite: "intersect" }}>
            <Img src={staticFile(beat.image)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: index === 2 ? "58% 42%" : "62% 40%", filter: "grayscale(1) contrast(1.28) brightness(.72)" }} />
            <AbsoluteFill style={{ background: "linear-gradient(to left,rgba(216,33,13,.68),rgba(216,33,13,.16) 56%,transparent)", mixBlendMode: "color" }} />
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 102, top: 80, fontFamily: SANS, fontSize: 360, fontWeight: 800, letterSpacing: "-0.09em", color: `rgba(216,33,13,${alpha(0.045 + land * 0.055)})` }}>11</div>

      <div style={{ position: "absolute", top: 118, insetInline: 0, textAlign: "center", opacity: intro, transform: `translateY(${lerp(24, 0, intro)}px)` }}>
        <div style={{ fontFamily: MONO, fontSize: 17, letterSpacing: "0.25em", color: C.gold }}>1998–99 · THE TREBLE</div>
        <div style={{ marginTop: 20, fontFamily: SANS, fontSize: 72, fontWeight: 600, letterSpacing: "-0.05em", color: C.ink }}>Eleven days. No margin.</div>
        <div style={{ marginTop: 18, fontFamily: SANS, fontSize: 25, color: C.dim }}>Three games. Lose one and the treble is gone.</div>
      </div>

      {TREBLE_BEATS.map((_, index) => <TrebleNight key={index} frame={frame} index={index} />)}
      <TreblePressureRail frame={frame} />

      <div style={{ position: "absolute", inset: 0, opacity: land, background: "radial-gradient(64% 70% at 50% 48%,#2b0c08,#0c0b0a 76%)" }} />
      <div style={{ position: "absolute", insetInline: 120, top: 184, opacity: land, transform: `translateY(${lerp(30, 0, land)}px)`, textAlign: "center" }}>
        <div style={{ fontFamily: MONO, fontSize: 18, letterSpacing: "0.26em", color: C.gold }}>ELEVEN DAYS FOR THE TREBLE</div>
        <div style={{ marginTop: 25, fontFamily: SANS, fontSize: 78, lineHeight: 1.02, fontWeight: 600, letterSpacing: "-0.05em", color: C.ink }}>Three must-wins.<br />Two comebacks.</div>
        <div style={{ marginTop: 25, fontFamily: SANS, fontSize: 42, fontWeight: 600, color: C.gold }}>Every winning goal came from the bench.</div>
        <div style={{ marginTop: 24, fontFamily: MONO, fontSize: 18, letterSpacing: "0.22em", color: C.ink }}>11 DAYS&nbsp;&nbsp;·&nbsp;&nbsp;3 WINS&nbsp;&nbsp;·&nbsp;&nbsp;3 TROPHIES</div>
      </div>
    </AbsoluteFill>
  );
}

function FergieConstellation({ frame }: { frame: number }) {
  const duration = 640;
  const opacity = sceneOpacity(frame, duration, 40);
  const countdownFrom = 42;
  const countdownFrames = 360;
  const sweep = clamp01((frame - countdownFrom) / countdownFrames);
  const bloomFrom = countdownFrom + countdownFrames + 18;
  const constellation = smoothstep(bloomFrom, bloomFrom + 92, frame);
  const intro = windowed(frame, 4, 22, 34, 48);
  return (
    <AbsoluteFill style={{ opacity }}>
      <div style={{ position: "absolute", top: 88, insetInline: 0, textAlign: "center", opacity: intro * (1 - constellation) }}>
        <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: "0.25em", color: C.red }}>FERGIE TIME</div>
        <div style={{ marginTop: 14, fontFamily: SANS, fontSize: 52, fontWeight: 600, letterSpacing: "-0.04em" }}>Three matches. The same late turn.</div>
      </div>

      <div style={{ position: "absolute", inset: 0, opacity: (1 - smoothstep(bloomFrom - 8, bloomFrom + 36, frame)), transform: `scale(${lerp(1, 0.94, constellation)})` }}>
        <FilmStoppageEcho frame={frame} sweep={sweep} />
      </div>

      <svg width="1920" height="1080" style={{ position: "absolute", inset: 0, opacity: constellation }}>
        <path d={lateGoalPath} fill="rgba(255,210,120,.54)" />
        <line x1="150" x2="1770" y1="775" y2="775" stroke={C.red} strokeOpacity="0.45" />
        {[86, 90, 94, 98].map((clock) => (
          <text key={clock} x="105" y={775 - (clock - 85) * 38 + 6} fill={C.faint} style={{ fontFamily: MONO, fontSize: 14 }}>
            {clock === 94 ? "90+4" : clock === 98 ? "90+8" : `${clock}′`}
          </text>
        ))}
        {[1950, 1970, 1990, 2010, yearOf(DATA.lateGoals.at(-1)?.date ?? "2026")].map((year) => {
          const x = 150 + ((year - LATE_GOAL_YEAR_FROM) / LATE_GOAL_YEAR_SPAN) * 1620;
          return (
            <g key={year}>
              <line x1={x} x2={x} y1="775" y2="788" stroke={C.faint} strokeOpacity="0.55" />
              <text x={x} y="812" textAnchor="middle" fill={C.faint} style={{ fontFamily: MONO, fontSize: 14 }}>{year}</text>
            </g>
          );
        })}
        {ECHO_ANNOTATIONS.map((annotation, index) => {
          const reveal = smoothstep(bloomFrom + 20 + index * 18, bloomFrom + 55 + index * 18, frame);
          const labelY = annotation.point.y - 36 - (index % 2) * 18;
          return (
            <g key={annotation.echo.id} opacity={reveal}>
              <circle cx={annotation.point.x} cy={annotation.point.y} r="11" fill={C.gold} fillOpacity="0.18" />
              <circle cx={annotation.point.x} cy={annotation.point.y} r="5.5" fill={C.gold} stroke={C.cream} strokeWidth="1.5" />
              <line x1={annotation.point.x} x2={annotation.point.x} y1={annotation.point.y - 8} y2={labelY + 10} stroke={C.gold} strokeOpacity="0.55" strokeWidth="1.2" />
              <text x={annotation.point.x} y={labelY} textAnchor="middle" fill={C.gold} style={{ fontFamily: MONO, fontSize: 15, fontWeight: 600 }}>{annotation.label}</text>
              <text x={annotation.point.x} y={labelY + 18} textAnchor="middle" fill={C.ink} style={{ fontFamily: MONO, fontSize: 13 }}>{annotation.clocks}</text>
            </g>
          );
        })}
        <circle cx="960" cy="500" r={lerp(48, 8, smoothstep(bloomFrom + 20, bloomFrom + 90, frame))} fill={C.gold} fillOpacity={0.2 * (1 - smoothstep(bloomFrom + 60, bloomFrom + 110, frame))} />
      </svg>
      <div style={{ position: "absolute", top: 100, insetInline: 0, textAlign: "center", opacity: constellation }}>
        <div style={{ fontFamily: MONO, color: C.gold, fontSize: 18, letterSpacing: "0.23em" }}>{DATA.lateGoals.length} RECORDED GOALS AFTER 85′</div>
        <div style={{ marginTop: 15, fontFamily: SANS, color: C.ink, fontSize: 56, fontWeight: 600, letterSpacing: "-0.04em" }}>Now open the full late-goal record.</div>
      </div>
      <div style={{ position: "absolute", insetInline: 0, bottom: 36, textAlign: "center", opacity: smoothstep(bloomFrom + 90, bloomFrom + 140, frame), fontFamily: SANS, color: C.dim, fontSize: 22 }}>Three matches, set against every late goal in the archive.</div>
    </AbsoluteFill>
  );
}

function Fortress({ frame }: { frame: number }) {
  const duration = 360;
  const opacity = sceneOpacity(frame, duration, 34);
  const wall = smoothstep(18, 90, frame);
  const numbers = smoothstep(70, 130, frame);
  const cracks = smoothstep(150, 220, frame);
  const dissolve = smoothstep(300, 350, frame);
  const games = DATA.fortress.games;
  const crackIds = new Set(DATA.fortress.cracks.map((crack) => crack.id));
  const rows = 10;
  const cols = Math.ceil(games.length / rows);
  const card = { left: 380, right: 1540, top: 440, bottom: 680 };
  const cellW = (card.right - card.left) / cols;
  const cellH = (card.bottom - card.top) / rows;
  const yearFrom = yearOf(games[0]?.date ?? "1984");
  const yearTo = yearOf(games.at(-1)?.date ?? "2026");
  return (
    <AbsoluteFill style={{ opacity: opacity * (1 - dissolve * 0.55) }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.22 * wall * (1 - dissolve), WebkitMaskImage: "radial-gradient(ellipse 75% 76% at 50% 55%,#000 12%,transparent 78%)" }}>
        <Img src={staticFile("media/journey/old-trafford.webp")} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(1) contrast(1.22) brightness(.66)" }} />
        <AbsoluteFill style={{ background: "radial-gradient(ellipse at center,rgba(216,33,13,.6),rgba(216,33,13,.08) 62%,transparent)", mixBlendMode: "color" }} />
      </div>

      <div style={{ position: "absolute", top: 88, insetInline: 0, textAlign: "center", opacity: 1 - dissolve }}>
        <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: "0.24em", color: C.red }}>OLD TRAFFORD · HOME LEAGUE</div>
        <div style={{ marginTop: 14, fontFamily: SANS, fontSize: 56, fontWeight: 600, letterSpacing: "-0.045em" }}>
          {frame < 90 ? "At Old Trafford, the half-time lead held." : frame < 160 ? `${games.length} half-time leads.` : "Only three slipped behind—and all three recovered."}
        </div>
      </div>

      <div style={{ position: "absolute", left: 380, right: 380, top: 308, display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr", gap: 18, alignItems: "end", opacity: numbers * (1 - dissolve) }}>
        <FortressNumber value={String(games.length)} label="MATCHES" />
        <FortressNumber value={String(DATA.fortress.w)} label="WINS" />
        <FortressNumber value={String(DATA.fortress.d)} label="DRAWS" />
        <FortressNumber value="0" label="DEFEATS" accent />
      </div>

      <svg width="1920" height="1080" style={{ position: "absolute", inset: 0, transform: `scale(${lerp(1, 1.08, dissolve)})`, transformOrigin: "50% 58%" }}>
        <path d="M 290 770 L 290 475 Q 290 286 480 286 L 1440 286 Q 1630 286 1630 475 L 1630 770" fill="rgba(12,11,10,.38)" fillOpacity={wall * (1 - dissolve)} stroke={C.red} strokeOpacity={0.4 * wall * (1 - dissolve)} strokeWidth="2.5" />
        <path d="M 474 770 L 474 526 Q 474 394 606 394 L 1314 394 Q 1446 394 1446 526 L 1446 770" fill="none" stroke={C.ink} strokeOpacity={0.1 * wall * (1 - dissolve)} />
        <g opacity={wall * (1 - dissolve * 0.75)}>
          {games.map((game, index) => {
            const col = Math.floor(index / rows);
            const row = index % rows;
            const x = card.left + col * cellW + cellW / 2;
            const y = card.top + row * cellH + cellH / 2;
            const cracked = crackIds.has(game.id);
            const reveal = smoothstep(index / games.length * 0.55, index / games.length * 0.55 + 0.2, wall);
            const isDraw = game.result === "D" || game.worst < 0;
            return (
              <g key={game.id} opacity={reveal}>
                {cracked && <circle cx={x} cy={y} r="7.5" fill="none" stroke={C.gold} strokeOpacity={0.35 + cracks * 0.45} strokeWidth="1.2" />}
                <circle
                  cx={x}
                  cy={y}
                  r={cracked ? 4.2 : isDraw ? 3.2 : 3.6}
                  fill={cracked ? C.gold : isDraw ? "#1a1512" : C.ink}
                  fillOpacity={cracked ? 0.95 : isDraw ? 0.9 : 0.78}
                  stroke={isDraw && !cracked ? C.gold : "none"}
                  strokeWidth={isDraw && !cracked ? 1.1 : 0}
                />
              </g>
            );
          })}
        </g>
        <text x={card.left} y={card.bottom + 26} fill={C.faint} style={{ fontFamily: MONO, fontSize: 14 }} opacity={wall * (1 - dissolve)}>{yearFrom}</text>
        <text x={card.right} y={card.bottom + 26} textAnchor="end" fill={C.faint} style={{ fontFamily: MONO, fontSize: 14 }} opacity={wall * (1 - dissolve)}>{yearTo} →</text>
      </svg>

      <div style={{ position: "absolute", left: 320, right: 320, bottom: 48, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 22, opacity: cracks * (1 - dissolve) }}>
        {DATA.fortress.cracks.map((crack) => (
          <div key={crack.id} style={{ paddingTop: 14, borderTop: `1px solid rgba(245,197,24,.45)`, textAlign: "center" }}>
            <div style={{ fontFamily: MONO, color: C.gold, fontSize: 16 }}>{crack.date.slice(0, 4)}</div>
            <div style={{ marginTop: 8, fontFamily: SANS, color: C.ink, fontSize: 20, fontWeight: 600 }}>{crack.opponent} · {crack.ft}</div>
            <div style={{ marginTop: 6, fontFamily: SANS, color: C.faint, fontSize: 15 }}>Lead lost. Defeat avoided.</div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
}

function FortressNumber({ value, label, accent = false }: { value: string; label: string; accent?: boolean }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontFamily: MONO, fontSize: accent ? 92 : 64, lineHeight: 0.9, color: accent ? C.gold : C.ink }}>{value}</div>
      <div style={{ marginTop: 10, fontFamily: SANS, fontSize: 13, fontWeight: 600, letterSpacing: "0.18em", color: C.faint }}>{label}</div>
    </div>
  );
}

function RecordOpens({ frame }: { frame: number }) {
  const opacity = smoothstep(0, 32, frame);
  const field = smoothstep(0, 90, frame);
  const pull = smoothstep(70, 130, frame);
  const receipt = smoothstep(100, 150, frame);
  const cta = smoothstep(140, 180, frame);
  const snapshotScroll = smoothstep(150, 205, frame);
  const knotX = interpolate(pull, [0, 1], [1814, 658]);
  const knotY = interpolate(pull, [0, 1], [888, 548]);
  const fieldScale = lerp(1.18, 0.72, pull);
  const fieldOpacity = field * (1 - receipt * 0.88);
  return (
    <AbsoluteFill style={{ opacity }}>
      <svg width="1920" height="1080" style={{ position: "absolute", inset: 0 }}>
        <g style={{ opacity: fieldOpacity, transform: `scale(${fieldScale})`, transformOrigin: "960px 640px" }}>
          <path d={matchPaths.W} fill={C.gold} fillOpacity="0.36" />
          <path d={matchPaths.D} fill={C.draw} fillOpacity="0.28" />
          <path d={matchPaths.L} fill={C.red} fillOpacity="0.3" />
          <path d="M 105 918 C 520 885, 940 928, 1815 888" fill="none" stroke={C.red} strokeOpacity="0.68" strokeWidth="3" />
        </g>
        <path d="M 1814 888 C 1510 820, 1070 650, 658 548" fill="none" stroke={C.red} strokeWidth="28" strokeOpacity={0.13 * pull} strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - pull} style={{ filter: "blur(8px)" }} />
        <path d="M 1814 888 C 1510 820, 1070 650, 658 548" fill="none" stroke={C.red} strokeWidth="3.5" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - pull} />
        <circle cx={knotX} cy={knotY} r={lerp(8, 16, receipt)} fill={C.gold} opacity={Math.max(field, pull)} />
      </svg>

      <div style={{
        position: "absolute",
        left: 250,
        top: 100,
        width: 408,
        height: 872,
        opacity: receipt,
        transform: `translate(${lerp(160, 0, receipt)}px, ${lerp(110, 0, receipt)}px) scale(${lerp(0.22, 1, receipt)})`,
        transformOrigin: "100% 52%",
        border: "1px solid rgba(243,237,232,.2)",
        borderRadius: 38,
        background: "#080706",
        boxShadow: `0 28px 90px rgba(0,0,0,.42), 0 0 ${48 * receipt}px rgba(245,197,24,.12)`,
        padding: 14,
        overflow: "hidden",
      }}>
        <div style={{ height: 28, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: 10, background: C.faint }} />
          <span style={{ width: 42, height: 4, borderRadius: 10, background: C.line }} />
        </div>
        <div style={{ position: "relative", height: 816, overflow: "hidden", borderRadius: 25, background: C.pitch }}>
          <Img
            src={staticFile("video/stills/chelsea-1954-mobile-match.png")}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: 380,
              height: "auto",
              transform: `translateY(${-390 * snapshotScroll}px)`,
            }}
          />
          <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 0 1px rgba(243,237,232,.08)", pointerEvents: "none" }} />
        </div>
      </div>

      <div style={{ position: "absolute", left: 850, right: 120, top: 310, opacity: cta, transform: `translateY(${lerp(26, 0, cta)}px)` }}>
        <div style={{ fontFamily: MONO, fontSize: 15, letterSpacing: "0.24em", color: C.red }}>EVERY THREAD LEADS TO A MATCH</div>
        <div style={{ marginTop: 23, fontFamily: SANS, fontSize: 72, lineHeight: 1.02, fontWeight: 600, letterSpacing: "-0.05em", color: C.ink }}>Pull a thread.</div>
        <div style={{ marginTop: 25, width: 342, height: 3, background: `linear-gradient(90deg,${C.red},${C.gold})`, transform: `scaleX(${cta})`, transformOrigin: "left" }} />
        <div style={{ marginTop: 25, fontFamily: MONO, fontSize: 20, letterSpacing: "0.08em", color: C.gold }}>www.utdstats.com&nbsp;&nbsp;↗</div>
        <div style={{ marginTop: 18, maxWidth: 520, fontFamily: SANS, fontSize: 21, lineHeight: 1.5, color: C.dim }}>Every claim opens onto the full match record.</div>
      </div>

      <div style={{ position: "absolute", left: 74, right: 74, bottom: 46, display: "flex", justifyContent: "space-between", opacity: smoothstep(160, 195, frame), fontFamily: MONO, fontSize: 13, letterSpacing: "0.17em", color: C.faint }}>
        <span>RED THREAD · AN INDEPENDENT HISTORICAL ARCHIVE</span><span>{DATA.counts.matches.toLocaleString("en-GB")} MATCHES, CONNECTED</span>
      </div>
    </AbsoluteFill>
  );
}

const CAPTIONS: { start: number; end: number; text: string }[] = [
  { start: 24, end: 130, text: "1886 — the first recorded XI" },
  { start: 150, end: 265, text: "1968 — level after 90" },
  { start: 285, end: 395, text: "1999 — two substitutes changed the final" },
  { start: 415, end: 500, text: "2008 — won on penalties" },
  { start: 530, end: 700, text: "1968 ↔ 2008 — two No. 7s, forty years apart" },
  { start: 715, end: 800, text: "Both became champions of Europe." },
  { start: 802, end: 890, text: "Both scored in the final." },
  { start: 892, end: 980, text: "Both won the Ballon d’Or." },
  { start: 984, end: 1120, text: "Both peaked in season five." },
  { start: 1145, end: 1205, text: "Eleven days. No margin." },
  { start: 1210, end: 1560, text: "1998–99 — three must-wins, every winning goal from the bench" },
  { start: 1570, end: 1620, text: "Three wins. Every winning goal from the bench." },
  { start: 1620, end: 1680, text: "Fergie time — three matches, the same late turn" },
  { start: 1680, end: 2040, text: "Eleven minutes. Six goals. Three turnarounds." },
  { start: 2040, end: 2160, text: "Then the full late-goal record." },
  { start: 2230, end: 2410, text: "Only three slipped behind—and all three recovered" },
  { start: 2510, end: 2630, text: `${DATA.counts.matches.toLocaleString("en-GB")} matches. Pull a thread.` },
  { start: 2630, end: 2700, text: "Every claim opens onto the full match record." },
];

function CaptionBurn({ frame, enabled }: { frame: number; enabled: boolean }) {
  if (!enabled) return null;
  const active = CAPTIONS.find((caption) => frame >= caption.start && frame < caption.end);
  if (!active) return null;
  const local = frame - active.start;
  const duration = active.end - active.start;
  const opacity = smoothstep(0, 10, local) * (1 - smoothstep(duration - 12, duration, local));
  return (
    <div style={{
      position: "absolute",
      left: 120,
      right: 120,
      bottom: 78,
      textAlign: "center",
      opacity,
      fontFamily: SANS,
      fontSize: 28,
      fontWeight: 600,
      letterSpacing: "-0.02em",
      color: C.ink,
      textShadow: "0 2px 18px rgba(0,0,0,.85)",
    }}>
      {active.text}
    </div>
  );
}

export function RedThreadMasterV2({ withAudio = true, withCaptions = false }: { withAudio?: boolean; withCaptions?: boolean }) {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ color: C.ink, fontFamily: SANS }}>
      <Fonts />
      <Field energy={smoothstep(0, MASTER_DURATION_SECONDS * FPS, frame)} />
      {frame < ACT.openingUntil + 30 && <HistoricalTimeline frame={frame} />}
      {frame >= ACT.rhymeFrom && frame < ACT.rhymeUntil && <RhymeLoop frame={frame - ACT.rhymeLocalOrigin} />}
      {frame >= ACT.fergieFrom && frame < ACT.fergieUntil && <FergieConstellation frame={frame - ACT.fergieLocalOrigin} />}
      {frame >= ACT.trebleFrom && frame < ACT.trebleUntil && <TreblePocket frame={frame - ACT.trebleLocalOrigin} />}
      {frame >= ACT.fortressFrom && frame < ACT.fortressUntil && <Fortress frame={frame - ACT.fortressLocalOrigin} />}
      {frame >= ACT.recordFrom && <RecordOpens frame={frame - ACT.recordLocalOrigin} />}
      <FilmKicker frame={frame} />
      <CaptionBurn frame={frame} enabled={withCaptions || !withAudio} />
      {withAudio && (
        <>
          <Sequence from={0} durationInFrames={MUSIC_TAIL_FROM + 24} layout="none">
            <Audio src={staticFile("video/audio/master-v3.mp3")} volume={(f) => musicHeadVolume(f)} />
          </Sequence>
          <Sequence from={MUSIC_TAIL_FROM} durationInFrames={198} layout="none">
            <Audio src={staticFile("video/audio/master-v3.mp3")} trimBefore={MUSIC_TAIL_SOURCE} volume={(f) => musicTailVolume(f)} />
          </Sequence>
        </>
      )}
    </AbsoluteFill>
  );
}
