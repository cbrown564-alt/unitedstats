"use client";

import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function focusableNodes(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true",
  );
}

/** Trap Tab within a dialog while active; restore focus on teardown. */
export function useFocusTrap(containerRef: RefObject<HTMLElement | null>, active: boolean) {
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;

    const timer = window.setTimeout(() => {
      const nodes = focusableNodes(container);
      const first = nodes[0];
      if (first) first.focus();
      else {
        container.tabIndex = -1;
        container.focus({ preventScroll: true });
      }
    }, 0);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const nodes = focusableNodes(container);
      if (nodes.length === 0) {
        e.preventDefault();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first || !container.contains(document.activeElement)) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    container.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(timer);
      container.removeEventListener("keydown", onKeyDown);
      previouslyFocused.current?.focus?.({ preventScroll: true });
    };
  }, [active, containerRef]);
}
