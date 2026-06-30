"use client";

import { useCallback, useEffect, useState } from "react";

/** Keeps an overlay mounted through its exit animation before unmounting. */
export function useAnimatedOverlay(open: boolean, durationMs = 300) {
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);
  const [prevOpen, setPrevOpen] = useState(open);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setMounted(true);
      setClosing(false);
    } else if (mounted) {
      setClosing(true);
    }
  }

  const onExitComplete = useCallback(() => {
    setMounted(false);
    setClosing(false);
  }, []);

  useEffect(() => {
    if (!closing) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduced) return;
    const timer = window.setTimeout(onExitComplete, 0);
    return () => window.clearTimeout(timer);
  }, [closing, onExitComplete]);

  useEffect(() => {
    if (!closing) return;
    const timer = window.setTimeout(onExitComplete, durationMs + 50);
    return () => window.clearTimeout(timer);
  }, [closing, durationMs, onExitComplete]);

  return { mounted, closing, onExitComplete };
}
