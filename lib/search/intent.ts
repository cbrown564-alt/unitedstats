import { getDb } from "../db";
import { findMatches, matchWhere, type MatchFilter, type Record_ } from "../queries";
import { queryString } from "../url";
import { scoreline, fmtDate } from "../format";
import { resolveEntity } from "./resolve";

/** Coverage grade carried beside a shaped verdict so the trust signal travels with
 *  the answer into the typeahead — the gap DISCOVERY §6 names. Derived, never
 *  invented: the result-level W/D/L record is complete for every official match, so
 *  record cuts grade `complete`; an event-derived answer (minute-stamped goals)
 *  grades `partial`. */
export interface AnswerCoverage {
  grade: "complete" | "partial";
  /** Short label for the chip ("complete" / "timed-goal data"). */
  label: string;
}

export interface ShapedAnswer {
  title: string;
  summary: string;
  href: string;
  hrefLabel: string;
  coverage?: AnswerCoverage;
  /** A best guess from question-shape alone (no trigger word) — the renderer frames
   *  it as "Did you mean…?" rather than asserting it. */
  tentative?: boolean;
}

/** The result-level record (W/D/L from `matches`) is complete for every official
 *  match, so every record cut shares one honest grade. */
const RESULT_COVERAGE: AnswerCoverage = { grade: "complete", label: "complete" };

// ---------------------------------------------------------------- record helpers

/** W/D/L/goals record for any matches slice, expressed through the shared filter
 * compiler so a shaped answer reads the exact rows the matches browser would. */
function recordFor(f: MatchFilter): Record_ {
  const { cond, params } = matchWhere(f);
  return getDb()
    .prepare(
      `SELECT COUNT(*) p, COALESCE(SUM(m.result='W'),0) w, COALESCE(SUM(m.result='D'),0) d,
              COALESCE(SUM(m.result='L'),0) l, COALESCE(SUM(m.gf),0) gf, COALESCE(SUM(m.ga),0) ga
       FROM matches m JOIN competitions c ON c.id = m.competition_id ${cond}`,
    )
    .get(params) as Record_;
}

function recText(r: Record_): string {
  if (!r.p) return "no matches on record";
  const winPct = ((100 * r.w) / r.p).toFixed(1);
  return `P${r.p} W${r.w} D${r.d} L${r.l} · ${winPct}% won · GF ${r.gf} GA ${r.ga}`;
}

/** /matches link from a filter — years stay bare so the page's `from`/`to` accept them. */
function matchesHref(p: Record<string, string | number | undefined>): string {
  return `/matches${queryString(p)}`;
}

// ---------------------------------------------------------------- scope parser

interface Scope {
  /** Query filter with ISO date bounds, ready for {@link recordFor}/{@link findMatches}. */
  filter: MatchFilter;
  /** Link params for /matches (years left bare). */
  link: Record<string, string | undefined>;
  venue?: "H" | "A";
  venueWord?: string;
  decadeLabel?: string;
  seasonLabel?: string;
  managerName?: string;
  scopeLabel?: string;
  /** Whether any head-to-head/record trigger word or verb was present (a confident
   *  signal to compute a head-to-head). */
  triggered: boolean;
  /** Whether the query has interrogative shape ("did/have/ever/how many times…").
   *  Question-shape plus a single strong opponent yields a *tentative* best guess
   *  even with no trigger word — the DISCOVERY §5 fallback. */
  question: boolean;
  /** Residual phrase after every recognised fragment is stripped. */
  rest: string;
}

// Verbs that signal a head-to-head intent in natural phrasing ("beat barcelona",
// "lost to liverpool", "better than city"). Deliberately excludes bare win/won/lost
// so a superlative ("biggest win in the 90s") is never mistaken for an opponent cut.
// Global so every occurrence is stripped, leaving a clean residual to resolve.
const H2H_VERBS =
  /\b(beat|beaten|beating|beats|thrash(?:ed|ing|es)?|hammer(?:ed|ing|s)?|lost to|lose to|losing to|drew with|draw with|drawn with|faced?|met|play(?:ed|ing)? against|win against|won against|better than|worse than)\b/g;

// Interrogative / question-shape markers ("did united ever…", "how many times…").
const QUESTION_WORDS =
  /\b(have|has|had|did|do|does|when|ever|are|is|was|were|how many times|how often|how many)\b/g;

