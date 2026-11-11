import type { ReactNode } from "react";
import { Bead, Cord, CordSvg, Plate, Strand } from "@/components/glyphs/cord/primitives";

/*
 * Key glyphs: the legends for the plate charts, drawn in the chart's own marks
 * instead of a sentence describing them. Each key is a row of small specimens
 * (one mark, one or two words), so the reader matches shape to shape rather
 * than parsing "out for a win, on the ring for a draw, in for a loss".
 *
 * Specimens are 22 × 14 units at 22 × 14 px, always lit, decorative (the words
 * beside them carry the meaning for assistive tech).
 */

const W = 22;
const H = 14;

function Specimen({ children }: { children: ReactNode }) {
  return (
    <CordSvg size={W} unit={W * 1.15} viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="cd-lit">
      {children}
    </CordSvg>
  );
}

export function KeyItem({ mark, children }: { mark: ReactNode; children: ReactNode }) {
  return (
    <span className="key-item">
      {mark}
      <span>{children}</span>
    </span>
  );
}

function KeyRow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`key-row ${className}`}>{children}</span>;
}

// ------------------------------------------------------------- season lap

const RING_Y = 8.6;
const LAP_Y = { W: 3.4, D: RING_Y - 1.2, L: 12.2 } as const;

/** One stretch of the lap's ring with a match bead set out (win), on (draw) or in (loss). */
function LapMark({ result }: { result: "W" | "D" | "L" }) {
  const by = LAP_Y[result];
  // Quadratic through (11, by) at its midpoint: c = (4·by − 2·RING_Y) / 2.
  const c = (4 * by - 2 * RING_Y) / 2;
  return (
    <Specimen>
      <Strand d={`M1 ${RING_Y}Q11 ${RING_Y - 2.4} 21 ${RING_Y}`} dashed />
      <Cord d={`M2.5 ${RING_Y - 0.2}Q11 ${c.toFixed(2)} 19.5 ${RING_Y - 0.2}`} />
      <Bead cx={11} cy={by} r={2.3} kind={result.toLowerCase() as "w" | "d" | "l"} />
    </Specimen>
  );
}

/** Legend for `SeasonLap`: out for a win, on the ring for a draw, in for a loss. */
export function LapKey({ className }: { className?: string }) {
  return (
    <KeyRow className={className}>
      <KeyItem mark={<LapMark result="W" />}>won</KeyItem>
      <KeyItem mark={<LapMark result="D" />}>drew</KeyItem>
      <KeyItem mark={<LapMark result="L" />}>lost</KeyItem>
    </KeyRow>
  );
}

// ------------------------------------------------------------- career cord

/** Legend for `CareerCord`: girth is matches, bead size is goals (or clean sheets), gold is a medal. */
export function CareerKey({
  markLabel,
  medal,
  floor,
  className,
}: {
  markLabel: string;
  medal: boolean;
  floor: boolean;
  className?: string;
}) {
  return (
    <KeyRow className={className}>
      <KeyItem
        mark={
          <Specimen>
            <Plate d="M1 7L21 2.6V11.4Z" strong />
            <Cord d="M1.5 7H20.5" />
          </Specimen>
        }
      >
        matches
      </KeyItem>
      <KeyItem
        mark={
          <Specimen>
            <Strand d="M1 7H21" />
            <Bead cx={3.6} cy={7} r={1.4} kind="pale" />
            <Bead cx={9.6} cy={7} r={2.2} kind="pale" />
            <Bead cx={17.2} cy={7} r={3.3} kind="pale" />
          </Specimen>
        }
      >
        {markLabel}
      </KeyItem>
      {medal && (
        <KeyItem
          mark={
            <Specimen>
              <Strand d="M1 7H21" />
              <Bead cx={11} cy={7} r={3} kind="gold" />
            </Specimen>
          }
        >
          medal
        </KeyItem>
      )}
      {floor && (
        <KeyItem
          mark={
            <Specimen>
              <Strand d="M1 7H21" />
              <circle cx={11} cy={7} r={2.8} className="key-floor" />
            </Specimen>
          }
        >
          partly recorded
        </KeyItem>
      )}
    </KeyRow>
  );
}

// ------------------------------------------------------------- rivalry cord

/** Legend for `RivalryCord`: a step up per United win, down per defeat, a pale bead where the lead changed. */
export function RivalryKey({ swaps, className }: { swaps: number; className?: string }) {
  return (
    <KeyRow className={className}>
      <KeyItem
        mark={
          <Specimen>
            <Strand d="M1 10H21" dashed />
            <Cord d="M1.5 10H9V4H20.5" />
          </Specimen>
        }
      >
        United win
      </KeyItem>
      <KeyItem
        mark={
          <Specimen>
            <Strand d="M1 4H21" dashed />
            <Cord d="M1.5 4H9V10H20.5" />
          </Specimen>
        }
      >
        defeat
      </KeyItem>
      {swaps > 0 && (
        <KeyItem
          mark={
            <Specimen>
              <Strand d="M1 7H21" dashed />
              <Cord d="M1.5 10.5L20.5 3.5" />
              <Bead cx={11} cy={7} r={2.4} kind="pale" />
            </Specimen>
          }
        >
          lead changed <span className="stat-num text-ink-dim">×{swaps}</span>
        </KeyItem>
      )}
    </KeyRow>
  );
}

// ------------------------------------------------------------- match flow

/** Legend for `MatchFlow`'s widened stoppage-time zone. */
export function StoppageKey({ className }: { className?: string }) {
  return (
    <KeyRow className={className}>
      <KeyItem
        mark={
          <Specimen>
            <Plate d="M13 2.5H21V11.5H13Z" />
            <Strand d="M13 2.5V11.5" />
            <Cord d="M1.5 7H20.5" />
          </Specimen>
        }
      >
        stoppage time, drawn wider
      </KeyItem>
    </KeyRow>
  );
}

// ------------------------------------------------------------- club thread

/** The league cord broken where no league was played (the wars). */
export function NoLeagueMark() {
  return (
    <Specimen>
      <Cord d="M1.5 5L6.5 9" />
      <Strand d="M7.5 9H14.5" dashed />
      <Cord d="M15.5 9L20.5 4" />
    </Specimen>
  );
}

/** Managers' reigns as the segmented rule beneath the cord. */
export function ReignMark() {
  return (
    <Specimen>
      <Strand d="M1 6H21" />
      <Plate d="M1 9.5H9V11.5H1ZM10.5 9.5H21V11.5H10.5Z" strong />
    </Specimen>
  );
}
