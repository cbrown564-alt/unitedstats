import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { LOOP_PROTOTYPE } from "./film-data";
import { clamp01, lerp, smoothstep, windowed } from "./math";

const COLORS = {
  pitch: "#0c0b0a",
  ink: "#f3ede8",
  inkDim: "#a89c94",
  inkFaint: "#6f645d",
  red: "#ff3b1f",
  gold: "#f5c518",
  cream: "#fff4d4",
};

const FONT_SANS = "ArchivoVideo, Arial, sans-serif";
const FONT_MONO = "PlexVideo, Consolas, monospace";

function buildLoopPath(leftX: number, rightX: number, y: number, radius: number): string {
  const centerX = 960;
  const centerY = 548;
  const neckY = centerY - radius;
  const bottomY = neckY + radius * 2;
  const bow = lerp(42, 12, clamp01(radius / 250));
  return (
    `M ${leftX.toFixed(1)} ${y.toFixed(1)} ` +
    `C ${lerp(leftX, centerX, 0.34).toFixed(1)} ${(y - bow).toFixed(1)} ` +
    `${lerp(centerX, leftX, 0.42).toFixed(1)} ${(neckY + bow * 0.35).toFixed(1)} ${centerX} ${neckY.toFixed(1)} ` +
    `A ${radius.toFixed(1)} ${radius.toFixed(1)} 0 0 1 ${centerX} ${bottomY.toFixed(1)} ` +
    `A ${radius.toFixed(1)} ${radius.toFixed(1)} 0 0 1 ${centerX} ${neckY.toFixed(1)} ` +
    `C ${lerp(centerX, rightX, 0.42).toFixed(1)} ${(neckY + bow * 0.35).toFixed(1)} ` +
    `${lerp(rightX, centerX, 0.34).toFixed(1)} ${(y - bow).toFixed(1)} ${rightX.toFixed(1)} ${y.toFixed(1)}`
  );
}

function FontFaces() {
  return (
    <style>{`
      @font-face {
        font-family: ArchivoVideo;
        src: url('${staticFile("video/fonts/archivo-400.ttf")}') format('truetype');
        font-style: normal;
        font-weight: 400;
      }
      @font-face {
        font-family: ArchivoVideo;
        src: url('${staticFile("video/fonts/archivo-600.ttf")}') format('truetype');
        font-style: normal;
        font-weight: 600;
      }
      @font-face {
        font-family: ArchivoVideo;
        src: url('${staticFile("video/fonts/archivo-800.ttf")}') format('truetype');
        font-style: normal;
        font-weight: 800;
      }
      @font-face {
        font-family: PlexVideo;
        src: url('${staticFile("video/fonts/plexmono-600.ttf")}') format('truetype');
        font-style: normal;
        font-weight: 600;
      }
      * { box-sizing: border-box; }
    `}</style>
  );
}

function FloodlitField({ energy }: { energy: number }) {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.pitch, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: [
            `radial-gradient(78% 68% at 50% 42%, rgba(216,33,13,${0.1 + energy * 0.17}), transparent 70%)`,
            "radial-gradient(110% 76% at 50% -18%, rgba(255,232,204,0.13), transparent 53%)",
            "linear-gradient(180deg, #100b09 0%, #160906 49%, #0d0a09 100%)",
          ].join(","),
        }}
      />
      <AbsoluteFill
        style={{
          background: "radial-gradient(105% 115% at 50% 54%, transparent 36%, rgba(0,0,0,0.84) 100%)",
        }}
      />
      <svg width="1920" height="1080" style={{ position: "absolute", inset: 0, opacity: 0.09 }} aria-hidden>
        <filter id="film-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.88" numOctaves="2" seed="17" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="1920" height="1080" filter="url(#film-grain)" opacity="0.28" />
      </svg>
    </AbsoluteFill>
  );
}

function Kicker({ frame }: { frame: number }) {
  const opacity = smoothstep(3, 18, frame) * (1 - smoothstep(345, 382, frame));
  return (
    <div
      style={{
        position: "absolute",
        left: 86,
        top: 62,
        display: "flex",
        alignItems: "center",
        gap: 18,
        opacity,
        fontFamily: FONT_MONO,
        fontSize: 17,
        fontWeight: 600,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        color: COLORS.inkFaint,
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: 99, background: COLORS.red, boxShadow: `0 0 18px ${COLORS.red}` }} />
      Red Thread&nbsp;&nbsp;/&nbsp;&nbsp;The line through time
    </div>
  );
}

