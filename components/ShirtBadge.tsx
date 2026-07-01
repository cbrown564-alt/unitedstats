"use client";

import { useId } from "react";

interface ShirtBadgeProps {
  number: number | null | undefined;
  decade?: string | null;
  apps?: number | null;
  compact?: boolean;
  /** Drain the shirt colour for an unused substitute who never took the pitch. */
  muted?: boolean;
}

// Literal colours — SVG gradient stops do not resolve CSS variables reliably.
const UNITED_SHIRT = {
  top: "#ff3b1f",
  base: "#9a1809",
  border: "rgba(255, 115, 85, 0.62)",
  number: "#f3ede8",
} as const;

export function ShirtBadge({ number, decade, apps, compact = false, muted = false }: ShirtBadgeProps) {
  const uid = useId().replace(/:/g, "");
  const gradientId = `shirt-${uid}`;

  if (number == null) {
    return (
      <span className="text-ink-faint" title="Shirt number not recorded" aria-label="Shirt number not recorded">
        {compact ? "\u00a0" : "—"}
      </span>
    );
  }

  const title = `${decade ?? "Unknown era"} shirt ${number}${apps ? `, ${apps} covered apps` : ""}`;

  return (
    <span className={`inline-flex items-center ${compact ? "justify-end" : "gap-2"}`} title={title}>
      <svg
        aria-label={title}
        role="img"
        className={`${compact ? "h-7 w-7" : "h-9 w-9"} shrink-0`}
        viewBox="0 0 100 100"
        style={muted ? { filter: "grayscale(0.85) brightness(0.85)", opacity: 0.55 } : undefined}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={UNITED_SHIRT.top} />
            <stop offset="100%" stopColor={UNITED_SHIRT.base} />
          </linearGradient>
          <linearGradient id={`${gradientId}-shadow`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="black" stopOpacity="0" />
            <stop offset="100%" stopColor="black" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        <path
          d="M 20,12 C 32,8 38,14 50,14 C 62,14 68,8 80,12 L 96,28 C 92,34 84,38 80,38 L 80,92 C 80,96 76,100 72,100 L 28,100 C 24,100 20,96 20,92 L 20,38 C 16,38 8,34 4,28 Z"
          fill={`url(#${gradientId})`}
          stroke={UNITED_SHIRT.border}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M 20,12 C 32,8 38,14 50,14 C 62,14 68,8 80,12 L 96,28 C 92,34 84,38 80,38 L 80,92 C 80,96 76,100 72,100 L 28,100 C 24,100 20,96 20,92 L 20,38 C 16,38 8,34 4,28 Z"
          fill={`url(#${gradientId}-shadow)`}
          pointerEvents="none"
        />

        <path
          d="M 38,14 C 38,22 62,22 62,14"
          fill="none"
          stroke={UNITED_SHIRT.border}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M 20,38 L 29,26"
          fill="none"
          stroke={UNITED_SHIRT.border}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.6"
        />
        <path
          d="M 80,38 L 71,26"
          fill="none"
          stroke={UNITED_SHIRT.border}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.6"
        />

        <text
          x="50"
          y="60"
          dominantBaseline="central"
          textAnchor="middle"
          fill={UNITED_SHIRT.number}
          className="stat-num font-semibold"
          fontSize="30"
          style={{ fontFamily: "inherit" }}
        >
          {number}
        </text>
      </svg>
      {!compact && (
        <span className="min-w-0">
          <span className="stat-num block text-sm text-ink">#{number}</span>
          {decade && <span className="block text-[0.65rem] uppercase tracking-[0.14em] text-ink-faint">{decade}</span>}
        </span>
      )}
    </span>
  );
}
