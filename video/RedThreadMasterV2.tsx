import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
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
export const MASTER_DURATION_SECONDS = 84;

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

type MasterData = {
  counts: { matches: number; events: number; lineups: number };
  firstMatch: { id: string; date: string; opponent: string; score: string; clubName: string };
  matches: MatchPoint[];
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

const fortressPath = pointPath(DATA.fortress.games, (game, index) => ({
  x: 150 + (index / Math.max(1, DATA.fortress.games.length - 1)) * 1620,
  y: 650 + ((hash(game.id) % 7) - 3) * 28,
}), 2.1);

function displayClock(minute: number, added: number | null): string {
  return minute === 90 && added ? `90+${added}′` : `${minute}′`;
}

function sceneOpacity(local: number, duration: number, fade = 34): number {
  return smoothstep(0, fade, local) * (1 - smoothstep(duration - fade, duration, local));
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
  const act = frame < 540 ? "FOLLOW" : frame < 1110 ? "LOOP" : frame < 1590 ? "SPIN OFF" : frame < 2040 ? "ECHO" : frame < 2310 ? "PLACE" : "RECORD";
  const finalFade = 1 - smoothstep(2400, 2460, frame);
  return (
    <div style={{ position: "absolute", left: 74, top: 56, display: "flex", alignItems: "center", gap: 16, opacity: finalFade, fontFamily: MONO, fontSize: 15, letterSpacing: "0.24em", color: C.faint }}>
      <span style={{ width: 8, height: 8, borderRadius: 20, background: C.red, boxShadow: `0 0 16px ${C.red}` }} />
      RED THREAD&nbsp;&nbsp;/&nbsp;&nbsp;{act}
    </div>
  );
}

type TimelineEvent = {
  year: number;
  x: number;
  start: number;
  eyebrow: string;
  headline: string;
  sub: string;
  european?: boolean;
};

const TIMELINE_EVENTS: TimelineEvent[] = [
  { year: 1886, x: 220, start: 18, eyebrow: "30 OCTOBER 1886", headline: "The first match.", sub: "Fleetwood Rangers 2–2 Newton Heath." },
  { year: 1909, x: 930, start: 118, eyebrow: "24 APRIL 1909", headline: "The first FA Cup.", sub: "Bristol City 0–1 United." },
  { year: 1954, x: 1770, start: 226, eyebrow: "16 OCTOBER 1954", headline: "Eleven goals.", sub: "Chelsea 5–6 United." },
  { year: 1968, x: 2310, start: 320, eyebrow: "29 MAY 1968", headline: "European champions.", sub: "Benfica 1–4 United · Wembley.", european: true },
  { year: 1999, x: 3080, start: 405, eyebrow: "26 MAY 1999", headline: "European champions.", sub: "Bayern 1–2 United · Barcelona.", european: true },
  { year: 2008, x: 3520, start: 482, eyebrow: "21 MAY 2008", headline: "European champions.", sub: "United 1–1 Chelsea · 6–5 pens · Moscow.", european: true },
];

function HistoricalTimeline({ frame }: { frame: number }) {
  const duration = 585;
  const opacity = sceneOpacity(frame, duration, 42);
  const travel = interpolate(frame, [18, 520], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  // Hold each authored knot near centre while its fact is legible, then travel
  // decisively to the next one. A single continuous linear pan made 1968 slide
  // off-screen before its European-Cup status had landed.
  const cameraX = interpolate(
    frame,
    [0, 78, 96, 164, 184, 274, 294, 370, 390, 452, 470, 540],
    [0, 0, 30, 30, -810, -810, -1350, -1350, -2120, -2120, -2560, -2560],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) },
  );
  const draw = lerp(0.025, 0.89, travel);
  const worldScale = lerp(1, 1.025, smoothstep(340, 520, frame));
  return (
    <AbsoluteFill style={{ opacity }}>
      <div style={{ position: "absolute", inset: 0, transform: `translateX(${cameraX}px) scale(${worldScale})`, transformOrigin: "50% 62%" }}>
        <svg width="4200" height="1080" style={{ position: "absolute", inset: 0 }}>
          <defs>
            <linearGradient id="history-filament" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor={C.red} /><stop offset="0.62" stopColor="#ff7046" /><stop offset="1" stopColor={C.gold} />
            </linearGradient>
            <filter id="history-glow" x="-10%" y="-500%" width="120%" height="1100%"><feGaussianBlur stdDeviation="11" /></filter>
          </defs>
          <path d="M 74 676 C 520 645, 960 698, 1390 660 S 2210 632, 2680 675 S 3370 632, 4040 660" fill="none" stroke={C.red} strokeWidth="28" strokeOpacity={0.16 * draw} pathLength="1" strokeDasharray="1" strokeDashoffset={1 - draw} filter="url(#history-glow)" />
          <path d="M 74 676 C 520 645, 960 698, 1390 660 S 2210 632, 2680 675 S 3370 632, 4040 660" fill="none" stroke="url(#history-filament)" strokeWidth="3.4" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - draw} />
          {TIMELINE_EVENTS.map((event) => {
            const arrived = smoothstep(event.start - 24, event.start + 8, frame);
            return (
              <g key={event.year} opacity={0.22 + arrived * 0.78}>
                {event.european && <circle cx={event.x} cy="665" r="26" fill={C.gold} fillOpacity="0.1" stroke={C.gold} strokeOpacity="0.42" />}
                <circle cx={event.x} cy="665" r={event.european ? 8 : 5.5} fill={event.european ? C.gold : C.cream} />
                <line x1={event.x} x2={event.x} y1="636" y2="700" stroke={event.european ? C.gold : C.ink} strokeOpacity="0.32" />
                <text x={event.x} y="744" textAnchor="middle" fill={event.european ? C.gold : C.faint} style={{ fontFamily: MONO, fontSize: event.european ? 23 : 18, letterSpacing: "0.08em" }}>{event.year}</text>
                {event.european && <text x={event.x} y="784" textAnchor="middle" fill={C.faint} style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, letterSpacing: "0.2em" }}>EUROPEAN CUP</text>}
              </g>
            );
          })}
        </svg>
        {TIMELINE_EVENTS.map((event) => {
          const hold = event.european ? 54 : 66;
          const show = windowed(frame, event.start - 18, event.start + 8, event.start + hold, event.start + hold + 22);
          return (
            <div key={event.year} style={{ position: "absolute", left: event.x - 235, top: 272, width: 470, textAlign: "center", opacity: show, transform: `translateY(${lerp(28, 0, show)}px)` }}>
              <div style={{ fontFamily: MONO, fontSize: 15, letterSpacing: "0.19em", color: event.european ? C.gold : C.faint }}>{event.eyebrow}</div>
              <div style={{ marginTop: 16, fontFamily: MONO, fontSize: 92, lineHeight: 0.92, letterSpacing: "-0.06em", color: C.ink }}>{event.year}</div>
              <div style={{ marginTop: 20, fontFamily: SANS, fontSize: 42, fontWeight: 600, letterSpacing: "-0.035em", color: C.ink }}>{event.headline}</div>
              <div style={{ marginTop: 10, fontFamily: SANS, fontSize: 20, color: C.dim }}>{event.sub}</div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", right: 64, bottom: 46, opacity: smoothstep(430, 510, frame), fontFamily: MONO, fontSize: 14, letterSpacing: "0.18em", color: C.faint }}>1886&nbsp;&nbsp;→&nbsp;&nbsp;2008</div>
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
  { start: 205, label: "EUROPEAN CUP", left: "1968 · WON", right: "2008 · WON", headline: "Forty years apart." },
  { start: 292, label: "THE FINAL", left: "BEST · 92′", right: "RONALDO · 25′", headline: "Both No. 7. Both scored." },
  { start: 382, label: "BALLON D’OR", left: "BEST · 1968", right: "RONALDO · 2008", headline: "Both won the Ballon d’Or." },
  { start: 474, label: "CLUB PEAK", left: "32 GOALS · 53 GAMES", right: "42 GOALS · 49 GAMES", headline: "Both peaked in their fifth United season." },
];

function RhymeLoop({ frame }: { frame: number }) {
  const duration = 630;
  const opacity = sceneOpacity(frame, duration, 42);
  const backwardDraw = smoothstep(60, 188, frame);
  const bestArrival = smoothstep(154, 215, frame);
  const ronaldoArrival = smoothstep(0, 54, frame);
  const finalFact = smoothstep(474, 548, frame);
  const baseY = 696;
  const backPath = "M 1490 696 C 1475 340, 1245 230, 980 292 C 755 220, 455 352, 430 696";
  const activeFact = [...RHYME_FACTS].reverse().find((fact) => frame >= fact.start) ?? null;
  const titleOpacity = frame < 205 ? windowed(frame, 28, 60, 168, 204) : 0;
  return (
    <AbsoluteFill style={{ opacity }}>
      <Portrait side="right" src="media/journey/cristiano-ronaldo.webp" opacity={0.31 * ronaldoArrival} />
      <Portrait side="left" src="media/journey/george-best.webp" opacity={0.31 * bestArrival} />
      <svg width="1920" height="1080" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="back-thread" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stopColor={C.gold} /><stop offset="0.42" stopColor="#ff7149" /><stop offset="1" stopColor={C.red} /></linearGradient>
          <filter id="back-glow" x="-30%" y="-80%" width="160%" height="260%"><feGaussianBlur stdDeviation="12" /></filter>
        </defs>
        <path d={`M 430 ${baseY} C 720 674, 1190 718, 1490 ${baseY}`} fill="none" stroke={C.red} strokeOpacity="0.38" strokeWidth="3" />
        {[{ year: 1968, x: 430 }, { year: 1999, x: 980 }, { year: 2008, x: 1490 }].map((item) => (
          <g key={item.year}>
            <circle cx={item.x} cy={baseY} r={item.year === 1999 ? 7 : 9} fill={item.year === 1999 ? C.gold : C.cream} />
            <text x={item.x} y={baseY + 54} textAnchor="middle" fill={item.year === 1999 ? C.gold : C.ink} style={{ fontFamily: MONO, fontSize: 29 }}>{item.year}</text>
            {item.year === 1999 && <text x={item.x} y={baseY + 84} textAnchor="middle" fill={C.faint} style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, letterSpacing: "0.18em" }}>THE THREAD WAITS</text>}
          </g>
        ))}
        <path d={backPath} fill="none" stroke={C.red} strokeWidth="32" strokeOpacity={0.17 * backwardDraw} strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - backwardDraw} filter="url(#back-glow)" />
        <path d={backPath} fill="none" stroke="url(#back-thread)" strokeWidth="4" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - backwardDraw} />
        <circle cx="430" cy={baseY} r={lerp(0, 32, bestArrival)} fill={C.gold} fillOpacity="0.18" />
        <circle cx="1490" cy={baseY} r={lerp(0, 24, ronaldoArrival)} fill={C.gold} fillOpacity="0.14" />
        <circle cx="980" cy={baseY} r={lerp(7, 30, smoothstep(560, 618, frame))} fill="none" stroke={C.gold} strokeOpacity={1 - smoothstep(590, 630, frame)} />
      </svg>

      <div style={{ position: "absolute", top: 122, insetInline: 0, textAlign: "center", opacity: titleOpacity }}>
        <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: "0.26em", color: C.dim }}>2008 REACHED</div>
        <div style={{ marginTop: 18, fontFamily: SANS, fontSize: 62, fontWeight: 600, letterSpacing: "-0.04em" }}>Then the thread loops back.</div>
      </div>

      {activeFact && (
        <div style={{ position: "absolute", top: 105, left: 570, right: 570, textAlign: "center", opacity: smoothstep(activeFact.start, activeFact.start + 26, frame), transform: `translateY(${lerp(24, 0, smoothstep(activeFact.start, activeFact.start + 26, frame))}px)` }}>
          <div style={{ fontFamily: MONO, fontSize: 15, letterSpacing: "0.25em", color: C.gold }}>{activeFact.label}</div>
          <div style={{ marginTop: 15, fontFamily: SANS, fontSize: 54, fontWeight: 600, letterSpacing: "-0.04em", color: C.ink }}>{activeFact.headline}</div>
        </div>
      )}

      <div style={{ position: "absolute", left: 210, right: 210, bottom: 90, display: "grid", gridTemplateColumns: "1fr 120px 1fr", alignItems: "center", gap: 24, opacity: smoothstep(192, 226, frame) }}>
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
  { start: 85, day: "16 MAY", place: "THE TITLE", fact: "0–1 after 26′", proof: "Cole · on 46′ · scored 48′", image: "media/journey/pl-celebration.webp" },
  { start: 195, day: "22 MAY", place: "THE CUP", fact: "United 2–0 Newcastle", proof: "Sheringham · on 9′ · scored 11′", image: "media/journey/fa-cup-lift.webp" },
  { start: 305, day: "26 MAY", place: "EUROPE", fact: "0–1 at 90′", proof: "Sheringham 90+1′ · Solskjær 90+3′", image: "media/journey/barcelona-climax.webp" },
];

