import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getMeta } from "@/lib/queries";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

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
const PANEL = "#161312";
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

/** The trust strip every card carries: scale, coverage honesty, openness. */
export function trustStrip(): string[] {
  const meta = getMeta();
  const matches = Number(meta.matches);
  return [
    `${Number.isFinite(matches) ? matches.toLocaleString("en-GB") : meta.matches} matches`,
    "coverage shown",
    "open dataset",
  ];
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
    strip: string[];
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
          <div style={{ display: "flex" }}>
            {strip.map((chip) => (
              <div
                key={chip}
                style={{
                  display: "flex",
                  alignItems: "center",
                  border: `1px solid ${LINE}`,
                  background: PANEL,
                  borderRadius: 10,
                  padding: "12px 22px",
                  marginRight: 16,
                  fontSize: 24,
                  color: INK,
                }}
              >
                {chip}
              </div>
            ))}
          </div>
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
    strip: string[];
  },
  headers?: Record<string, string>,
) {
  return renderCard({ eyebrow: "MANCHESTER UNITED HISTORY", title: question, subtitle: summary, strip }, headers);
}

/** An entity's social card (match, player, manager, opponent, season). */
export function entityCard(
  props: { eyebrow: string; title: string; subtitle: string; strip: string[] },
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
    eyebrow, home, away, score, outcome, date, goals, footnote, strip,
  }: {
    eyebrow: string;
    home: string;
    away: string;
    score: string;
    outcome: "W" | "D" | "L";
    date: string;
    goals: MatchGoal[];
    footnote?: string;
    strip: string[];
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
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "58px 72px" }}>
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

          <div style={{ display: "flex" }}>
            {strip.map((chip) => (
              <div
                key={chip}
                style={{
                  display: "flex", alignItems: "center", border: `1px solid ${LINE}`, background: PANEL,
                  borderRadius: 10, padding: "12px 22px", marginRight: 16, fontSize: 24, color: INK,
                }}
              >
                {chip}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    ogOptions(headers),
  );
}

/** A single moved record, shown as a figure-over-label stat tile. `tone` colours
 *  the figure: a gain reads gold, a loss reads red, anything neutral stays ink. */
export type DigestTile = { figure: string; label: string; tone: "up" | "down" | "neutral" };

const tileColor = (tone: DigestTile["tone"]) => (tone === "up" ? GOLD : tone === "down" ? DEVIL : INK);

/**
 * The history-changed card, built to show the *finding*, not just name it: the
 * match as a result strip (score coloured by outcome), the single biggest change
 * as the headline, and the records it moved as a row of stat tiles — the same
 * figure-over-label idiom the site uses, so a pasted link reads as data.
 */
export function digestCard(
  {
    date, headline, result, tiles, strip,
  }: {
    date: string;
    headline: string;
    result: { team: string; score: string; opponent: string; meta: string; outcome: "W" | "D" | "L" };
    tiles: DigestTile[];
    strip: string[];
  },
  headers?: Record<string, string>,
) {
  const scoreColor = result.outcome === "W" ? WIN : result.outcome === "L" ? DEVIL : DRAW;
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
            padding: "58px 72px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", fontSize: 26, letterSpacing: 4 }}>
            <OgBrand />
            <span style={{ color: INK_DIM, marginLeft: 18 }}>HISTORY CHANGED</span>
            <span style={{ color: INK_FAINT, marginLeft: "auto", letterSpacing: 0, fontSize: 24 }}>{date}</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", fontSize: 30 }}>
              <span style={{ color: INK_DIM }}>{result.team}</span>
              <span style={{ fontFamily: MONO, color: scoreColor, fontWeight: 600, margin: "0 16px", fontSize: 38, letterSpacing: -1 }}>
                {result.score}
              </span>
              <span style={{ color: INK }}>{result.opponent}</span>
              <span style={{ color: INK_FAINT, marginLeft: 18, fontSize: 23 }}>{result.meta}</span>
            </div>
            <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.05, letterSpacing: -1.5, marginTop: 20, maxWidth: 1000 }}>
              {headline}
            </div>
            {tiles.length > 0 && (
              <div style={{ display: "flex", marginTop: 36 }}>
                {tiles.map((tile) => (
                  <div
                    key={tile.label}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      border: `1px solid ${LINE}`,
                      background: PANEL_2,
                      borderRadius: 14,
                      padding: "18px 26px",
                      marginRight: 18,
                    }}
                  >
                    <span style={{ fontFamily: MONO, fontSize: 46, fontWeight: 600, letterSpacing: -1, color: tileColor(tile.tone) }}>
                      {tile.figure}
                    </span>
                    <span style={{ fontSize: 20, color: INK_DIM, marginTop: 8, letterSpacing: 1, textTransform: "uppercase" }}>
                      {tile.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "flex" }}>
            {strip.map((chip) => (
              <div
                key={chip}
                style={{
                  display: "flex",
                  alignItems: "center",
                  border: `1px solid ${LINE}`,
                  background: PANEL,
                  borderRadius: 10,
                  padding: "12px 22px",
                  marginRight: 16,
                  fontSize: 24,
                  color: INK,
                }}
              >
                {chip}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    ogOptions(headers),
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
    question, figure, gloss, visual, strip, accent = "gold",
  }: {
    question: string;
    figure: string;
    gloss: string;
    visual: QuestionVisual;
    strip: string[];
    accent?: "gold" | "devil";
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
        <div
          style={{
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

          <div style={{ display: "flex" }}>
            {strip.map((chip) => (
              <div
                key={chip}
                style={{
                  display: "flex",
                  alignItems: "center",
                  border: `1px solid ${LINE}`,
                  background: PANEL,
                  borderRadius: 10,
                  padding: "12px 22px",
                  marginRight: 16,
                  fontSize: 24,
                  color: INK,
                }}
              >
                {chip}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    ogOptions(headers),
  );
}