/** Strip every match of `re` from `s`, reporting whether anything was removed — so a
 *  global regex stays confined to `.replace` and never carries `lastIndex` state into
 *  a separate `.test` call. */
function stripAll(s: string, re: RegExp): { out: string; hit: boolean } {
  const out = s.replace(re, " ");
  return { out, hit: out !== s };
}

const decadeBase = (d: string): number =>
  d.length === 4 ? Number(d) : Number(d) >= 30 ? 1900 + Number(d) : 2000 + Number(d);

/**
 * Pull every recognised modifier out of a normalised query — venue, decade,
 * season, manager, and a small set of competition scopes — leaving a residual
 * phrase for entity resolution. Decoupling phrasing (here) from computation (the
 * templates) is what lets many spellings reach the same answer.
 */
function parseScope(norm: string): Scope {
  let rest = ` ${norm} `;
  const filter: MatchFilter = {};
  const link: Record<string, string | undefined> = {};
  const scope: Partial<Scope> = {};
  let triggered = false;
  let question = false;

  const strip = (re: RegExp): RegExpExecArray | null => {
    const m = re.exec(rest);
    if (m) rest = `${rest.slice(0, m.index)} ${rest.slice(m.index + m[0].length)}`.replace(/\s+/g, " ");
    return m;
  };

  // venue — "at home" before bare "home" so the longer phrase wins
  if (strip(/\b(?:away|on the road)\b/)) {
    filter.venue = "A"; link.venue = "A"; scope.venue = "A"; scope.venueWord = "away";
  } else if (strip(/\bat home\b/) || strip(/\bhome\b/)) {
    filter.venue = "H"; link.venue = "H"; scope.venue = "H"; scope.venueWord = "at home";
  }

  // explicit season "1998-99" / "1998/99"
  const season = strip(/\b(\d{4})\s*[/–-]\s*(\d{2,4})\b/);
  if (season) {
    const s = `${season[1]}-${(Number(season[1]) + 1).toString().slice(2)}`;
    filter.season = s; link.season = s; scope.seasonLabel = s;
  }

  // decade "90s" / "1990s" / "in the 90s"
  const decade = strip(/\b(?:in\s+)?(?:the\s+)?((?:19|20)\d{2}|\d{2})s\b/);
  if (decade && !season) {
    const base = decadeBase(decade[1]);
    filter.from = `${base}-01-01`; filter.to = `${base + 9}-12-31`;
    link.from = String(base); link.to = String(base + 9);
    scope.decadeLabel = `${base}s`;
  }

  // manager "under X" (not the late-goals special case, handled by its own trigger)
  const under = /\bunder\s+(.+?)\s*$/.exec(rest);
  if (under) {
    const mg = resolveEntity(under[1], "manager");
    if (mg) {
      filter.manager = mg.entity_id; scope.managerName = mg.label; triggered = true;
      rest = rest.slice(0, under.index).replace(/\s+/g, " ");
    }
  }

  // a small, high-traffic set of competition scopes
  if (strip(/\bin europe\b/) || strip(/\beurope(?:an)?\b/)) {
    filter.type = "european"; link.type = "european"; scope.scopeLabel = "in Europe";
  } else if (strip(/\bfa cup\b/)) {
    filter.type = "domestic-cup"; link.type = "domestic-cup"; scope.scopeLabel = "in the FA Cup";
  } else if (strip(/\bleague cup\b/)) {
    filter.type = "league-cup"; link.type = "league-cup"; scope.scopeLabel = "in the League Cup";
  } else if (strip(/\bin (?:the )?cups?\b/)) {
    filter.type = "cup"; link.type = "cup"; scope.scopeLabel = "in the cups";
  } else if (strip(/\bin (?:the )?league\b/)) {
    filter.type = "league"; link.type = "league"; scope.scopeLabel = "in the league";
  }

  // head-to-head verbs in natural phrasing ("beat barcelona", "lost to liverpool")
  const verbs = stripAll(rest, H2H_VERBS);
  if (verbs.hit) { triggered = true; rest = verbs.out; }

  // interrogative shape — a softer signal that drives the tentative best guess
  const qwords = stripAll(rest, QUESTION_WORDS);
  if (qwords.hit) { question = true; rest = qwords.out; }

  // explicit head-to-head / record trigger words
  if (/\b(record|records|results?|vs|versus|v|against|h2h|head to head)\b/.test(rest)) triggered = true;
  rest = rest.replace(/\b(record|records|results?|vs|versus|v|against|h2h|head to head|at|to|the)\b/g, " ");

  // strip the United subject so the residual is a clean opponent name — but never a
  // trailing club name like "Leeds United"/"Sheffield United": bare "united"/"utd"
  // goes only at the start or right after a question/aux word.
  rest = rest.replace(/\b(?:man(?:chester)?\s+(?:united|utd)|mufc)\b/g, " ");
  rest = rest.replace(/(^|\s(?:have|has|had|did|do|does|when|ever|are|is|was|were)\s)(?:united|utd)\b/g, "$1");
  rest = rest.replace(/^\s*(?:united|utd|we|us)\b/, " ");
  rest = rest.replace(/\b(?:we|us)\b/g, " ");
  rest = rest.replace(/\s+/g, " ").trim();

  return { filter, link, triggered, question, rest, ...scope };
}

