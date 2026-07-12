/* eslint-disable @next/next/no-img-element -- ImageResponse requires native img elements. */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ReactNode } from "react";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { getMeta } from "@/lib/queries";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

export type OgMedia = {
  src: string | ArrayBuffer;
  position?: string;
  treatment?: "full" | "panel" | "texture";
};

/** Resolve only locally cached media. A missing file is an intentional fallback. */
export async function localOgMedia(src?: string | null, options: Omit<OgMedia, "src"> = {}): Promise<OgMedia | undefined> {
  if (!src || !src.startsWith("/")) return undefined;
  try {
    const path = join(process.cwd(), "public", ...src.split("/").filter(Boolean));
    const original = readFileSync(path);
    const data = path.toLowerCase().endsWith(".webp") ? await sharp(original).png().toBuffer() : original;
    return { src: Uint8Array.from(data).buffer, ...options };
  } catch {
    return undefined;
  }
}

// The site's own faces, bundled as static TTFs (Satori can't read the woff2 that
// next/font caches). Archivo is the default; Plex Mono carries the numerals, so a
// shared card's scores match the on-page `.stat-num` mono exactly. Read once per
// server process; the OG routes are `force-dynamic`, so they run in Node.
const FONT_DIR = join(process.cwd(), "assets", "og-fonts");
const font = (file: string) => readFileSync(join(FONT_DIR, file));
const OG_FONTS = [
  { name: "Archivo", data: font("archivo-400.ttf"), weight: 400 as const, style: "normal" as const },
  { name: "Archivo", data: font("archivo-600.ttf"), weight: 600 as const, style: "normal" as const },
  { name: "Archivo", data: font("archivo-800.ttf"), weight: 800 as const, style: "normal" as const },
  { name: "Plex Mono", data: font("plexmono-600.ttf"), weight: 600 as const, style: "normal" as const },
];
const MONO = "Plex Mono";

const ogOptions = (headers?: Record<string, string>) => ({
  ...OG_SIZE,
  fonts: OG_FONTS,
  ...(headers ? { headers } : {}),
});

// Brand tokens, inlined: the OG renderer (Satori) has no access to the
// stylesheet's CSS custom properties, so these mirror app/globals.css.
const PITCH = "#0c0b0a";
const PANEL_2 = "#1f1a18";
const LINE = "#2c2522";
const INK = "#f3ede8";
const INK_DIM = "#a89c94";
const INK_FAINT = "#6f645d";
const DEVIL = "#ff3b1f";
const GOLD = "#f5c518";
const WIN = "#ffd94a";
const DRAW = "#9a8d83";
const LOSS = "#a52218";

function OgBrand() {
  return (
    <span style={{ display: "flex", fontWeight: 700 }}>
      <span style={{ color: DEVIL }}>RED</span>
      <span style={{ color: INK, marginLeft: 8 }}>THREAD</span>
    </span>
  );
}

export type TrustItem = { lead: string; detail: string };

/** The evidence promise every card carries: scale, honesty, inspectability. */
export function trustStrip(): TrustItem[] {
  const meta = getMeta();
  const matches = Number(meta.matches);
  return [
    { lead: `${Number.isFinite(matches) ? matches.toLocaleString("en-GB") : meta.matches} matches`, detail: "checked" },
    { lead: "Gaps shown", detail: "never hidden" },
    { lead: "Open data", detail: "you can inspect" },
  ];
}

