import { getDb } from "./db";
import type { Record_ } from "./queries";

interface SearchEntity {
  kind: "player" | "manager" | "opponent" | "season" | "competition" | "match";
  label: string;
  detail: string;
  href: string;
}

interface ShapedAnswer {
  title: string;
  summary: string;
  href: string;
  hrefLabel: string;
}

export interface SearchResponse {
  shaped: ShapedAnswer[];
  entities: SearchEntity[];
}

function rec(cond: string, params: (string | number)[]): Record_ {
  return getDb()
    .prepare(
      `SELECT COUNT(*) p, COALESCE(SUM(result='W'),0) w, COALESCE(SUM(result='D'),0) d,
              COALESCE(SUM(result='L'),0) l, COALESCE(SUM(gf),0) gf, COALESCE(SUM(ga),0) ga
       FROM matches m WHERE ${cond}`,
    )
    .get(...params) as Record_;
}

function recText(r: Record_): string {
  if (!r.p) return "no matches on record";
  const winPct = ((100 * r.w) / r.p).toFixed(1);
  return `P${r.p} W${r.w} D${r.d} L${r.l} · ${winPct}% won · GF ${r.gf} GA ${r.ga}`;
}

function findOpponent(name: string): { id: string; name: string } | undefined {
  return getDb()
    .prepare("SELECT id, name FROM opponents WHERE name LIKE ? ORDER BY length(name) LIMIT 1")
    .get(`%${name}%`) as { id: string; name: string } | undefined;
}

function findManager(name: string): { id: string; name: string } | undefined {
  return getDb()
    .prepare("SELECT id, name FROM managers WHERE name LIKE ? ORDER BY length(name) LIMIT 1")
    .get(`%${name}%`) as { id: string; name: string } | undefined;
}

/**
 * Shaped templates: a handful of question forms that get a computed answer with
 * an evidence link, ahead of plain entity lookup. Recognised shapes:
 *   - "record [home|away] [at|against|vs|v] <opponent>"
 *   - "<opponent> away" / "<opponent> at home"
 *   - "record under <manager>" / "<anything> under <manager>"
 *   - "late goals under <manager>"
 *   - "record in <season>"
 */
function shapedAnswers(q: string): ShapedAnswer[] {
  const out: ShapedAnswer[] = [];
  const norm = q.trim().toLowerCase().replace(/\s+/g, " ");

  // late goals under <manager>
  const late = norm.match(/^late goals under (.+)$/);
  if (late) {
    const mg = findManager(late[1]);
    if (mg) {
      const row = getDb()
        .prepare(
          `SELECT COUNT(*) n, SUM(e.minute >= 76) late
           FROM match_events e JOIN matches m ON m.id = e.match_id
           WHERE m.manager_id = ? AND e.type IN ('goal','pen-goal','own-goal-for')
             AND e.minute IS NOT NULL AND e.minute <= 90`,
        )
        .get(mg.id) as { n: number; late: number };
      if (row.n > 0) {
        out.push({
          title: `Late goals under ${mg.name}`,
          summary: `${row.late} of ${row.n} timed goals (${((100 * row.late) / row.n).toFixed(1)}%) came in the final 15 minutes`,
          href: `/manager/${mg.id}`,
          hrefLabel: `${mg.name} →`,
        });
      }
    }
  }

  // record under <manager>
  const under = norm.match(/^(?:record |results )?under (.+)$/);
  if (under && !late) {
    const mg = findManager(under[1]);
    if (mg) {
      out.push({
        title: `Record under ${mg.name}`,
        summary: recText(rec("manager_id = ?", [mg.id])),
        href: `/manager/${mg.id}`,
        hrefLabel: `${mg.name} →`,
      });
    }
  }

  // record [home|away] at/against <opponent>
  const vs = norm.match(/^record\s+(home\s+|away\s+)?(?:at|against|vs\.?|v)\s+(.+)$/);
  if (vs) {
    const venue = vs[1]?.trim() === "away" || norm.startsWith("record away") ? "A"
      : vs[1]?.trim() === "home" ? "H" : null;
    const opp = findOpponent(vs[2]);
    if (opp) {
      const cond = venue ? "opponent_id = ? AND venue = ?" : "opponent_id = ?";
      const params = venue ? [opp.id, venue] : [opp.id];
      const where = venue === "A" ? "away at" : venue === "H" ? "at home to" : "against";
      out.push({
        title: `Record ${where} ${opp.name}`,
        summary: recText(rec(cond, params)),
        href: `/matches?opponent=${opp.id}${venue ? `&venue=${venue}` : ""}`,
        hrefLabel: "Show the matches →",
      });
    }
  }

  // "<opponent> away" / "<opponent> at home"
  const oppVenue = norm.match(/^(.+?)\s+(away|at home|home)$/);
  if (oppVenue && !vs) {
    const opp = findOpponent(oppVenue[1]);
    if (opp) {
      const venue = oppVenue[2] === "away" ? "A" : "H";
      out.push({
        title: `Record ${venue === "A" ? "away at" : "at home to"} ${opp.name}`,
        summary: recText(rec("opponent_id = ? AND venue = ?", [opp.id, venue])),
        href: `/matches?opponent=${opp.id}&venue=${venue}`,
        hrefLabel: "Show the matches →",
      });
    }
  }

  // record in <season>  (also bare "1998/99", "1998-99")
  const seasonToken = norm.match(/^(?:record in |results in )?(\d{4})\s*[/–-]\s*(\d{2,4})$/);
  if (seasonToken) {
    const start = seasonToken[1];
    const season = `${start}-${(Number(start) + 1).toString().slice(2)}`;
    const exists = getDb().prepare("SELECT 1 FROM matches WHERE season = ? LIMIT 1").get(season);
    if (exists) {
      out.push({
        title: `${season} season`,
        summary: recText(rec("season = ?", [season])),
        href: `/seasons/${season}`,
        hrefLabel: "Season page →",
      });
    }
  }

  return out;
}

