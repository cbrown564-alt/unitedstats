function ThreadlineMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 58 58" fill="none" aria-hidden>
      <rect x="1" y="1" width="56" height="56" rx="14" fill="#161312" stroke="#2c2522" strokeWidth="1.5" />
      {/* Left shield side (dimmer) */}
      <path
        d="M 29,44 C 20,40 14,32 14,19 C 14,15 22,14 29,14"
        stroke="#ff3b1f"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.45"
      />
      {/* Right shield (backing mask) */}
      <path
        d="M 27,58 C 27,52 28,47 29,44 C 38,40 44,32 44,19 C 44,15 36,14 29,14 C 29,19 29,24 29,29"
        stroke="#161312"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Right shield (bright stroke) */}
      <path
        d="M 27,58 C 27,52 28,47 29,44 C 38,40 44,32 44,19 C 44,15 36,14 29,14 C 29,19 29,24 29,29"
        stroke="#ff3b1f"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Left shield top overlay (backing mask) */}
      <path
        d="M 14,19 C 14,15 22,14 29,14"
        stroke="#161312"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Left shield top overlay (actual stroke) */}
      <path
        d="M 14,19 C 14,15 22,14 29,14"
        stroke="#ff3b1f"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.45"
      />
      {/* Center dot */}
      <circle cx="29" cy="29" r="2.0" fill="#ff3b1f" />
    </svg>
  );
}

export function RedThreadWordmark({
  compactOnMobile = false,
  hideText = false,
  markSize = 34,
}: {
  compactOnMobile?: boolean;
  hideText?: boolean;
  markSize?: number;
}) {
  return (
    <span className="inline-flex shrink-0 items-center gap-2.5 text-ink" aria-label="Red Thread">
      <ThreadlineMark size={markSize} />
      {!hideText && (
        <span className={["display text-base leading-none", compactOnMobile ? "hidden sm:inline" : ""].join(" ")}>
          <span className="text-devil-bright">Red</span> Thread
        </span>
      )}
    </span>
  );
}
