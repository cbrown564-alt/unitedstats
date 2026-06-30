"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId } from "react";
import { NAV_SECTIONS, isNavActive } from "@/lib/navSections";
import { BottomSheet, BottomSheetBody, BottomSheetHeader } from "@/components/mobile/BottomSheet";

type MobileNavSheetProps = {
  open: boolean;
  onClose: () => void;
};

export function MobileNavSheet({ open, onClose }: MobileNavSheetProps) {
  const pathname = usePathname();
  const titleId = useId();

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      ariaLabel="Site sections"
      titleId={titleId}
      fitContent
      panelClassName="mobile-sheet-panel--nav"
    >
      <BottomSheetHeader>
        <p id={titleId} className="text-xs font-semibold uppercase tracking-[0.18em] text-devil-bright">
          Sections
        </p>
      </BottomSheetHeader>

      <BottomSheetBody>
        <nav aria-label="Primary navigation" className="mobile-sheet-nav mobile-sheet-nav--compact">
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
    </BottomSheet>
  );
}
