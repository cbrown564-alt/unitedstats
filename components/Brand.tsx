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
      <g
        clipPath={`url(#${clipId})`}
        stroke="#ff3b1f"
        strokeWidth="2.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* A proper football-crest silhouette, drawn as a single strand. */}
        <path
          d="M 29 8.6
             C 24.1 11.3 18.1 13.3 11.4 14.5
             C 11.6 25.3 12.7 32.7 17.2 38.7
             C 20.3 42.8 24.4 46.1 29 48.7
             C 33.6 46.1 37.7 42.8 40.8 38.7
             C 45.3 32.7 46.4 25.3 46.6 14.5
             C 39.9 13.3 33.9 11.3 29 8.6 Z"
        />

        {/* A quieter inner strand gives the shield the layered construction
            of an old embroidered badge. */}
        <path
          d="M 15.2 23.9
             C 20.4 22.0 25.3 21.9 29.7 23.8
             C 35.2 26.1 38.8 30.9 40.4 36.8"
          opacity="0.58"
        />

        {/* The live thread enters from below, follows the shield point, then
            coils into an open knot. The dark halo creates an over/under weave. */}
        <path
          d="M 25.6 59.5
             C 25.7 54.3 26.7 50.6 29 47.7
             C 31.1 45.0 34.3 42.5 36.6 39.3
             C 39.3 35.5 41.2 31.6 41.0 27.3
             C 40.7 22.0 37.5 18.6 33.0 18.3
             C 28.5 18.1 24.9 20.6 24.2 24.2
             C 23.5 27.8 25.6 30.8 29.3 31.5
             C 32.7 32.1 35.6 30.0 35.9 27.1
             C 36.1 25.0 35.0 23.5 33.3 22.9"
          stroke="#161312"
          strokeWidth="5.9"
        />
        <path
          d="M 25.6 59.5
             C 25.7 54.3 26.7 50.6 29 47.7
             C 31.1 45.0 34.3 42.5 36.6 39.3
             C 39.3 35.5 41.2 31.6 41.0 27.3
             C 40.7 22.0 37.5 18.6 33.0 18.3
             C 28.5 18.1 24.9 20.6 24.2 24.2
             C 23.5 27.8 25.6 30.8 29.3 31.5
             C 32.7 32.1 35.6 30.0 35.9 27.1
             C 36.1 25.0 35.0 23.5 33.3 22.9"
        />

        {/* A short overpass makes the knot read as woven, not merely tangled. */}
        <path d="M 27.4 31.0 C 29.8 31.9 32.1 31.4 33.8 30.0" stroke="#161312" strokeWidth="5.9" />
        <path d="M 27.4 31.0 C 29.8 31.9 32.1 31.4 33.8 30.0" />
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
