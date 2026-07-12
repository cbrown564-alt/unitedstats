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
/** Lean master: follow → loop → Treble pocket → one scale bloom → receipt. */
export const MASTER_DURATION_SECONDS = 68;
/** Opening composition length — three signatures with readable dwell. */
export const OPENING_DURATION_FRAMES = 540;

/** Global act windows (frames). Local scene clocks subtract the *LocalOrigin. */
const ACT = {
  openingUntil: OPENING_DURATION_FRAMES,
  rhymeFrom: 480,
  rhymeLocalOrigin: 510,
  rhymeUntil: 900,
  trebleFrom: 860,
  trebleLocalOrigin: 890,
  trebleUntil: 1420,
  fergieFrom: 1370,
  fergieLocalOrigin: 1370,
  fergieUntil: 1780,
  recordFrom: 1720,
  recordLocalOrigin: 1740,
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
  lateGoals: { name: string; minute: number; added: number | null }[];
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
  visualMode: "first-xi" | "score-storm" | "year-mark" | "penalty-constellation";
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

const lateGoalPath = pointPath(DATA.lateGoals, (goal) => ({
  x: 150 + ((yearOf(goal.date) - 1950) / 76) * 1620,
  y: 775 - Math.min(14, Math.max(0, goal.clock - 85)) * 38 + (hash(goal.key) % 25),
}), 2.2);

function displayClock(minute: number, added: number | null): string {
  return minute === 90 && added ? `90+${added}′` : `${minute}′`;
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

function musicDuck(frame: number, inStart: number, inEnd: number, outStart: number, outEnd: number): number {
  return smoothstep(inStart, inEnd, frame) * (1 - smoothstep(outStart, outEnd, frame));
}

function masterMusicVolume(frame: number): number {
  const duck = Math.max(
    musicDuck(frame, 640, 670, 780, 820), // rhyme facts land
    musicDuck(frame, 1240, 1265, 1300, 1330), // Treble Europe 90′
    musicDuck(frame, 1400, 1430, 1580, 1620), // Fergie clock tension
    musicDuck(frame, 1800, 1830, 1920, 1960), // receipt / CTA
  );
  return lerp(0.82, 0.24, duck);
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
  const finalFade = 1 - smoothstep(1920, 1980, frame);
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
        <div style={{ marginTop: 15, fontFamily: SANS, fontSize: 52, fontWeight: 600, letterSpacing: "-0.04em", color: C.ink }}>The first XI.</div>
        <div style={{ marginTop: 14, fontFamily: SANS, fontSize: 22, color: C.dim }}>One match begins the record.</div>
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
        <div style={{ marginTop: 13, fontFamily: SANS, fontSize: 48, lineHeight: 1.02, fontWeight: 600, letterSpacing: "-0.05em", color: C.ink }}>Decided from the spot.</div>
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
        <div style={{ position: "absolute", inset: "66px 0 auto", textAlign: "center" }}><div style={{ fontFamily: MONO, fontSize: 72, lineHeight: 1, color: C.ink }}>{won}–{lost}</div><div style={{ marginTop: 8, fontFamily: MONO, fontSize: 11, letterSpacing: "0.18em", color: C.faint }}>SHOOT-OUT · AGGREGATE RECORD</div></div>
      </div>
      <div style={{ position: "absolute", left: 18, bottom: 25 }}><MatchScore match={match} compact /></div>
      <div style={{ position: "absolute", left: 18, top: 20, width: 360, textAlign: "center", fontFamily: MONO, color: C.gold }}><div style={{ fontSize: 17 }}>25′ · RONALDO</div><div style={{ marginTop: 6, fontSize: 11, letterSpacing: "0.18em", color: C.faint }}>THE NUMBER SEVEN RETURNS</div></div>
    </div>
  );
}

function FeaturedMatchSignature({ match, frame, end }: { match: FeaturedMatch; frame: number; end: number }) {
  if (match.visualMode === "year-mark") return null;
  const { enter, exit, presence } = featuredMatchMotion(frame, match, end);
  // Finish the signature animation before travel/exit begins so the XI/storm can be read.
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
  // One travelling thread head drives the camera. 1968/1999 are year marks only —
  // their proofs wait for the loop and Treble.
  const travel = travelState(frame);
  const cameraX = 960 - travel.x + travel.anticipation * 11 - travel.settle * 5;
  const draw = interpolate(
    frame,
    [0, 50, 110, 160, 210, 280, 320, 360, 430, 540],
    [0.025, 0.08, 0.38, 0.42, 0.58, 0.64, 0.74, 0.82, 0.94, 0.97],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: THREAD_TRAVEL_EASE },
  );
  const worldScale = 1 - travel.anticipation * 0.006 + travel.energy * 0.012 + travel.settle * 0.003 + smoothstep(320, 480, frame) * 0.012;
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
            const european = event.match.competition.toLowerCase().includes("europe");
            const yearOnly = event.visualMode === "year-mark";
            return (
              <g key={event.year} opacity={0.22 + arrived * 0.78}>
                <line x1={event.x} x2={event.x} y1="606" y2="656" stroke={european ? C.gold : C.cream} strokeWidth="1.5" strokeOpacity={(yearOnly ? arrived : motion.presence) * 0.34} pathLength="1" strokeDasharray="1" strokeDashoffset={1 - (yearOnly ? arrived : motion.enter)} />
                {european && <circle cx={event.x} cy="665" r="26" fill={C.gold} fillOpacity="0.1" stroke={C.gold} strokeOpacity="0.42" />}
                <circle cx={event.x} cy="665" r={european ? 8 : 5.5} fill={european ? C.gold : C.cream} />
                <line x1={event.x} x2={event.x} y1="636" y2="700" stroke={european ? C.gold : C.ink} strokeOpacity="0.32" />
                <text x={event.x} y="744" textAnchor="middle" fill={european ? C.gold : C.faint} style={{ fontFamily: MONO, fontSize: european ? 23 : 18, letterSpacing: "0.08em" }}>{event.year}</text>
                {european && !yearOnly && <text x={event.x} y="784" textAnchor="middle" fill={C.faint} style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, letterSpacing: "0.2em" }}>EUROPEAN CUP</text>}
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

