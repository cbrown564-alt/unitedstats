import { getDb } from "../db";
import { findMatches, matchWhere, type MatchFilter, type Record_ } from "../queries";
import { parseRoundPhrase, roundFilterLabel } from "../matchRounds";
import { queryString } from "../url";
import { scoreline, fmtDate } from "../format";
import { resolveEntity, type IndexRow } from "./resolve";

/** Coverage grade carried beside a shaped verdict so the trust signal travels with
 *  the answer into the typeahead — the gap DISCOVERY §6 names. Derived, never
 *  invented: the result-level W/D/L record (and United's own goals-for, both read
 *  straight off `matches`) is complete for every official match, so those cuts grade
 *  `complete`; an event/lineup-derived answer (a player's goals, appearances, or
 *  assists) grades `partial`. */
export interface AnswerCoverage {
  grade: "complete" | "partial";
  /** Short label for the chip ("complete" / "goal data" / "lineup data"). */
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
 * match, so every record cut shares one honest grade. United's goals-for is in the
 * same table, so a team goal count is complete too. */
const RESULT_COVERAGE: AnswerCoverage = { grade: "complete", label: "complete" };
const GOAL_COVERAGE: AnswerCoverage = { grade: "partial", label: "goal data" };
const LINEUP_COVERAGE: AnswerCoverage = { grade: "partial", label: "lineup data" };
const ASSIST_COVERAGE: AnswerCoverage = { grade: "partial", label: "assist data" };

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
  const winPct = ((100 * r.w) / r.p).toFixed(0);
  return `P${r.p} W${r.w} D${r.d} L${r.l} · ${winPct}% won · GF ${r.gf} GA ${r.ga}`;
}

/** /matches link from a filter — years stay bare so the page's `from`/`to` accept them. */
function matchesHref(p: Record<string, string | number | undefined>): string {
  // Keep outward-facing sort aliases stable for existing links/tests, while the
  // internal filter model uses canonical gd-* variants.
  const sort = p.sort;
  const outwardSort =
    sort === "gd-desc" ? "margin"
      : sort === "gd-asc" ? "defeat"
      : sort;
  return `/matches${queryString({ ...p, sort: outwardSort as string | number | undefined })}`;
}

const plural = (n: number, one: string, many = `${one}s`) => (n === 1 ? one : many);

const decadeBase = (d: string): number =>
  d.length === 4 ? Number(d) : Number(d) >= 30 ? 1900 + Number(d) : 2000 + Number(d);

// ============================================================ the intent grammar
//
// Every aggregate question is one shape: a SUBJECT (the team, a player, or a
// manager) measured by a METRIC (record, goals, appearances, assists) within a
// SCOPE (opponent, venue, competition, era, season, manager). The old parser
// hard-coded all three into a flat list of templates, so adjacent cells of the
// grid ("Rooney goals vs X" but not "Rooney appearances vs X") were arbitrarily
// empty. This parses the three slots once and dispatches; adding a metric or a
// scope is now additive, and combinations come for free. Comparison (two
// subjects) and superlative (pick one extreme match) keep bespoke renderers —
// they aren't subject×metric×scope shapes.

type MetricKey = "record" | "goals" | "appearances" | "assists";

/** Metric keyword → key. Order matters: the specific player nouns win over the
 *  generic "record" fallback, and every occurrence of the chosen family is stripped
 *  so a residual like "score" can't leak into the subject ("how many goals did
 *  rooney *score*"). */
const METRIC_LEXICON: [MetricKey, RegExp][] = [
  ["appearances", /\b(appearances?|apps?|caps|games?)\b/g],
  ["assists", /\b(assists?|assisted)\b/g],
  ["goals", /\b(goals?|scor(?:e|ed|es|ing)|netted|nets)\b/g],
  ["record", /\b(records?|results?)\b/g],
];

/** A minute window narrows the goals metric ("late goals", "first-half goals").
 *  `lo` is inclusive; an absent `hi` runs to the end (so "late" includes stoppage).
 *  "Late" matches the canonical product definition — after the 85th minute — used by
 *  the homepage late-goals question and `lib/trails.ts`, not the looser "final 15". */
interface GoalWindow {
  key: "firstHalf" | "secondHalf" | "late" | "stoppage" | "extraTime";
  lo?: number;
  hi?: number;
  /** Short word for a title ("late goals"). */
  name: string;
  /** Full phrase for a summary ("came after the 85th minute"). */
  label: string;
}
const GOAL_WINDOWS: [RegExp, GoalWindow][] = [
  [/\bfirst[- ]half\b/, { key: "firstHalf", lo: 1, hi: 45, name: "first-half", label: "in the first half" }],
  [/\bsecond[- ]half\b/, { key: "secondHalf", lo: 46, name: "second-half", label: "in the second half" }],
  [/\bstoppage[- ]time\b/, { key: "stoppage", name: "stoppage-time", label: "in stoppage time" }],
  [/\bextra[- ]time\b/, { key: "extraTime", name: "extra-time", label: "in extra time" }],
  [/\blate\b/, { key: "late", lo: 86, name: "late", label: "after the 85th minute" }],
];

