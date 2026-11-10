import { useId, type CSSProperties, type ReactNode } from "react";

/*
 * Cord primitives: the second-generation thread grammar (docs/GLYPHS.md, "Cord").
 *
 * The first set drew everything as hairline outline. On the lifted charcoal
 * canvas that read thin and fussy, so cord glyphs carry mass instead:
 *
 *   Plate  — a tonal fill: the record, the thing being described.
 *   Cord   — one weighted, continuous red thread per glyph. It is the part that
 *            moves: it sews in, carries a needle head, pulls taut.
 *   Strand — a secondary pale line, used sparingly.
 *   Bead   — a fact. Gold is still reserved for proof.
 *
 * Weight is optically sized: small glyphs get a heavier cord, large ones a
 * finer one, so a 16px nav icon and a 160px specimen read as the same object.
 */

export type CordBeadKind = "gold" | "thread" | "pale" | "hollow" | "w" | "d" | "l";

/** Stroke width in 24-unit space for a glyph rendered at `size` px. */
export function opticalStroke(size: number, unit = 24): number {
  const px = (size * 24) / unit;
  const sw = 2.15 * Math.pow(20 / px, 0.42);
  return Math.round(Math.min(2.7, Math.max(0.9, sw)) * 100) / 100;
}

export function Plate({ d, strong }: { d: string; strong?: boolean }) {
  return <path className={strong ? "cd-plate cd-plate--strong" : "cd-plate"} d={d} />;
}

/**
 * The cord. Solid cords carry pathLength so they can sew in, and render a
 * hidden twin that becomes the needle head (a dot riding the path) in motion.
 * `pull` is the taut shape the cord straightens to on hover, with the same
 * command structure as `d` so it can interpolate.
 */
export function Cord({ d, pull, dashed, fine }: { d: string; pull?: string; dashed?: boolean; fine?: boolean }) {
  const cls = ["cd-cord", dashed && "cd-cord--dashed", fine && "cd-fine"].filter(Boolean).join(" ");
  const style = pull ? ({ "--cd-pull": `path("${pull}")` } as CSSProperties) : undefined;
  if (dashed) return <path className={cls} d={d} />;
  return (
    <>
      <path className={cls} d={d} pathLength={1} style={style} data-pull={pull ? "" : undefined} />
      {!pull && <path className="cd-head" d={d} pathLength={1} />}
    </>
  );
}

export function Strand({ d, dashed, fine }: { d: string; dashed?: boolean; fine?: boolean }) {
  const cls = ["cd-strand", dashed && "cd-strand--dashed", fine && "cd-fine"].filter(Boolean).join(" ");
  return <path className={cls} d={d} />;
}

/** A bead. `i` staggers it in a tally; `t` (0–1) times it against a played cord. */
export function Bead({
  cx,
  cy,
  r,
  kind = "gold",
  i,
  t,
  dx,
}: {
  cx: number;
  cy: number;
  r: number;
  kind?: CordBeadKind;
  i?: number;
  t?: number;
  dx?: number;
}) {
  const style: Record<string, string | number> = {};
  if (i !== undefined) style["--i"] = i;
  if (t !== undefined) style["--t"] = t;
  if (dx !== undefined) style["--dx"] = `${dx}px`;
  return <circle className={`cd-b cd-b--${kind}`} cx={cx} cy={cy} r={r} style={style as CSSProperties} />;
}

/**
 * Over-under: `children` pass beneath `over`, cut out with a mask so the
 * crossing reads on any ground, including translucent glass.
 */
export function Beneath({ over, children, box = 24 }: { over: string; children: ReactNode; box?: number }) {
  const id = `cd${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <>
      <mask id={id} maskUnits="userSpaceOnUse" x={-4} y={-4} width={box + 8} height={box + 8}>
        <rect x={-4} y={-4} width={box + 8} height={box + 8} fill="#fff" />
        <path className="cd-cut" d={over} />
      </mask>
      <g mask={`url(#${id})`}>{children}</g>
    </>
  );
}

export function CordSvg({
  size = 20,
  className,
  children,
  label,
  motion,
  viewBox = "0 0 24 24",
  unit = 24,
  width,
  height,
  style,
}: {
  size?: number;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  label?: string;
  /** Signature motion this glyph runs when its host is hovered (cord.css). */
  motion?: CordMotion;
  viewBox?: string;
  /** Units per `size` px, for non-square data glyphs. */
  unit?: number;
  width?: number;
  height?: number;
}) {
  return (
    <svg
      width={width ?? size}
      height={height ?? size}
      viewBox={viewBox}
      className={["cd", className].filter(Boolean).join(" ")}
      style={{ "--cd-sw": opticalStroke(size, unit), ...style } as CSSProperties}
      data-motion={motion}
      aria-hidden={label ? undefined : true}
      role={label ? "img" : undefined}
      aria-label={label}
    >
      {children}
    </svg>
  );
}

/** The named motions in app/cord.css. Every glyph sews; these add a signature. */
export type CordMotion = "run" | "pull" | "slide" | "knot" | "unravel" | "orbit";