const RHYME_FACTS = [
  { start: 140, label: "EUROPEAN CUP", left: "1968 · WON", right: "2008 · WON", headline: "Forty years apart." },
  { start: 240, label: "THE FINAL", left: "BEST · 92′", right: "RONALDO · 25′", headline: "Both No. 7. Both scored." },
];

function RhymeLoop({ frame }: { frame: number }) {
  const duration = 450;
  const opacity = sceneOpacity(frame, duration, 36);
  const circleDraw = smoothstep(50, 280, frame);
  const exitDraw = smoothstep(360, 430, frame);
  const bestArrival = smoothstep(110, 165, frame);
  const ronaldoArrival = smoothstep(0, 48, frame);
  const finalFact = smoothstep(240, 300, frame);
  const handoff = smoothstep(0, 70, frame);
  const contentFade = 1 - smoothstep(360, 410, frame);
  const worldX = lerp(-530, 0, handoff);
  const baseY = 696;
  const circlePath = "M 1490 696 C 1490 420, 1253 196, 960 196 C 667 196, 430 420, 430 696 C 430 972, 667 996, 960 996 C 1253 996, 1490 972, 1490 696";
  const exitPath = "M 1490 696 C 1360 660, 1190 674, 980 696";
  const activeFact = [...RHYME_FACTS].reverse().find((fact) => frame >= fact.start) ?? null;
  const titleOpacity = frame < 140 ? windowed(frame, 24, 52, 110, 138) : 0;
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
        <g opacity={contentFade * smoothstep(40, 80, frame)}>
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
        <circle cx="980" cy={baseY} r={lerp(7, 30, smoothstep(380, 430, frame))} fill="none" stroke={C.gold} strokeOpacity={1 - smoothstep(400, 440, frame)} />
        <circle cx="980" cy={baseY} r="7" fill={C.gold} opacity={smoothstep(360, 400, frame)} />
      </svg>
      </div>

      <div style={{ position: "absolute", top: 122, insetInline: 0, textAlign: "center", opacity: titleOpacity }}>
        <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: "0.26em", color: C.dim }}>1968&nbsp;&nbsp;↔&nbsp;&nbsp;2008</div>
        <div style={{ marginTop: 18, fontFamily: SANS, fontSize: 62, fontWeight: 600, letterSpacing: "-0.04em" }}>Some nights return.</div>
      </div>

      {activeFact && (
        <div style={{ position: "absolute", top: 105, left: 570, right: 570, textAlign: "center", opacity: smoothstep(activeFact.start, activeFact.start + 26, frame) * contentFade, transform: `translateY(${lerp(24, 0, smoothstep(activeFact.start, activeFact.start + 26, frame))}px)` }}>
          <div style={{ fontFamily: MONO, fontSize: 15, letterSpacing: "0.25em", color: C.gold }}>{activeFact.label}</div>
          <div style={{ marginTop: 15, fontFamily: SANS, fontSize: 54, fontWeight: 600, letterSpacing: "-0.04em", color: C.ink }}>{activeFact.headline}</div>
        </div>
      )}

      <div style={{ position: "absolute", left: 210, right: 210, bottom: 90, display: "grid", gridTemplateColumns: "1fr 120px 1fr", alignItems: "center", gap: 24, opacity: smoothstep(130, 170, frame) * contentFade }}>
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

const TREBLE_DECIDERS = [
  { date: "16 May", place: "Old Trafford", image: "media/journey/old-trafford.webp", objectPosition: "42% 48%" },
  { date: "22 May", place: "Wembley", image: "media/journey/wembley.webp", objectPosition: "50% 40%" },
  { date: "26 May", place: "Camp Nou", image: "media/journey/camp-nou.webp", objectPosition: "55% 42%" },
] as const;

const BENCH_SPANS = [
  {
    label: "16 May · Tottenham",
    competition: "Premier League",
    rows: [{ on: 46, scored: 48, added: null as number | null, name: "Cole", latency: "two minutes" }],
  },
  {
    label: "22 May · Newcastle",
    competition: "FA Cup",
    rows: [{ on: 9, scored: 11, added: null as number | null, name: "Sheringham", latency: "two minutes" }],
  },
  {
    label: "26 May · Bayern",
    competition: "Champions League",
    rows: [
      { on: 67, scored: 90, added: 1, name: "Sheringham", latency: "stoppage" },
      { on: 81, scored: 90, added: 3, name: "Solskjær", latency: "stoppage" },
    ],
  },
] as const;