// Verbs that signal a head-to-head intent in natural phrasing ("beat barcelona",
// "lost to liverpool"). Deliberately excludes bare win/won/lost so a superlative
// ("biggest win in the 90s") is never mistaken for an opponent cut.
const H2H_VERBS =
  /\b(beat|beaten|beating|beats|thrash(?:ed|ing|es)?|hammer(?:ed|ing|s)?|lost to|lose to|losing to|drew with|draw with|drawn with|faced?|met|play(?:ed|ing)? against|win against|won against|better than|worse than)\b/g;

// Interrogative / question-shape markers ("did united ever…", "how many times…").
const QUESTION_WORDS =
  /\b(have|has|had|did|do|does|when|ever|are|is|was|were|how many times|how often|how many)\b/g;

// An explicit opponent connector splits "‹subject› ‹connector› ‹opponent›". Venue
// words ("away", "at home") are stripped first, so a surviving "at"/"to" is the
// "away at Arsenal" / "lost to Leeds" form rather than a venue.
const OPP_CONNECTOR = /\b(?:against|versus|vs\.?|away to|at home to|to|at|v)\b/;

const UNITED_WORDS = new Set(["", "united", "man utd", "man united", "manchester united", "mufc", "us", "we"]);

/** Strip the United subject so the residual is a clean name — but never a trailing
 *  club name like "Leeds United"/"Sheffield United": bare "united"/"utd" goes only at
 *  the start or right after a question/aux word. */
