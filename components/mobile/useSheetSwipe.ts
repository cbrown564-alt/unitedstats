"use client";

import { useCallback, useRef, type RefObject } from "react";

const DEFAULT_THRESHOLD = 72;

/** Pointer drag on the grab handle — translateY down, dismiss past threshold. */
export function useSheetSwipe(
  sheetRef: RefObject<HTMLDivElement | null>,
  onClose: () => void,
  threshold = DEFAULT_THRESHOLD,
) {
  const dragRef = useRef<{ startY: number; offset: number; dragging: boolean }>({
    startY: 0,
    offset: 0,
    dragging: false,
  });

  const resetTransform = useCallback(() => {
    if (sheetRef.current) sheetRef.current.style.transform = "";
  }, [sheetRef]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    dragRef.current = { startY: e.clientY, offset: 0, dragging: true };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current.dragging) return;
      const delta = Math.max(0, e.clientY - dragRef.current.startY);
      dragRef.current.offset = delta;
      if (sheetRef.current) {
        sheetRef.current.style.transform = delta > 0 ? `translateY(${delta}px)` : "";
      }
    },
    [sheetRef],
  );

  const finishDrag = useCallback(() => {
    if (!dragRef.current.dragging) return;
    const shouldClose = dragRef.current.offset > threshold;
    dragRef.current = { startY: 0, offset: 0, dragging: false };
    resetTransform();
    if (shouldClose) onClose();
  }, [onClose, resetTransform, threshold]);

  return {
    resetTransform,
    grabProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp: finishDrag,
      onPointerCancel: finishDrag,
    },
  };
}
