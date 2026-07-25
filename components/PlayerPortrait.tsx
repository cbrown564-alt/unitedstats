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
  className?: string;
}

const SIZES = {
  xs: { box: "h-7 w-7", pixels: 28, text: "text-[9px]" },
  sm: { box: "h-10 w-10", pixels: 40, text: "text-xs" },
  md: { box: "h-14 w-14 sm:h-16 sm:w-16", pixels: 64, text: "text-lg" },
  lg: { box: "h-40 w-40 sm:h-44 sm:w-44", pixels: 176, text: "text-3xl" },
};

/**
 * Wikimedia occasionally leaves legacy cache-buster queries on otherwise
 * immutable Commons thumbnails. Strip those before handing the URL to
 * next/image so the strict query-free remote pattern remains enforceable.
 */
export function normalizePortraitSrc(src: string | null | undefined): string | null | undefined {
  if (!src?.startsWith("https://")) return src;
  try {
    const url = new URL(src);
    if (url.hostname === "upload.wikimedia.org" && url.pathname.startsWith("/wikipedia/commons/")) {
      url.search = "";
      return url.toString();
    }
  } catch {
    // Let next/image surface malformed non-Wikimedia URLs as before.
  }
  return src;
}

export function PlayerPortrait({ name, src, size = "sm", priority = false, className = "" }: PlayerPortraitProps) {
  const config = SIZES[size];
  const imageSrc = normalizePortraitSrc(src);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = Boolean(imageSrc && imageSrc !== failedSrc);

  return (
    <span
      className={`${config.box} ${className} relative grid shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-panel-2 text-ink-faint shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]`}
    >
      {showImage ? (
        <Image
          src={imageSrc!}
          alt={`Portrait of ${name}`}
          width={config.pixels}
          height={config.pixels}
          // Portraits are already cached, compact WebPs rendered at fixed sizes.
          // Serving them directly avoids creating paid Vercel variants for every
          // portrait/size combination with negligible visual benefit.
          unoptimized
          priority={priority}
          sizes={`${config.pixels}px`}
          className="h-full w-full object-cover"
          onError={() => setFailedSrc(imageSrc!)}
        />
      ) : (
        <span className={`stat-num font-semibold ${config.text}`} aria-hidden="true">
          {initialsFor(name)}
        </span>
      )}
    </span>
  );
}
