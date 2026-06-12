interface ShirtBadgeProps {
  number: number | null | undefined;
  decade?: string | null;
  apps?: number | null;
  compact?: boolean;
}

function paletteForDecade(decade?: string | null): { background: string; color: string; border: string } {
  const year = decade ? Number(decade.slice(0, 4)) : Number.NaN;
  if (Number.isNaN(year)) {
    return {
      background: "linear-gradient(135deg, #1f1a18 0 50%, #2c2522 50% 100%)",
      color: "var(--color-ink-dim)",
      border: "rgb(168 156 148 / 0.35)",
    };
  }
  if (year < 1900) {
    return {
      background: "linear-gradient(90deg, #1d5f4a 0 50%, #f5c518 50% 100%)",
      color: "#11100f",
      border: "rgb(245 197 24 / 0.7)",
    };
  }
  if (year < 1940) {
    return {
      background: "linear-gradient(135deg, #bb1d12 0 62%, #f3ede8 62% 72%, #bb1d12 72% 100%)",
      color: "#fff7f2",
      border: "rgb(255 59 31 / 0.65)",
    };
  }
  if (year < 1970) {
    return {
      background: "linear-gradient(180deg, #d8210d 0 58%, #f3ede8 58% 64%, #d8210d 64% 100%)",
      color: "#fff7f2",
      border: "rgb(243 237 232 / 0.55)",
    };
  }
  if (year < 1990) {
    return {
      background: "linear-gradient(90deg, #b8160b 0 40%, #11100f 40% 46%, #d8210d 46% 100%)",
      color: "#fff7f2",
      border: "rgb(216 33 13 / 0.6)",
    };
  }
  if (year < 2010) {
    return {
      background: "linear-gradient(135deg, #d8210d 0 44%, #11100f 44% 52%, #f3ede8 52% 58%, #d8210d 58% 100%)",
      color: "#fff7f2",
      border: "rgb(243 237 232 / 0.6)",
    };
  }
  if (year < 2020) {
    return {
      background: "linear-gradient(180deg, #e32613 0 70%, #11100f 70% 76%, #e32613 76% 100%)",
      color: "#fff7f2",
      border: "rgb(255 59 31 / 0.72)",
    };
  }
  return {
    background: "linear-gradient(135deg, #c9160a 0 50%, #f5c518 50% 55%, #9e1309 55% 100%)",
    color: "#fff7f2",
    border: "rgb(245 197 24 / 0.55)",
  };
}

export function ShirtBadge({ number, decade, apps, compact = false }: ShirtBadgeProps) {
  if (number == null) {
    return <span className="text-ink-faint">{compact ? "--" : "No shirt data"}</span>;
  }

  const palette = paletteForDecade(decade);
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