function OgTrustStrip({ items, dark = false }: { items: TrustItem[]; dark?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", background: dark ? "rgba(12,11,10,.82)" : "transparent", padding: dark ? "12px 16px" : 0, borderRadius: dark ? 8 : 0 }}>
      <span style={{ color: DEVIL, fontFamily: MONO, fontSize: 16, letterSpacing: 2, marginRight: 22 }}>EVIDENCE</span>
      {items.map((item, index) => (
        <div key={item.lead} style={{ display: "flex", alignItems: "baseline" }}>
          {index > 0 && <span style={{ color: LINE, fontSize: 22, margin: "0 18px" }}>•</span>}
          <span style={{ color: INK, fontSize: 21, fontWeight: 600 }}>{item.lead}</span>
          <span style={{ color: INK_DIM, fontSize: 20, marginLeft: 7 }}>{item.detail}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * The shared card frame: brand mark + eyebrow, a dominant title, a one-line
 * subtitle, and the trust strip — so a pasted link always arrives carrying its
 * own provenance. `headers` is forwarded to the response for the on-demand
 * entity cards (the static question/default cards leave it unset).
 */
function renderCard(
  { eyebrow, title, subtitle, strip }: {
    eyebrow: string;
    title: string;
    subtitle: string;
    strip: TrustItem[];
  },
  headers?: Record<string, string>,
) {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: PITCH, color: INK, fontFamily: "Archivo" }}>
        <div style={{ width: 16, height: "100%", background: DEVIL }} />
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "64px 72px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", fontSize: 26, letterSpacing: 4 }}>
            <OgBrand />
            <span style={{ color: INK_DIM, marginLeft: 18 }}>{eyebrow}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 66, fontWeight: 800, lineHeight: 1.05, letterSpacing: -1.5 }}>
              {title}
            </div>
            <div style={{ fontSize: 28, color: INK_DIM, lineHeight: 1.35, marginTop: 28, maxWidth: 920 }}>
              {subtitle}
            </div>
          </div>
          <OgTrustStrip items={strip} />
        </div>
      </div>
    ),
    ogOptions(headers),
  );
}

/** A question's social card: the headline question over its one-line summary. */
export function evidenceCard(
  { question, summary, strip }: {
    question: string;
    summary: string;
    strip: TrustItem[];
  },
  headers?: Record<string, string>,
) {
  return renderCard({ eyebrow: "MANCHESTER UNITED HISTORY", title: question, subtitle: summary, strip }, headers);
}

/** An entity's social card (match, player, manager, opponent, season). */
export function entityCard(
  props: { eyebrow: string; title: string; subtitle: string; strip: TrustItem[] },
  headers?: Record<string, string>,
) {
  return renderCard(props, headers);
}

/** A single goal as a point on the match's minute axis. `side` colours the dot —
 *  United gold, opponent grey — so the run of play reads as a shape. */
export type MatchGoal = { minute: number; addedTime: number; side: "united" | "opponent" };

/** The goal-minute timeline: a 0→full-time axis with a dot per goal, United gold
 *  and opponent grey, ticks at half- and full-time. A late flurry crammed past the
 *  90' tick (the treble final's two stoppage-time goals) reads instantly; an early
 *  concession sits alone on the left. The shape carries the drama the scoreline hides. */
function goalStrip(goals: MatchGoal[]) {
  const W = Q_WIDTH;
  const dotR = 11;
  const inner = W - dotR * 2;
  const lastEff = Math.max(90, ...goals.map((g) => g.minute + (g.addedTime ?? 0)));
  const domain = lastEff <= 90 ? 98 : lastEff + 6; // headroom past the last goal
  const at = (min: number) => Math.round((min / domain) * inner) + dotR;
  const x = (g: MatchGoal) => at(g.minute + Math.min(g.addedTime ?? 0, 7) * 0.7);
  return (
    <div style={{ display: "flex", flexDirection: "column", width: W }}>
      <div style={{ position: "relative", display: "flex", width: W, height: 52 }}>
        <div style={{ position: "absolute", left: 0, top: 25, width: W, height: 2, background: LINE }} />
        {[45, 90].map((m) => (
          <div key={m} style={{ position: "absolute", left: at(m), top: 16, width: 2, height: 20, background: LINE }} />
        ))}
        {goals.map((g, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x(g) - dotR,
              top: 15,
              width: dotR * 2,
              height: dotR * 2,
              borderRadius: dotR,
              background: g.side === "united" ? GOLD : DRAW,
              border: `3px solid ${PITCH}`,
            }}
          />
        ))}
      </div>
      <div style={{ position: "relative", display: "flex", width: W, height: 26, fontSize: 19, color: INK_FAINT }}>
        <span style={{ position: "absolute", left: 0 }}>Kick-off</span>
        <span style={{ position: "absolute", left: at(45) - 12 }}>HT</span>
        <span style={{ position: "absolute", left: at(90) - 64 }}>Full time</span>
      </div>
    </div>
  );
}

/**
 * A match's social card: the scoreline coloured by outcome, the matchup, and the
 * goals drawn as a minute-timeline — so the record's drama (a stoppage-time
 * flurry, an early concession) arrives as a *shape*, not a flat scoreline. When no
 * goal events are recorded (older matches), the strip is dropped and a context
 * line (venue, half-time) carries the slot instead.
 */
