"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef } from "react";
import { NAV_SECTIONS, isNavActive } from "@/lib/navSections";

type MobileNavSheetProps = {
  open: boolean;
  onClose: () => void;
};

const DISMISS_THRESHOLD = 72;

export function MobileNavSheet({ open, onClose }: MobileNavSheetProps) {
  const pathname = usePathname();
  const panelId = useId();
  const dragRef = useRef<{ startY: number; offset: number; dragging: boolean }>({
    startY: 0,
    offset: 0,
    dragging: false,
  });
  const dragOffsetRef = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    document.body.classList.add("mobile-sheet-open");
    dragOffsetRef.current = 0;
    if (sheetRef.current) sheetRef.current.style.transform = "";
    return () => document.body.classList.remove("mobile-sheet-open");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    dragRef.current = { startY: e.clientY, offset: 0, dragging: true };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current.dragging) return;
    const delta = Math.max(0, e.clientY - dragRef.current.startY);
    dragRef.current.offset = delta;
    dragOffsetRef.current = delta;
    if (sheetRef.current) {
      sheetRef.current.style.transform = delta > 0 ? `translateY(${delta}px)` : "";
    }
  }, []);

  const finishDrag = useCallback(() => {
    if (!dragRef.current.dragging) return;
    const shouldClose = dragRef.current.offset > DISMISS_THRESHOLD;
    dragRef.current = { startY: 0, offset: 0, dragging: false };
    dragOffsetRef.current = 0;
    if (sheetRef.current) sheetRef.current.style.transform = "";
    if (shouldClose) onClose();
  }, [onClose]);

  if (!open) return null;

  return (
    <div className="mobile-sheet-root mobile-sheet-root--open" aria-hidden={false}>
      <button
        type="button"
        aria-label="Close navigation"
        className="mobile-sheet-backdrop"
        onClick={onClose}
      />

      <div
        ref={sheetRef}
        id={panelId}
        role="dialog"
        aria-modal="true"
        aria-label="Site sections"
        className="mobile-sheet-panel mobile-sheet-panel--open"
      >
        <div
          className="mobile-sheet-grab"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
        >
          <span className="mobile-sheet-grab-bar" aria-hidden />
        </div>

        <div className="mobile-sheet-header">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-devil-bright">Sections</p>
          <p className="mt-1 text-sm text-ink-dim">Swipe down or tap outside to close</p>
        </div>

        <nav aria-label="Primary navigation" className="mobile-sheet-nav">
          <Link
            href="/"
            onClick={onClose}
            aria-current={pathname === "/" ? "page" : undefined}
            className={["mobile-sheet-link", pathname === "/" ? "mobile-sheet-link--active" : ""].join(" ")}
          >
            <span className="mobile-sheet-link-label">Home</span>
            <span className="mobile-sheet-link-hint">Tonight&apos;s spark</span>
          </Link>

          {NAV_SECTIONS.map(([label, href]) => {
            const active = isNavActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                aria-current={active ? "page" : undefined}
                className={["mobile-sheet-link", active ? "mobile-sheet-link--active" : ""].join(" ")}
              >
                <span className="mobile-sheet-link-label">{label}</span>
              </Link>
            );
          })}
        </nav>

        <p className="mobile-sheet-footnote">
          Red Thread — evidence-backed Manchester United history. Not affiliated with Manchester United FC.
        </p>
      </div>
    </div>
  );
}
