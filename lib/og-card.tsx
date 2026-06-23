import { ImageResponse } from "next/og";
import { getMeta } from "@/lib/queries";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

// Brand tokens, inlined: the OG renderer (Satori) has no access to the
// stylesheet's CSS custom properties, so these mirror app/globals.css.
const PITCH = "#0c0b0a";
const PANEL = "#161312";
const LINE = "#2c2522";
const INK = "#f3ede8";
const INK_DIM = "#a89c94";
const DEVIL = "#ff3b1f";

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
 * The shared evidence card: brand mark, the answer's question, its one-line
 * summary, and the trust strip. Used for the site default and for every
 * question's social card so a pasted link arrives carrying its own provenance.
 */
export function evidenceCard({
  question, summary, strip,
}: {
  question: string;
  summary: string;
  strip: string[];
}) {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: PITCH, color: INK }}>
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
            <span style={{ color: DEVIL, fontWeight: 700 }}>UNITEDSTATS</span>
            <span style={{ color: INK_DIM, marginLeft: 18 }}>MANCHESTER UNITED HISTORY</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 66, fontWeight: 800, lineHeight: 1.05, letterSpacing: -1.5 }}>
              {question}
            </div>
            <div style={{ fontSize: 28, color: INK_DIM, lineHeight: 1.35, marginTop: 28, maxWidth: 920 }}>
              {summary}
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
    { ...OG_SIZE },
  );
}