export function matchCard(
  {
    eyebrow, home, away, score, outcome, date, goals, footnote, strip, media,
  }: {
    eyebrow: string;
    home: string;
    away: string;
    score: string;
    outcome: "W" | "D" | "L";
    date: string;
    goals: MatchGoal[];
    footnote?: string;
    strip: TrustItem[];
    media?: OgMedia;
  },
  headers?: Record<string, string>,
) {
  const scoreColor = outcome === "W" ? WIN : outcome === "L" ? DEVIL : DRAW;
  const name = (text: string, align: "flex-end" | "flex-start") => (
    <div style={{ display: "flex", width: 396, justifyContent: align, overflow: "hidden" }}>
      <span style={{ fontSize: 40, color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{text}</span>
    </div>
  );
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: PITCH, color: INK, fontFamily: "Archivo" }}>
        <div style={{ width: 16, height: "100%", background: DEVIL }} />
        {media && <div style={{ position: "absolute", right: 0, top: 0, width: 650, height: 630, display: "flex", overflow: "hidden" }}>
          {/* @ts-expect-error ImageResponse supports local image ArrayBuffers. */}
          <img src={media.src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: media.position ?? "50% 50%" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, #0c0b0a 0%, rgba(12,11,10,.88) 34%, rgba(12,11,10,.34) 100%)" }} />
        </div>}
        {media && <div style={{ position: "absolute", left: 16, top: 0, width: 535, height: 630, background: PITCH }} />}
        <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "58px 72px" }}>
          <div style={{ display: "flex", alignItems: "center", fontSize: 26, letterSpacing: 4 }}>
            <OgBrand />
            <span style={{ color: INK_DIM, marginLeft: 18 }}>{eyebrow}</span>
            <span style={{ color: INK_FAINT, marginLeft: "auto", letterSpacing: 0, fontSize: 24 }}>{date}</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              {name(home, "flex-end")}
              <span style={{ fontFamily: MONO, fontSize: 86, fontWeight: 600, letterSpacing: -2, color: scoreColor, margin: "0 30px", lineHeight: 1 }}>{score}</span>
              {name(away, "flex-start")}
            </div>
            {footnote && (
              <div style={{ display: "flex", justifyContent: "center", marginTop: 14, fontSize: 23, color: INK_DIM }}>{footnote}</div>
            )}
            {goals.length > 0 && <div style={{ display: "flex", marginTop: 40 }}>{goalStrip(goals)}</div>}
          </div>

          <OgTrustStrip items={strip} dark={!!media} />
        </div>
      </div>
    ),
    ogOptions(headers),
  );
}

/** Cinematic authored story card: full-canvas archive media with one concrete claim. */
export function storyCard(
  { chapter, title, claim, marker, media, strip }: { chapter: string; title: string; claim: string; marker: string; media: OgMedia; strip: TrustItem[] },
  headers?: Record<string, string>,
) {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: PITCH, color: INK, fontFamily: "Archivo", overflow: "hidden" }}>
      {/* @ts-expect-error ImageResponse supports local image ArrayBuffers. */}
      <img src={media.src} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: media.position ?? "50% 50%" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(12,11,10,.98) 0%, rgba(12,11,10,.9) 42%, rgba(12,11,10,.22) 78%, rgba(12,11,10,.38) 100%)" }} />
      <div style={{ position: "absolute", left: 16, top: 0, width: 730, height: 630, background: "rgba(12,11,10,.76)" }} />
      <div style={{ position: "absolute", left: 0, top: 0, width: 16, height: 630, background: DEVIL }} />
      <div style={{ position: "relative", width: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "56px 72px 54px 88px" }}>
        <div style={{ display: "flex", alignItems: "center", fontSize: 26, letterSpacing: 4 }}><div style={{ display: "flex", width: 220 }}><OgBrand /></div><span style={{ color: INK_DIM, marginLeft: 14 }}>STORY / {chapter}</span></div>
        <div style={{ display: "flex", flexDirection: "column", width: 690 }}>
          <span style={{ color: DEVIL, fontFamily: MONO, fontSize: 25, letterSpacing: 2 }}>{marker}</span>
          <span style={{ fontSize: 70, fontWeight: 800, lineHeight: 1.02, letterSpacing: -2, marginTop: 14 }}>{title}</span>
          <span style={{ fontSize: 28, color: INK_DIM, lineHeight: 1.3, marginTop: 22 }}>{claim}</span>
        </div>
        <OgTrustStrip items={strip} dark />
      </div>
    </div>,
    ogOptions(headers),
  );
}

