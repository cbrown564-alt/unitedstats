import { useId, type ReactNode } from "react";

/*
 * First-generation thread primitives: a red thread (T) and the pale record it
 * runs through (P). The icons now use Cord (components/glyphs/cord/); these
 * remain for the coverage weave. Colour and weight come from --tg-* custom
 * properties in app/thread.css. See docs/GLYPHS.md for the grammar.
 */

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
