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

function entityResults(q: string, limit = 5): SearchEntity[] {
  const db = getDb();
  const like = `%${q}%`;
  const out: SearchEntity[] = [];

  const players = db
    .prepare(
      `SELECT p.id, p.name,
              COALESCE(pr.goals, pt.goals, 0) goals,
              COALESCE(pr.apps, pt.apps, 0) apps
       FROM players p
       LEFT JOIN player_records pr ON pr.player_id = p.id
       LEFT JOIN player_totals pt ON pt.player_id = p.id AND pt.scope = 'all'
       WHERE p.name LIKE ?
         AND pr.player_id IS NOT NULL
       ORDER BY goals DESC, apps DESC LIMIT ?`,
    )
    .all(like, limit) as { id: string; name: string; goals: number; apps: number }[];
  for (const p of players) {
    out.push({
      kind: "player",
      label: p.name,
      detail: `${p.goals} goals${p.apps ? ` · ${p.apps} apps` : ""}`,
      href: `/player/${p.id}`,
    });
  }

  const managers = db
    .prepare(
      `SELECT mg.id, mg.name, COUNT(m.id) p, COALESCE(SUM(m.result='W'),0) w
       FROM managers mg LEFT JOIN matches m ON m.manager_id = mg.id
       WHERE mg.name LIKE ? GROUP BY mg.id ORDER BY p DESC LIMIT ?`,
    )
    .all(like, limit) as { id: string; name: string; p: number; w: number }[];
  for (const m of managers) {
    out.push({
      kind: "manager",
      label: m.name,
      detail: m.p ? `${m.p} matches · ${((100 * m.w) / m.p).toFixed(0)}% won` : "manager",
      href: `/manager/${m.id}`,
    });
  }

  const opponents = db
    .prepare(
      `SELECT o.id, o.name, COUNT(*) p FROM matches m JOIN opponents o ON o.id = m.opponent_id
       WHERE o.name LIKE ? GROUP BY o.id ORDER BY p DESC LIMIT ?`,
    )
    .all(like, limit) as { id: string; name: string; p: number }[];
  for (const o of opponents) {
    out.push({
      kind: "opponent",
      label: o.name,
      detail: `${o.p} meetings`,
      href: `/opponent/${o.id}`,
    });
  }

  const competitions = db
    .prepare(
      `SELECT c.id, c.name, COUNT(m.id) n FROM competitions c JOIN matches m ON m.competition_id = c.id
       WHERE c.name LIKE ? GROUP BY c.id ORDER BY n DESC LIMIT 3`,
    )
    .all(like) as { id: string; name: string; n: number }[];
  for (const c of competitions) {
    out.push({
      kind: "competition",
      label: c.name,
      detail: `${c.n} matches`,
      href: `/matches?competition=${c.id}`,
    });
  }

  // season tokens like "1999" or "1998-99"
  if (/^\d{4}/.test(q.trim())) {
    const seasons = db
      .prepare("SELECT DISTINCT season FROM matches WHERE season LIKE ? ORDER BY season DESC LIMIT 3")
      .all(`${q.trim().slice(0, 4)}%`) as { season: string }[];
    for (const s of seasons) {
      out.push({ kind: "season", label: s.season, detail: "season", href: `/seasons/${s.season}` });
    }
  }

  // exact date → match
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

  return out;
}

export function runSearch(q: string): SearchResponse {
  if (!q || q.trim().length < 2) return { shaped: [], entities: [] };
  return { shaped: shapedAnswers(q), entities: entityResults(q) };
}