// ---------------------------------------------------------------- templates

const UNITED_WORDS = new Set(["", "united", "man utd", "man united", "manchester united", "mufc", "us", "we"]);

/** A head-to-head record vs a named opponent, venue/era-aware. Exposed so the
 * `vs:` scoping operator can call it directly. `strong` gates the opponent resolution
 * to a confident prefix hit only — the tentative best-guess path uses it. */
export function headToHead(
  opponentText: string,
  extra?: MatchFilter,
  label?: string,
  strong = false,
): ShapedAnswer | null {
  const opp = resolveEntity(opponentText, "opponent", { strong });
  if (!opp) return null;
  const venue = extra?.venue;
  const where = venue === "A" ? "away at" : venue === "H" ? "at home to" : "against";
  const filter: MatchFilter = { ...extra, opponent: opp.entity_id };
  const link: Record<string, string | undefined> = {
    opponent: opp.entity_id, venue, type: extra?.type,
    from: extra?.from ? extra.from.slice(0, 4) : undefined,
    to: extra?.to ? extra.to.slice(0, 4) : undefined,
  };
  return {
    title: `Record ${where} ${opp.label}${label ? ` ${label}` : ""}`,
    summary: recText(recordFor(filter)),
    href: matchesHref(link),
    hrefLabel: "Show the matches →",
    coverage: RESULT_COVERAGE,
  };
}

/** Biggest win / heaviest defeat / best attended — the single extreme match in
 * the current scope, with a browse-the-slice link. */
function superlative(norm: string, scope: Scope): ShapedAnswer | null {
  let sort: MatchFilter["sort"] | undefined;
  let noun = "";
  if (/\b(biggest|best|record|heaviest)\s+(win|victory|wins|victories)\b/.test(norm)) {
    sort = "margin"; noun = "Biggest win";
  } else if (/\b(heaviest|worst|biggest)\s+(defeat|loss|defeats|losses)\b/.test(norm)) {
    sort = "defeat"; noun = "Heaviest defeat";
  } else if (/\b(best attended|highest attendance|record attendance|biggest crowd|best attendance)\b/.test(norm)) {
    sort = "attendance"; noun = "Best attended";
  }
  if (!sort) return null;

  // The residual after scope-stripping may name an opponent to scope the extreme to.
  const oppFilter: MatchFilter = {};
  let oppLabel = "";
  if (scope.rest && !UNITED_WORDS.has(scope.rest)) {
    const opp = resolveEntity(scope.rest, "opponent");
    if (opp) { oppFilter.opponent = opp.entity_id; oppLabel = ` v ${opp.label}`; }
  }

  const filter: MatchFilter = { ...scope.filter, ...oppFilter, sort, limit: 1 };
  const { rows } = findMatches(filter);
  const top = rows[0];
  if (!top) return null;

  const scopeBits = [oppLabel.trim(), scope.scopeLabel, scope.decadeLabel ? `in the ${scope.decadeLabel}` : ""]
    .filter(Boolean)
    .join(" ");
  const title = `${noun}${scopeBits ? ` ${scopeBits}` : ""}`;
  const att = sort === "attendance" && top.attendance ? ` · ${top.attendance.toLocaleString("en-GB")}` : "";
  const summary = `${scoreline(top.gf, top.ga, [top.pen_gf, top.pen_ga], !!top.aet)} v ${top.opponent_name} · ${fmtDate(top.date)}${att}`;
  const link: Record<string, string | undefined> = {
    ...scope.link, opponent: oppFilter.opponent, sort,
  };
  // Margin/defeat extremes read straight off the complete result record; the
  // attendance extreme is bounded by the partial attendance facet.
  const coverage: AnswerCoverage =
    sort === "attendance" ? { grade: "partial", label: "attendance data" } : RESULT_COVERAGE;
  return { title, summary, href: matchesHref(link), hrefLabel: "Browse the slice →", coverage };
}

