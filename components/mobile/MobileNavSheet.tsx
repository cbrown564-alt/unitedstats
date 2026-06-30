"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId } from "react";
import { NAV_SECTIONS, isNavActive } from "@/lib/navSections";
import { BottomSheet, BottomSheetBody, BottomSheetFooter, BottomSheetHeader } from "@/components/mobile/BottomSheet";

type MobileNavSheetProps = {
  open: boolean;
  onClose: () => void;
};

export function MobileNavSheet({ open, onClose }: MobileNavSheetProps) {
  const pathname = usePathname();
  const titleId = useId();

  return (
    <BottomSheet open={open} onClose={onClose} ariaLabel="Site sections" titleId={titleId}>
      <BottomSheetHeader>
        <p id={titleId} className="text-xs font-semibold uppercase tracking-[0.18em] text-devil-bright">
          Sections
        </p>
        <p className="mt-1 text-sm text-ink-dim">Swipe down or tap outside to close</p>
      </BottomSheetHeader>

      <BottomSheetBody>
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
      </BottomSheetBody>

      <BottomSheetFooter>
        Red Thread — evidence-backed Manchester United history. Not affiliated with Manchester United FC.
      </BottomSheetFooter>
    </BottomSheet>
  );
}
