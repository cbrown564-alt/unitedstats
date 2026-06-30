"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";

const DEFAULT_THRESHOLD = 72;
const DRAG_START_PX = 8;

type DragPhase = "idle" | "dismiss" | "scroll";

function readScrollTop(scrollRef?: RefObject<HTMLElement | null>) {
  return scrollRef?.current?.scrollTop ?? 0;
}

/** Swipe down to dismiss — touch (passive:false) + pointer for desktop. */
export function useSheetSwipe(
  sheetRef: RefObject<HTMLDivElement | null>,
  onClose: () => void,
  active: boolean,
  options?: {
    threshold?: number;
    scrollRef?: RefObject<HTMLElement | null>;
  },
) {
  const threshold = options?.threshold ?? DEFAULT_THRESHOLD;
  const scrollRef = options?.scrollRef;

  const dragRef = useRef({
    startY: 0,
    startX: 0,
    offset: 0,
    phase: "idle" as DragPhase,
  });

  const resetTransform = useCallback(() => {
    if (sheetRef.current) sheetRef.current.style.transform = "";
  }, [sheetRef]);

  const resetDrag = useCallback(() => {
    dragRef.current = { startY: 0, startX: 0, offset: 0, phase: "idle" };
    resetTransform();
  }, [resetTransform]);

  const finishDrag = useCallback(() => {
    const drag = dragRef.current;
    if (drag.phase === "dismiss") {
      const shouldClose = drag.offset > threshold;
      resetTransform();
      if (shouldClose) onClose();
    }
    dragRef.current = { startY: 0, startX: 0, offset: 0, phase: "idle" };
  }, [onClose, resetTransform, threshold]);

  // Touch — non-passive touchmove + preventDefault stops page scroll behind the sheet.
  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet || !active) return;

    const beginMove = (clientY: number, clientX: number) => {
      const drag = dragRef.current;
      const dy = clientY - drag.startY;
      const dx = clientX - drag.startX;
      if (Math.abs(dy) < DRAG_START_PX && Math.abs(dx) < DRAG_START_PX) return;

      if (dy <= 0 || Math.abs(dx) > Math.abs(dy)) {
        drag.phase = "scroll";
        return;
      }

      if (readScrollTop(scrollRef) > 0) {
        drag.phase = "scroll";
        return;
      }

      drag.phase = "dismiss";
    };

    const applyDismiss = (clientY: number) => {
      const drag = dragRef.current;
      if (drag.phase !== "dismiss") return;
      const delta = Math.max(0, clientY - drag.startY);
      drag.offset = delta;
      sheet.style.transform = delta > 0 ? `translateY(${delta}px)` : "";
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      dragRef.current = {
        startY: e.touches[0].clientY,
        startX: e.touches[0].clientX,
        offset: 0,
        phase: "idle",
      };
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const y = e.touches[0].clientY;
      const x = e.touches[0].clientX;
      const drag = dragRef.current;

      if (drag.phase === "idle") {
        beginMove(y, x);
      }

      if (drag.phase === "dismiss") {
        e.preventDefault();
        applyDismiss(y);
        return;
      }

      // Rubber-band at scroll top → dismiss, not page scroll.
      if (drag.phase === "scroll" && readScrollTop(scrollRef) <= 0 && y - drag.startY > DRAG_START_PX) {
        drag.phase = "dismiss";
        e.preventDefault();
        applyDismiss(y);
      }
    };

    const onTouchEnd = () => finishDrag();

    sheet.addEventListener("touchstart", onTouchStart, { passive: true });
    sheet.addEventListener("touchmove", onTouchMove, { passive: false });
    sheet.addEventListener("touchend", onTouchEnd);
    sheet.addEventListener("touchcancel", onTouchEnd);

    return () => {
      sheet.removeEventListener("touchstart", onTouchStart);
      sheet.removeEventListener("touchmove", onTouchMove);
      sheet.removeEventListener("touchend", onTouchEnd);
      sheet.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [active, finishDrag, scrollRef, sheetRef]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === "touch") return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    dragRef.current = {
      startY: e.clientY,
      startX: e.clientX,
      offset: 0,
      phase: "idle",
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerType === "touch") return;
      const drag = dragRef.current;
      const dy = e.clientY - drag.startY;
      const dx = e.clientX - drag.startX;

      if (drag.phase === "idle") {
        if (Math.abs(dy) < DRAG_START_PX && Math.abs(dx) < DRAG_START_PX) return;
        if (dy <= 0 || Math.abs(dx) > Math.abs(dy)) {
          drag.phase = "scroll";
          return;
        }
        if (readScrollTop(scrollRef) > 0) {
          drag.phase = "scroll";
          return;
        }
        drag.phase = "dismiss";
      }

      if (drag.phase === "dismiss") {
        e.preventDefault();
        const delta = Math.max(0, e.clientY - drag.startY);
        drag.offset = delta;
        if (sheetRef.current) {
          sheetRef.current.style.transform = delta > 0 ? `translateY(${delta}px)` : "";
        }
      }
    },
    [scrollRef, sheetRef],
  );

  const onPointerUp = useCallback(() => finishDrag(), [finishDrag]);

  return {
    resetTransform,
    resetDrag,
    sheetProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
    },
  };
}
