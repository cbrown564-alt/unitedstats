import { useId } from "react";

function ThreadlineMark({ size = 34 }: { size?: number }) {
  const clipId = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 58 58" fill="none" aria-hidden>
      <defs>
        <clipPath id={clipId}>
          <rect x="1" y="1" width="56" height="56" rx="14" />
        </clipPath>
      </defs>
      <rect x="1" y="1" width="56" height="56" rx="14" fill="#161312" stroke="#2c2522" strokeWidth="1.5" />
      <g clipPath={`url(#${clipId})`} stroke="#ff3b1f" strokeWidth="2.5" strokeLinecap="round">
        {/* Crest: loose end near the bottom point, up the left edge, pointed
            peak, sharp right shoulder, then the edge fuses into the thread */}
        <path
          d="M 27.8 47.0
             C 25.9 45.6 23.4 43.9 21.2 41.8
             C 18.0 38.9 15.4 35.3 13.9 31.4
             C 12.6 28.0 11.8 24.4 11.4 20.6
             C 11.1 17.9 11.0 15.9 11.0 14.2
             C 16.3 13.5 22.5 10.9 27.4 8.2
             C 33.4 10.0 42.0 11.6 47.0 13.4
             C 47.2 16.6 46.6 20.0 45.9 22.5
             C 45.5 23.9 44.9 25.0 44.3 26.2"
          strokeLinejoin="miter"
          strokeMiterlimit="10"
        />
        {/* Thread: exits the tile at the bottom, S-curves past the bottom
            point, climbs the right side, spirals in to end below the eye */}
        <path
          d="M 25.9 59.5
             C 26.2 56.5 26.5 54.5 27.3 52.3
             C 28.2 49.9 29.5 48.6 30.9 47.2
             C 32.4 45.7 33.6 44.2 34.6 42.6
             C 36.1 40.2 38.8 36.4 40.9 33.0
             C 42.5 30.4 43.6 28.3 44.3 26.2
             C 44.9 24.4 45.2 22.9 45.1 21.4
             C 44.9 18.9 43.9 16.9 42.0 15.4
             C 40.6 14.3 39.0 13.9 37.3 13.9
             C 35.2 13.9 33.0 14.5 31.4 15.9
             C 30.4 16.8 29.8 17.4 29.3 18.4
             C 28.7 19.9 28.4 21.6 28.5 23.3
             C 28.6 25.0 29.1 26.3 30.0 27.5
             C 30.9 28.6 32.1 29.3 33.5 29.6
             C 34.5 29.8 35.3 29.7 36.3 29.5"
          strokeLinejoin="round"
        />
        {/* The eye */}
        <circle cx="35.8" cy="23.6" r="2.3" fill="#ff3b1f" stroke="none" />
      </g>
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
