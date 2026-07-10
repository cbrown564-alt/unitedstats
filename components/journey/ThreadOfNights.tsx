"use client";

import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";

type Knot = { id: string; side: "left" | "right" };

type Node = Knot & { x: number; y: number; stitchX: number };

type Geometry = { height: number; nodes: Node[] };

type Point = { x: number; y: number };

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/** A restrained Catmull-Rom spline through the authored receipt seams. */
function threadPath(points: readonly Point[]): string {
  const first = points[0];
  if (!first) return "";
  if (points.length === 1) return `M ${first.x} ${first.y}`;

  let path = `M ${first.x} ${first.y}`;
  const pull = 0.72 / 6;
  for (let index = 0; index < points.length - 1; index++) {
    const previous = points[index - 1] ?? points[index];
    const current = points[index];
    const next = points[index + 1];
    const after = points[index + 2] ?? next;
    const c1x = current.x + (next.x - previous.x) * pull;
    const c1y = current.y + (next.y - previous.y) * pull;
    const c2x = next.x - (after.x - current.x) * pull;
    const c2y = next.y - (after.y - current.y) * pull;
    path += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${next.x} ${next.y}`;
  }
  return path;
}

/**
 * The B-story's single continuous filament. It measures the real positions of
 * its document stations, so one SVG can travel down the entire story even when a
 * receipt grows on a narrow viewport. On desktop it sweeps from the history line
 * into alternating evidence stations; on mobile it becomes one left-gutter line.
 */
export function ThreadOfNights({ knots, children }: { knots: readonly Knot[]; children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [geometry, setGeometry] = useState<Geometry>({ height: 1, nodes: [] });
  const [progress, setProgress] = useState(0);
  const [reduced, setReduced] = useState(false);

  useLayoutEffect(() => {
    document.documentElement.dataset.chrome = "off";
    return () => {
      delete document.documentElement.dataset.chrome;
    };
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const measure = () => {
      const rootRect = root.getBoundingClientRect();
      const mobile = window.innerWidth < 640;
      const toViewX = (x: number) => ((x - rootRect.left) / Math.max(1, rootRect.width)) * 1000;
      const nodes = knots.flatMap((knot) => {
        const seam = root.querySelector<HTMLElement>(`[data-thread-stitch="${knot.id}"]`);
        if (!seam) return [];
        const rect = seam.getBoundingClientRect();
        const stitchX = toViewX(mobile ? rect.left : knot.side === "left" ? rect.right : rect.left);
        return [{
          ...knot,
          // Desktop thread travels through each receipt's inner seam. On phone,
          // the continuous line stays in the gutter and a short tack reaches the slip.
          x: mobile ? 84 : stitchX,
          stitchX,
          y: rect.top - rootRect.top + 48,
        }];
      });
      setGeometry({ height: Math.max(1, root.scrollHeight), nodes });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    // The server-rendered station slot can be committed just after this client
    // boundary's first layout pass. Re-measure on that commit instead of falling
    // back to the start→end path for the whole visit.
    const mutations = new MutationObserver(measure);
    mutations.observe(root, { childList: true, subtree: true });
    const nextFrame = requestAnimationFrame(measure);
    const retry = window.setTimeout(measure, 80);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      mutations.disconnect();
      cancelAnimationFrame(nextFrame);
      window.clearTimeout(retry);
      window.removeEventListener("resize", measure);
    };
  }, [knots]);

  useEffect(() => {
    if (reduced) {
      return;
    }
    const root = rootRef.current;
    if (!root) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = root.getBoundingClientRect();
      setProgress(clamp01((window.innerHeight - rect.top) / (rect.height + window.innerHeight * 0.15)));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [reduced]);

  const mobile = geometry.nodes.length > 0 && geometry.nodes[0]?.x === 84;
  const start = { x: mobile ? 84 : 72, y: 112 };
  const end = { x: mobile ? 84 : 928, y: geometry.height - 72 };
  const path = threadPath([start, ...geometry.nodes, end]);

  const draw = reduced ? 1 : Math.max(0.025, progress);

  return (
    <div ref={rootRef} className="journey-floodlit full-bleed-viewport relative isolate overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(105%_22%_at_50%_0%,rgba(255,232,204,0.1),transparent_60%)]" aria-hidden />
      <svg
        className="pointer-events-none absolute left-0 top-0 z-[1] w-full"
        style={{ height: geometry.height }}
        viewBox={`0 0 1000 ${geometry.height}`}
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <linearGradient id="nights-filament" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgb(255 59 31)" stopOpacity="0.82" />
            <stop offset="45%" stopColor="rgb(255 112 71)" stopOpacity="0.98" />
            <stop offset="57%" stopColor="rgb(255 210 120)" stopOpacity="1" />
            <stop offset="100%" stopColor="rgb(255 59 31)" stopOpacity="0.86" />
          </linearGradient>
          <filter id="nights-thread-soft" x="-60%" y="-4%" width="220%" height="108%"><feGaussianBlur stdDeviation="9" /></filter>
          <filter id="nights-knot-glow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="8" /></filter>
        </defs>
        <path d={path} fill="none" stroke="rgb(255 59 31)" strokeOpacity="0.1" strokeWidth="10" filter="url(#nights-thread-soft)" />
        <path d={path} fill="none" stroke="rgb(255 105 72)" strokeOpacity="0.16" strokeWidth="1.5" />
        <path d={path} fill="none" stroke="url(#nights-filament)" strokeWidth="2.45" strokeLinecap="round" strokeLinejoin="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - draw} />
        {geometry.nodes.map((node) => {
          const arrival = reduced ? 1 : smoothstep(node.y / geometry.height - 0.075, node.y / geometry.height + 0.02, progress);
          return (
            <g key={node.id} opacity={0.34 + arrival * 0.66}>
              {mobile && (
                <>
                  <path d={`M ${node.x} ${node.y} C ${node.x + 18} ${node.y - 5}, ${node.stitchX - 18} ${node.y + 5}, ${node.stitchX} ${node.y}`} fill="none" stroke="rgb(255 105 72)" strokeOpacity="0.34" strokeWidth="5" filter="url(#nights-thread-soft)" />
                  <path d={`M ${node.x} ${node.y} C ${node.x + 18} ${node.y - 5}, ${node.stitchX - 18} ${node.y + 5}, ${node.stitchX} ${node.y}`} fill="none" stroke="url(#nights-filament)" strokeWidth="1.8" strokeLinecap="round" />
                </>
              )}
              <circle cx={node.x} cy={node.y} r={22} fill="rgb(255 59 31)" fillOpacity={0.18 * arrival} filter="url(#nights-knot-glow)" />
              <circle cx={node.x} cy={node.y} r={7} fill="none" stroke="rgb(255 210 120)" strokeOpacity={0.45 + arrival * 0.4} strokeWidth="1.15" />
              <circle cx={node.x} cy={node.y} r={3.5} fill="rgb(255 210 120)" />
            </g>
          );
        })}
      </svg>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
