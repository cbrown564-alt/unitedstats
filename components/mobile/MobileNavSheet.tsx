"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useState } from "react";
import { PRIMARY_NAV, SECONDARY_NAV, isNavActive } from "@/lib/navSections";
import { BottomSheet, BottomSheetBody, BottomSheetHeader } from "@/components/mobile/BottomSheet";

type MobileNavSheetProps = {
  open: boolean;
  onClose: () => void;
};

export function MobileNavSheet({ open, onClose }: MobileNavSheetProps) {
  const pathname = usePathname();
  const titleId = useId();
  const secondaryActive = SECONDARY_NAV.some((item) => isNavActive(pathname, item.href));
  const [secondaryOpen, setSecondaryOpen] = useState(secondaryActive);

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
          </Link>

          {PRIMARY_NAV.map(({ label, href }) => {
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

          <details
            className="mobile-sheet-secondary"
            open={secondaryOpen}
            onToggle={(event) => setSecondaryOpen(event.currentTarget.open)}
          >
            <summary className={["mobile-sheet-link", secondaryActive ? "mobile-sheet-link--active" : ""].join(" ")}>
              <span className="mobile-sheet-link-label">More</span>
              <span aria-hidden>⌄</span>
            </summary>
            <div className="mobile-sheet-secondary-links">
              {SECONDARY_NAV.map(({ label, href }) => {
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
            </div>
          </details>
        </nav>
      </BottomSheetBody>
    </BottomSheet>
  );
}
