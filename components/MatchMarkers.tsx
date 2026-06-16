/**
 * Small inline event markers for teamsheets: a football beside a scorer's name,
 * and a booking card. Kept monochrome-friendly so they sit quietly on the pitch
 * rather than shouting like emoji. A second yellow is rendered by the caller as a
 * single red, matching how a sending-off actually reads.
 */

function BallSvg() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden className="shrink-0">
      <circle cx="12" cy="12" r="10" fill="#f4f1ea" stroke="#141414" strokeWidth="1.4" />
      <path
        d="M12 8.8 15.04 11.01 13.88 14.59 10.12 14.59 8.96 11.01Z"
        fill="#141414"
      />
      <path
        d="M12 8.8 12 2 M15.04 11.01 21.51 8.91 M13.88 14.59 17.88 20.09 M10.12 14.59 6.12 20.09 M8.96 11.01 2.49 8.91"
        fill="none"
        stroke="#141414"
        strokeWidth="1.1"
      />
    </svg>
  );
}

function BootSvg() {
  // Low-cut football boot, side-on, toe to the right: a heel, an ankle-opening
  // notch on top, a sloping laced instep to a rounded toe, and three studs on
  // the sole — the features that make it read as a boot rather than a welly.
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" aria-hidden className="shrink-0">
      <path
        d="M3 13.8 Q2.9 12.2 4.6 11.8 L7.4 11 Q9.2 10.4 10.8 10.6 Q11.8 10.8 12.6 12.2
           Q13.8 12.9 15 12.2 Q16.4 11.5 17.2 10.2 Q17.9 9.4 19 9.8 Q21 10.4 20.8 12.6
           Q20.6 14.6 20 15.2 L17.9 15.2 L17.2 17.3 L16.5 15.2 L14.2 15.2 L13.5 17.3
           L12.8 15.2 L10.5 15.2 L9.8 17.3 L9.1 15.2 L6.8 15.2 L6.1 17.3 L5.4 15.2
           L4.4 15.2 Q3 15.2 3 13.8 Z"
        fill="#f5f3ee"
        stroke="#141414"
        strokeWidth="0.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** A football, optionally with a ×N multiplier for a brace/hat-trick. */
export function GoalMark({ count = 1 }: { count?: number }) {
  return (
    <span
      className="inline-flex items-center gap-0.5 align-middle"
      aria-label={count > 1 ? `${count} goals` : "goal"}
    >
      <BallSvg />
      {count > 1 && <span className="stat-num text-[9px] leading-none text-ink-dim">&times;{count}</span>}
    </span>
  );
}

/** A boot, the assist convention; muted so it reads as secondary to a goal. */
export function AssistMark({ count = 1 }: { count?: number }) {
  return (
    <span
      className="inline-flex items-center gap-0.5 align-middle text-ink-faint"
      aria-label={count > 1 ? `${count} assists` : "assist"}
    >
      <BootSvg />
      {count > 1 && <span className="stat-num text-[9px] leading-none text-ink-dim">&times;{count}</span>}
    </span>
  );
}

/** A booking card; `red` covers both straight reds and second yellows. */
export function CardMark({ type, className = "" }: { type: "yellow" | "red"; className?: string }) {
  return (
    <span
      aria-label={`${type} card`}
      title={`${type} card`}
      className={`inline-block h-3.5 w-2.5 rounded-[1px] shadow-[0_1px_2px_rgba(0,0,0,0.5)] ${className}`}
      style={{ background: type === "red" ? "var(--color-loss)" : "var(--color-gold)" }}
    />
  );
}