/** Stable collection identity card: one archive promise, without implying a single record. */
export function collectionCard(
  { eyebrow, title, marker, description, strip }: { eyebrow: string; title: string; marker: string; description: string; strip: TrustItem[] },
) {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", overflow: "hidden", background: PITCH, color: INK, fontFamily: "Archivo" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 16, height: 630, background: DEVIL }} />
      <div style={{ position: "absolute", right: -100, top: -170, width: 610, height: 860, border: `2px solid ${LINE}`, transform: "rotate(18deg)" }} />
      <div style={{ position: "absolute", right: 80, top: 0, width: 2, height: 630, background: LINE }} />
      <div style={{ position: "absolute", right: 178, top: 0, width: 2, height: 630, background: LINE }} />
      <div style={{ position: "absolute", right: 276, top: 0, width: 2, height: 630, background: LINE }} />
      <div style={{ position: "relative", display: "flex", width: "100%", flexDirection: "column", justifyContent: "space-between", padding: "58px 72px 54px 88px" }}>
        <div style={{ display: "flex", alignItems: "center", fontSize: 26, letterSpacing: 4 }}><OgBrand /><span style={{ color: INK_DIM, marginLeft: 18 }}>{eyebrow}</span></div>
        <div style={{ display: "flex", flexDirection: "column", width: 780 }}>
          <span style={{ color: DEVIL, fontFamily: MONO, fontSize: 23, letterSpacing: 2 }}>{marker}</span>
          <span style={{ fontSize: 76, fontWeight: 800, lineHeight: 1, letterSpacing: -2, marginTop: 15 }}>{title}</span>
          <span style={{ color: INK_DIM, fontSize: 29, lineHeight: 1.3, marginTop: 24 }}>{description}</span>
        </div>
        <OgTrustStrip items={strip} />
      </div>
    </div>,
    ogOptions(),
  );
}

// --- Entity cards: name + one figure + a shape that echoes the page's hero -----

const CLUB_FOUNDED = 1878;

/** A season as a diverging skyline: wins as gold bars above the midline, losses as
 *  red below, draws as grey ticks on the line — the same idiom as the on-page
 *  `ResultSpine`. The shape of a season (a relentless gold wall, a ragged struggle)
 *  reads before any number. */
function seasonSpine(results: ("W" | "D" | "L")[]) {
  const W = Q_WIDTH;
  const n = results.length || 1;
  const gap = n > 50 ? 3 : n > 30 ? 5 : 8;
  const cellW = Math.max(4, Math.floor((W - (n - 1) * gap) / n));
  const half = 34;
  const barH = 27;
  return (
    <div style={{ position: "relative", display: "flex", width: W, height: half * 2 }}>
      <div style={{ position: "absolute", left: 0, top: half - 1, width: W, height: 2, background: LINE }} />
      {results.map((r, i) => {
        const left = i * (cellW + gap);
        if (r === "D") {
          return <div key={i} style={{ position: "absolute", left, top: half - 4, width: cellW, height: 8, background: DRAW, borderRadius: 2 }} />;
        }
        const win = r === "W";
        return (
          <div
            key={i}
            style={{ position: "absolute", left, top: win ? half - barH : half, width: cellW, height: barH, background: win ? WIN : LOSS, borderRadius: win ? "3px 3px 0 0" : "0 0 3px 3px" }}
          />
        );
      })}
    </div>
  );
}

/** A career/reign as a gold span on the club's full timeline (founding → today),
 *  the same `CareerSpanBar` idiom the register and managers list use — so the card
 *  shows *when* at a glance, the figure shows *how much*. */
function careerBar(firstYear: number, lastYear: number) {
  const W = Q_WIDTH;
  const end = new Date().getFullYear();
  const span = Math.max(1, end - CLUB_FOUNDED);
  const at = (y: number) => Math.round(((Math.max(CLUB_FOUNDED, Math.min(end, y)) - CLUB_FOUNDED) / span) * W);
  const left = at(firstYear);
  const right = Math.max(left + 6, at(lastYear));
  return (
    <div style={{ display: "flex", flexDirection: "column", width: W }}>
      <div style={{ position: "relative", display: "flex", width: W, height: 30 }}>
        <div style={{ position: "absolute", left: 0, top: 9, width: W, height: 12, background: PANEL_2, borderRadius: 6 }} />
        <div style={{ position: "absolute", left, top: 9, width: right - left, height: 12, background: GOLD, borderRadius: 6 }} />
      </div>
      <div style={{ position: "relative", display: "flex", width: W, height: 24, fontSize: 20, color: INK_FAINT }}>
        <span style={{ position: "absolute", left: 0 }}>{CLUB_FOUNDED}</span>
        <span style={{ position: "absolute", left: Math.min(W - 110, Math.max(0, left)), color: GOLD }}>{firstYear}–{lastYear}</span>
        <span style={{ position: "absolute", right: 0 }}>{end}</span>
      </div>
    </div>
  );
}

