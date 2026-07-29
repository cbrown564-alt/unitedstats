import type Database from "better-sqlite3";
import { getDb } from "./db";
import { rediscoveryForEntity } from "./rediscovery";
import type { InflationIndices } from "./inflation";
import {
  buildManagerTransferLensView,
  costBandForMeanMultiple,
  feePlMeanMultiple,
  type ManagerAggregateBucket,
  type ManagerDefiningLink,
  type ManagerSpellOutcome,
  type ManagerSpellState,
  type ManagerTransferLens,
  type ManagerTransferLensStatic,
} from "./transferManagerLens";
import type { TransferRow } from "./queries";

const MANAGER_DEFINING_LINKS: Record<
  string,
  Array<{ kind: "season" | "player"; id: string; label: string; blurb: string }>
> = {
  "alex-ferguson": [
    {
      kind: "season",
      id: "1998-99",
      label: "1998–99 Treble window",
      blurb: "Yorke, Stam and Solskjær arrived before the Treble season — follow the window into the campaign.",
    },
    {
      kind: "player",
      id: "eric-cantona",
      label: "Eric Cantona",
      blurb: "The Leeds signing that unlocked the first Ferguson league title.",
    },
  ],
  "matt-busby": [
    {
      kind: "player",
      id: "dennis-viollet",
      label: "Dennis Viollet",
      blurb: "A Busby Babes signing whose goals still surface in the rediscovery pool.",
    },
  ],
};

interface SigningRow {
  transfer_id: string;
  player_id: string | null;
  player_name: string;
  signing_date: string | null;
  season: string | null;
  fee_gbp: number | null;
  fee_kind: string;
  last_appearance: string | null;
}

function managerPositionMix(db: Database.Database, signings: TransferRow[]): ManagerAggregateBucket[] {
  const stmt = db.prepare("SELECT bucket FROM player_positions WHERE player_id = ?");
  const buckets = new Map<string, ManagerAggregateBucket>();
  for (const t of signings) {
    if (t.direction !== "in" || !t.player_id) continue;
    const row = stmt.get(t.player_id) as { bucket: string | null } | undefined;
    const id = row?.bucket ?? "unknown";
    const label = row?.bucket ?? "Unknown position";
    const bucket = buckets.get(id) ?? { id, label, count: 0, transferIds: [] };
    bucket.count++;
    bucket.transferIds.push(t.id);
    buckets.set(id, bucket);
  }
  return [...buckets.values()].sort((a, b) => b.count - a.count);
}

function managerSigningOutcomes(db: Database.Database, managerId: string, indices: InflationIndices): ManagerSpellOutcome[] {
  const latestSeason = (db.prepare("SELECT season FROM matches ORDER BY date DESC LIMIT 1").get() as { season: string })
    .season;
  const activeThreshold = `${latestSeason.slice(0, 4)}-07-01`;
  const signings = db
    .prepare(
      `SELECT t.id transfer_id, t.player_id, COALESCE(p.name, t.player_name) player_name,
              t.date signing_date, t.season, t.fee_gbp, t.fee_kind, pt.last_date last_appearance
       FROM transfers t
       LEFT JOIN players p ON p.id = t.player_id
       LEFT JOIN player_totals pt ON pt.player_id = t.player_id AND pt.scope = 'all'
       JOIN manager_tenures mt ON t.date >= mt.date_from AND (mt.date_to IS NULL OR t.date <= mt.date_to)
       WHERE mt.manager_id = ?
         AND t.direction = 'in'
         AND t.type = 'permanent'
         AND t.date IS NOT NULL
       ORDER BY t.date DESC`,
    )
    .all(managerId) as SigningRow[];

  const exitStmt = db.prepare(
    `SELECT id, date, type FROM transfers
     WHERE player_id = ? AND direction = 'out' AND date >= ? AND type != 'loan'
     ORDER BY date`,
  );
  const statsStmt = db.prepare(
    `SELECT COUNT(*) apps, COALESCE(SUM(l.started = 1), 0) starts,
            COUNT(DISTINCT m.season) observation_seasons
     FROM match_lineups l
     JOIN matches m ON m.id = l.match_id
     WHERE l.player_id = ? AND l.player_side = 'united' AND l.bench = 0
       AND m.date >= ? AND m.date <= ?`,
  );
  const goalsStmt = db.prepare(
    `SELECT COALESCE(SUM(CASE
       WHEN e.player_id = ? AND ((e.player_side = 'united' AND e.type IN ('goal','pen-goal')) OR e.type = 'own-goal-for')
       THEN 1 ELSE 0 END), 0) goals
     FROM match_events e JOIN matches m ON m.id = e.match_id
     WHERE m.date >= ? AND m.date <= ?`,
  );

  return signings.map((signing) => {
    const exit =
      signing.player_id && signing.signing_date
        ? ((exitStmt.all(signing.player_id, signing.signing_date) as Array<{ id: string; date: string | null; type: string }>).find(
            (row) => row.date != null,
          ) ?? null)
        : null;
    const endDate = exit?.date ?? null;
    const stats =
      signing.player_id && signing.signing_date
        ? (statsStmt.get(signing.player_id, signing.signing_date, endDate ?? "9999-12-31") as {
            apps: number;
            starts: number;
            observation_seasons: number;
          })
        : null;
    const goals =
      signing.player_id && signing.signing_date
        ? (goalsStmt.get(signing.player_id, signing.signing_date, endDate ?? "9999-12-31") as { goals: number }).goals
        : null;
    const spellState: ManagerSpellState =
      !signing.player_id || !signing.signing_date
        ? "unresolved"
        : exit
          ? "completed"
          : signing.last_appearance && signing.last_appearance >= activeThreshold
            ? "active_candidate"
            : "unclosed_record";

    return {
      transferId: signing.transfer_id,
      playerId: signing.player_id,
      playerName: signing.player_name,
      season: signing.season,
      feeGbp: signing.fee_gbp,
      feeKind: signing.fee_kind,
      costBand: costBandForMeanMultiple(
        feePlMeanMultiple(signing.fee_gbp, signing.fee_kind, signing.signing_date, signing.season, indices),
      ),
      spellState,
      apps: stats?.apps ?? null,
      starts: stats?.starts ?? null,
      goals,
      observationSeasons: stats?.observation_seasons ?? null,
    };
  });
}

