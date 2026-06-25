import { QUESTIONS } from "./questions";
import { questionHeadlines } from "./questionHeadlines";
import { CURATED_CUTS, cutHref, curatedCut, runCut } from "./cut";
import { clubRecords } from "./trails";
import { scoreline, venuePrefix, fmtNum } from "./format";

export type SurpriseTone = "devil" | "gold" | "win";

/**
 * One curated, genuinely-surprising morsel for the wanderer's "surprise me" door
 * (Phase 18.3). A fact is *small on purpose*: a headline figure and a sharp line
 * that completes it, plus the door to its full receipt. The reveal surface shows
 * one at a time and re-rolls in place, so the wanderer gets "one surprising fact,
 * then another" without ever reading a whole page first.
 *
 * The pool is curated, not random noise: every fact is drawn from a tested
 * question, a curated Cut, or a club record — the same honest, reproducible
 * figures the rest of the site links to. Static guardrail intact (no behaviour,
 * no model); the rolling is a deterministic walk over this fixed set.
 */
export interface SurpriseFact {
  /** Stable id — React reveal key and de-dupe. */
  id: string;
  kind: "question" | "cut" | "record";
  /** What kind of find this is, in the wanderer's words. */
  eyebrow: string;
  /** The big number/scoreline that *is* the surprise. */
  figure: string;
  /** The clause that completes the figure into a sentence. */
  line: string;
  href: string;
  /** The door's verb ("See the full finding", "Open the cut", "See the match"). */
  cta: string;
  tone: SurpriseTone;
}

/** The year of an ISO date, for a record's one-line provenance. */
function yearOf(iso: string): string {
  return iso.slice(0, 4);
}

/**
 * Assemble the curated fact pool. Reads the live db (question headlines, three
 * curated-cut headlines, the club records) — a handful of light queries, run once
 * per `/surprise` request. Order is stable; the reveal shuffles client-side.
 */
export function surpriseFacts(): SurpriseFact[] {
  const facts: SurpriseFact[] = [];

  // The nine tested myths — each headline is already a figure + a sharp clause.
  const headlines = questionHeadlines();
  for (const q of QUESTIONS) {
    const h = headlines[q.slug];
    if (!h || h.stat === "—") continue;
    facts.push({
      id: `q-${q.slug}`,
      kind: "question",
      eyebrow: "A myth, tested",
      figure: h.stat,
      line: h.gloss,
      href: `/questions/${q.slug}`,
      cta: "See the full finding",
      tone: h.tone,
    });
  }

  // The curated cuts — the standout group each one surfaces.
  for (const c of CURATED_CUTS) {
    const spec = curatedCut(c);
    const head = runCut(spec, 8).headline;
    if (!head) continue;
    facts.push({
      id: `cut-${c.slug}`,
      kind: "cut",
      eyebrow: "A way to slice the record",
      figure: head.figure,
      line: `${head.metric} · ${head.subject} — ${head.gloss}`,
      href: cutHref(spec),
      cta: "Open the cut",
      tone: "gold",
    });
  }

  // The club's all-time peaks — scorelines and crowds that land on their own.
  const rec = clubRecords();
  if (rec.biggestWin) {
    const m = rec.biggestWin;
    facts.push({
      id: "rec-biggest-win",
      kind: "record",
      eyebrow: "A club record",
      figure: scoreline(m.gf, m.ga),
      line: `${venuePrefix(m.venue)} ${m.opponent_name} in ${yearOf(m.date)} — United's biggest win`,
      href: `/match/${m.id}`,
      cta: "See the match",
      tone: "win",
    });
  }
  if (rec.heaviestDefeat) {
    const m = rec.heaviestDefeat;
    facts.push({
      id: "rec-heaviest-defeat",
      kind: "record",
      eyebrow: "A club record (the other kind)",
      figure: scoreline(m.gf, m.ga),
      line: `${venuePrefix(m.venue)} ${m.opponent_name} in ${yearOf(m.date)} — the heaviest defeat on record`,
      href: `/match/${m.id}`,
      cta: "See the match",
      tone: "devil",
    });
  }
  if (rec.recordCrowd?.attendance) {
    const m = rec.recordCrowd;
    facts.push({
      id: "rec-crowd",
      kind: "record",
      eyebrow: "A club record",
      figure: fmtNum(m.attendance),
      line: `watched ${venuePrefix(m.venue)} ${m.opponent_name} in ${yearOf(m.date)} — United's record crowd`,
      href: `/match/${m.id}`,
      cta: "See the match",
      tone: "gold",
    });
  }
  if (rec.mostGoalsInSeason) {
    const s = rec.mostGoalsInSeason;
    facts.push({
      id: "rec-most-goals-season",
      kind: "record",
      eyebrow: "A club record",
      figure: fmtNum(s.gf),
      line: `goals across ${s.season} — United's highest-scoring season`,
      href: `/seasons/${s.season}`,
      cta: "Open the season",
      tone: "gold",
    });
  }

  return facts;
}

/** Pick an index into a pool of length `len`. `rng` is injectable so the server's
 *  initial pick is testable; the route passes `Math.random`. */
export function pickIndex(len: number, rng: () => number = Math.random): number {
  return Math.min(len - 1, Math.max(0, Math.floor(rng() * len)));
}