/** The shared entity-card frame: brand + eyebrow, the name, one mono figure with a
 *  gloss, and a shape underneath. The structural sibling of `questionCard`, so every
 *  surface's unfurl reads as one family. */
function renderStatCard(
  {
    eyebrow, title, contextRight, figure, figureLabel, accent = "gold", shape, strip, media,
  }: {
    eyebrow: string;
    title: string;
    contextRight?: string;
    figure: string;
    figureLabel: string;
    accent?: "gold" | "devil" | "ink";
    shape: ReactNode;
    strip: TrustItem[];
    media?: OgMedia;
  },
  headers?: Record<string, string>,
) {
  const acc = accent === "devil" ? DEVIL : accent === "ink" ? INK : GOLD;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: PITCH, color: INK, fontFamily: "Archivo" }}>
        <div style={{ width: 16, height: "100%", background: DEVIL }} />
        {media && <div style={{ position: "absolute", right: 0, top: 0, width: 460, height: 630, display: "flex", overflow: "hidden" }}>
          {/* @ts-expect-error ImageResponse supports local image ArrayBuffers. */}
          <img src={media.src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: media.position ?? "50% 35%" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, #0c0b0a 0%, rgba(12,11,10,.72) 20%, rgba(12,11,10,.08) 66%, rgba(12,11,10,.28) 100%)" }} />
        </div>}
        <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "58px 72px" }}>
          <div style={{ display: "flex", alignItems: "center", fontSize: 26, letterSpacing: 4 }}>
            <OgBrand />
            <span style={{ color: INK_DIM, marginLeft: 18 }}>{eyebrow}</span>
            {contextRight && <span style={{ color: INK_FAINT, marginLeft: "auto", letterSpacing: 0, fontSize: 24 }}>{contextRight}</span>}
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", width: media ? 690 : Q_WIDTH, overflow: "hidden" }}>
              <span style={{ fontSize: media ? 58 : 62, fontWeight: 800, letterSpacing: -1.5, color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {title}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", marginTop: 16 }}>
              <span style={{ fontFamily: MONO, fontSize: 60, fontWeight: 600, letterSpacing: -1, color: acc }}>{figure}</span>
              <span style={{ fontSize: 26, color: INK_DIM, marginLeft: 20, lineHeight: 1.3, maxWidth: 760 }}>{figureLabel}</span>
            </div>
            <div style={{ display: "flex", marginTop: 38 }}>{shape}</div>
          </div>

          <OgTrustStrip items={strip} dark={!!media} />
        </div>
      </div>
    ),
    ogOptions(headers),
  );
}

const winPct = (w: number, p: number) => `${Math.round((100 * w) / (p || 1))}%`;

/** A manager's card: their record drawn as a W-D-L conviction bar, win % as the figure. */
export function managerCard(
  { name, role, p, w, d, l, era, strip, media }: { name: string; role: string; p: number; w: number; d: number; l: number; era?: string; strip: TrustItem[]; media?: OgMedia },
  headers?: Record<string, string>,
) {
  return renderStatCard(
    {
      eyebrow: role.toUpperCase(),
      title: name,
      contextRight: era,
      figure: winPct(w, p),
      figureLabel: `won · ${p.toLocaleString("en-GB")} matches in charge`,
      shape: vizWdl(w, d, l),
      strip,
      media,
    },
    headers,
  );
}

/** A head-to-head card: the all-time record as a conviction bar, win % as the figure. */
export function opponentCard(
  { name, p, w, d, l, since, strip }: { name: string; p: number; w: number; d: number; l: number; since?: string; strip: TrustItem[] },
  headers?: Record<string, string>,
) {
  return renderStatCard(
    {
      eyebrow: "HEAD TO HEAD",
      title: `United v ${name}`,
      contextRight: since,
      figure: winPct(w, p),
      figureLabel: `United wins · ${p.toLocaleString("en-GB")} meetings`,
      accent: w >= l ? "gold" : "devil",
      shape: vizWdl(w, d, l),
      strip,
    },
    headers,
  );
}