const AXIS_END_MIN = 96;
const benchPct = (minute: number) => (minute / AXIS_END_MIN) * 100;

function TreblePlaceAtmosphere({ frame }: { frame: number }) {
  return (
    <>
      {TREBLE_DECIDERS.map((decider, index) => {
        const knotAt = 90 + index * 55;
        const op = smoothstep(knotAt, knotAt + 28, frame) * (1 - smoothstep(300, 340, frame)) * 0.28;
        const side = index === 0 ? "left" : index === 2 ? "right" : "bottom";
        const mask =
          side === "left"
            ? "linear-gradient(to right,#000 0%,#000 40%,transparent 92%),linear-gradient(to top,transparent 8%,#000 45%,transparent 100%)"
            : side === "right"
              ? "linear-gradient(to left,#000 0%,#000 40%,transparent 92%),linear-gradient(to top,transparent 8%,#000 45%,transparent 100%)"
              : "linear-gradient(to top,#000 0%,#000 35%,transparent 88%),linear-gradient(to right,transparent 6%,#000 40%,#000 60%,transparent 94%)";
        const box =
          side === "left"
            ? { left: 0, top: "16%", bottom: "22%", width: "38%" }
            : side === "right"
              ? { right: 0, top: "16%", bottom: "22%", width: "38%" }
              : { left: "18%", right: "18%", bottom: 0, height: "36%" };
        return (
          <div key={decider.place} style={{ position: "absolute", ...box, opacity: op, WebkitMaskImage: mask, maskComposite: "intersect" }}>
            <Img src={staticFile(decider.image)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: decider.objectPosition, filter: "grayscale(1) contrast(1.25) brightness(.72)" }} />
            <AbsoluteFill style={{
              background: side === "left"
                ? "linear-gradient(to right,rgba(216,33,13,.72),rgba(216,33,13,.14),transparent)"
                : side === "right"
                  ? "linear-gradient(to left,rgba(216,33,13,.72),rgba(216,33,13,.14),transparent)"
                  : "linear-gradient(to top,rgba(216,33,13,.55),rgba(216,33,13,.12),transparent)",
              mixBlendMode: "color",
            }} />
          </div>
        );
      })}
    </>
  );
}

