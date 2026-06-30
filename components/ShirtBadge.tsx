interface ShirtBadgeProps {
  number: number | null | undefined;
  decade?: string | null;
  apps?: number | null;
  compact?: boolean;
  /** Drain the shirt colour for an unused substitute who never took the pitch. */
  muted?: boolean;
  /** Render every shirt the same dark United red instead of the decade-tint — for
   *  dense lists (the register) where the era colour is a distraction, not a signal. */
  uniform?: boolean;
}

interface ShirtPalette {
  stop1: string;
  stop2: string;
  color: string;
  border: string;
}

const NEUTRAL_SHIRT: ShirtPalette = {
  stop1: "oklch(35% 0.01 40)",
  stop2: "oklch(22% 0.01 40)",
  color: "var(--color-ink-dim)",
  border: "rgb(168 156 148 / 0.35)",
};

const UNIFORM_SHIRT: ShirtPalette = {
  stop1: "oklch(40% 0.16 31)",
  stop2: "oklch(27% 0.13 31)",
  color: "var(--color-ink)",
  border: "oklch(46% 0.13 31 / 0.7)",
};

function paletteForDecade(decade?: string | null): ShirtPalette {
  const year = decade ? Number(decade.slice(0, 4)) : Number.NaN;
  if (Number.isNaN(year)) {
    return NEUTRAL_SHIRT;
  }

  const clamped = Math.max(1880, Math.min(2030, year));
  const t = (clamped - 1880) / 150;
  const lightness = Math.round(76 - t * 42);
  const shadowLightness = Math.max(22, lightness - 13);
  const borderLightness = Math.min(82, lightness + 8);

  return {
    stop1: `oklch(${lightness}% 0.16 31)`,
    stop2: `oklch(${shadowLightness}% 0.13 31)`,
    color: lightness > 58 ? "oklch(18% 0.015 40)" : "var(--color-ink)",
    border: `oklch(${borderLightness}% 0.12 31 / 0.72)`,
  };
}

export function ShirtBadge({ number, decade, apps, compact = false, muted = false, uniform = false }: ShirtBadgeProps) {
  if (number == null) {
    return (
      <span className="text-ink-faint" title="Shirt number not recorded" aria-label="Shirt number not recorded">
        {compact ? "\u00a0" : "—"}
      </span>
    );
  }

  const palette = uniform ? UNIFORM_SHIRT : paletteForDecade(decade);
  const title = `${decade ?? "Unknown era"} shirt ${number}${apps ? `, ${apps} covered apps` : ""}`;
  const gradientId = `shirt-grad-${decade || "neutral"}-${uniform ? "uniform" : "era"}-${number}`;

  return (
    <span className={`inline-flex items-center ${compact ? "justify-end" : "gap-2"}`} title={title}>
      <svg
        aria-label={title}
        role="img"
        className={`${compact ? "h-7 w-7" : "h-9 w-9"} shrink-0`}
        viewBox="0 0 100 100"
        style={{
          color: palette.color,
          ...(muted ? { filter: "grayscale(0.85) brightness(0.85)", opacity: 0.55 } : null),
        }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={palette.stop1} />
            <stop offset="100%" stopColor={palette.stop2} />
          </linearGradient>
          <linearGradient id={`${gradientId}-shadow`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="black" stopOpacity="0" />
            <stop offset="100%" stopColor="black" stopOpacity="0.18" />
          </linearGradient>
        </defs>

        {/* Main Shirt Body & Sleeves (Option 1 Design) */}
        <path
          d="M 20,12 C 32,8 38,14 50,14 C 62,14 68,8 80,12 L 96,28 C 92,34 84,38 80,38 L 80,92 C 80,96 76,100 72,100 L 28,100 C 24,100 20,96 20,92 L 20,38 C 16,38 8,34 4,28 Z"
          fill={`url(#${gradientId})`}
          stroke={palette.border}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Shadow Overlay for depth (simulates inset shadow) */}
        <path
          d="M 20,12 C 32,8 38,14 50,14 C 62,14 68,8 80,12 L 96,28 C 92,34 84,38 80,38 L 80,92 C 80,96 76,100 72,100 L 28,100 C 24,100 20,96 20,92 L 20,38 C 16,38 8,34 4,28 Z"
          fill={`url(#${gradientId}-shadow)`}
          pointerEvents="none"
        />

        {/* Collar */}
        <path
          d="M 38,14 C 38,22 62,22 62,14"
          fill="none"
          stroke={palette.border}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Sleeve Seams */}
        <path
          d="M 20,38 L 29,26"
          fill="none"
          stroke={palette.border}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.6"
        />
        <path
          d="M 80,38 L 71,26"
          fill="none"
          stroke={palette.border}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.6"
        />

        {/* Player Number */}
        <text
          x="50"
          y="60"
          dominantBaseline="central"
          textAnchor="middle"
          fill="currentColor"
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