/** A season's card: the season drawn as a diverging result spine, win % as the figure. */
export function seasonCard(
  { season, results, w, d, l, strip }: { season: string; results: ("W" | "D" | "L")[]; w: number; d: number; l: number; strip: TrustItem[] },
  headers?: Record<string, string>,
) {
  return renderStatCard(
    {
      eyebrow: "SEASON",
      title: `United ${season}`,
      figure: winPct(w, results.length),
      figureLabel: `won · ${w}W ${d}D ${l}L across ${results.length} matches`,
      shape: seasonSpine(results),
      strip,
    },
    headers,
  );
}

/** A player's card: their years drawn as a career span on the club timeline, goals as the figure. */
export function playerCard(
  { name, position, goals, apps, firstYear, lastYear, strip, media }: { name: string; position?: string; goals: number; apps: number; firstYear: number; lastYear: number; strip: TrustItem[]; media?: OgMedia },
  headers?: Record<string, string>,
) {
  return renderStatCard(
    {
      eyebrow: (position ?? "Player").toUpperCase(),
      title: name,
      figure: goals.toLocaleString("en-GB"),
      figureLabel: `goals · ${apps.toLocaleString("en-GB")} appearances`,
      shape: careerBar(firstYear, lastYear),
      strip,
      media,
    },
    headers,
  );
}

// --- Question cards: a tested question, its verdict, and the answer drawn -----
// The content width inside the spine + 72px padding.
const Q_WIDTH = 1040;

/** The per-question answer visual. `columns` for a distribution (late-goal share
 *  by decade), `rows` for a ranked comparison (bogey sides, cup leans, the own-
 *  goal leaderboard), `wdl` for a single conviction bar (the Old Trafford record). */
export type QuestionVisual =
  | { kind: "columns"; bars: { label: string; value: number; base?: number; highlight?: boolean }[] }
  | { kind: "rows"; bars: { label: string; value: number; valueText: string; highlight?: boolean }[] }
  | { kind: "wdl"; w: number; d: number; l: number };

/** Decade columns. When a bar carries `base`, it is drawn as two stacked segments —
 *  a `base` floor in the accent and a `value - base` cap in devil-red — so a split
 *  total (regulation minutes vs stoppage time) reads as a flat base with a growing
 *  cap rather than one height. Plain bars (no `base`) keep the single-segment look. */
