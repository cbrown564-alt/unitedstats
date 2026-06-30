const stroke = {
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export type NavIconId =
  | "discover"
  | "matches"
  | "seasons"
  | "players"
  | "managers"
  | "opponents"
  | "analytics"
  | "transfers"
  | "data";

export function NavIcon({ id, className }: { id: NavIconId; className?: string }) {
  const props = { ...stroke, className, "aria-hidden": true as const };

  switch (id) {
    case "discover":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" {...props}>
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
      );
    case "matches":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" {...props}>
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <circle cx="12" cy="12" r="3" />
          <path d="M8 3v3h8V3" />
          <path d="M8 21v-3h8v3" />
        </svg>
      );
    case "seasons":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" {...props}>
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="6" y1="8" x2="6" y2="12" />
          <circle cx="6" cy="6" r="2" />
          <line x1="12" y1="12" x2="12" y2="16" />
          <circle cx="12" cy="18" r="2" />
          <line x1="18" y1="8" x2="18" y2="12" />
          <circle cx="18" cy="6" r="2" />
        </svg>
      );
    case "players":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" {...props}>
          <path d="M 5,3 C 8,2 9,3.5 12,3.5 C 15,3.5 16,2 19,3 L 23,7 C 22,8.5 20,9.5 19,9.5 L 19,21 C 19,21.5 18.5,22 18,22 L 6,22 C 5.5,22 5,21.5 5,21 L 5,9.5 C 4,9.5 2,8.5 1,7 Z" />
          <path d="M 9,3.5 C 9,5.5 15,5.5 15,3.5" />
          <path d="M 5,9.5 L 7,6.5" opacity="0.6" />
          <path d="M 19,9.5 L 17,6.5" opacity="0.6" />
        </svg>
      );
    case "managers":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" {...props}>
          <circle cx="12" cy="7" r="4" />
          <path d="M20 21v-2a4 4 0 0 0-4-4h-2l-2 3-2-3H8a4 4 0 0 0-4 4v2" />
          <path d="M12 18L11 22L12 23.5L13 22Z" />
        </svg>
      );
    case "opponents":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" {...props}>
          <path d="M12 3 4 7v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V7l-8-4z" />
          <line x1="12" y1="3" x2="12" y2="22" />
        </svg>
      );
    case "analytics":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" {...props}>
          <path d="M3 3v18h18" />
          <path d="m19 9-5 5-4-4-3 3" />
        </svg>
      );
    case "transfers":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" {...props}>
          <path d="m17 2 4 4-4 4" />
          <path d="M21 6H3" />
          <path d="m7 22-4-4 4-4" />
          <path d="M3 18h18" />
        </svg>
      );
    case "data":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" {...props}>
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M3 5v14a9 3 0 0 0 18 0V5" />
          <path d="M3 12a9 3 0 0 0 18 0" />
        </svg>
      );
    default: {
      const _exhaustive: never = id;
      return _exhaustive;
    }
  }
}
