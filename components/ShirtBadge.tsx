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

const NEUTRAL_SHIRT = {
  background: "linear-gradient(180deg, oklch(35% 0.01 40), oklch(22% 0.01 40))",
  color: "var(--color-ink-dim)",
  border: "rgb(168 156 148 / 0.35)",
} as const;

// One dark United red, used for every uniform row — the shirt without the era grade.
const UNIFORM_SHIRT = {
  background: "linear-gradient(180deg, oklch(40% 0.16 31), oklch(27% 0.13 31))",
  color: "var(--color-ink)",
  border: "oklch(46% 0.13 31 / 0.7)",
} as const;

function paletteForDecade(decade?: string | null): { background: string; color: string; border: string } {
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
    background: `linear-gradient(180deg, oklch(${lightness}% 0.16 31), oklch(${shadowLightness}% 0.13 31))`,
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

  return (
    <span className={`inline-flex items-center ${compact ? "justify-end" : "gap-2"}`} title={title}>
      <span
        aria-label={title}
        className={`${compact ? "h-7 w-7 text-[0.68rem]" : "h-9 w-9 text-xs"} stat-num grid place-items-center border font-semibold shadow-[inset_0_-8px_14px_rgb(0_0_0_/0.18)]`}
        style={{
          background: palette.background,
          color: palette.color,
          borderColor: palette.border,
          clipPath: "polygon(18% 0, 35% 0, 42% 12%, 58% 12%, 65% 0, 82% 0, 100% 24%, 82% 42%, 82% 100%, 18% 100%, 18% 42%, 0 24%)",
          ...(muted ? { filter: "grayscale(0.85) brightness(0.85)", opacity: 0.55 } : null),
        }}
      >
        {number}
      </span>
      {!compact && (
        <span className="min-w-0">
          <span className="stat-num block text-sm text-ink">#{number}</span>
          {decade && <span className="block text-[0.65rem] uppercase tracking-[0.14em] text-ink-faint">{decade}</span>}
        </span>
      )}
    </span>
  );
}