function stripUnitedSubject(s: string): string {
  return ` ${s} `
    .replace(/\b(?:man(?:chester)?\s+(?:united|utd)|mufc)\b/g, " ")
    .replace(/(^|\s(?:have|has|had|did|do|does|when|ever|are|is|was|were)\s)(?:united|utd)\b/g, "$1")
    .replace(/^\s*(?:united|utd|we|us)\b/, " ")
    .replace(/\b(?:we|us)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

interface ParsedIntent {
  subjectKind: "team" | "player" | "manager";
  subject?: IndexRow;
  metric?: MetricKey;
  metricExplicit: boolean;
  /** A minute window on the goals metric ("late goals" → after the 85th minute). */
  goalWindow?: GoalWindow;
  /** Opponent resolved from an explicit connector ("vs liverpool"). */
  opponent?: IndexRow;
  /** A no-connector residual that might be an opponent for a team head-to-head —
   *  resolved (and gated) at dispatch so a bare name never auto-fires. */
  opponentCandidate?: string;
  /** Scope filter: venue/type/from/to/season/manager — opponent is added per cut. */
  filter: MatchFilter;
  /** /matches link params for the scope (years bare). */
  link: Record<string, string | undefined>;
  labels: {
    venueWord?: string;
    scopeLabel?: string;
    decadeLabel?: string;
    seasonLabel?: string;
    managerName?: string;
    competitionLabel?: string;
    roundLabel?: string;
  };
  /** A confident head-to-head signal (verb, record metric, or a connector). */
  triggered: boolean;
  /** Interrogative shape — drives the tentative best guess. */
  question: boolean;
  /** True when the leftover names nothing of its own — so a team aggregate is safe. */
  teamLeftoverClean: boolean;
}

function resolvePerson(text: string, metric?: MetricKey): IndexRow | undefined {
  // Appearances and assists only make sense for a player; goals/record could be a
  // manager, so resolve against both and let prominence rank ("ferguson" → manager).
  const kind: string | string[] =
    metric === "appearances" || metric === "assists" ? "player" : ["player", "manager"];
  return resolveEntity(text, kind, { strong: true });
}

/**
 * Pull the three slots out of a normalised query. Phrasing (here) is decoupled from
 * computation (the cut builders), so many spellings reach the same answer.
 */
function parseIntent(norm: string): ParsedIntent {
  let s = ` ${norm} `;
  const filter: MatchFilter = {};
  const link: Record<string, string | undefined> = {};
  const labels: ParsedIntent["labels"] = {};
  let triggered = false;
  let question = false;

  const strip = (re: RegExp): RegExpExecArray | null => {
    const m = re.exec(s);
    if (m) s = `${s.slice(0, m.index)} ${s.slice(m.index + m[0].length)}`.replace(/\s+/g, " ");
    return m;
  };

  // 1. metric — strip the whole family so no verb/noun leaks into the subject.
  let metric: MetricKey | undefined;
  for (const [key, re] of METRIC_LEXICON) {
    const next = s.replace(re, " ");
    if (next !== s) {
      metric = key;
      s = next.replace(/\s+/g, " ");
      if (key === "record") triggered = true;
      break;
    }
  }
  const metricExplicit = metric !== undefined;

  // 1b. goal time-window qualifier ("late goals", "first-half goals").
  let goalWindow: GoalWindow | undefined;
  for (const [re, win] of GOAL_WINDOWS) {
    const next = s.replace(re, " ");
    if (next !== s) {
      goalWindow = win;
      s = next.replace(/\s+/g, " ");
      break;
    }
  }

  // 2. venue — "at home" before bare "home" so the longer phrase wins.
  if (strip(/\b(?:away|on the road)\b/)) {
    filter.venue = "A"; link.venue = "A"; labels.venueWord = "away";
  } else if (strip(/\bat home\b/) || strip(/\bhome\b/)) {
    filter.venue = "H"; link.venue = "H"; labels.venueWord = "at home";
  }

  // 3. explicit season "1998-99" / "1998/99"
  const season = strip(/\b(\d{4})\s*[/–-]\s*(\d{2,4})\b/);
  if (season) {
    const sLabel = `${season[1]}-${(Number(season[1]) + 1).toString().slice(2)}`;
    filter.season = sLabel; link.season = sLabel; labels.seasonLabel = sLabel;
  }

  // 4. decade "90s" / "1990s" / "in the 90s"
  const decade = strip(/\b(?:in\s+)?(?:the\s+)?((?:19|20)\d{2}|\d{2})s\b/);
  if (decade && !season) {
    const base = decadeBase(decade[1]);
    filter.from = `${base}-01-01`; filter.to = `${base + 9}-12-31`;
    link.from = String(base); link.to = String(base + 9);
    labels.decadeLabel = `${base}s`;
  }

  // 4b. knockout round — longest phrase first ("semi-final" before "final").
  const roundParsed = parseRoundPhrase(s.trim());
  if (roundParsed) {
    filter.round = roundParsed.key;
    link.round = roundParsed.key;
    labels.roundLabel = roundFilterLabel(roundParsed.key);
    triggered = true;
    s = ` ${roundParsed.rest} `;
  }

  // 5. competition scopes
  if (strip(/\bin europe\b/) || strip(/\beurope(?:an)?\b/)) {
    filter.type = "european"; link.type = "european"; labels.scopeLabel = "in Europe";
  } else if (strip(/\bfa cup\b/)) {
    filter.type = "domestic-cup"; link.type = "domestic-cup"; labels.scopeLabel = "in the FA Cup";
  } else if (strip(/\bleague cup\b/)) {
    filter.type = "league-cup"; link.type = "league-cup"; labels.scopeLabel = "in the League Cup";
  } else if (strip(/\bin (?:the )?cups?\b/)) {
    filter.type = "cup"; link.type = "cup"; labels.scopeLabel = "in the cups";
  } else if (strip(/\bin (?:the )?league\b/)) {
    filter.type = "league"; link.type = "league"; labels.scopeLabel = "in the league";
  }

  // 5b. named competition — explicit phrases before the index resolver so
  // "champions league" lands on the modern competition, not the European Cup alias.
  if (!filter.competition && !filter.type) {
    if (strip(/\bchampions league\b|\bucl\b/)) {
      filter.competition = "champions-league";
      link.competition = "champions-league";
      labels.competitionLabel = "UEFA Champions League";
      triggered = true;
    } else if (strip(/\beuropa league\b|\buefa cup\b|\buel\b/)) {
      filter.competition = "europa-league";
      link.competition = "europa-league";
      labels.competitionLabel = "UEFA Europa League";
      triggered = true;
    } else if (strip(/\beuropean cup\b/)) {
      filter.competition = "european-cup";
      link.competition = "european-cup";
      labels.competitionLabel = "European Cup";
      triggered = true;
    } else {
      const compResidual = stripUnitedSubject(s.trim());
      if (compResidual) {
        const comp = resolveEntity(compResidual, "competition", { strong: true });
        if (comp) {
          filter.competition = comp.entity_id;
          link.competition = comp.entity_id;
          labels.competitionLabel = comp.label;
          triggered = true;
          s = " ";
        }
      }
    }
  }

  // 6. manager scope "under X" (distinct from a manager *subject* — this narrows)
  const under = /\bunder\s+(.+?)\s*$/.exec(s);
  if (under) {
    const mg = resolveEntity(under[1], "manager");
    if (mg) {
      filter.manager = mg.entity_id; link.manager = mg.entity_id; labels.managerName = mg.label; triggered = true;
      s = `${s.slice(0, under.index)} `.replace(/\s+/g, " ");
    }
  }

  // 7. opponent connector — split "‹subject› ‹conn› ‹opponent›".
  let opponent: IndexRow | undefined;
  let opponentCandidate: string | undefined;
  let subjectText: string;
  const conn = OPP_CONNECTOR.exec(s);
  if (conn) {
    triggered = true;
    const right = stripUnitedSubject(cleanSubject(s.slice(conn.index + conn[0].length)).text);
    opponent = right ? resolveEntity(right, "opponent") : undefined;
    subjectText = s.slice(0, conn.index);
  } else {
    subjectText = s;
  }

  // 8. subject — clean off verbs/questions, then resolve the leading name.
  const cleaned = cleanSubject(subjectText);
  if (cleaned.verb) triggered = true;
  if (cleaned.question) question = true;
  const subj = stripUnitedSubject(cleaned.text);

  let subjectKind: ParsedIntent["subjectKind"] = "team";
  let subject: IndexRow | undefined;
  let teamLeftoverClean = true;
  if (subj && !UNITED_WORDS.has(subj)) {
    const person = resolvePerson(subj, metric);
    if (person) {
      subjectKind = person.kind === "manager" ? "manager" : "player";
      subject = person;
    } else if (!opponent) {
      // No connector matched a club, and the residual isn't a person — it's an
      // opponent candidate for a team head-to-head (gated at dispatch).
      opponentCandidate = subj;
      teamLeftoverClean = false;
    } else {
      // Junk to the left of a real connector — ignore it, the team is the subject.
      teamLeftoverClean = false;
    }
  }

  return {
    subjectKind, subject, metric, metricExplicit, goalWindow, opponent, opponentCandidate,
    filter, link, labels, triggered, question, teamLeftoverClean,
  };
}

/** Strip head-to-head verbs, question words, and the scorer marker ("goals *by*
 *  Cantona") off a fragment, reporting which verbs/questions were present so the
 *  caller can set the trigger/question flags. */
function cleanSubject(s: string): { text: string; verb: boolean; question: boolean } {
  const afterVerb = s.replace(H2H_VERBS, " ");
  const verb = afterVerb !== s;
  const afterQ = afterVerb.replace(QUESTION_WORDS, " ");
  const question = afterQ !== afterVerb;
  const afterBy = afterQ.replace(/\b(?:scored\s+)?(?:by|from)\b/g, " ");
  return { text: afterBy.replace(/\s+/g, " ").trim(), verb, question };
}

// =============================================================== the cut builders

/** SCOPE filter restricted to the dimensions a metric query can join on — opponent,
 *  venue, competition type, era, season, manager — so event/lineup counts narrow the
 *  same way the record does. */
function scopeFilter(intent: ParsedIntent, opponentId?: string): MatchFilter {
  return {
    opponent: opponentId,
    competition: intent.filter.competition,
    venue: intent.filter.venue,
    type: intent.filter.type,
    round: intent.filter.round,
    from: intent.filter.from,
    to: intent.filter.to,
    season: intent.filter.season,
    manager: intent.filter.manager,
  };
}

/** Extra `AND …` conditions (with params) for an events/lineups query, reusing the
 *  shared filter compiler so the slice matches the record exactly. */
function scopeExtra(f: MatchFilter): { sql: string; params: Record<string, string | number> } {
  const { cond, params } = matchWhere(f);
  return { sql: cond ? cond.replace(/^WHERE/, "AND") : "", params };
}

/** /matches link params for a scope (years bare), with an optional subject filter.
 *  Scope params first, then `extra` — so a subject filter (scorer/player, or a
 *  manager-as-subject) wins over an unset scope and the linked slice matches the
 *  count exactly. */
function scopeLink(intent: ParsedIntent, extra: Record<string, string | undefined>): Record<string, string | undefined> {
  return {
    opponent: intent.opponent?.entity_id,
    competition: intent.filter.competition,
    venue: intent.filter.venue,
    type: intent.filter.type,
    round: intent.filter.round,
    manager: intent.filter.manager,
    season: intent.filter.season,
    from: intent.filter.from?.slice(0, 4),
    to: intent.filter.to?.slice(0, 4),
    ...extra,
  };
}

/** Human scope phrase for a no-opponent title ("at home in the 1990s"). */
function scopePhrase(intent: ParsedIntent): string {
  const { venueWord, scopeLabel, decadeLabel, seasonLabel, managerName } = intent.labels;
  return [
    venueWord,
    scopeLabel ?? (decadeLabel ? `in the ${decadeLabel}` : ""),
    seasonLabel ? `in ${seasonLabel}` : "",
    managerName ? `under ${managerName}` : "",
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
}

/** "v Liverpool" / "away at Liverpool" / "at home to Liverpool". */
function oppPhrase(opp: IndexRow, venue?: string): string {
  const where = venue === "A" ? "away at" : venue === "H" ? "at home to" : "v";
  return `${where} ${opp.label}`;
}

const lastBit = (date: string | null) => (date ? ` · last ${fmtDate(date)}` : "");

/** A head-to-head record vs a named opponent, venue/era-aware. Exposed so the `vs:`
 * scoping operator can call it directly. `strong` gates resolution to a confident
 * prefix hit only — the tentative best-guess path uses it. */
export function headToHead(
  opponentText: string,
  extra: MatchFilter = {},
  label?: string,
  strong = false,
): ShapedAnswer | null {
  const opp = resolveEntity(opponentText, "opponent", { strong });
  return opp ? teamRecordVs(opp, extra, label) : null;
}

function teamRecordVs(opp: IndexRow, extra: MatchFilter, label?: string): ShapedAnswer {
  const venue = extra.venue;
  const where = venue === "A" ? "away at" : venue === "H" ? "at home to" : "against";
  const filter: MatchFilter = { ...extra, opponent: opp.entity_id };
  const link: Record<string, string | undefined> = {
    opponent: opp.entity_id, venue, type: extra.type, competition: extra.competition, round: extra.round,
    from: extra.from ? extra.from.slice(0, 4) : undefined,
    to: extra.to ? extra.to.slice(0, 4) : undefined,
  };
  return {
    title: `Record ${where} ${opp.label}${label ? ` ${label}` : ""}`,
    summary: recText(recordFor(filter)),
    href: matchesHref(link),
    hrefLabel: "Matches →",
    coverage: RESULT_COVERAGE,
  };
}

/** United's own goals for/against over a scope ("United goals at home in the 90s"). */
function teamGoals(intent: ParsedIntent, label: string): ShapedAnswer {
  const f = scopeFilter(intent, intent.opponent?.entity_id);
  const { cond, params } = matchWhere(f);
  const row = getDb()
    .prepare(
      `SELECT COALESCE(SUM(m.gf),0) gf, COALESCE(SUM(m.ga),0) ga, COUNT(*) p
       FROM matches m JOIN competitions c ON c.id = m.competition_id ${cond}`,
    )
    .get(params) as { gf: number; ga: number; p: number };
  return {
    title: `United goals${label ? ` ${label}` : ""}`,
    summary: row.p
      ? `${row.gf.toLocaleString("en-GB")} scored, ${row.ga.toLocaleString("en-GB")} conceded in ${row.p} ${plural(row.p, "match", "matches")}`
      : "no matches on record",
    href: matchesHref(scopeLink(intent, {})),
    hrefLabel: "Matches →",
    coverage: RESULT_COVERAGE,
  };
}

/** Goals narrowed to a minute window ("late goals by Cantona", "late goals against
 *  Bayern", "late goals under Ferguson") — a rate over the same scope, framed "N of M
 *  recorded goals (X%) came ‹window›". Event-derived, so always `partial`. For a
 *  player it counts his own goals; for the team it counts every United goal (open
 *  play, penalty, and own-goals-for), per the canonical late-goals definition. */
function goalWindowCut(intent: ParsedIntent, win: GoalWindow, player?: IndexRow): ShapedAnswer {
  const oppId = intent.opponent?.entity_id;
  const { sql, params } = scopeExtra(scopeFilter(intent, oppId));
  const subject = player
    ? "e.player_id = @pid AND e.player_side = 'united' AND e.type IN ('goal','pen-goal')"
    : "e.type IN ('goal','pen-goal','own-goal-for')";
  const inWindow =
    win.key === "stoppage"
      ? "(COALESCE(e.added_time, 0) > 0 OR (m.aet = 0 AND e.minute > 90))"
      : win.key === "extraTime"
        ? "m.aet = 1 AND e.minute > 90"
        : `e.minute >= @lo${win.hi ? " AND e.minute <= @hi" : ""}`;
  const bind: Record<string, string | number> = { ...(win.lo ? { lo: win.lo } : {}), ...(win.hi ? { hi: win.hi } : {}), ...params };
  if (player) bind.pid = player.entity_id;

  const r = getDb()
    .prepare(
      `SELECT COUNT(*) total, COALESCE(SUM(CASE WHEN ${inWindow} THEN 1 ELSE 0 END), 0) win
       FROM match_events e JOIN matches m ON m.id = e.match_id JOIN competitions c ON c.id = m.competition_id
       WHERE ${subject} AND e.minute IS NOT NULL ${sql}`,
    )
    .get(bind) as { total: number; win: number };

  const who = player ? player.label : "United";
  const scopeBit = intent.opponent
    ? ` ${oppPhrase(intent.opponent, intent.filter.venue)}`
    : scopePhrase(intent) ? ` ${scopePhrase(intent)}` : "";
  const pct = r.total ? ((100 * r.win) / r.total).toFixed(0) : "0";
  return {
    title: `${who} ${win.name} goals${scopeBit}`,
    summary: r.total
      ? `${r.win} of ${r.total} recorded ${plural(r.total, "goal")} (${pct}%) came ${win.label}`
      : `No recorded goals${intent.opponent ? ` against ${intent.opponent.label}` : ""}`,
    href: matchesHref(scopeLink(intent, { goalWindow: win.key, ...(player ? { scorer: player.entity_id } : {}) })),
    hrefLabel: "Matches →",
    coverage: { grade: "partial", label: "timed-goal data" },
  };
}

/** A player's goals / appearances / assists over a scope. */
function playerCut(player: IndexRow, metric: MetricKey, intent: ParsedIntent): ShapedAnswer {
  const db = getDb();
  const oppId = intent.opponent?.entity_id;
  const { sql, params } = scopeExtra(scopeFilter(intent, oppId));
  const bind = { pid: player.entity_id, ...params };
  const titleScope = intent.opponent ? oppPhrase(intent.opponent, intent.filter.venue) : scopePhrase(intent);

  if (metric === "appearances") {
    const r = db
      .prepare(
        `SELECT COUNT(*) apps, COALESCE(SUM(l.started),0) starts, MAX(m.date) last_date
         FROM match_lineups l JOIN matches m ON m.id = l.match_id JOIN competitions c ON c.id = m.competition_id
         WHERE l.player_id = @pid AND l.player_side = 'united' AND l.bench = 0 ${sql}`,
      )
      .get(bind) as { apps: number; starts: number; last_date: string | null };
    return {
      title: intent.opponent ? `${player.label} ${titleScope}` : `${player.label} — apps${titleScope ? ` ${titleScope}` : ""}`,
      summary: r.apps
        ? `${r.apps} ${plural(r.apps, "app")} (${r.starts} ${plural(r.starts, "start")})${lastBit(r.last_date)}`
        : `No recorded apps${intent.opponent ? ` against ${intent.opponent.label}` : ""}`,
      href: matchesHref(scopeLink(intent, { player: player.entity_id })),
      hrefLabel: "Matches →",
      coverage: LINEUP_COVERAGE,
    };
  }

  if (metric === "assists") {
    const r = db
      .prepare(
        `SELECT COUNT(*) n, COUNT(DISTINCT m.id) matches, MAX(m.date) last_date
         FROM match_events e JOIN matches m ON m.id = e.match_id JOIN competitions c ON c.id = m.competition_id
         WHERE e.assist_player_id = @pid AND e.assist_side = 'united' AND e.type IN ('goal','pen-goal') ${sql}`,
      )
      .get(bind) as { n: number; matches: number; last_date: string | null };
    return {
      title: intent.opponent ? `${player.label} ${titleScope}` : `${player.label} — assists${titleScope ? ` ${titleScope}` : ""}`,
      summary: r.n
        ? `${r.n} recorded ${plural(r.n, "assist")} in ${r.matches} ${plural(r.matches, "match", "matches")}${lastBit(r.last_date)}`
        : `No recorded assists${intent.opponent ? ` against ${intent.opponent.label}` : ""}`,
      href: matchesHref(scopeLink(intent, { assister: player.entity_id })),
      hrefLabel: "Matches →",
      coverage: ASSIST_COVERAGE,
    };
  }

  // goals (default for a player subject)
  const r = db
    .prepare(
      `SELECT COUNT(*) n, COUNT(DISTINCT m.id) matches, MAX(m.date) last_date
       FROM match_events e JOIN matches m ON m.id = e.match_id JOIN competitions c ON c.id = m.competition_id
       WHERE e.player_id = @pid AND e.player_side = 'united' AND e.type IN ('goal','pen-goal') ${sql}`,
    )
    .get(bind) as { n: number; matches: number; last_date: string | null };
  return {
    title: intent.opponent ? `${player.label} ${titleScope}` : `${player.label} — goals${titleScope ? ` ${titleScope}` : ""}`,
    summary: r.n
      ? `${r.n} recorded ${plural(r.n, "goal")} in ${r.matches} ${plural(r.matches, "match", "matches")}${lastBit(r.last_date)}`
      : `No recorded goals${intent.opponent ? ` against ${intent.opponent.label}` : ""}`,
    href: matchesHref(scopeLink(intent, { scorer: player.entity_id })),
    hrefLabel: "Matches →",
    coverage: GOAL_COVERAGE,
  };
}

/** A manager's record, optionally vs one opponent ("Ferguson record vs Arsenal"). */
function managerCut(manager: IndexRow, intent: ParsedIntent): ShapedAnswer {
  const filter: MatchFilter = { ...scopeFilter(intent, intent.opponent?.entity_id), manager: manager.entity_id };
  if (intent.opponent) {
    return {
      title: `${manager.label} ${oppPhrase(intent.opponent, intent.filter.venue)}`,
      summary: recText(recordFor(filter)),
      href: matchesHref(scopeLink(intent, { manager: manager.entity_id })),
      hrefLabel: "Matches →",
      coverage: RESULT_COVERAGE,
    };
  }
  return {
    title: `Record under ${manager.label}`,
    summary: recText(recordFor(filter)),
    href: `/manager/${manager.entity_id}`,
    hrefLabel: `${manager.label} →`,
    coverage: RESULT_COVERAGE,
  };
}

/** Team aggregate with no opponent: era/competition record, season record, or a
 *  record under a manager named by an "under X" scope. */
function teamScopedRecord(intent: ParsedIntent): ShapedAnswer | null {
  const { scopeLabel, decadeLabel, seasonLabel, managerName } = intent.labels;

  if (intent.filter.manager && managerName) {
    return {
      title: `Record under ${managerName}`,
      summary: recText(recordFor(intent.filter)),
      href: `/manager/${intent.filter.manager}`,
      hrefLabel: `${managerName} →`,
      coverage: RESULT_COVERAGE,
    };
  }

  if (scopeLabel || decadeLabel) {
    const where = scopeLabel ?? `in the ${decadeLabel}`;
    return {
      title: `United ${where}`,
      summary: recText(recordFor(intent.filter)),
      href: matchesHref(intent.link),
      hrefLabel: "Matches →",
      coverage: RESULT_COVERAGE,
    };
  }

  if (seasonLabel) {
    const exists = getDb().prepare("SELECT 1 FROM matches WHERE season = ? LIMIT 1").get(seasonLabel);
    if (exists) {
      return {
        title: `${seasonLabel} season`,
        summary: recText(recordFor({ season: seasonLabel })),
        href: `/seasons/${seasonLabel}`,
        hrefLabel: "Season page →",
        coverage: RESULT_COVERAGE,
      };
    }
  }
  return null;
}

/** A competition round slice — finals, semi-finals, etc. — usually reached from search. */
function roundSliceCut(intent: ParsedIntent): ShapedAnswer | null {
  if (!intent.filter.round) return null;

  const roundWord = (intent.labels.roundLabel ?? roundFilterLabel(intent.filter.round)).toLowerCase();
  const comp = intent.labels.competitionLabel
    ?? intent.labels.scopeLabel?.replace(/^in (?:the )?/i, "");
  const title = comp ? `${comp} ${roundWord}s` : `United ${roundWord}s`;

  const filter = scopeFilter(intent, intent.opponent?.entity_id);
  return {
    title,
    summary: recText(recordFor(filter)),
    href: matchesHref(scopeLink(intent, {})),
    hrefLabel: "Matches →",
    coverage: RESULT_COVERAGE,
  };
}

// =================================================================== specials

/** Biggest win / heaviest defeat / best attended — the single extreme match in
 * the current scope, with a browse-the-slice link. */
function superlative(norm: string, intent: ParsedIntent): ShapedAnswer | null {
  let sort: MatchFilter["sort"] | undefined;
  let attendanceMode = false;
  let noun = "";
  if (/\b(biggest|best|record|heaviest)\s+(win|victory|wins|victories)\b/.test(norm)) {
    sort = "gd-desc"; noun = "Biggest win";
  } else if (/\b(heaviest|worst|biggest)\s+(defeat|loss|defeats|losses)\b/.test(norm)) {
    sort = "gd-asc"; noun = "Heaviest defeat";
  } else if (/\b(best attended|highest attendance|record attendance|biggest crowd|best attendance)\b/.test(norm)) {
    attendanceMode = true; noun = "Best attended";
  }
  if (!sort && !attendanceMode) return null;

  const oppId = intent.opponent?.entity_id;
  const oppLabel = intent.opponent ? ` v ${intent.opponent.label}` : "";
  const filter: MatchFilter = { ...scopeFilter(intent, oppId), ...(sort ? { sort } : {}), limit: attendanceMode ? 8000 : 1 };
  const { rows } = findMatches(filter);
  const top = attendanceMode
    ? rows.reduce<(typeof rows)[number] | undefined>(
        (best, row) => {
          if (!row.attendance) return best;
          if (!best || !best.attendance || row.attendance > best.attendance) return row;
          return best;
        },
        undefined,
      )
    : rows[0];
  if (!top) return null;

  const scopeBits = [oppLabel.trim(), intent.labels.scopeLabel, intent.labels.decadeLabel ? `in the ${intent.labels.decadeLabel}` : ""]
    .filter(Boolean)
    .join(" ");
  const title = `${noun}${scopeBits ? ` ${scopeBits}` : ""}`;
  const att = attendanceMode && top.attendance ? ` · ${top.attendance.toLocaleString("en-GB")}` : "";
  const summary = `${scoreline(top.gf, top.ga, [top.pen_gf, top.pen_ga], !!top.aet)} v ${top.opponent_name} · ${fmtDate(top.date)}${att}`;
  const link: Record<string, string | undefined> = { ...scopeLink(intent, {}), ...(sort ? { sort } : {}) };
  const coverage: AnswerCoverage =
    attendanceMode ? { grade: "partial", label: "attendance data" } : RESULT_COVERAGE;
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

function comparisonParts(norm: string): { left: string; right: string } | null {
  const m = /^(.+?)\s+(?:vs\.?|versus|v|compared to|compared with)\s+(.+?)$/.exec(norm);
  if (!m) return null;
  return { left: m[1].trim(), right: m[2].trim() };
}

// =================================================================== dispatch

/**
 * Turn a free-text question into computed answers with evidence links. Comparison
 * (two subjects) and the extreme-match superlative keep bespoke renderers;
 * everything else is one subject×metric×scope grammar — including the goals metric
 * narrowed to a minute window ("late goals") — so adding a metric, a scope, or a
 * window is additive rather than another template.
 */
export function shapedAnswers(q: string): ShapedAnswer[] {
  const out: ShapedAnswer[] = [];
  const norm = q.trim().toLowerCase().replace(/\s+/g, " ");
  if (!norm) return out;

  const push = (a: ShapedAnswer | null) => { if (a && !out.some((o) => o.title === a.title)) out.push(a); };
  const cmpParts = comparisonParts(norm);
  const cmp = comparison(norm);

  // Ambiguous "player vs short token" reads (e.g. "cantona vs leeds") should favour
  // player-vs-opponent when the club resolves strongly and the player on the right does not.
  if (cmpParts) {
    const leftPlayer = resolveEntity(cmpParts.left, "player", { strong: true });
    const rightText = stripUnitedSubject(cleanSubject(cmpParts.right).text);
    const rightOpponent = rightText ? resolveEntity(rightText, "opponent", { strong: true }) : undefined;
    const rightPlayerStrong = resolveEntity(cmpParts.right, "player", { strong: true });
    if (leftPlayer && rightOpponent && !rightPlayerStrong) {
      const intent = parseIntent(norm);
      const scoped: ParsedIntent = { ...intent, subjectKind: "player", subject: leftPlayer, opponent: rightOpponent };
      const explicitMetric = intent.metric;
      if (explicitMetric) {
        push(playerCut(leftPlayer, explicitMetric, scoped));
      } else {
        const withMetricTitle = (metric: MetricKey): ShapedAnswer => {
          const metricTitle = metric === "appearances" ? "apps" : metric;
          return { ...playerCut(leftPlayer, metric, scoped), title: `${leftPlayer.label} v ${rightOpponent.label} — ${metricTitle}` };
        };
        push(withMetricTitle("appearances"));
        push(withMetricTitle("goals"));
        push(withMetricTitle("assists"));
      }
      push(cmp);
      return out;
    }
  }

  // Comparison wins outright when both sides resolve to players.
  push(cmp);
  if (out.length) return out;

  const intent = parseIntent(norm);

  // Round slices ("champions league finals") are search-first — surface them early.
  push(roundSliceCut(intent));

  // The extreme-match selector sits alongside the grammar (it returns one match).
  push(superlative(norm, intent));

  const metric = intent.metric;
  // The window only narrows the goals metric; ignore it on appearances/record.
  const window = intent.goalWindow;

  if (intent.subjectKind === "player" && intent.subject) {
    // A bare name stays entity-first; only a metric or an opponent earns a verdict.
    if (intent.metricExplicit || intent.opponent) {
      const m = metric ?? "goals";
      push(window && m === "goals"
        ? goalWindowCut(intent, window, intent.subject)
        : playerCut(intent.subject, m, intent));
    }
  } else if (intent.subjectKind === "manager" && intent.subject) {
    if (intent.metricExplicit || intent.opponent) {
      if (metric === "goals") {
        // The manager is the subject, so fold it into the scope as a filter and read
        // United's goals under him.
        const mId = intent.subject.entity_id;
        const scoped: ParsedIntent = {
          ...intent,
          filter: { ...intent.filter, manager: mId },
          link: { ...intent.link, manager: mId },
          labels: { ...intent.labels, managerName: intent.subject.label },
        };
        const oppBit = intent.opponent ? ` ${oppPhrase(intent.opponent, intent.filter.venue)}` : "";
        push(window
          ? goalWindowCut(scoped, window)
          : teamGoals(scoped, `under ${intent.subject.label}${oppBit}`));
      } else {
        push(managerCut(intent.subject, intent));
      }
    }
  } else {
    // Team subject.
    const opp = intent.opponent ?? (intent.opponentCandidate
      ? resolveEntity(intent.opponentCandidate, "opponent", { strong: !intent.triggered })
      : undefined);

    if (opp) {
      const assert = intent.triggered || intent.metricExplicit || !!intent.filter.venue;
      if (assert) {
        if (metric === "goals") {
          const scoped = { ...intent, opponent: opp };
          push(window ? goalWindowCut(scoped, window) : teamGoals(scoped, oppPhrase(opp, intent.filter.venue)));
        } else {
          push(teamRecordVs(opp, scopeFilter(intent)));
        }
      } else if (intent.question) {
        // Tentative best guess: question-shape + one strong opponent, no trigger.
        push({ ...teamRecordVs(opp, scopeFilter(intent)), tentative: true });
      }
    } else if (intent.teamLeftoverClean) {
      // No opponent: an aggregate over the scope.
      if (metric === "goals" && intent.metricExplicit) {
        push(window ? goalWindowCut(intent, window) : teamGoals(intent, scopePhrase(intent)));
      } else if (metric !== "goals") {
        push(teamScopedRecord(intent));
      }
    }
  }

  return out;
}