function ArchiveRun({ frame }: { frame: number }) {
  const opacity = 1 - smoothstep(142, 176, frame);
  const draw = smoothstep(6, 116, frame);
  const cameraX = interpolate(frame, [0, 136], [0, -170], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const cameraScale = interpolate(frame, [0, 136], [1, 1.09], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.quad),
  });
  const p1909 = windowed(frame, 28, 39, 63, 74);
  const p1954 = windowed(frame, 72, 84, 112, 126);
  const speed = smoothstep(102, 146, frame);

  const ticks = [1886, 1892, 1909, 1911, 1948, 1954, 1958, 1968];
  const tickXs = [118, 240, 530, 635, 1000, 1160, 1320, 1584];

  return (
    <AbsoluteFill style={{ opacity, transform: `translateX(${cameraX}px) scale(${cameraScale})`, transformOrigin: "50% 58%" }}>
      <svg width="2100" height="1080" style={{ position: "absolute", inset: 0 }} aria-hidden>
        <defs>
          <linearGradient id="archive-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={COLORS.red} stopOpacity="0.72" />
            <stop offset="0.55" stopColor="#ff7046" />
            <stop offset="1" stopColor={COLORS.gold} />
          </linearGradient>
          <filter id="archive-soft" x="-10%" y="-500%" width="120%" height="1100%">
            <feGaussianBlur stdDeviation="10" />
          </filter>
        </defs>
        <path
          d="M 84 624 C 330 608, 410 638, 610 616 S 980 585, 1180 620 S 1510 647, 1770 606 S 1990 595, 2080 614"
          fill="none"
          stroke={COLORS.red}
          strokeWidth="24"
          strokeOpacity={0.18 * draw}
          pathLength="1"
          strokeDasharray="1"
          strokeDashoffset={1 - draw}
          filter="url(#archive-soft)"
        />
        <path
          d="M 84 624 C 330 608, 410 638, 610 616 S 980 585, 1180 620 S 1510 647, 1770 606 S 1990 595, 2080 614"
          fill="none"
          stroke="url(#archive-line)"
          strokeWidth="3.2"
          strokeLinecap="round"
          pathLength="1"
          strokeDasharray="1"
          strokeDashoffset={1 - draw}
        />
        {ticks.map((year, index) => {
          const arrival = smoothstep(12 + index * 11, 24 + index * 11, frame);
          return (
            <g key={year} opacity={0.2 + arrival * 0.8}>
              <line x1={tickXs[index]} x2={tickXs[index]} y1="602" y2="648" stroke={COLORS.ink} strokeOpacity="0.24" />
              <circle cx={tickXs[index]} cy="621" r={year === 1909 || year === 1954 ? 6.5 : 3.4} fill={year === 1909 || year === 1954 ? COLORS.gold : COLORS.cream} />
              <text x={tickXs[index]} y="688" textAnchor="middle" fill={COLORS.inkFaint} style={{ fontFamily: FONT_MONO, fontSize: 19, letterSpacing: "0.08em" }}>
                {year}
              </text>
            </g>
          );
        })}
        {Array.from({ length: 28 }).map((_, index) => {
          const x = 1080 + index * 41;
          return (
            <line
              key={x}
              x1={x}
              x2={x + 56 * speed}
              y1={456 + ((index * 73) % 330)}
              y2={456 + ((index * 73) % 330)}
              stroke={index % 5 === 0 ? COLORS.gold : COLORS.red}
              strokeOpacity={speed * (index % 5 === 0 ? 0.34 : 0.15)}
              strokeWidth={index % 5 === 0 ? 2 : 1}
            />
          );
        })}
      </svg>

      <div style={{ position: "absolute", left: 112, top: 486, opacity: windowed(frame, 0, 12, 40, 55) }}>
        <div style={{ fontFamily: FONT_MONO, fontSize: 20, color: COLORS.red, letterSpacing: "0.18em" }}>1886</div>
        <div style={{ marginTop: 12, fontFamily: FONT_SANS, fontSize: 48, fontWeight: 600, color: COLORS.ink }}>One match.</div>
      </div>

      <ArchiveCallout
        opacity={p1909}
        x={500}
        eyebrow="24 APRIL 1909"
        year="1909"
        line="Bristol City 0–1 United"
        fact="First FA Cup."
      />
      <ArchiveCallout
        opacity={p1954}
        x={1090}
        eyebrow="16 OCTOBER 1954"
        year="1954"
        line="Chelsea 5–6 United"
        fact="Eleven goals."
      />
    </AbsoluteFill>
  );
}