function TreblePocket({ frame }: { frame: number }) {
  const duration = 540;
  const opacity = sceneOpacity(frame, duration, 40);
  const ringDraw = smoothstep(20, 420, frame);
  const active = [...TREBLE_BEATS].reverse().find((beat) => frame >= beat.start) ?? TREBLE_BEATS[0];
  const beatIndex = TREBLE_BEATS.indexOf(active);
  const land = smoothstep(414, 485, frame);
  return (
    <AbsoluteFill style={{ opacity }}>
      {TREBLE_BEATS.map((beat, index) => {
        const visible = windowed(frame, beat.start - 30, beat.start + 24, beat.start + 92, beat.start + 122);
        return (
          <div key={beat.day} style={{ position: "absolute", inset: 0, opacity: visible * 0.29, WebkitMaskImage: "radial-gradient(ellipse 72% 74% at 50% 55%,#000 18%,transparent 76%)" }}>
            <Img src={staticFile(beat.image)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: index === 2 ? "50% 42%" : "50% 40%", filter: "grayscale(1) contrast(1.22) brightness(.72)" }} />
            <AbsoluteFill style={{ background: "radial-gradient(ellipse at center,rgba(216,33,13,.55),rgba(216,33,13,.08) 62%,transparent)", mixBlendMode: "color" }} />
          </div>
        );
      })}
      <svg width="1920" height="1080" style={{ position: "absolute", inset: 0 }}>
        <defs><filter id="pocket-glow"><feGaussianBlur stdDeviation="10" /></filter></defs>
        <text x="960" y="590" textAnchor="middle" fill={C.red} opacity="0.13" style={{ fontFamily: SANS, fontSize: 430, fontWeight: 800 }}>99</text>
        <circle cx="960" cy="585" r="292" fill="none" stroke={C.red} strokeWidth="28" strokeOpacity={0.13 * ringDraw} pathLength="1" strokeDasharray="1" strokeDashoffset={1 - ringDraw} filter="url(#pocket-glow)" />
        <circle cx="960" cy="585" r="292" fill="none" stroke={C.red} strokeWidth="3.4" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - ringDraw} />
        {[
          { x: 668, y: 585 }, { x: 960, y: 877 }, { x: 1252, y: 585 },
        ].map((point, index) => {
          const arrival = smoothstep(TREBLE_BEATS[index].start, TREBLE_BEATS[index].start + 34, frame);
          return <g key={index} opacity={0.25 + arrival * 0.75}><circle cx={point.x} cy={point.y} r="20" fill={C.gold} fillOpacity="0.13" /><circle cx={point.x} cy={point.y} r="7" fill={C.gold} stroke={C.cream} /></g>;
        })}
      </svg>

      <div style={{ position: "absolute", top: 94, insetInline: 0, textAlign: "center" }}>
        <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: "0.24em", color: C.gold }}>1998–99 · ELEVEN DAYS</div>
        <div style={{ marginTop: 16, fontFamily: SANS, fontSize: 62, fontWeight: 600, letterSpacing: "-0.045em", color: C.ink }}>{frame < 82 ? "The thread opens." : frame < 414 ? "Three must-wins." : "All three, from the bench."}</div>
      </div>

      <div style={{ position: "absolute", left: 575, right: 575, top: 318, textAlign: "center", opacity: 1 - land * 0.25 }}>
        <div style={{ fontFamily: MONO, color: C.gold, fontSize: 20, letterSpacing: "0.2em" }}>{active.day}</div>
        <div style={{ marginTop: 8, fontFamily: SANS, color: C.ink, fontSize: 31, fontWeight: 600, letterSpacing: "0.08em" }}>{active.place}</div>
        <div style={{ marginTop: 42, fontFamily: MONO, color: C.ink, fontSize: 49 }}>{active.fact}</div>
        <div style={{ marginTop: 16, fontFamily: SANS, color: C.dim, fontSize: 22 }}>{active.proof}</div>
      </div>

      <div style={{ position: "absolute", left: 260, right: 260, bottom: 52, opacity: land, transform: `translateY(${lerp(22, 0, land)}px)`, textAlign: "center" }}>
        <div style={{ fontFamily: SANS, fontSize: 38, fontWeight: 600, color: C.ink }}>Three must-wins. Two from behind. All three from the bench.</div>
        <div style={{ marginTop: 12, fontFamily: MONO, fontSize: 16, letterSpacing: "0.2em", color: C.gold }}>THREE TROPHIES FOLLOWED</div>
      </div>
      <div style={{ position: "absolute", right: 72, bottom: 48, fontFamily: MONO, color: C.faint, fontSize: 13, letterSpacing: "0.16em" }}>{beatIndex + 1}&nbsp;/&nbsp;3</div>
    </AbsoluteFill>
  );
}

