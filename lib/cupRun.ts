/**
 * United's *run* through a cup competition in one season, modelled as a single
 * spine of stages from entry to exit. We only hold United's own matches — not the
 * other half of every tie — so a true two-sided bracket would be mostly empty
 * slots. Instead this builds the honest object: the path United actually walked,
 * each rung a tie (one match, a two-legged aggregate, or a replay) or the group
 * stage, ordered by how deep the round is.
 *
 * Round ordering mirrors {@link file://scripts/build-db.ts}'s `roundRank` exactly,
 * so the deepest stage drawn here agrees with the stored `furthest_round` and the
 * lane verdict — the sources spell the same round a dozen ways and both places
 * must canonicalise them identically.
 */
import type { MatchRow } from "./queries";

const WORD_NUM: Record<string, number> = {
  first: 1,
  second: 2,
  third: 3,
  fourth: 4,
  fifth: 5,
  sixth: 6,
};

/** Canonicalise a raw round string onto one ladder; ord ranks depth. */
function roundRank(raw: string): { name: string; ord: number } {
  const r = raw
    .replace(/\s+(?:first|second) leg$/i, "")
    .replace(/\s+(?:(?:second|2nd) )?replay$/i, "")
    .trim();
  const lc = r.toLowerCase();

  if (lc === "final") return { name: "Final", ord: 40 };
  if (lc.includes("third place")) return { name: "Third place", ord: 35 };
  if (/semi[-\s]?final/.test(lc)) return { name: "Semi-final", ord: 30 };
  if (/quarter[-\s]?final/.test(lc)) return { name: "Quarter-final", ord: 20 };
  if (/round of 16|first knockout round/.test(lc)) return { name: "Round of 16", ord: 16 };
  if (/round of 32/.test(lc)) return { name: "Round of 32", ord: 15.5 };
  if (/play-?off/.test(lc)) return { name: "Play-off round", ord: 15.2 };
  if (/group|league phase/.test(lc)) return { name: "Group stage", ord: 15 };

  const num = lc.match(/round (\d+)/) ?? lc.match(/(\d+)(?:st|nd|rd|th) round/);
  const word = lc.match(/(first|second|third|fourth|fifth|sixth) round/);
  const n = num ? Number(num[1]) : word ? WORD_NUM[word[1]] : null;
  if (n != null) return { name: `Round ${n}`, ord: 9 + n };

  if (/qualifying|preliminary/.test(lc)) {
    const q = lc.match(/(first|second|third|fourth)/);
    return { name: r, ord: 1 + (q ? WORD_NUM[q[1]] : 0) / 10 };
  }
  return { name: r, ord: 5 };
}

/** Where a stage left United: still climbing, knocked out, or the final verdict. */
export type StageOutcome = "advanced" | "out" | "winners" | "runners-up";

export interface CupTie {
  kind: "tie";
  round: string;
  ord: number;
  opponentId: string;
  opponentName: string;
  /** The leg(s) of this tie in date order: one match, two legs, or a replay. */
  legs: MatchRow[];
  format: "single" | "two-legged" | "replay";
  /** Aggregate score across the legs — only for genuine two-legged ties. */
  agg: { gf: number; ga: number } | null;
  /** The match that settled the tie (the replay, the second leg, or the only leg). */
  decisive: MatchRow;
  outcome: StageOutcome;
}

export interface CupGroup {
  kind: "group";
  label: string;
  ord: number;
  matches: MatchRow[];
  w: number;
  d: number;
  l: number;
  /** Unique opponents faced in the group, in order of first meeting. */
  opponents: { id: string; name: string }[];
  outcome: Extract<StageOutcome, "advanced" | "out">;
}

export type CupStage = CupTie | CupGroup;

export interface CupRun {
  stages: CupStage[];
}

/** A round-robin group has no round name (or a "Group …" one); a knockout tie does. */
function isGroupRound(round: string | null): boolean {
  const t = (round ?? "").trim();
  return t === "" || /group|league phase/i.test(t);
}

/**
 * Assemble United's stages for one competition in one season. Group matches
 * collapse into a single round-robin node; knockout matches fold into ties by
 * canonical round (so two legs and a replay of the same round read as one rung).
 * Advancement is read from depth, not the leg scores — United advanced from a tie
 * iff a deeper stage exists, which settles two-legged ties levelled on aggregate
 * (won on away goals or penalties) without us having to model those rules.
 */
export function buildCupRun(matches: MatchRow[]): CupRun {
  const sorted = [...matches].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const groupMatches = sorted.filter((m) => isGroupRound(m.round));

  let group: CupGroup | null = null;
  let knockout = sorted.filter((m) => !isGroupRound(m.round));

  // A real round-robin needs several matches; one or two no-round games are a
  // one-off (a shield, a super cup) and belong on the knockout spine instead.
  if (groupMatches.length >= 3) {
    const label = groupMatches.some((m) => /league phase/i.test(m.round ?? ""))
      ? "League phase"
      : "Group stage";
    let w = 0;
    let d = 0;
    let l = 0;
    const seen = new Map<string, string>();
    for (const m of groupMatches) {
      if (m.result === "W") w++;
      else if (m.result === "D") d++;
      else l++;
      if (!seen.has(m.opponent_id)) seen.set(m.opponent_id, m.opponent_name);
    }
    group = {
      kind: "group",
      label,
      ord: 15,
      matches: groupMatches,
      w,
      d,
      l,
      opponents: [...seen].map(([id, name]) => ({ id, name })),
      outcome: "out",
    };
  } else {
    knockout = sorted;
  }

  const byRound = new Map<string, MatchRow[]>();
  for (const m of knockout) {
    const { name } = roundRank(m.round ?? "");
    const arr = byRound.get(name) ?? [];
    arr.push(m);
    byRound.set(name, arr);
  }

  const ties: CupTie[] = [];
  for (const legs of byRound.values()) {
    const ord = roundRank(legs[0].round ?? "").ord;
    const twoLeg = legs.some((m) => /leg/i.test(m.round ?? ""));
    const format = twoLeg ? "two-legged" : legs.length > 1 ? "replay" : "single";
    const agg = twoLeg
      ? legs.reduce((a, m) => ({ gf: a.gf + m.gf, ga: a.ga + m.ga }), { gf: 0, ga: 0 })
      : null;
    ties.push({
      kind: "tie",
      round: roundRank(legs[0].round ?? "").name,
      ord,
      opponentId: legs[0].opponent_id,
      opponentName: legs[0].opponent_name,
      legs,
      format,
      agg,
      decisive: legs[legs.length - 1],
      outcome: "advanced",
    });
  }

  const stages: CupStage[] = [...(group ? [group] : []), ...ties].sort((a, b) => a.ord - b.ord);
  if (stages.length === 0) return { stages: [] };

  // The deepest stage is where the run ended; everything shallower was survived.
  const deepest = Math.max(...stages.map((s) => s.ord));
  for (const s of stages) {
    if (s.ord < deepest) {
      s.outcome = "advanced";
    } else if (s.kind === "tie" && s.round === "Final") {
      s.outcome = s.decisive.outcome === "W" ? "winners" : "runners-up";
    } else {
      s.outcome = "out";
    }
  }

  return { stages };
}
