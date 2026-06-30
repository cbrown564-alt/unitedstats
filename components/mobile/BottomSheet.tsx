"use client";

import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useId,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import { useAnimatedOverlay } from "@/components/mobile/useAnimatedOverlay";
import { useFocusTrap } from "@/components/mobile/useFocusTrap";
import { useSheetSwipe } from "@/components/mobile/useSheetSwipe";

const EXIT_MS = 300;

const BottomSheetScrollContext = createContext<RefObject<HTMLDivElement | null> | null>(null);

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
  /** Hug content height instead of stretching to max viewport height. */
  fitContent?: boolean;
  /** Swipe down anywhere on the panel to dismiss (when scroll is at top). Default true. */
  dismissAnywhere?: boolean;
  /** Extra class on the panel — e.g. nav-specific density. */
  panelClassName?: string;
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
  fitContent = false,
  dismissAnywhere = true,
  panelClassName = "",
}: BottomSheetProps) {
  const panelId = useId();
  const sheetRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { mounted, closing, onExitComplete } = useAnimatedOverlay(open, EXIT_MS);
  const { resetTransform, sheetProps } = useSheetSwipe(sheetRef, onClose, {
    threshold: dismissThreshold,
    scrollRef,
  });

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
  const panelAnimClass = closing ? "mobile-sheet-panel--closing" : "mobile-sheet-panel--open";
  const panelSizeClass = fitContent ? "mobile-sheet-panel--fit" : "";

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
        className={[
          "mobile-sheet-panel",
          panelAnimClass,
          panelSizeClass,
          panelClassName,
        ]
          .filter(Boolean)
          .join(" ")}
        onAnimationEnd={closing ? onExitComplete : undefined}
        {...(dismissAnywhere ? sheetProps : undefined)}
      >
        {grabHandle && (
          <div className="mobile-sheet-grab" aria-hidden>
            <span className="mobile-sheet-grab-bar" />
          </div>
        )}
        <BottomSheetScrollContext.Provider value={scrollRef}>{children}</BottomSheetScrollContext.Provider>
      </div>
    </div>
  );
}

export function BottomSheetHeader({ children }: { children: ReactNode }) {
  return <div className="mobile-sheet-header">{children}</div>;
}

/** Scroll container when content exceeds max-height; ref wired for dismiss-anywhere. */
export const BottomSheetBody = forwardRef<HTMLDivElement, { children: ReactNode; className?: string }>(
  function BottomSheetBody({ children, className = "" }, ref) {
    const scrollRef = useContext(BottomSheetScrollContext);

    const setRef = (node: HTMLDivElement | null) => {
      if (scrollRef) scrollRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    };

    return (
      <div ref={setRef} className={["mobile-sheet-body", className].filter(Boolean).join(" ")}>
        {children}
      </div>
    );
  },
);
