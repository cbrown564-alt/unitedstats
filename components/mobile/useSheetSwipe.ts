"use client";

import { useCallback, useRef, type RefObject } from "react";

const DEFAULT_THRESHOLD = 72;
const DRAG_START_PX = 8;

type DragPhase = "idle" | "dismiss" | "scroll";

/** Pointer drag — translateY down, dismiss past threshold. */
export function useSheetSwipe(
  sheetRef: RefObject<HTMLDivElement | null>,
  onClose: () => void,
  options?: {
    threshold?: number;
    /** When set, dismiss drag only starts if this element is scrolled to the top. */
    scrollRef?: RefObject<HTMLElement | null>;
  },
) {
  const threshold = options?.threshold ?? DEFAULT_THRESHOLD;
  const dragRef = useRef<{
    startY: number;
    startX: number;
    offset: number;
    phase: DragPhase;
    pointerId: number | null;
  }>({
    startY: 0,
    startX: 0,
    offset: 0,
    phase: "idle",
    pointerId: null,
  });

  const resetTransform = useCallback(() => {
    if (sheetRef.current) sheetRef.current.style.transform = "";
  }, [sheetRef]);

  const scrollRef = options?.scrollRef;

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      dragRef.current = {
        startY: e.clientY,
        startX: e.clientX,
        offset: 0,
        phase: "idle",
        pointerId: e.pointerId,
      };
    },
    [],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const drag = dragRef.current;
      if (drag.pointerId !== e.pointerId) return;

      if (drag.phase === "idle") {
        const dy = e.clientY - drag.startY;
        const dx = e.clientX - drag.startX;
        if (Math.abs(dy) < DRAG_START_PX && Math.abs(dx) < DRAG_START_PX) return;

        // Horizontal or upward intent — leave to links / scroll.
        if (dy <= 0 || Math.abs(dx) > Math.abs(dy)) {
          drag.phase = "scroll";
          return;
        }

        if (!scrollRef?.current || scrollRef.current.scrollTop <= 0) {
          drag.phase = "dismiss";
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        } else {
          drag.phase = "scroll";
          return;
        }
      }

      if (drag.phase !== "dismiss") return;

      const delta = Math.max(0, e.clientY - drag.startY);
      drag.offset = delta;
      if (sheetRef.current) {
        sheetRef.current.style.transform = delta > 0 ? `translateY(${delta}px)` : "";
      }
    },
    [scrollRef, sheetRef],
  );

  const finishDrag = useCallback(() => {
    const drag = dragRef.current;
    if (drag.phase === "dismiss") {
      const shouldClose = drag.offset > threshold;
      resetTransform();
      if (shouldClose) onClose();
    }
    dragRef.current = { startY: 0, startX: 0, offset: 0, phase: "idle", pointerId: null };
  }, [onClose, resetTransform, threshold]);

  const sheetProps = {
    onPointerDown,
    onPointerMove,
    onPointerUp: finishDrag,
    onPointerCancel: finishDrag,
  };

  return { resetTransform, sheetProps };
}
