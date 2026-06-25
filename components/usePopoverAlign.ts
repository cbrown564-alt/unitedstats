"use client";

import { useLayoutEffect, useRef, useState } from "react";

/**
 * Keeps a `top-full` popover on-screen: left-aligned by default, flipped to the
 * right edge when a left-aligned panel would overflow the viewport. Measured in a
 * layout effect (before paint), so the flip never shows as a jump. Returns a ref
 * for the panel and the alignment class to drop into its className.
 */
export function usePopoverAlign<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const [flip, setFlip] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setFlip(el.getBoundingClientRect().right > window.innerWidth - 8);
  }, []);
  return { ref, align: flip ? "right-0 left-auto" : "left-0" };
}