/**
 * Fold a string to a matchable form: strip diacritics, lowercase, reduce to
 * space-separated alphanumeric tokens. Mirrors the `fold()` used by
 * scripts/build-db.ts so "solskjaer" matches the indexed "Solskjær".
 */
function fold(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Trigram set of a folded string (space-padded so prefixes/suffixes count). */
function trigrams(s: string): Set<string> {
  const p = `  ${s} `;
  const out = new Set<string>();
  for (let i = 0; i < p.length - 2; i++) out.add(p.slice(i, i + 3));
  return out;
}

/** Jaccard overlap of two trigram sets, 0..1. */
function triSim(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const g of a) if (b.has(g)) inter++;
  return inter / (a.size + b.size - inter);
}

interface IndexRow {
  kind: string;
  label: string;
  detail: string;
  href: string;
  name_norm: string;
  aliases: string | null;
  prominence: number;
}

// The whole index is small (~1.4k rows); cache it for the trigram fallback so a
// typo doesn't cost a table scan + per-row work on a cold prepare each keystroke.
let indexCache: IndexRow[] | null = null;
function allRows(): IndexRow[] {
  if (!indexCache) {
    indexCache = getDb()
      .prepare("SELECT kind, label, detail, href, name_norm, aliases, prominence FROM search_index")
      .all() as IndexRow[];
  }
  return indexCache;
}

/**
 * Typo-tolerant fallback: rank by trigram similarity against name + aliases when
 * prefix-FTS finds nothing, so "roony" still surfaces Rooney. Similarity carries
 * the order, nudged by prominence to break near-ties toward the prominent entity.
 */
function fuzzyResults(folded: string, limit: number): SearchEntity[] {
  const qg = trigrams(folded);
  const scored: { row: IndexRow; score: number }[] = [];
  for (const row of allRows()) {
    // Compare against the whole name and each token/alias, taking the best — so a
    // misspelt surname ("roony") isn't diluted by the rest of the name ("wayne …").
    let sim = triSim(qg, trigrams(row.name_norm));
    const fields = [...row.name_norm.split(" "), ...(row.aliases?.split(" ") ?? [])].filter(Boolean);
    for (const f of fields) sim = Math.max(sim, triSim(qg, trigrams(f)));
    if (row.name_norm.includes(folded)) sim = Math.max(sim, 0.7); // substring still strong
    if (sim >= 0.4) scored.push({ row, score: sim + 0.05 * row.prominence });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(({ row }) => ({
    kind: row.kind as SearchEntity["kind"],
    label: row.label,
    detail: row.detail,
    href: row.href,
  }));
}

/**
 * Rank entities from the FTS5 `search_index` (built in scripts/build-db.ts):
 * bm25 relevance, blended with a per-kind `prominence` prior and an exact-prefix
 * boost so a prominent prefix hit beats an incidental mid-string one. Falls back
 * to a folded substring scan when FTS finds nothing, so partials/typos still land.
 */
function entityResults(q: string, limit = 12): SearchEntity[] {
  const db = getDb();
  const out: SearchEntity[] = [];

  // exact date → match (matches aren't in the entity index; lead with it)
  if (/^\d{4}-\d{2}-\d{2}$/.test(q.trim())) {
    const matches = db
      .prepare("SELECT id, date, opponent_name, gf, ga FROM matches WHERE date = ? LIMIT 3")
      .all(q.trim()) as { id: string; date: string; opponent_name: string; gf: number; ga: number }[];
    for (const m of matches) {
      out.push({
        kind: "match",
        label: `v ${m.opponent_name} ${m.gf}–${m.ga}`,
        detail: m.date,
        href: `/match/${m.id}`,
      });
    }
  }

  const folded = fold(q);
  if (!folded) return out;
  const matchExpr = folded
    .split(" ")
    .filter(Boolean)
    .map((t) => `${t}*`)
    .join(" ");

  let rows = db
    .prepare(
      `SELECT s.kind, s.label, s.detail, s.href
       FROM search_fts JOIN search_index s ON s.rowid = search_fts.rowid
       WHERE search_fts MATCH ?
       ORDER BY (
         bm25(search_fts) - 1.5 * s.prominence
         - CASE WHEN s.name_norm LIKE ? THEN 2 ELSE 0 END
       )
       LIMIT ?`,
    )
    .all(matchExpr, `${folded}%`, limit) as SearchEntity[];

  // Typo-tolerant fallback (trigram similarity) when prefix-FTS is empty.
  if (rows.length === 0) rows = fuzzyResults(folded, limit);

  out.push(...rows);
  return out;
}

export function runSearch(q: string): SearchResponse {
  if (!q || q.trim().length < 2) return { shaped: [], entities: [] };
  return { shaped: shapedAnswers(q), entities: entityResults(q) };
}
