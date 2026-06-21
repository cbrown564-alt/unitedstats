"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const CommandPalette = dynamic<{ initialOpen?: boolean }>(
  () => import("./CommandPalette").then((mod) => mod.CommandPalette),
  { ssr: false },
);

export function CommandPaletteLoader() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (mounted) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setMounted(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mounted]);

  return mounted ? <CommandPalette initialOpen /> : null;
}