function TrebleSpinoffStage({ frame }: { frame: number }) {
  const axisY = 210;
  const axisX0 = 140;
  const axisX1 = 1780;
  const departX = 980;
  const returnX = 1020;
  const cx = 960;
  const cy = 530;
  const r = 205;
  const neckY = cy - r;
  const knotXY: [number, number][] = [
    [cx - r, cy],
    [cx, cy + r],
    [cx + r, cy],
  ];
  const path =
    `M ${axisX0} ${axisY} L ${departX} ${axisY} ` +
    `C ${departX - 90} ${axisY + 30} ${cx + 130} ${neckY - 46} ${cx} ${neckY} ` +
    `A ${r} ${r} 0 0 0 ${cx} ${cy + r} ` +
    `A ${r} ${r} 0 0 0 ${cx} ${neckY} ` +
    `C ${cx + 140} ${neckY - 42} ${returnX - 90} ${axisY + 6} ${returnX} ${axisY} ` +
    `L ${axisX1} ${axisY}`;
  const draw = interpolate(frame, [8, 280], [0.12, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: THREAD_TRAVEL_EASE });
  const awaken = smoothstep(0, 36, frame);
  const land = smoothstep(300, 360, frame);
  const stageFade = 1 - smoothstep(300, 340, frame);
  const ninetyNine = 0.05 + awaken * 0.04 + draw * 0.04 + land * 0.03;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: stageFade }}>
      <svg width="1920" height="1080" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="treble-filament" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={C.red} stopOpacity="0.9" />
            <stop offset="30%" stopColor="#ff5030" />
            <stop offset="50%" stopColor="#ffd278" />
            <stop offset="70%" stopColor="#ff5030" />
            <stop offset="100%" stopColor={C.red} stopOpacity="0.9" />
          </linearGradient>
          <filter id="treble-pocket-glow" x="-20%" y="-80%" width="140%" height="260%"><feGaussianBlur stdDeviation="10" /></filter>
        </defs>
        <text x={cx} y={cy + 18} textAnchor="middle" fill={C.red} fillOpacity={ninetyNine} style={{ fontFamily: SANS, fontSize: 280, fontWeight: 800, letterSpacing: "-0.08em" }}>99</text>
        <line x1={axisX0} y1={axisY} x2={axisX1} y2={axisY} stroke={C.red} strokeOpacity={0.08 + awaken * 0.1} strokeWidth="1.6" />
        <text x={axisX0} y={axisY - 22} fill={C.dim} fillOpacity={0.2 + awaken * 0.35} style={{ fontFamily: MONO, fontSize: 18 }}>1886</text>
        <text x={axisX1} y={axisY - 22} textAnchor="end" fill={C.dim} fillOpacity={0.2 + awaken * 0.35} style={{ fontFamily: SANS, fontSize: 18, fontWeight: 500, letterSpacing: "0.04em" }}>now</text>
        <text x={departX} y={axisY - 26} textAnchor="middle" fill={C.ink} fillOpacity={0.35 + awaken * 0.55} style={{ fontFamily: MONO, fontSize: 28, fontWeight: 700 }}>1999</text>
        <path d={path} fill="none" stroke={C.red} strokeWidth="28" strokeOpacity={draw * 0.16} strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - draw} filter="url(#treble-pocket-glow)" />
        <path d={path} fill="none" stroke="url(#treble-filament)" strokeWidth="3.6" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - draw} />
        <g opacity={lerp(0.5, 1, awaken)}>
          <circle cx={departX} cy={axisY} r="22" fill="#fff" fillOpacity="0.08" />
          <circle cx={departX} cy={axisY} r="13" fill="none" stroke="#fff" strokeOpacity="0.5" strokeWidth="1.3" />
          <circle cx={departX} cy={axisY} r="2.6" fill={C.cream} />
        </g>
        {TREBLE_DECIDERS.map((decider, index) => {
          const [kx, ky] = knotXY[index];
          const knotFrac = 0.34 + index * 0.18;
          const op = smoothstep(knotFrac - 0.04, knotFrac + 0.04, draw);
          const label =
            index === 0
              ? { x: kx - 28, y: ky - 4, anchor: "end" as const, placeY: ky + 24 }
              : index === 1
                ? { x: kx, y: ky + 38, anchor: "middle" as const, placeY: ky + 62 }
                : { x: kx + 28, y: ky - 4, anchor: "start" as const, placeY: ky + 24 };
          return (
            <g key={decider.date} opacity={op}>
              <circle cx={kx} cy={ky} r="16" fill={C.gold} fillOpacity="0.16" />
              <circle cx={kx} cy={ky} r="7" fill={C.gold} stroke={C.cream} strokeWidth="1.2" />
              {index === 2 && <circle cx={kx} cy={ky} r={lerp(10, 22, smoothstep(260, 300, frame))} fill="none" stroke={C.gold} strokeOpacity={0.55 * (1 - smoothstep(300, 340, frame))} strokeWidth="1.5" />}
              <text x={label.x} y={label.y} textAnchor={label.anchor} fill={C.dim} style={{ fontFamily: SANS, fontSize: 24, fontWeight: 500 }}>{decider.date}</text>
              <text x={label.x} y={label.placeY} textAnchor={label.anchor} fill={C.faint} style={{ fontFamily: SANS, fontSize: 14, fontWeight: 500, letterSpacing: "0.14em" }}>{decider.place.toUpperCase()}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function BenchLatencyFilm({ frame }: { frame: number }) {
  const enter = smoothstep(300, 340, frame);
  const leave = 1 - smoothstep(460, 500, frame);
  const opacity = enter * leave;
  const euroHold = windowed(frame, 400, 418, 438, 462);
  return (
    <div style={{ position: "absolute", inset: 0, opacity }}>
      <div style={{ position: "absolute", left: 220, right: 220, top: 210, opacity: 1 - euroHold * 0.9 }}>
        {BENCH_SPANS.map((night, nightIndex) => {
          const nightArrive = smoothstep(305 + nightIndex * 22, 328 + nightIndex * 22, frame);
          return (
            <div key={night.label} style={{ marginBottom: 36, opacity: nightArrive, transform: `translateY(${lerp(18, 0, nightArrive)}px)` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontFamily: MONO, fontSize: 13, letterSpacing: "0.16em", color: C.faint }}>
                <span>{night.label.toUpperCase()}</span>
                <span>{night.competition.toUpperCase()}</span>
              </div>
              {night.rows.map((row) => {
                const scoredAx = row.added ? 90 + row.added : row.scored;
                const onPct = benchPct(row.on);
                const scoredPct = benchPct(scoredAx);
                const spanPct = Math.max(scoredPct - onPct, 0.4);
                const mid = Math.min(Math.max(onPct + spanPct / 2, 8), 92);
                const clock = row.added ? `${row.scored}+${row.added}′` : `${row.scored}′`;
                return (
                  <div key={`${row.name}-${row.on}`} style={{ position: "relative", marginBottom: night.rows.length > 1 ? 26 : 0, minHeight: 68 }}>
                    <div style={{ position: "absolute", left: `${mid}%`, top: 0, transform: "translateX(-50%)", fontFamily: MONO, fontSize: 13, color: C.dim, whiteSpace: "nowrap" }}>
                      <span style={{ color: C.faint }}>{row.on}′</span>
                      {" → "}
                      <span style={{ color: C.gold }}>{clock}</span>
                    </div>
                    <div style={{ position: "absolute", left: 0, right: 0, top: 26, height: 18 }}>
                      <div style={{ position: "absolute", insetInline: 0, top: "50%", height: 1, background: "rgba(168,156,148,.18)", transform: "translateY(-50%)" }} />
                      <div style={{ position: "absolute", left: `${benchPct(45)}%`, top: "50%", width: 1, height: 10, background: "rgba(168,156,148,.28)", transform: "translate(-50%,-50%)" }} />
                      <div style={{ position: "absolute", left: `${benchPct(90)}%`, top: "50%", width: 1, height: 12, background: "rgba(168,156,148,.4)", transform: "translate(-50%,-50%)" }} />
                      <div style={{ position: "absolute", left: `${onPct}%`, top: "50%", width: `${spanPct}%`, height: 3, borderRadius: 4, background: `linear-gradient(90deg,rgba(168,156,148,.5),${C.gold})`, transform: "translateY(-50%)" }} />
                      <div style={{ position: "absolute", left: `${onPct}%`, top: "50%", width: 8, height: 8, borderRadius: 20, background: C.faint, transform: "translate(-50%,-50%)" }} />
                      <div style={{ position: "absolute", left: `${scoredPct}%`, top: "50%", width: 14, height: 14, borderRadius: 20, background: C.gold, boxShadow: `0 0 16px rgba(245,197,24,.75)`, transform: "translate(-50%,-50%)" }} />
                    </div>
                    <div style={{ position: "absolute", left: `${mid}%`, top: 50, transform: "translateX(-50%)", textAlign: "center", whiteSpace: "nowrap" }}>
                      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.14em", color: C.faint }}>{row.latency.toUpperCase()}</div>
                      <div style={{ marginTop: 3, fontFamily: SANS, fontSize: 16, fontWeight: 600, color: C.dim }}>{row.name}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
        <div style={{ position: "relative", marginTop: 4, height: 18, fontFamily: MONO, fontSize: 12, letterSpacing: "0.14em", color: C.faint }}>
          <span style={{ position: "absolute", left: 0 }}>0′</span>
          <span style={{ position: "absolute", left: `${benchPct(45)}%`, transform: "translateX(-50%)" }}>45′</span>
          <span style={{ position: "absolute", left: `${benchPct(90)}%`, transform: "translateX(-50%)" }}>90′</span>
        </div>
      </div>

      <div style={{ position: "absolute", left: 0, right: 0, top: 300, textAlign: "center", opacity: euroHold, transform: `scale(${lerp(0.96, 1, euroHold)})` }}>
        <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: "0.22em", color: C.red }}>NINETY MINUTES GONE</div>
        <div style={{ marginTop: 12, fontFamily: MONO, fontSize: 148, lineHeight: 0.9, letterSpacing: "-0.08em", color: C.ink }}>0–1</div>
        <div style={{ marginTop: 18, fontFamily: SANS, fontSize: 24, color: C.dim }}>Then both from the bench.</div>
      </div>
    </div>
  );
}

function TreblePocket({ frame }: { frame: number }) {
  const duration = 530;
  const opacity = sceneOpacity(frame, duration, 40);
  const copyPhase = frame < 90 ? 0 : frame < 280 ? 1 : 2;
  const copyLines = [
    { line: "1998–99.", sub: "63 games." },
    { line: "Three must-wins.", sub: "Final day. Cup final. European final." },
    { line: "All three, from the bench.", sub: "The 16th. The 22nd. The 26th." },
  ] as const;
  const active = copyLines[copyPhase];
  const copyOpacity = copyPhase === 0
    ? windowed(frame, 6, 28, 72, 92)
    : copyPhase === 1
      ? windowed(frame, 92, 118, 260, 290)
      : windowed(frame, 298, 318, 348, 368);
  const land = smoothstep(450, 485, frame);
  const handoff = smoothstep(486, 520, frame);
  return (
    <AbsoluteFill style={{ opacity }}>
      <TreblePlaceAtmosphere frame={frame} />
      <TrebleSpinoffStage frame={frame} />
      <BenchLatencyFilm frame={frame} />

      <div style={{ position: "absolute", top: 96, insetInline: 0, textAlign: "center", opacity: copyOpacity * (1 - handoff), transform: `translateY(${lerp(18, 0, copyOpacity)}px)` }}>
        <div style={{ fontFamily: MONO, fontSize: 15, letterSpacing: "0.26em", color: C.gold }}>RED THREAD / 02</div>
        <div style={{ marginTop: 18, fontFamily: SANS, fontSize: copyPhase === 2 ? 58 : 64, fontWeight: 600, letterSpacing: "-0.045em", color: C.ink }}>{active.line}</div>
        <div style={{ marginTop: 14, fontFamily: SANS, fontSize: 22, color: C.dim }}>{active.sub}</div>
      </div>

      <div style={{ position: "absolute", insetInline: 0, bottom: 64, textAlign: "center", opacity: land * (1 - handoff), transform: `translateY(${lerp(16, 0, land)}px)` }}>
        <div style={{ fontFamily: SANS, fontSize: 20, color: C.dim }}><span style={{ fontFamily: MONO, fontWeight: 600, color: C.ink }}>3</span> trophies.</div>
      </div>

      <div style={{
        position: "absolute",
        left: "50%",
        top: "48%",
        width: 280,
        height: 280,
        marginLeft: -140,
        marginTop: -140,
        opacity: handoff,
        transform: `scale(${lerp(0.4, 1.05, smoothstep(486, 530, frame))})`,
        borderRadius: 999,
        border: `2px solid rgba(245,197,24,${0.35 + handoff * 0.4})`,
        boxShadow: "0 0 60px rgba(255,59,31,.25)",
        display: "grid",
        placeItems: "center",
        background: "radial-gradient(circle,rgba(43,12,8,.7),transparent 72%)",
      }}>
        <div style={{ fontFamily: MONO, fontSize: 64, letterSpacing: "-0.08em", color: C.ink }}>90+3′</div>
      </div>
    </AbsoluteFill>
  );
}

function FergieConstellation({ frame }: { frame: number }) {
  const duration = 390;
  const opacity = sceneOpacity(frame, duration, 34);
  const clockBuild = smoothstep(8, 58, frame);
  const tension = windowed(frame, 28, 70, 170, 210);
  const bloom = smoothstep(170, 250, frame);
  const constellation = smoothstep(190, 280, frame);
  const echoes = DATA.fergieEchoes;
  const clockMinute = interpolate(frame, [16, 80, 170], [85, 90, 93], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const added = Math.max(0, clockMinute - 90);
  const clockLabel = clockMinute < 90
    ? `${Math.floor(clockMinute)}′`
    : added < 0.35
      ? "90′"
      : `90+${Math.min(8, Math.ceil(added))}′`;
  const tickPulse = 0.55 + 0.45 * Math.sin(frame * 0.42);
  return (
    <AbsoluteFill style={{ opacity }}>
      <div style={{
        position: "absolute",
        left: "50%",
        top: "46%",
        width: 520,
        height: 520,
        marginLeft: -260,
        marginTop: -260,
        opacity: clockBuild * (1 - constellation * 0.92),
        transform: `scale(${lerp(0.82, 1, clockBuild) * lerp(1, 1.55, bloom)})`,
      }}>
        <svg width="520" height="520" style={{ position: "absolute", inset: 0 }}>
          <defs>
            <filter id="fergie-clock-glow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="10" /></filter>
          </defs>
          <circle cx="260" cy="260" r="210" fill="none" stroke={C.red} strokeOpacity={0.14 + tension * 0.12} strokeWidth="28" filter="url(#fergie-clock-glow)" />
          <circle cx="260" cy="260" r="198" fill="none" stroke={C.line} strokeWidth="2" />
          <circle cx="260" cy="260" r="198" fill="none" stroke={C.gold} strokeWidth="3" strokeOpacity={0.55 + tension * 0.35 * tickPulse} pathLength="1" strokeDasharray="1" strokeDashoffset={1 - clockBuild * 0.72 - bloom * 0.28} strokeLinecap="round" />
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((index) => {
            const angle = (index / 12) * Math.PI * 2 - Math.PI / 2;
            const inner = 168;
            const outer = 188;
            return <line key={index} x1={260 + Math.cos(angle) * inner} y1={260 + Math.sin(angle) * inner} x2={260 + Math.cos(angle) * outer} y2={260 + Math.sin(angle) * outer} stroke={index % 3 === 0 ? C.gold : C.faint} strokeOpacity={0.35 + clockBuild * 0.45} strokeWidth={index % 3 === 0 ? 3 : 1.5} />;
          })}
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}>
          <div>
            <div style={{ fontFamily: MONO, fontSize: 18, letterSpacing: "0.28em", color: C.red, opacity: 0.7 + tension * 0.3 }}>FERGIE TIME</div>
            <div style={{ marginTop: 10, fontFamily: MONO, fontSize: 110, lineHeight: 0.92, letterSpacing: "-0.08em", color: C.ink, textShadow: `0 0 ${28 * tension}px rgba(245,197,24,.35)` }}>{clockLabel}</div>
            <div style={{ marginTop: 14, fontFamily: SANS, fontSize: 22, color: C.dim, opacity: 1 - bloom }}>{frame < 90 ? "The same late shape." : "Three nights. One clock."}</div>
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", inset: 0, opacity: 1 - constellation }}>
        {echoes.map((echo, index) => {
          const arrival = smoothstep(28 + index * 44, 56 + index * 44, frame);
          const angle = (-110 + index * 110) * Math.PI / 180;
          const radius = lerp(340, 390, arrival);
          const x = 960 + Math.cos(angle) * radius;
          const y = 500 + Math.sin(angle) * radius * 0.55;
          return (
            <div key={echo.id} style={{
              position: "absolute",
              left: x,
              top: y,
              width: 280,
              transform: `translate(-50%, -50%) scale(${lerp(0.88, 1, arrival)})`,
              opacity: arrival,
              textAlign: "center",
            }}>
              <div style={{ fontFamily: MONO, fontSize: 20, color: C.gold }}>{echo.date.slice(0, 4)}</div>
              <div style={{ marginTop: 8, fontFamily: SANS, fontSize: 22, fontWeight: 600, color: C.ink }}>{echo.opponent}</div>
              <div style={{ marginTop: 16, fontFamily: MONO, fontSize: 36, color: C.ink }}>0–1&nbsp;→&nbsp;2–1</div>
              <div style={{ marginTop: 10, display: "flex", justifyContent: "center", gap: 16, color: C.gold, fontFamily: MONO, fontSize: 16 }}>
                {echo.lateGoals.map((goal) => <span key={`${goal.name}-${goal.minute}-${goal.added}`}>{displayClock(goal.minute, goal.added)}</span>)}
              </div>
            </div>
          );
        })}
      </div>

      <svg width="1920" height="1080" style={{ position: "absolute", inset: 0, opacity: constellation }}>
        <path d={lateGoalPath} fill="rgba(255,210,120,.54)" />
        <line x1="150" x2="1770" y1="775" y2="775" stroke={C.red} strokeOpacity="0.45" />
        {[86, 90, 94, 98].map((clock) => <text key={clock} x="105" y={775 - (clock - 85) * 38 + 6} fill={C.faint} style={{ fontFamily: MONO, fontSize: 14 }}>{clock === 94 ? "90+4" : clock === 98 ? "90+8" : `${clock}′`}</text>)}
        <circle cx="960" cy="500" r={lerp(48, 8, smoothstep(210, 280, frame))} fill={C.gold} fillOpacity={0.2 * (1 - smoothstep(250, 300, frame))} />
      </svg>
      <div style={{ position: "absolute", top: 100, insetInline: 0, textAlign: "center", opacity: constellation }}>
        <div style={{ fontFamily: MONO, color: C.gold, fontSize: 18, letterSpacing: "0.23em" }}>{DATA.lateGoals.length} RECORDED GOALS AFTER 85′</div>
        <div style={{ marginTop: 15, fontFamily: SANS, color: C.ink, fontSize: 56, fontWeight: 600, letterSpacing: "-0.04em" }}>One pressure, across eras.</div>
      </div>
      <div style={{ position: "absolute", insetInline: 0, bottom: 52, textAlign: "center", opacity: smoothstep(280, 330, frame), fontFamily: SANS, color: C.dim, fontSize: 22 }}>1993 to 2023. The same impossible finish.</div>
    </AbsoluteFill>
  );
}

function RecordOpens({ frame }: { frame: number }) {
  const opacity = smoothstep(0, 32, frame);
  const field = smoothstep(0, 90, frame);
  const pull = smoothstep(70, 130, frame);
  const receipt = smoothstep(100, 150, frame);
  const cta = smoothstep(140, 180, frame);
  const knotX = interpolate(pull, [0, 1], [1814, 1032]);
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
        <path d="M 1814 888 C 1640 850, 1410 690, 1032 548" fill="none" stroke={C.red} strokeWidth="28" strokeOpacity={0.13 * pull} strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - pull} style={{ filter: "blur(8px)" }} />
        <path d="M 1814 888 C 1640 850, 1410 690, 1032 548" fill="none" stroke={C.red} strokeWidth="3.5" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - pull} />
        <circle cx={knotX} cy={knotY} r={lerp(8, 16, receipt)} fill={C.gold} opacity={Math.max(field, pull)} />
      </svg>

      <div style={{
        position: "absolute",
        left: 176,
        top: 202,
        width: 856,
        height: 520,
        opacity: receipt,
        transform: `translate(${lerp(160, 0, receipt)}px, ${lerp(110, 0, receipt)}px) scale(${lerp(0.22, 1, receipt)})`,
        transformOrigin: "92% 68%",
        border: "1px solid rgba(243,237,232,.2)",
        background: "rgba(12,11,10,.9)",
        boxShadow: `0 28px 90px rgba(0,0,0,.42), 0 0 ${48 * receipt}px rgba(245,197,24,.12)`,
        padding: "42px 48px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 14, letterSpacing: "0.19em", color: C.faint }}>
          <span>MATCH RECEIPT</span><span>26 MAY 1999</span>
        </div>
        <div style={{ marginTop: 34, display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "baseline", gap: 22 }}>
          <div style={{ fontFamily: SANS, fontSize: 35, fontWeight: 600, textAlign: "right", color: C.dim }}>BAYERN</div>
          <div style={{ fontFamily: MONO, fontSize: 80, lineHeight: 1, letterSpacing: "-0.08em", color: C.ink }}>1–2</div>
          <div style={{ fontFamily: SANS, fontSize: 35, fontWeight: 600, color: C.ink }}>UNITED</div>
        </div>
        <div style={{ marginTop: 16, textAlign: "center", fontFamily: MONO, fontSize: 14, letterSpacing: "0.18em", color: C.gold }}>EUROPEAN CUP FINAL · CAMP NOU</div>
        <div style={{ marginTop: 34, borderTop: "1px solid rgba(243,237,232,.14)" }}>
          {[{ clock: "90+1′", player: "SHERINGHAM" }, { clock: "90+3′", player: "SOLSKJÆR" }].map((event) => (
            <div key={event.clock} style={{ display: "grid", gridTemplateColumns: "112px 1fr auto", alignItems: "center", padding: "17px 0", borderBottom: "1px solid rgba(243,237,232,.1)" }}>
              <span style={{ fontFamily: MONO, fontSize: 18, color: C.gold }}>{event.clock}</span>
              <span style={{ fontFamily: SANS, fontSize: 19, fontWeight: 600, color: C.ink }}>{event.player}</span>
              <span style={{ fontFamily: MONO, fontSize: 12, letterSpacing: "0.16em", color: C.faint }}>SUBSTITUTE</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 23, fontFamily: MONO, fontSize: 13, letterSpacing: "0.08em", color: C.faint }}>/match/1999-05-26-bayern-munich-n</div>
      </div>

      <div style={{ position: "absolute", left: 1160, right: 120, top: 310, opacity: cta, transform: `translateY(${lerp(26, 0, cta)}px)` }}>
        <div style={{ fontFamily: MONO, fontSize: 15, letterSpacing: "0.24em", color: C.red }}>THE EVIDENCE IS THE DOOR</div>
        <div style={{ marginTop: 23, fontFamily: SANS, fontSize: 72, lineHeight: 1.02, fontWeight: 600, letterSpacing: "-0.05em", color: C.ink }}>Pull a thread.</div>
        <div style={{ marginTop: 25, width: 342, height: 3, background: `linear-gradient(90deg,${C.red},${C.gold})`, transform: `scaleX(${cta})`, transformOrigin: "left" }} />
        <div style={{ marginTop: 25, fontFamily: MONO, fontSize: 17, letterSpacing: "0.08em", color: C.gold }}>unitedstats.vercel.app/stories&nbsp;&nbsp;↗</div>
        <div style={{ marginTop: 18, maxWidth: 520, fontFamily: SANS, fontSize: 21, lineHeight: 1.5, color: C.dim }}>Every claim leads back to its receipt.</div>
      </div>

      <div style={{ position: "absolute", left: 74, right: 74, bottom: 46, display: "flex", justifyContent: "space-between", opacity: smoothstep(160, 195, frame), fontFamily: MONO, fontSize: 13, letterSpacing: "0.17em", color: C.faint }}>
        <span>RED THREAD · AN INDEPENDENT HISTORICAL ARCHIVE</span><span>{DATA.counts.matches.toLocaleString("en-GB")} MATCHES, CONNECTED</span>
      </div>
    </AbsoluteFill>
  );
}

const CAPTIONS: { start: number; end: number; text: string }[] = [
  { start: 24, end: 130, text: "1886 — the first XI" },
  { start: 150, end: 250, text: "1954 — eleven goals, one night" },
  { start: 390, end: 500, text: "2008 — decided from the spot" },
  { start: 520, end: 640, text: "1968 ↔ 2008 — some nights return" },
  { start: 650, end: 820, text: "Both No. 7. Both scored." },
  { start: 900, end: 1180, text: "1998–99 — three must-wins" },
  { start: 1190, end: 1370, text: "All three, from the bench." },
  { start: 1400, end: 1600, text: "Fergie time — the same late shape" },
  { start: 1600, end: 1740, text: `${DATA.lateGoals.length} goals after 85′` },
  { start: 1780, end: 1920, text: `${DATA.counts.matches.toLocaleString("en-GB")} matches — pull a thread` },
  { start: 1920, end: 2040, text: "Every claim leads back to its receipt" },
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

function ActHandoffFilament({ frame }: { frame: number }) {
  const bridges = [
    { start: 480, end: 540, d: "M 1490 696 C 1360 640, 1180 560, 980 520" }, // opening → rhyme
    { start: 840, end: 910, d: "M 1490 696 C 1360 660, 1190 674, 980 696" }, // rhyme → 1999
    { start: 1340, end: 1400, d: "M 960 540 C 960 480, 960 420, 960 360" }, // treble → clock
    { start: 1680, end: 1750, d: "M 960 500 C 1180 640, 1500 800, 1814 888" }, // fergie → archive field
  ];
  return (
    <svg width="1920" height="1080" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs>
        <filter id="handoff-glow" x="-20%" y="-200%" width="140%" height="500%"><feGaussianBlur stdDeviation="8" /></filter>
      </defs>
      {bridges.map((bridge) => {
        const draw = windowed(frame, bridge.start, bridge.start + 18, bridge.end - 18, bridge.end);
        return (
          <g key={bridge.start} opacity={draw}>
            <path d={bridge.d} fill="none" stroke={C.red} strokeWidth="22" strokeOpacity={0.14} strokeLinecap="round" filter="url(#handoff-glow)" />
            <path d={bridge.d} fill="none" stroke={C.gold} strokeWidth="3" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - draw} />
          </g>
        );
      })}
    </svg>
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
      {frame >= ACT.recordFrom && <RecordOpens frame={frame - ACT.recordLocalOrigin} />}
      <ActHandoffFilament frame={frame} />
      <FilmKicker frame={frame} />
      <CaptionBurn frame={frame} enabled={withCaptions || !withAudio} />
      {withAudio && (
        <>
          <Sequence from={0} durationInFrames={62 * FPS} layout="none">
            <Audio src={staticFile("video/audio/master-v3.mp3")} volume={(f) => masterMusicVolume(f)} />
          </Sequence>
          <Sequence from={62 * FPS} durationInFrames={6 * FPS} layout="none">
            <Audio src={staticFile("video/audio/master-v3.mp3")} trimBefore={78 * FPS} volume={(f) => masterMusicVolume(62 * FPS + f)} />
          </Sequence>
          <Sequence from={0} durationInFrames={ACT.openingUntil}>
            <Audio src={staticFile("video/audio/master-v6-opening-sfx.wav")} volume={0.48} />
          </Sequence>
          <Audio src={staticFile("video/audio/master-v6-body-sfx.wav")} volume={0.52} />
          <Sequence from={ACT.trebleLocalOrigin} durationInFrames={530}>
            <Audio src={staticFile("video/audio/master-v5-sfx.wav")} volume={0.7} />
          </Sequence>
        </>
      )}
    </AbsoluteFill>
  );
}