/** Player-vs-player comparison: both sides must resolve to players. */
function comparison(norm: string): ShapedAnswer | null {
  const m = /^(.+?)\s+(?:vs\.?|versus|v|compared to|compared with)\s+(.+?)$/.exec(norm);
  if (!m) return null;
  const a = resolveEntity(m[1], "player");
  const b = resolveEntity(m[2], "player");
  if (!a || !b || a.entity_id === b.entity_id) return null;
  return {
    title: `${a.label} vs ${b.label}`,
    summary: `${a.label}: ${a.detail}  —  ${b.label}: ${b.detail}`,
    href: `/compare?mode=players&a=${a.entity_id}&b=${b.entity_id}`,
    hrefLabel: "Compare side by side →",
  };
}

/** Late goals under a manager — kept verbatim from the original template set. */
function lateGoals(norm: string): ShapedAnswer | null {
  const late = /^late goals under (.+)$/.exec(norm);
  if (!late) return null;
  const mg = resolveEntity(late[1], "manager");
  if (!mg) return null;
  const row = getDb()
    .prepare(
      `SELECT COUNT(*) n, SUM(e.minute >= 76) late
       FROM match_events e JOIN matches m ON m.id = e.match_id
       WHERE m.manager_id = ? AND e.type IN ('goal','pen-goal','own-goal-for')
         AND e.minute IS NOT NULL AND e.minute <= 90`,
    )
    .get(mg.entity_id) as { n: number; late: number };
  if (!row.n) return null;
  return {
    title: `Late goals under ${mg.label}`,
    summary: `${row.late} of ${row.n} timed goals (${((100 * row.late) / row.n).toFixed(1)}%) came in the final 15 minutes`,
    href: `/manager/${mg.entity_id}`,
    hrefLabel: `${mg.label} →`,
    coverage: { grade: "partial", label: "timed-goal data" },
  };
}

/**
 * A single player's recorded goals against one opponent — "how many times did
 * Rooney score against Arsenal". This is the shape the {@link headToHead} template
 * structurally can't reach: head-to-head scopes United's *team* record vs a club,
 * whereas this scopes one player. The query is split on the opponent connector
 * (against/vs/v); the player is resolved from the cleaned left side and the
 * opponent from the right, both `strong` so a verb-less near-miss never asserts a
 * wrong subject. A team-record phrasing like "record against arsenal" — whose left
 * side names no player — returns null here and falls through to {@link headToHead}.
 * Event-derived, so the verdict carries a `partial` goal-data grade.
 */
function playerVsOpponent(norm: string): ShapedAnswer | null {
  const split = /\b(?:against|versus|vs\.?|v)\b/.exec(norm);
  if (!split) return null;
  // The player side, stripped of interrogatives, the scoring verb/noun, and the
  // United subject, so "how many times did rooney score" resolves to just "rooney".
  const left = norm
    .slice(0, split.index)
    .replace(QUESTION_WORDS, " ")
    .replace(/\b(scor(?:e|ed|es|ing)|goals?|nets?|netted|record|results?|times|many|often)\b/g, " ")
    .replace(/\b(?:man(?:chester)?\s+(?:united|utd)|mufc|united|utd|we|us)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!left) return null;
  const player = resolveEntity(left, "player", { strong: true });
  if (!player) return null;
  const opp = resolveEntity(norm.slice(split.index + split[0].length).trim(), "opponent", { strong: true });
  if (!opp) return null;

  const row = getDb()
    .prepare(
      `SELECT COUNT(*) goals, COUNT(DISTINCT m.id) matches, MAX(m.date) last_date
       FROM match_events e JOIN matches m ON m.id = e.match_id
       WHERE e.player_id = ? AND e.player_side = 'united'
         AND e.type IN ('goal','pen-goal') AND m.opponent_id = ?`,
    )
    .get(player.entity_id, opp.entity_id) as { goals: number; matches: number; last_date: string | null };

  const summary =
    row.goals > 0
      ? `${row.goals} recorded goal${row.goals === 1 ? "" : "s"} in ${row.matches} match${row.matches === 1 ? "" : "es"}${
          row.last_date ? ` · last ${fmtDate(row.last_date)}` : ""
        }`
      : `No recorded goals against ${opp.label}`;
  return {
    title: `${player.label} v ${opp.label}`,
    summary,
    href: player.href,
    hrefLabel: `${player.label} →`,
    coverage: { grade: "partial", label: "goal data" },
  };
}

