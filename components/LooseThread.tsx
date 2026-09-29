"use client";

import { useEffect, useRef } from "react";

type Pt = { x: number; y: number; px: number; py: number };

const N = 26;
const HEIGHT = 190;

/**
 * The 404 moment: the record runs as a ticked thread to a pin, then the thread
 * hangs loose and frays. The loose end follows the pointer while it is over
 * the canvas and falls back when it leaves. The loop sleeps once the rope
 * settles; under reduced motion a single settled frame is drawn.
 */
export function LooseThread() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const root = getComputedStyle(document.documentElement);
    const thread = root.getPropertyValue("--color-devil-bright").trim() || "#ff3b1f";
    const pale = root.getPropertyValue("--color-ink-faint").trim() || "#aa9f97";

    let W = 0;
    let dpr = 1;
    let seg = 8;
    let pin = { x: 0, y: 0 };
    let pts: Pt[] = [];
    let ptr: { x: number; y: number } | null = null;
    let frame = 0;
    let running = false;

    const layout = () => {
      const r = cv.getBoundingClientRect();
      W = r.width;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = W * dpr;
      cv.height = HEIGHT * dpr;
      pin = { x: Math.round(W * 0.44), y: 58 };
      seg = Math.min(W * 0.46, 230) / N;
      // Start the loose end lying out to the right, so it visibly drops.
      pts = Array.from({ length: N + 1 }, (_, i) => {
        const x = pin.x + seg * i;
        const y = pin.y + Math.sin(i / 3) * 6;
        return { x, y, px: x, py: y };
      });
    };

    const step = () => {
      let motion = 0;
      for (let i = 1; i <= N; i++) {
        const p = pts[i];
        const vx = (p.x - p.px) * 0.97;
        const vy = (p.y - p.py) * 0.97;
        p.px = p.x;
        p.py = p.y;
        p.x += vx;
        p.y += vy + 0.2;
        motion += Math.abs(vx) + Math.abs(vy);
      }
      // Held, the end follows the pointer; let go, it drifts back to a rest
      // point so the loose thread drapes rather than dropping dead.
      {
        const t = pts[N];
        const goal = ptr ?? { x: pin.x + seg * N * 0.84, y: pin.y + 46 };
        const k = ptr ? 0.3 : 0.05;
        t.x += (goal.x - t.x) * k;
        t.y += (goal.y - t.y) * k;
      }
      for (let k = 0; k < 32; k++) {
        pts[0].x = pin.x;
        pts[0].y = pin.y;
        for (let i = 0; i < N; i++) {
          const a = pts[i];
          const b = pts[i + 1];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d = Math.hypot(dx, dy) || 1;
          const diff = (d - seg) / d / 2;
          if (i > 0) {
            a.x += dx * diff;
            a.y += dy * diff;
            b.x -= dx * diff;
            b.y -= dy * diff;
          } else {
            b.x -= dx * diff * 2;
            b.y -= dy * diff * 2;
          }
        }
        for (const p of pts) {
          p.x = Math.max(3, Math.min(W - 3, p.x));
          p.y = Math.max(3, Math.min(HEIGHT - 4, p.y));
        }
      }
      return motion;
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, HEIGHT);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // The record: fixtures as pale ticks along a taut thread, up to the pin.
      ctx.strokeStyle = pale;
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let x = 12, i = 0; x < pin.x - 8; x += 22, i++) {
        const h = i % 5 === 0 ? 7 : i % 2 ? 3.5 : 5;
        ctx.moveTo(x, pin.y - h);
        ctx.lineTo(x, pin.y + h);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;

      ctx.strokeStyle = thread;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(0, pin.y);
      ctx.lineTo(pin.x, pin.y);
      for (let i = 1; i < N; i++) {
        const mx = (pts[i].x + pts[i + 1].x) / 2;
        const my = (pts[i].y + pts[i + 1].y) / 2;
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
      }
      const tip = pts[N];
      const prev = pts[N - 1];
      ctx.lineTo(tip.x, tip.y);
      ctx.stroke();

      // The fray: fibres fanning from the tip along its direction.
      const ang = Math.atan2(tip.y - prev.y, tip.x - prev.x);
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      for (const [spread, len] of [[-0.55, 12], [-0.18, 15], [0.2, 13], [0.6, 10]] as const) {
        const a = ang + spread;
        ctx.moveTo(tip.x, tip.y);
        ctx.quadraticCurveTo(
          tip.x + Math.cos(ang) * len * 0.5,
          tip.y + Math.sin(ang) * len * 0.5,
          tip.x + Math.cos(a) * len,
          tip.y + Math.sin(a) * len,
        );
      }
      ctx.stroke();
      ctx.globalAlpha = 1;

      // The pin where the record stops.
      ctx.fillStyle = thread;
      ctx.beginPath();
      ctx.arc(pin.x, pin.y, 3, 0, Math.PI * 2);
      ctx.fill();
    };

    const loop = () => {
      const motion = step();
      draw();
      if (!ptr && motion < 0.05) {
        running = false;
        return;
      }
      frame = requestAnimationFrame(loop);
    };

    const wake = () => {
      if (reduced || running) return;
      running = true;
      frame = requestAnimationFrame(loop);
    };

    const settle = () => {
      for (let i = 0; i < 400; i++) step();
      draw();
    };

    layout();
    if (reduced) settle();
    else wake();

    const ro = new ResizeObserver(() => {
      const before = W;
      layout();
      if (reduced || Math.abs(before - W) < 1) settle();
      else wake();
    });
    ro.observe(cv);

    const pos = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onMove = (e: PointerEvent) => {
      if (reduced) return;
      ptr = pos(e);
      wake();
    };
    const onLeave = () => {
      ptr = null;
      wake();
    };
    cv.addEventListener("pointermove", onMove);
    cv.addEventListener("pointerdown", onMove);
    cv.addEventListener("pointerleave", onLeave);
    cv.addEventListener("pointerup", onLeave);
    cv.addEventListener("pointercancel", onLeave);

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      cv.removeEventListener("pointermove", onMove);
      cv.removeEventListener("pointerdown", onMove);
      cv.removeEventListener("pointerleave", onLeave);
      cv.removeEventListener("pointerup", onLeave);
      cv.removeEventListener("pointercancel", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="block w-full touch-pan-y"
      style={{ height: HEIGHT, cursor: "grab" }}
    />
  );
}
