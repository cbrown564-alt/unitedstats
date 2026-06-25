"use client";

import Image from "next/image";
import { useState } from "react";
import { initialsFor } from "@/lib/names";

interface PlayerPortraitProps {
  name: string;
  src?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  /** Set on the one above-the-fold portrait per page (the hero plate) for LCP. */
  priority?: boolean;
}

const SIZES = {
  xs: { box: "h-7 w-7", pixels: 28, text: "text-[9px]" },
  sm: { box: "h-10 w-10", pixels: 40, text: "text-xs" },
  md: { box: "h-14 w-14 sm:h-16 sm:w-16", pixels: 64, text: "text-lg" },
  lg: { box: "h-40 w-40 sm:h-44 sm:w-44", pixels: 176, text: "text-3xl" },
};

export function PlayerPortrait({ name, src, size = "sm", priority = false }: PlayerPortraitProps) {
  const config = SIZES[size];
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = Boolean(src && src !== failedSrc);

  return (
    <span
      className={`${config.box} relative grid shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-panel-2 text-ink-faint shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]`}
    >
      {showImage ? (
        <Image
          src={src!}
          alt={`Portrait of ${name}`}
          width={config.pixels}
          height={config.pixels}
          priority={priority}
          sizes={`${config.pixels}px`}
          className="h-full w-full object-cover"
          onError={() => setFailedSrc(src!)}
        />
      ) : (
        <span className={`stat-num font-semibold ${config.text}`} aria-hidden="true">
          {initialsFor(name)}
        </span>
      )}
    </span>
  );
}
