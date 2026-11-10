import { Bead, Cord, CordSvg, Strand } from "@/components/glyphs/cord/primitives";

/**
 * The rediscovery mark, in Cord: a slack thread that ties one loop round a
 * proven bead (the night worth pulling on) and runs on. Static; it marks a
 * prompt, it does not perform.
 */
export function ThreadSignalKnot() {
  return (
    <CordSvg
      size={36}
      unit={40}
      viewBox="0 0 68 40"
      width={68}
      height={40}
      className="cd-lit h-9 w-[4.25rem] shrink-0"
    >
      <Strand d="M2 30H66" dashed />
      <Cord d="M2 30C10 30 16 14 26 18C33 21 33 27 40 27A8 8 0 1 0 32 19C34 25 46 30 54 22C58 18 61 14 66 13" />
      <Bead cx={40} cy={19} r={4.4} />
    </CordSvg>
  );
}
