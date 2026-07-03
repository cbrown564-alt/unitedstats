"use client";

import { useEffect } from "react";
import {
  focusSlashSearch,
  isEditableTarget,
  isSlashKey,
  requestMobileSearchOpen,
  requestSidebarSearchActivation,
} from "@/lib/search/slashShortcut";

/**
 * Global "/" shortcut — focus a visible page search field when one exists,
 * otherwise fall back to sidebar search (lg+) or the mobile search shell.
 */
export function SlashSearchShortcut() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!isSlashKey(e) || isEditableTarget(document.activeElement)) return;
      e.preventDefault();
      if (focusSlashSearch()) return;
      if (window.matchMedia("(min-width: 1024px)").matches) {
        requestSidebarSearchActivation();
      } else {
        requestMobileSearchOpen();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return null;
}
