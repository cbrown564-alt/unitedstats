"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

/**
 * The full-bleed Explore feature-strip carousel (Answering and Asking). The slides are server-rendered (they
 * carry DB-backed signature visuals) and passed straight through as `children`;
 * this client wrapper only adds the scroll mechanics — desktop prev/next arrows
 * and edge fades that appear once there is more strip in that direction.
 *
 * Core browsing stays the zero-JS CSS scroll-snap of the server version: swipe and
 * trackpad still work with JS off; the arrows are a progressive enhancement for a
 * mouse, translucent and revealed on hover so they never sit on top of the answer.
 */
export function FeatureCarousel({ children, label }: { children: ReactNode; label: string }) {
  const ref = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ atStart: true, atEnd: false });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    // Scroll-snap rests the first card at the container's left padding, not 0, so
    // "at start" is measured against that resting offset rather than zero.
    const restLeft = el.querySelector("li")?.offsetLeft ?? 0;
    const max = el.scrollWidth - el.clientWidth;
    setEdges({ atStart: el.scrollLeft <= restLeft + 1, atEnd: el.scrollLeft >= max - 1 });
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  const scrollByCard = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const card = el.querySelector("li");
    const step = card ? card.clientWidth + 16 /* gap-4 */ : el.clientWidth * 0.9;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <div className="group relative -mx-4 sm:-mx-6">
      <ul
        ref={ref}
        aria-label={label}
        onScroll={measure}
        className="scrollbar-none flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:px-6"
      >
        {children}
      </ul>

      {/* Edge fades — only on the side that still has strip to reach. */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 left-0 hidden w-12 bg-gradient-to-r from-pitch to-transparent transition-opacity sm:block ${
          edges.atStart ? "opacity-0" : "opacity-100"
        }`}
      />
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 right-0 hidden w-12 bg-gradient-to-l from-pitch to-transparent transition-opacity sm:block ${
          edges.atEnd ? "opacity-0" : "opacity-100"
        }`}
      />

      <EdgeArrow side="left" hidden={edges.atStart} onClick={() => scrollByCard(-1)} />
      <EdgeArrow side="right" hidden={edges.atEnd} onClick={() => scrollByCard(1)} />
    </div>
  );
}

function EdgeArrow({
  side,
  hidden,
  onClick,
}: {
  side: "left" | "right";
  hidden: boolean;
  onClick: () => void;
}) {
  const left = side === "left";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={left ? "Previous question" : "Next question"}
      tabIndex={hidden ? -1 : 0}
      className={[
        "absolute top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full",
        "border border-line bg-panel/70 text-ink-dim backdrop-blur transition-all",
        "hover:bg-panel hover:text-ink focus-ring lg:flex",
        left ? "left-2" : "right-2",
        // Translucent until the strip is hovered, then revealed; gone at the edge.
        hidden ? "pointer-events-none opacity-0" : "opacity-40 group-hover:opacity-100",
      ].join(" ")}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
        <polyline points={left ? "15 18 9 12 15 6" : "9 18 15 12 9 6"} />
      </svg>
    </button>
  );
}
