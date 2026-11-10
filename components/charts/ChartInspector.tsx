"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from "react";

/** Tooltip content for one inspected datum. All strings, so it serializes cheaply. */
type ChartTip = {
  title: string;
  value?: string;
  /** Right-aligned beside `value`, e.g. "1.84 pts/game". */
  aside?: string;
  /** Movement or change line in the accent colour. */
  accent?: string;
  meta?: string;
  /** Multi-series rows (career duel). */
  rows?: { name: string; color: string; value: string; note?: string }[];
};

export type InspectPoint = {
  /** Centre, 0..100 across the plot. */
  x: number;
  /** Vertical anchor, 0..100 from the top (point mode, markers, tooltip). */
  y?: number;
  /** Highlight band for `cursor="band"`; defaults to a sliver around `x`. */
  x0?: number;
  x1?: number;
  tip: ChartTip;
  href?: string;
  /** Rings drawn on the active datum, e.g. one per series. */
  markers?: { y: number; color: string }[];
};

function subscribeCoarse(onChange: () => void) {
  const mq = window.matchMedia("(pointer: coarse)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/** True on phones/tablets, where hover inspection is unavailable. */
function useCoarsePointer() {
  return useSyncExternalStore(
    subscribeCoarse,
    () => window.matchMedia("(pointer: coarse)").matches,
    () => false,
  );
}

function nearestByX(points: InspectPoint[], x: number) {
  let best = -1;
  let dist = Infinity;
  points.forEach((p, i) => {
    const inside = p.x0 != null && p.x1 != null && x >= p.x0 && x <= p.x1;
    const d = inside ? -1 : Math.abs(p.x - x);
    if (d < dist) {
      dist = d;
      best = i;
    }
  });
  return best;
}

/**
 * The interaction layer over a hand-drawn plot. The plot itself (passed as
 * children) is static markup; this adds hover/focus inspection, tap-to-pin on
 * touch, arrow-key stepping, and a real link for the active datum, so evidence
 * opens with normal client navigation (and opens in a new tab on modifier-click).
 */
export function ChartInspector({
  points,
  mode = "x",
  cursor = "line",
  label,
  showTip = true,
  hitRadius = 18,
  children,
}: {
  points: InspectPoint[];
  /** `x`: nearest along x (bars, lines). `xy`: nearest point within `hitRadius` px. */
  mode?: "x" | "xy";
  cursor?: "band" | "line" | "none";
  label: string;
  showTip?: boolean;
  hitRadius?: number;
  children: ReactNode;
}) {
  const coarse = useCoarsePointer();
  const root = useRef<HTMLDivElement>(null);
  const link = useRef<HTMLAnchorElement>(null);
  const [active, setActive] = useState<number | null>(null);
  const [pinned, setPinned] = useState(false);

  const locate = useCallback(
    (event: { clientX: number; clientY: number }) => {
      const box = root.current?.getBoundingClientRect();
      if (!box || box.width === 0) return null;
      const x = ((event.clientX - box.left) / box.width) * 100;
      if (mode === "x") return nearestByX(points, x);
      let best: number | null = null;
      let dist = hitRadius;
      points.forEach((p, i) => {
        const dx = ((p.x - x) / 100) * box.width;
        const dy = (((p.y ?? 50) / 100) * box.height) - (event.clientY - box.top);
        const d = Math.hypot(dx, dy);
        if (d <= dist) {
          dist = d;
          best = i;
        }
      });
      return best;
    },
    [points, mode, hitRadius],
  );

  useEffect(() => {
    if (!pinned) return;
    const onDown = (event: globalThis.PointerEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) {
        setPinned(false);
        setActive(null);
      }
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [pinned]);

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" && event.pointerType !== "pen") return;
    if (coarse) return;
    setActive(locate(event));
  };

  // Taps (and clicks on empty plot space): pin on touch, or open on desktop.
  const onClick = (event: MouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("a")) return;
    const hit = locate(event);
    if (hit == null) {
      setPinned(false);
      setActive(null);
      return;
    }
    if (coarse) {
      if (pinned && hit === active) {
        setPinned(false);
        setActive(null);
      } else {
        setActive(hit);
        setPinned(true);
      }
      return;
    }
    if (points[hit]?.href) {
      setActive(hit);
      requestAnimationFrame(() => link.current?.click());
    }
  };

  // The active link: on touch the first tap pins, a second tap on it opens.
  const onLinkClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (coarse && !pinned) {
      event.preventDefault();
      setPinned(true);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const last = points.length - 1;
    const step = (to: number) => {
      event.preventDefault();
      setActive(Math.max(0, Math.min(last, to)));
    };
    if (event.key === "ArrowRight" || event.key === "ArrowDown") step((active ?? -1) + 1);
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") step((active ?? points.length) - 1);
    else if (event.key === "Home") step(0);
    else if (event.key === "End") step(last);
    else if (event.key === "Enter" && active != null && points[active]?.href) {
      event.preventDefault();
      link.current?.click();
    } else if (event.key === "Escape") {
      setActive(null);
      setPinned(false);
    }
  };

  const point = active != null ? points[active] : undefined;
  const tipVisible = point && showTip && (!coarse || pinned);
  const x0 = point?.x0 ?? (point ? point.x - 0.6 : 0);
  const x1 = point?.x1 ?? (point ? point.x + 0.6 : 0);

  return (
    <div
      ref={root}
      role="group"
      aria-label={label}
      aria-roledescription="chart"
      tabIndex={0}
      className="chart-inspector relative h-full w-full touch-manipulation outline-none focus-visible:ring-2 focus-visible:ring-devil/50 focus-visible:ring-offset-2 focus-visible:ring-offset-pitch"
      onPointerMove={onPointerMove}
      onPointerLeave={() => {
        if (!pinned) setActive(null);
      }}
      onClick={onClick}
      onKeyDown={onKeyDown}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node) && !pinned) setActive(null);
      }}
    >
      {point && cursor !== "none" && (
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-y-0 ${cursor === "band" ? "bg-white/[0.035]" : "w-px bg-devil-bright/30"}`}
          style={cursor === "band" ? { left: `${x0}%`, width: `${x1 - x0}%` } : { left: `${point.x}%` }}
        />
      )}
      {children}
      {point?.markers?.map((m, i) => (
        <span
          key={i}
          aria-hidden
          className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-panel"
          style={{ left: `${point.x}%`, top: `${m.y}%`, borderColor: m.color }}
        />
      ))}
      {point?.href && (
        <Link
          ref={link}
          href={point.href}
          prefetch={false}
          tabIndex={-1}
          aria-label={`Open ${point.tip.title}`}
          onClick={onLinkClick}
          className="absolute inset-y-0 cursor-pointer"
          style={{ left: `${x0}%`, width: `${Math.max(x1 - x0, 1.2)}%` }}
        />
      )}
      {tipVisible && <TipCard point={point} mode={mode} pinned={pinned} coarse={coarse} />}
      <span className="sr-only" aria-live="polite">
        {point ? [point.tip.title, point.tip.value, point.tip.aside, point.tip.meta].filter(Boolean).join(", ") : ""}
      </span>
    </div>
  );
}

function TipCard({
  point,
  mode,
  pinned,
  coarse,
}: {
  point: InspectPoint;
  mode: "x" | "xy";
  pinned: boolean;
  coarse: boolean;
}) {
  const { tip, href } = point;
  const right = point.x > 55;
  const horizontal = right ? { right: `calc(${100 - point.x}% + 12px)` } : { left: `calc(${point.x}% + 12px)` };
  const y = point.y ?? 0;
  const vertical =
    mode === "xy" && y > 45 ? { bottom: `calc(${100 - y}% + 10px)` } : { top: mode === "xy" ? `calc(${y}% + 10px)` : "4px" };

  return (
    <div
      className={`pointer-events-none absolute z-20 w-max min-w-36 max-w-[min(15rem,70vw)] rounded-md border bg-panel px-3 py-2 text-xs shadow-[0_10px_30px_rgb(0_0_0_/_0.35)] ${
        pinned ? "border-devil/40 ring-1 ring-devil/15" : "border-line"
      }`}
      style={{ ...horizontal, ...vertical }}
    >
      <div className="text-ink-dim">{tip.title}</div>
      {tip.value && (
        <div className="mt-0.5 flex items-baseline justify-between gap-3">
          <span className="stat-num text-base font-semibold text-ink">{tip.value}</span>
          {tip.aside && <span className="stat-num text-ink-dim">{tip.aside}</span>}
        </div>
      )}
      {tip.accent && <div className="stat-num mt-0.5 text-[11px] text-devil-bright">{tip.accent}</div>}
      {tip.rows?.map((row) => (
        <div key={row.name} className="mt-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-medium" style={{ color: row.color }}>{row.name}</span>
            <span className="stat-num text-sm font-semibold text-ink">{row.value}</span>
          </div>
          {row.note && <div className="stat-num text-[11px] text-ink-faint">{row.note}</div>}
        </div>
      ))}
      {tip.meta && <div className="mt-1 text-ink-faint">{tip.meta}</div>}
      {href && (
        <div className="mt-1 text-[11px] font-medium text-devil-bright">
          {coarse ? "Tap again to open evidence" : "Click to open evidence"}
        </div>
      )}
      {coarse && !href && <div className="mt-1 text-[11px] text-ink-faint">Tap elsewhere to dismiss</div>}
    </div>
  );
}
