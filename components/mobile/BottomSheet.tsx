"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { useAnimatedOverlay } from "@/components/mobile/useAnimatedOverlay";
import { useFocusTrap } from "@/components/mobile/useFocusTrap";
import { useSheetSwipe } from "@/components/mobile/useSheetSwipe";

const EXIT_MS = 300;

export type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  /** Accessible name when no visible title is wired via titleId. */
  ariaLabel: string;
  /** id of the visible title element for aria-labelledby. */
  titleId?: string;
  children: ReactNode;
  /** Drag handle for swipe-to-dismiss. Default true. */
  grabHandle?: boolean;
  /** Pixels of downward drag before dismiss. */
  dismissThreshold?: number;
};

/**
 * Reusable mobile bottom sheet — exit animation, focus trap, swipe dismiss,
 * backdrop tap, Escape, and body scroll lock. Phase A primitive for nav,
 * filter panels, and quick previews (MOBILE.md §1.2).
 */
export function BottomSheet({
  open,
  onClose,
  ariaLabel,
  titleId,
  children,
  grabHandle = true,
  dismissThreshold,
}: BottomSheetProps) {
  const panelId = useId();
  const sheetRef = useRef<HTMLDivElement>(null);
  const { mounted, closing, onExitComplete } = useAnimatedOverlay(open, EXIT_MS);
  const { resetTransform, grabProps } = useSheetSwipe(sheetRef, onClose, dismissThreshold);

  useFocusTrap(sheetRef, mounted && !closing);

  useEffect(() => {
    if (!mounted) return;
    document.body.classList.add("mobile-sheet-open");
    resetTransform();
    return () => document.body.classList.remove("mobile-sheet-open");
  }, [mounted, resetTransform]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  const rootClass = closing ? "mobile-sheet-root--closing" : "mobile-sheet-root--open";
  const panelClass = closing ? "mobile-sheet-panel--closing" : "mobile-sheet-panel--open";

  return (
    <div className={`mobile-sheet-root ${rootClass}`} aria-hidden={closing}>
      <button
        type="button"
        aria-label="Close"
        className="mobile-sheet-backdrop"
        onClick={onClose}
      />

      <div
        ref={sheetRef}
        id={panelId}
        role="dialog"
        aria-modal="true"
        aria-label={titleId ? undefined : ariaLabel}
        aria-labelledby={titleId}
        className={`mobile-sheet-panel ${panelClass}`}
        onAnimationEnd={closing ? onExitComplete : undefined}
      >
        {grabHandle && (
          <div className="mobile-sheet-grab" {...grabProps}>
            <span className="mobile-sheet-grab-bar" aria-hidden />
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function BottomSheetHeader({ children }: { children: ReactNode }) {
  return <div className="mobile-sheet-header">{children}</div>;
}

/** Scrollable sheet content — flex-1 with overscroll containment. */
export function BottomSheetBody({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={["mobile-sheet-body", className].filter(Boolean).join(" ")}>{children}</div>;
}

export function BottomSheetFooter({ children }: { children: ReactNode }) {
  return <p className="mobile-sheet-footnote">{children}</p>;
}