function vizColumns(bars: { label: string; value: number; base?: number; highlight?: boolean }[], acc: string, muted: string) {
  const gap = 10;
  const colW = Math.floor((Q_WIDTH - (bars.length - 1) * gap) / bars.length);
  const h = 156;
  const max = Math.max(...bars.map((b) => b.value), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap }}>
      {bars.map((b, i) => {
        const totalH = Math.max(6, Math.round((b.value / max) * h));
        const baseH = b.base != null && b.value > 0 ? Math.round((Math.min(b.base, b.value) / b.value) * totalH) : totalH;
        const capH = totalH - baseH;
        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: colW }}>
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", height: h }}>
              {capH > 0 && <div style={{ width: colW, height: capH, background: DEVIL, borderRadius: "5px 5px 0 0" }} />}
              <div style={{ width: colW, height: baseH, background: b.base != null ? acc : b.highlight ? acc : muted, borderRadius: capH > 0 ? 0 : "5px 5px 0 0" }} />
            </div>
            <span style={{ fontSize: 18, marginTop: 10, color: b.highlight ? INK : INK_FAINT }}>{b.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function vizRows(bars: { label: string; value: number; valueText: string; highlight?: boolean }[], acc: string, muted: string) {
  const labelW = 300, valueW = 80, gap = 16;
  const trackW = Q_WIDTH - labelW - valueW - gap * 2;
  const max = Math.max(...bars.map((b) => b.value), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", width: Q_WIDTH, gap: 12 }}>
      {bars.map((b, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", width: labelW, overflow: "hidden" }}>
            <span style={{ fontSize: 23, fontWeight: b.highlight ? 700 : 400, color: b.highlight ? INK : INK_DIM, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {b.label}
            </span>
          </div>
          <div style={{ display: "flex", width: trackW, marginLeft: gap, alignItems: "center" }}>
            <div style={{ height: 24, width: Math.max(8, Math.round((b.value / max) * trackW)), background: b.highlight ? acc : muted, borderRadius: 5 }} />
          </div>
          <span style={{ width: valueW, marginLeft: gap, textAlign: "right", fontSize: 23, fontWeight: 700, color: b.highlight ? acc : INK_DIM }}>
            {b.valueText}
          </span>
        </div>
      ))}
    </div>
  );
}

function vizWdl(w: number, d: number, l: number) {
  const total = Math.max(w + d + l, 1);
  const seg = (n: number) => Math.round((n / total) * Q_WIDTH);
  return (
    <div style={{ display: "flex", flexDirection: "column", width: Q_WIDTH }}>
      <div style={{ display: "flex", width: Q_WIDTH, height: 46, borderRadius: 8, overflow: "hidden" }}>
        {w > 0 && <div style={{ width: seg(w), height: 46, background: WIN }} />}
        {d > 0 && <div style={{ width: seg(d), height: 46, background: DRAW }} />}
        {l > 0 && <div style={{ width: seg(l), height: 46, background: LOSS }} />}
      </div>
      <div style={{ display: "flex", marginTop: 14, fontSize: 24 }}>
        <span style={{ color: WIN, fontWeight: 700 }}>Won {w}</span>
        <span style={{ color: INK_FAINT, margin: "0 14px" }}>·</span>
        <span style={{ color: DRAW, fontWeight: 700 }}>Drew {d}</span>
        <span style={{ color: INK_FAINT, margin: "0 14px" }}>·</span>
        <span style={{ color: l > 0 ? LOSS : INK_FAINT, fontWeight: 700 }}>Lost {l}</span>
      </div>
    </div>
  );
}

/**
 * A tested-question card: the question as the headline, a one-figure verdict, and
 * the answer drawn as a small chart — bars, a ranked ladder, or a conviction bar —
 * so the pasted link carries the finding, not just the question. `accent` tints
 * the figure and the standout mark (gold for a positive read, red for a negative).
 */
export function questionCard(
  {
    question, figure, gloss, visual, strip, accent = "gold", media,
  }: {
    question: string;
    figure: string;
    gloss: string;
    visual: QuestionVisual;
    strip: TrustItem[];
    accent?: "gold" | "devil";
    media?: OgMedia;
  },
  headers?: Record<string, string>,
) {
  const acc = accent === "devil" ? DEVIL : GOLD;
  const muted = accent === "devil" ? "rgba(255,59,31,0.30)" : "rgba(245,197,24,0.30)";
  const body =
    visual.kind === "columns" ? vizColumns(visual.bars, acc, muted)
    : visual.kind === "rows" ? vizRows(visual.bars, acc, muted)
    : vizWdl(visual.w, visual.d, visual.l);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: PITCH, color: INK, fontFamily: "Archivo" }}>
        <div style={{ width: 16, height: "100%", background: DEVIL }} />
        {media && <div style={{ position: "absolute", right: 0, top: 0, width: 520, height: 630, display: "flex", overflow: "hidden" }}>
          {/* @ts-expect-error ImageResponse supports local image ArrayBuffers. */}
          <img src={media.src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: media.position ?? "50% 50%" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, #0c0b0a 0%, rgba(12,11,10,.84) 28%, rgba(12,11,10,.2) 72%, rgba(12,11,10,.38) 100%)" }} />
        </div>}
        <div
          style={{
            position: "relative",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "54px 72px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", fontSize: 26, letterSpacing: 4 }}>
            <OgBrand />
            <span style={{ color: INK_DIM, marginLeft: 18 }}>TESTED AGAINST THE RECORD</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 46, fontWeight: 800, lineHeight: 1.05, letterSpacing: -1, maxWidth: Q_WIDTH }}>
              {question}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", marginTop: 16 }}>
              <span style={{ fontFamily: MONO, fontSize: 60, fontWeight: 600, letterSpacing: -1, color: acc }}>{figure}</span>
              <span style={{ fontSize: 26, color: INK_DIM, marginLeft: 20, lineHeight: 1.3, maxWidth: 760 }}>{gloss}</span>
            </div>
            <div style={{ display: "flex", marginTop: 30 }}>{body}</div>
          </div>

          <OgTrustStrip items={strip} dark={!!media} />
        </div>
      </div>
    ),
    ogOptions(headers),
  );
}
