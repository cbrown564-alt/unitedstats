import { useId, type ReactNode } from "react";

/*
 * Thread-glyph primitives. Every glyph in the set is built from these marks:
 * a red thread (T), the pale record it runs through (P), and beads (B) where a
 * fact is proven. Colours and weight come from --tg-* custom properties in
 * app/thread.css so the same glyph can sit quietly in a nav rail or light up
 * when active. See docs/GLYPHS.md for the grammar.
 */

type BeadKind = "b" | "br" | "bp" | "bo" | "fw" | "fd" | "fl";

/** The red thread. Solid threads carry pathLength so hosts can sew them in. */
export function T({ d, st, fine, opacity }: { d: string; st?: boolean; fine?: boolean; opacity?: number }) {
  const cls = ["tg-t", st && "tg-st", fine && "tg-fb"].filter(Boolean).join(" ");
  return <path className={cls} d={d} pathLength={st ? undefined : 1} opacity={opacity} />;
}

/** The pale record: frames, ticks and the other strands a thread crosses. */
export function P({ d, dashed, fine, butt }: { d: string; dashed?: boolean; fine?: boolean; butt?: boolean }) {
  const cls = ["tg-p", dashed && "tg-pd", fine && "tg-fb", butt && "tg-pb"].filter(Boolean).join(" ");
  return <path className={cls} d={d} />;
}

/** A bead. Gold (b) is reserved for something proven. */
export function B({ cx, cy, r, kind = "b" }: { cx: number; cy: number; r: number; kind?: BeadKind }) {
  return <circle className={`tg-${kind}`} cx={cx} cy={cy} r={r} />;
}

/**
 * Over-under without a halo colour: `children` pass beneath `over`, which is
 * cut out of them with a mask, so crossings read on any ground (including the
 * sidebar's translucent glass).
 */
export function Under({ over, butt, children }: { over: string; butt?: boolean; children: ReactNode }) {
  const id = `tg${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <>
      <mask id={id} maskUnits="userSpaceOnUse" x="-2" y="-2" width="28" height="28">
        <rect x="-2" y="-2" width="28" height="28" fill="#fff" />
        <path className={butt ? "tg-cut tg-cut-b" : "tg-cut"} d={over} />
      </mask>
      <g mask={`url(#${id})`}>{children}</g>
    </>
  );
}

export function GlyphSvg({
  size = 20,
  className,
  children,
  label,
}: {
  size?: number;
  className?: string;
  children: ReactNode;
  label?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={["tg", className].filter(Boolean).join(" ")}
      aria-hidden={label ? undefined : true}
      role={label ? "img" : undefined}
      aria-label={label}
    >
      {children}
    </svg>
  );
}
