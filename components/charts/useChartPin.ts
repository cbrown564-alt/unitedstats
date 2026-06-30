"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

function subscribeCoarse(onStoreChange: () => void) {
  const mq = window.matchMedia("(pointer: coarse)");
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function getCoarseSnapshot() {
  return window.matchMedia("(pointer: coarse)").matches;
}

/** True on phones/tablets where hover inspection is unavailable. */
export function useCoarsePointer() {
  return useSyncExternalStore(subscribeCoarse, getCoarseSnapshot, () => false);
}

/**
 * Tap-to-pin / tap-elsewhere-to-dismiss for chart inspection on touch devices.
 * Re-tapping the same datum clears the pin.
 */
export function useChartPin<T>() {
  const [pinned, setPinned] = useState<T | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const pin = useCallback((datum: T) => {
    setPinned((prev) => (prev === datum ? null : datum));
  }, []);

  const clear = useCallback(() => setPinned(null), []);

  useEffect(() => {
    if (!pinned) return;
    const onPointerDown = (event: PointerEvent) => {
      const root = rootRef.current;
      if (root && !root.contains(event.target as Node)) clear();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [pinned, clear]);

  return { pinned, pin, clear, rootRef, isPinned: pinned != null };
}