function FergieConstellation({ frame }: { frame: number }) {
  const duration = 510;
  const opacity = sceneOpacity(frame, duration, 40);
  const zoomOut = smoothstep(220, 358, frame);
  const constellation = smoothstep(284, 392, frame);
  const echoes = DATA.fergieEchoes;
  return (
    <AbsoluteFill style={{ opacity }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${lerp(1, 0.78, zoomOut)})`, opacity: 1 - constellation }}>
        <div style={{ position: "absolute", top: 104, insetInline: 0, textAlign: "center" }}>
          <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: "0.25em", color: C.red }}>FERGIE TIME</div>
          <div style={{ marginTop: 14, fontFamily: SANS, fontSize: 59, fontWeight: 600, letterSpacing: "-0.04em" }}>{frame < 220 ? "The same late shape." : "Three nights become a pattern."}</div>
        </div>
        <div style={{ position: "absolute", left: 220, right: 220, top: 330, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 34 }}>
          {echoes.map((echo, index) => {
            const arrival = smoothstep(34 + index * 64, 72 + index * 64, frame);
            return (
              <div key={echo.id} style={{ opacity: arrival, paddingTop: 20, borderTop: `1px solid rgba(243,237,232,${alpha(0.22 * arrival)})`, textAlign: "center", transform: `translateY(${lerp(28, 0, arrival)}px)` }}>
                <div style={{ fontFamily: MONO, fontSize: 21, color: C.red }}>{echo.date.slice(0, 4)}</div>
                <div style={{ marginTop: 12, fontFamily: SANS, fontSize: 25, fontWeight: 600, color: C.ink }}>{echo.opponent}</div>
                <div style={{ marginTop: 31, fontFamily: MONO, fontSize: 47, color: C.ink }}>0–1&nbsp;&nbsp;→&nbsp;&nbsp;2–1</div>
                <div style={{ marginTop: 18, display: "flex", justifyContent: "center", gap: 20, color: C.gold, fontFamily: MONO, fontSize: 19 }}>
                  {echo.lateGoals.map((goal) => <span key={`${goal.name}-${goal.minute}-${goal.added}`}>{displayClock(goal.minute, goal.added)}</span>)}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ position: "absolute", left: 510, right: 510, bottom: 150, display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: MONO, color: C.faint, fontSize: 14, letterSpacing: "0.16em" }}>
          <span>1993</span><span style={{ height: 1, flex: 1, margin: "0 22px", background: `linear-gradient(90deg,${C.red},${C.gold},${C.red})` }} /><span>2023</span>
        </div>
      </div>

      <svg width="1920" height="1080" style={{ position: "absolute", inset: 0, opacity: constellation }}>
        <path d={lateGoalPath} fill="rgba(255,210,120,.54)" />
        <line x1="150" x2="1770" y1="775" y2="775" stroke={C.red} strokeOpacity="0.45" />
        {[86, 90, 94, 98].map((clock) => <text key={clock} x="105" y={775 - (clock - 85) * 38 + 6} fill={C.faint} style={{ fontFamily: MONO, fontSize: 14 }}>{clock === 94 ? "90+4" : clock === 98 ? "90+8" : `${clock}′`}</text>)}
      </svg>
      <div style={{ position: "absolute", top: 100, insetInline: 0, textAlign: "center", opacity: constellation }}>
        <div style={{ fontFamily: MONO, color: C.gold, fontSize: 18, letterSpacing: "0.23em" }}>{DATA.lateGoals.length} RECORDED GOALS AFTER 85′</div>
        <div style={{ marginTop: 15, fontFamily: SANS, color: C.ink, fontSize: 56, fontWeight: 600, letterSpacing: "-0.04em" }}>The whole late-goal constellation.</div>
      </div>
      <div style={{ position: "absolute", insetInline: 0, bottom: 52, textAlign: "center", opacity: smoothstep(392, 444, frame), fontFamily: SANS, color: C.dim, fontSize: 22 }}>The phrase belongs to Ferguson. The repeating shape belongs to the record.</div>
    </AbsoluteFill>
  );
}

function Fortress({ frame }: { frame: number }) {
  const duration = 390;
  const opacity = sceneOpacity(frame, duration, 38);
  const wall = smoothstep(36, 136, frame);
  const numbers = smoothstep(122, 205, frame);
  const cracks = smoothstep(214, 292, frame);
  return (
    <AbsoluteFill style={{ opacity }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.22 * wall, WebkitMaskImage: "radial-gradient(ellipse 75% 76% at 50% 55%,#000 12%,transparent 78%)" }}>
        <Img src={staticFile("media/journey/old-trafford.webp")} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(1) contrast(1.22) brightness(.66)" }} />
        <AbsoluteFill style={{ background: "radial-gradient(ellipse at center,rgba(216,33,13,.6),rgba(216,33,13,.08) 62%,transparent)", mixBlendMode: "color" }} />
      </div>
      <svg width="1920" height="1080" style={{ position: "absolute", inset: 0 }}>
        <path d={fortressPath} fill={C.ink} fillOpacity={0.28 * wall} />
        {DATA.fortress.games.filter((game) => game.worst < 0).map((game) => {
          const index = DATA.fortress.games.findIndex((candidate) => candidate.id === game.id);
          const x = 150 + (index / Math.max(1, DATA.fortress.games.length - 1)) * 1620;
          const y = 650 + ((hash(game.id) % 7) - 3) * 28;
          return <g key={game.id} opacity={cracks}><circle cx={x} cy={y} r="20" fill={C.red} fillOpacity="0.15" /><circle cx={x} cy={y} r="8" fill={C.gold} stroke={C.cream} /></g>;
        })}
        <path d="M 290 770 L 290 475 Q 290 286 480 286 L 1440 286 Q 1630 286 1630 475 L 1630 770" fill="none" stroke={C.red} strokeOpacity={0.34 * wall} strokeWidth="2.5" />
        <path d="M 474 770 L 474 526 Q 474 394 606 394 L 1314 394 Q 1446 394 1446 526 L 1446 770" fill="none" stroke={C.ink} strokeOpacity={0.12 * wall} />
      </svg>
      <div style={{ position: "absolute", top: 92, insetInline: 0, textAlign: "center" }}>
        <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: "0.24em", color: C.red }}>OLD TRAFFORD · HOME LEAGUE</div>
        <div style={{ marginTop: 14, fontFamily: SANS, fontSize: 58, fontWeight: 600, letterSpacing: "-0.045em" }}>{frame < 122 ? "Zoom out again." : frame < 214 ? "Led at half-time." : "Only three ever fell behind."}</div>
      </div>
      <div style={{ position: "absolute", left: 290, right: 290, top: 350, display: "grid", gridTemplateColumns: "1.25fr 1fr 1fr 1fr", gap: 24, alignItems: "end", opacity: numbers }}>
        <FortressNumber value={String(DATA.fortress.games.length)} label="VERIFIABLE MATCHES" />
        <FortressNumber value={String(DATA.fortress.w)} label="WINS" />
        <FortressNumber value={String(DATA.fortress.d)} label="DRAWS" />
        <FortressNumber value="0" label="DEFEATS" accent />
      </div>
      <div style={{ position: "absolute", left: 320, right: 320, bottom: 58, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 22, opacity: cracks }}>
        {DATA.fortress.cracks.map((crack) => <div key={crack.id} style={{ paddingTop: 14, borderTop: `1px solid rgba(245,197,24,.45)`, textAlign: "center" }}><div style={{ fontFamily: MONO, color: C.gold, fontSize: 16 }}>{crack.date.slice(0, 4)}</div><div style={{ marginTop: 8, fontFamily: SANS, color: C.ink, fontSize: 20, fontWeight: 600 }}>{crack.opponent} · {crack.ft}</div><div style={{ marginTop: 6, fontFamily: SANS, color: C.faint, fontSize: 15 }}>Fell behind. Rescued.</div></div>)}
      </div>
    </AbsoluteFill>
  );
}

function FortressNumber({ value, label, accent = false }: { value: string; label: string; accent?: boolean }) {
  return <div style={{ textAlign: "center" }}><div style={{ fontFamily: MONO, fontSize: accent ? 130 : 88, lineHeight: 0.9, color: accent ? C.gold : C.ink }}>{value}</div><div style={{ marginTop: 16, fontFamily: SANS, fontSize: 14, fontWeight: 600, letterSpacing: "0.18em", color: C.faint }}>{label}</div></div>;
}

function RecordOpens({ frame }: { frame: number }) {
  const opacity = smoothstep(0, 36, frame);
  const field = smoothstep(0, 118, frame);
  const stats = windowed(frame, 72, 112, 154, 186);
  const final = smoothstep(190, 230, frame);
  return (
    <AbsoluteFill style={{ opacity }}>
      <svg width="1920" height="1080" style={{ position: "absolute", inset: 0, opacity: field * (1 - final * 0.66), transform: `scale(${lerp(1.2, 0.92, field)})`, transformOrigin: "center" }}>
        <path d={matchPaths.W} fill={C.gold} fillOpacity="0.36" />
        <path d={matchPaths.D} fill={C.draw} fillOpacity="0.28" />
        <path d={matchPaths.L} fill={C.red} fillOpacity="0.3" />
        <path d="M 105 918 C 520 885, 940 928, 1815 888" fill="none" stroke={C.red} strokeOpacity="0.68" strokeWidth="3" />
        <circle cx="1814" cy="888" r="8" fill={C.gold} />
        <path d="M 1814 888 C 1860 878, 1900 864, 1985 828" fill="none" stroke={C.red} strokeWidth="3" />
      </svg>
      <div style={{ position: "absolute", left: 290, right: 290, top: 344, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 22, opacity: stats }}>
        <ArchiveStat value={DATA.counts.matches.toLocaleString("en-GB")} label="MATCHES" />
        <ArchiveStat value={DATA.counts.events.toLocaleString("en-GB")} label="GOAL & MATCH EVENTS" />
        <ArchiveStat value={DATA.counts.lineups.toLocaleString("en-GB")} label="LINEUP ROWS" />
      </div>
      <div style={{ position: "absolute", top: 268, insetInline: 0, textAlign: "center", opacity: final, transform: `translateY(${lerp(28, 0, final)}px)` }}>
        <div style={{ fontFamily: MONO, fontSize: 16, color: C.red, letterSpacing: "0.25em" }}>THE RECORD OPENS</div>
        <div style={{ marginTop: 20, fontFamily: SANS, fontSize: 76, fontWeight: 600, letterSpacing: "-0.05em", color: C.ink }}>The line continues.</div>
        <div style={{ marginTop: 24, fontFamily: SANS, fontSize: 23, color: C.dim }}>Every match since 1886. Every claim opens into its receipt.</div>
      </div>
      <div style={{ position: "absolute", left: 74, right: 74, bottom: 46, display: "flex", justifyContent: "space-between", opacity: smoothstep(220, 262, frame), fontFamily: MONO, fontSize: 14, letterSpacing: "0.18em", color: C.faint }}>
        <span>RED THREAD · AN INDEPENDENT HISTORICAL ARCHIVE</span><span>FOLLOW THE LINE&nbsp;&nbsp;↗</span>
      </div>
    </AbsoluteFill>
  );
}

function ArchiveStat({ value, label }: { value: string; label: string }) {
  return <div style={{ paddingTop: 20, borderTop: "1px solid rgba(243,237,232,.18)", textAlign: "center" }}><div style={{ fontFamily: MONO, fontSize: 62, color: C.ink }}>{value}</div><div style={{ marginTop: 12, fontFamily: SANS, fontSize: 14, fontWeight: 600, letterSpacing: "0.2em", color: C.faint }}>{label}</div></div>;
}

export function RedThreadMasterV2() {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ color: C.ink, fontFamily: SANS }}>
      <Fonts />
      <Field energy={smoothstep(0, MASTER_DURATION_SECONDS * FPS, frame)} />
      {frame < 585 && <HistoricalTimeline frame={frame} />}
      {frame >= 510 && frame < 1140 && <RhymeLoop frame={frame - 510} />}
      {frame >= 1080 && frame < 1620 && <TreblePocket frame={frame - 1080} />}
      {frame >= 1530 && frame < 2040 && <FergieConstellation frame={frame - 1530} />}
      {frame >= 1980 && frame < 2370 && <Fortress frame={frame - 1980} />}
      {frame >= 2280 && <RecordOpens frame={frame - 2280} />}
      <FilmKicker frame={frame} />
      <Audio src={staticFile("video/audio/master-v2.wav")} volume={0.88} />
    </AbsoluteFill>
  );
}