function ArchiveCallout({
  opacity,
  x,
  eyebrow,
  year,
  line,
  fact,
}: {
  opacity: number;
  x: number;
  eyebrow: string;
  year: string;
  line: string;
  fact: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: 280,
        width: 460,
        opacity,
        transform: `translateY(${lerp(32, 0, opacity)}px)`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14, fontFamily: FONT_MONO, color: COLORS.inkFaint, fontSize: 15, letterSpacing: "0.18em" }}>
        <span style={{ width: 64, height: 1, background: COLORS.red }} />
        {eyebrow}
      </div>
      <div style={{ marginTop: 18, fontFamily: FONT_MONO, fontSize: 102, lineHeight: 0.9, color: COLORS.ink, letterSpacing: "-0.06em" }}>{year}</div>
      <div style={{ marginTop: 24, fontFamily: FONT_SANS, fontSize: 23, color: COLORS.inkDim }}>{line}</div>
      <div style={{ marginTop: 6, fontFamily: FONT_SANS, fontSize: 37, fontWeight: 600, color: COLORS.ink }}>{fact}</div>
    </div>
  );
}

function PortraitMonument({
  side,
  src,
  opacity,
  travel,
}: {
  side: "left" | "right";
  src: string;
  opacity: number;
  travel: number;
}) {
  const left = side === "left";
  return (
    <div
      style={{
        position: "absolute",
        insetBlock: 90,
        [left ? "left" : "right"]: -35,
        width: 780,
        opacity,
        transform: `translateX(${left ? -travel : travel}px) scale(1.02)`,
        WebkitMaskImage: left
          ? "linear-gradient(to right, black 0%, black 42%, transparent 94%), linear-gradient(to top, transparent 0%, black 31%, black 72%, transparent 100%)"
          : "linear-gradient(to left, black 0%, black 42%, transparent 94%), linear-gradient(to top, transparent 0%, black 31%, black 72%, transparent 100%)",
        maskComposite: "intersect",
      }}
    >
      <Img
        src={staticFile(src)}
        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: left ? "52% 34%" : "48% 34%", filter: "grayscale(1) contrast(1.22) brightness(0.82)" }}
      />
      <AbsoluteFill
        style={{
          background: left
            ? "linear-gradient(to right, rgba(216,33,13,0.7), rgba(216,33,13,0.18) 56%, transparent)"
            : "linear-gradient(to left, rgba(216,33,13,0.7), rgba(216,33,13,0.18) 56%, transparent)",
          mixBlendMode: "color",
        }}
      />
    </div>
  );
}