function buildDefiningLinks(managerId: string, transfers: TransferRow[]): ManagerDefiningLink[] {
  const links: ManagerDefiningLink[] = [];
  const seen = new Set<string>();

  const push = (link: ManagerDefiningLink) => {
    const key = `${link.kind}:${link.href}`;
    if (seen.has(key)) return;
    seen.add(key);
    links.push(link);
  };

  for (const authored of MANAGER_DEFINING_LINKS[managerId] ?? []) {
    if (authored.kind === "season") {
      push({
        kind: "season",
        href: `/seasons/${authored.id}`,
        label: authored.label,
        blurb: authored.blurb,
      });
      const prompt = rediscoveryForEntity("season", authored.id);
      if (prompt) {
        push({
          kind: "match",
          href: prompt.href,
          label: prompt.line,
          blurb: prompt.reason,
        });
      }
    } else {
      push({
        kind: "player",
        href: `/player/${authored.id}`,
        label: authored.label,
        blurb: authored.blurb,
      });
      const prompt = rediscoveryForEntity("player", authored.id);
      if (prompt) {
        push({
          kind: "match",
          href: prompt.href,
          label: prompt.line,
          blurb: prompt.reason,
        });
      }
    }
  }

  const topSeason = [...new Set(transfers.map((t) => t.season).filter(Boolean) as string[])].sort((a, b) =>
    b.localeCompare(a),
  )[0];
  if (topSeason) {
    const prompt = rediscoveryForEntity("season", topSeason);
    if (prompt) {
      push({
        kind: "match",
        href: prompt.href,
        label: `${topSeason} — ${prompt.line}`,
        blurb: prompt.reason,
      });
    }
  }

  return links.slice(0, 6);
}

export function buildManagerTransferLensStatic(
  managerId: string,
  transfers: TransferRow[],
  indices: InflationIndices,
  db: Database.Database = getDb(),
): ManagerTransferLensStatic {
  const signings = transfers.filter((t) => t.direction === "in");
  const spellOutcomes = managerSigningOutcomes(db, managerId, indices);
  return {
    positionMix: managerPositionMix(db, signings),
    completedSpells: spellOutcomes.filter((row) => row.spellState === "completed"),
    ongoingSpells: spellOutcomes.filter((row) => row.spellState === "active_candidate"),
    definingLinks: buildDefiningLinks(managerId, transfers),
  };
}

/** Server helper for tests and pages that need the full merged lens. */
export function buildManagerTransferLens(
  managerId: string,
  transfers: TransferRow[],
  mode: import("./inflation").MoneyMode,
  indices: InflationIndices,
  db: Database.Database = getDb(),
): ManagerTransferLens {
  return buildManagerTransferLensView(transfers, mode, indices, buildManagerTransferLensStatic(managerId, transfers, indices, db));
}
