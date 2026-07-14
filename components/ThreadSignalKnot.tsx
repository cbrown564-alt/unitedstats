/**
 * The homepage match thread reduced to one signal: a swaying red filament,
 * one tied loop, and the gold bead that marks a United goal.
 */
export function ThreadSignalKnot() {
  const thread =
    "M 2 20 C 10 6, 18 33, 29 20 C 34 14, 38 12, 42 12 A 7 7 0 1 1 42 26 A 7 7 0 1 1 42 12 C 50 14, 55 29, 66 15";

  return (
    <svg
      viewBox="0 0 68 40"
      className="h-9 w-[4.25rem] shrink-0 overflow-visible"
      fill="none"
      aria-hidden
    >
      <path
        d={thread}
        pathLength={1}
        className="thread-path"
        stroke="rgb(255 59 31)"
        strokeOpacity="0.2"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: "blur(2px)" }}
      />
      <path
        d={thread}
        pathLength={1}
        className="thread-path"
        stroke="rgb(255 59 31)"
        strokeOpacity="0.82"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <g className="thread-knot" style={{ animationDelay: "620ms" }}>
        <circle cx="42" cy="19" r="8.5" fill="rgb(245 197 24)" fillOpacity="0.12" />
        <circle cx="42" cy="19" r="4" fill="rgb(245 197 24)" stroke="#fff4d4" strokeWidth="1" />
        <circle cx="42" cy="19" r="1.2" fill="#fff4d4" />
      </g>
    </svg>
  );
}