/**
 * Turn a free-text question into computed answers with evidence links. A handful
 * of template families — comparison, player-vs-opponent, superlative, head-to-head,
 * record-under-manager, era/competition-scoped, and a season record — each fed by
 * the shared scope parser and entity resolver, so phrasing is decoupled from
 * computation.
 */
export function shapedAnswers(q: string): ShapedAnswer[] {
  const out: ShapedAnswer[] = [];
  const norm = q.trim().toLowerCase().replace(/\s+/g, " ");
  if (!norm) return out;

  const push = (a: ShapedAnswer | null) => { if (a && !out.some((o) => o.title === a.title)) out.push(a); };

  // 1. fixed-shape specials
  push(lateGoals(norm));
  push(comparison(norm));
  if (out.length) return out;

  // Player vs opponent runs only after the player-vs-player comparison has had its
  // chance, so "rooney vs charlton" stays a two-player comparison rather than also
  // yielding "Wayne Rooney v Charlton Athletic".
  push(playerVsOpponent(norm));
  if (out.length) return out;

  // 2. scoped templates
  const scope = parseScope(norm);

  push(superlative(norm, scope));

  // head-to-head when the residual names an opponent and a trigger/venue is present
  const namesOpponent = scope.rest && !UNITED_WORDS.has(scope.rest);
  if ((scope.triggered || scope.venue) && namesOpponent) {
    push(headToHead(scope.rest, scope.filter));
  } else if (scope.question && namesOpponent && out.length === 0) {
    // Tentative best guess: question-shape + one strong opponent, no trigger word.
    // "did united ever beat barcelona" → "Did you mean: Record against Barcelona?"
    // Strong-only resolution so a fuzzy near-miss never asserts a wrong answer.
    const guess = headToHead(scope.rest, scope.filter, undefined, true);
    if (guess) push({ ...guess, tentative: true });
  }

  // record under a manager
  if (scope.managerName && UNITED_WORDS.has(scope.rest)) {
    push({
      title: `Record under ${scope.managerName}`,
      summary: recText(recordFor(scope.filter)),
      href: `/manager/${scope.filter.manager}`,
      hrefLabel: `${scope.managerName} →`,
      coverage: RESULT_COVERAGE,
    });
  }

  // era / competition-scoped overall record ("United in Europe", "record in the 90s")
  const scoped = scope.scopeLabel || scope.decadeLabel;
  if (scoped && UNITED_WORDS.has(scope.rest) && !scope.managerName) {
    const where = scope.scopeLabel ?? `in the ${scope.decadeLabel}`;
    push({
      title: `United ${where}`,
      summary: recText(recordFor(scope.filter)),
      href: matchesHref(scope.link),
      hrefLabel: "Show the matches →",
      coverage: RESULT_COVERAGE,
    });
  }

  // bare season record ("1998-99")
  if (scope.seasonLabel && UNITED_WORDS.has(scope.rest) && !scoped && !scope.managerName) {
    const exists = getDb().prepare("SELECT 1 FROM matches WHERE season = ? LIMIT 1").get(scope.seasonLabel);
    if (exists) {
      push({
        title: `${scope.seasonLabel} season`,
        summary: recText(recordFor({ season: scope.seasonLabel })),
        href: `/seasons/${scope.seasonLabel}`,
        hrefLabel: "Season page →",
        coverage: RESULT_COVERAGE,
      });
    }
  }

  return out;
}