function RhymeStage({ frame }: { frame: number }) {
  const enter = smoothstep(122, 166, frame);
  const collapse = smoothstep(238, 326, frame);
  const land = smoothstep(312, 356, frame);
  const finalHold = smoothstep(350, 384, frame);
  const portraitOpacity = enter * lerp(0.12, 0.34, smoothstep(160, 224, frame)) * (1 - land * 0.14);
  const portraitTravel = lerp(52, 0, smoothstep(132, 210, frame));
  const yearOpacity = enter * (1 - smoothstep(264, 326, frame));
  const leftX = lerp(422, 886, collapse);
  const rightX = lerp(1498, 1034, collapse);
  const knotY = lerp(638, 572, collapse);
  const radius = lerp(238, 54, collapse);
  const path = buildLoopPath(leftX, rightX, knotY, radius);
  const loopDraw = lerp(0.08, 1, smoothstep(156, 316, frame));
  const sevenOpacity = enter * lerp(0.035, 0.16, smoothstep(190, 342, frame));
  const gapCopy = windowed(frame, 158, 176, 226, 252);
  const pairCopy = windowed(frame, 222, 246, 304, 330);
  const landCopy = smoothstep(322, 360, frame);

  return (
    <AbsoluteFill style={{ opacity: enter }}>
      <PortraitMonument side="left" src={LOOP_PROTOTYPE.rhyme.left.image} opacity={portraitOpacity} travel={portraitTravel} />
      <PortraitMonument side="right" src={LOOP_PROTOTYPE.rhyme.right.image} opacity={portraitOpacity} travel={portraitTravel} />

      <div style={{ position: "absolute", insetInline: 0, top: 118, textAlign: "center" }}>
        <div
          style={{
            opacity: gapCopy,
            transform: `translateY(${lerp(24, 0, gapCopy)}px)`,
            fontFamily: FONT_MONO,
            fontSize: 18,
            fontWeight: 600,
            letterSpacing: "0.28em",
            color: COLORS.inkDim,
          }}
        >
          FORTY YEARS APART
        </div>
        <div
          style={{
            position: "absolute",
            insetInline: 0,
            top: 24,
            opacity: pairCopy,
            transform: `translateY(${lerp(26, 0, pairCopy)}px)`,
            fontFamily: FONT_SANS,
            fontSize: 58,
            fontWeight: 600,
            letterSpacing: "-0.035em",
            color: COLORS.ink,
          }}
        >
          Two No. 7s.
        </div>
        <div
          style={{
            position: "absolute",
            insetInline: 0,
            top: 10,
            opacity: landCopy,
            transform: `translateY(${lerp(24, 0, landCopy)}px)`,
            fontFamily: FONT_SANS,
            fontSize: 67,
            fontWeight: 600,
            letterSpacing: "-0.045em",
            color: COLORS.ink,
          }}
        >
          The same red seven.
        </div>
      </div>

      <svg width="1920" height="1080" style={{ position: "absolute", inset: 0 }} aria-hidden>
        <defs>
          <linearGradient id="loop-filament" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={COLORS.red} stopOpacity="0.9" />
            <stop offset="0.36" stopColor="#ff7149" />
            <stop offset="0.5" stopColor="#ffd29b" />
            <stop offset="0.64" stopColor="#ff7149" />
            <stop offset="1" stopColor={COLORS.red} stopOpacity="0.9" />
          </linearGradient>
          <filter id="loop-soft" x="-30%" y="-60%" width="160%" height="220%">
            <feGaussianBlur stdDeviation="13" />
          </filter>
          <filter id="gold-glow" x="-400%" y="-400%" width="900%" height="900%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
        </defs>

        <text
          x="960"
          y="566"
          textAnchor="middle"
          dominantBaseline="central"
          fill={COLORS.red}
          opacity={sevenOpacity}
          style={{ fontFamily: FONT_SANS, fontSize: 470, fontWeight: 800, letterSpacing: "-0.08em" }}
        >
          7
        </text>

        <path d={path} fill="none" stroke={COLORS.red} strokeWidth="34" strokeOpacity={0.18 * loopDraw} strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - loopDraw} filter="url(#loop-soft)" />
        <path d={path} fill="none" stroke={COLORS.red} strokeWidth="9" strokeOpacity={0.48 * loopDraw} strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - loopDraw} style={{ filter: "blur(3px)" }} />
        <path d={path} fill="none" stroke="url(#loop-filament)" strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - loopDraw} />

        {[
          { x: leftX, year: 1968, name: "BEST" },
          { x: rightX, year: 2008, name: "RONALDO" },
        ].map((item) => (
          <g key={item.year} opacity={yearOpacity}>
            <text x={item.x} y={knotY - 28} textAnchor="middle" dominantBaseline="central" fill={COLORS.ink} style={{ fontFamily: FONT_MONO, fontSize: 150, fontWeight: 600, letterSpacing: "-0.08em" }}>
              {item.year}
            </text>
            <text x={item.x} y={knotY + 93} textAnchor="middle" fill={COLORS.inkDim} style={{ fontFamily: FONT_SANS, fontSize: 25, fontWeight: 600, letterSpacing: "0.22em" }}>
              {item.name}
            </text>
          </g>
        ))}

        {[leftX, rightX].map((x) => (
          <g key={x} opacity={0.4 + loopDraw * 0.6}>
            <circle cx={x} cy={knotY} r="26" fill={COLORS.cream} fillOpacity="0.08" filter="url(#gold-glow)" />
            <circle cx={x} cy={knotY} r="13" fill="none" stroke={COLORS.cream} strokeOpacity="0.64" strokeWidth="1.3" />
            <circle cx={x} cy={knotY} r="3.2" fill={COLORS.cream} />
          </g>
        ))}

        <g opacity={land}>
          <circle cx="960" cy="548" r={lerp(10, 28, land)} fill={COLORS.gold} fillOpacity="0.22" filter="url(#gold-glow)" />
          <circle cx="960" cy="548" r={lerp(5, 10, land)} fill={COLORS.gold} stroke={COLORS.cream} strokeWidth="1.3" />
          <circle cx="960" cy="548" r={lerp(8, 42, smoothstep(330, 382, frame))} fill="none" stroke={COLORS.gold} strokeOpacity={1 - smoothstep(350, 394, frame)} strokeWidth="1.6" />
        </g>
      </svg>

      <EvidenceReceipts progress={finalHold} />
    </AbsoluteFill>
  );
}

