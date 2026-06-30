function ThreadlineMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 58 58" fill="none" aria-hidden>
      <rect x="1" y="1" width="56" height="56" rx="14" fill="#161312" stroke="#2c2522" />
      <path d="M12 31C18 22 25 39 31 29C36 21 41 22 46 27" stroke="#ff3b1f" strokeWidth="4" strokeLinecap="round" />
      <path d="M18 17v24M40 17v24" stroke="#f3ede8" strokeWidth="3" strokeLinecap="round" />
      <circle cx="46" cy="27" r="4" fill="#ff3b1f" />
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