function EvidenceReceipts({ progress }: { progress: number }) {
  const left = LOOP_PROTOTYPE.rhyme.left;
  const right = LOOP_PROTOTYPE.rhyme.right;
  const rise = lerp(34, 0, progress);
  return (
    <div
      style={{
        position: "absolute",
        left: 210,
        right: 210,
        bottom: 82,
        display: "grid",
        gridTemplateColumns: "1fr 116px 1fr",
        alignItems: "end",
        gap: 30,
        opacity: progress,
        transform: `translateY(${rise}px)`,
      }}
    >
      <Receipt side="left" year={left.year} name={left.familyName} minute={left.finalGoal} detail={`${left.finalLabel} · ${left.finalOpponent} ${left.finalScore}`} />
      <div style={{ paddingBottom: 34, textAlign: "center", fontFamily: FONT_MONO, color: COLORS.gold, fontSize: 17, letterSpacing: "0.2em" }}>SCORED</div>
      <Receipt side="right" year={right.year} name={right.familyName} minute={right.finalGoal} detail={`${right.finalLabel} · ${right.finalOpponent} ${right.finalScore}`} />
    </div>
  );
}

function Receipt({
  side,
  year,
  name,
  minute,
  detail,
}: {
  side: "left" | "right";
  year: number;
  name: string;
  minute: string;
  detail: string;
}) {
  const align = side === "left" ? "right" : "left";
  return (
    <div style={{ borderTop: "1px solid rgba(243,237,232,0.2)", paddingTop: 18, textAlign: align }}>
      <div style={{ display: "flex", justifyContent: side === "left" ? "flex-end" : "flex-start", alignItems: "baseline", gap: 18 }}>
        <span style={{ fontFamily: FONT_MONO, fontSize: 17, color: COLORS.red, letterSpacing: "0.14em" }}>{year}</span>
        <span style={{ fontFamily: FONT_SANS, fontSize: 37, fontWeight: 600, color: COLORS.ink, letterSpacing: "-0.025em" }}>{name}</span>
        <span style={{ fontFamily: FONT_MONO, fontSize: 31, color: COLORS.gold }}>{minute}</span>
      </div>
      <div style={{ marginTop: 8, fontFamily: FONT_SANS, fontSize: 17, color: COLORS.inkFaint }}>{detail}</div>
    </div>
  );
}

function EndFrame({ frame }: { frame: number }) {
  const progress = smoothstep(390, 414, frame);
  return (
    <div
      style={{
        position: "absolute",
        right: 74,
        top: 60,
        opacity: progress,
        fontFamily: FONT_MONO,
        fontSize: 15,
        letterSpacing: "0.18em",
        color: COLORS.inkFaint,
        textTransform: "uppercase",
      }}
    >
      Every claim opens into the record&nbsp;&nbsp;↗
    </div>
  );
}

export function RedThreadLoopPrototype() {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const energy = smoothstep(0, 0.82, frame / durationInFrames);

  return (
    <AbsoluteFill style={{ color: COLORS.ink, fontFamily: FONT_SANS }}>
      <FontFaces />
      <FloodlitField energy={energy} />
      <ArchiveRun frame={frame} />
      <RhymeStage frame={frame} />
      <Kicker frame={frame} />
      <EndFrame frame={frame} />
      <Audio src={staticFile("video/audio/loop-prototype.wav")} volume={0.88} />
    </AbsoluteFill>
  );
}
