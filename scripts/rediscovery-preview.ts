/**
 * Inspect the rediscovery engine's picks (Phase 3a). Prints the ranked "most
 * rediscoverable" nights so the selection can be judged *before* any surface is
 * built — pick quality is the whole point of the engine.
 *
 * Usage:
 *   npx tsx scripts/rediscovery-preview.ts                 # overall + sample eras
 *   npx tsx scripts/rediscovery-preview.ts --since 2015    # biased to a reader's era
 *   npx tsx scripts/rediscovery-preview.ts --opponent liverpool
 *   npx tsx scripts/rediscovery-preview.ts --season 2015-16
 *   npx tsx scripts/rediscovery-preview.ts --player wayne-rooney --limit 15
 *
 * Reads the readonly data/united.db, so run `npm run build:db` first.
 */
import { topRediscoveries, type RediscoveryPick, type RediscoveryOpts } from "../lib/rediscovery";
import { scoreline } from "../lib/format";
import type { ChargeComponents } from "../lib/charge";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const limit = Number(arg("limit") ?? 25);
const since = arg("since") ? Number(arg("since")) : undefined;
const opponent = arg("opponent");
const season = arg("season");
const manager = arg("manager");
const player = arg("player");

function comps(c: ChargeComponents): string {
  return (Object.entries(c) as [keyof ChargeComponents, number][])
    .filter(([, v]) => v > 0.01)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k} ${v.toFixed(2)}`)
    .join(", ");
}

function line(p: RediscoveryPick, i: number): string {
  const m = p.match;
  const score = scoreline(m.gf, m.ga, [m.pen_gf, m.pen_ga], !!m.aet);
  const head =
    `${String(i + 1).padStart(2)}. ` +
    `${p.score.toFixed(2)} (base ${p.baseScore.toFixed(2)}, charge ${p.charge.toFixed(2)}, faded ${p.fadedness.toFixed(2)})  ` +
    `[${p.reason}]  ${m.date}  United ${score} ${m.opponent_name} (${m.venue})  ${m.competition_name}${m.round ? ` · ${m.round}` : ""}`;
  return `${head}\n      ${p.prompt}\n      ${comps(p.components)}`;
}

function section(title: string, opts: RediscoveryOpts): void {
  console.log(`\n══ ${title} ${"═".repeat(Math.max(0, 64 - title.length))}`);
  const picks = topRediscoveries({ limit, ...opts });
  if (picks.length === 0) console.log("   (no charged matches)");
  for (let i = 0; i < picks.length; i++) console.log(line(picks[i], i));
}

const targeted = opponent || season || manager || player || since != null;

if (opponent) section(`Opponent: ${opponent}`, { entityKind: "opponent", entityId: opponent, since });
else if (season) section(`Season: ${season}`, { entityKind: "season", entityId: season, since });
else if (manager) section(`Manager: ${manager}`, { entityKind: "manager", entityId: manager, since });
else if (player) section(`Player: ${player}`, { entityKind: "player", entityId: player, since });
else if (since != null) section(`Overall — following since ${since}`, { since });

if (!targeted) {
  // Default suite: a rich picture in one run.
  section("Overall (no era bias)", {});
  section("Following since 2010", { since: 2010 });
  section("Following since 2018", { since: 2018 });
  section("Following since 1992", { since: 1992 });
  section("Opponent: liverpool", { entityKind: "opponent", entityId: "liverpool" });
  section("Season: 2015-16", { entityKind: "season", entityId: "2015-16" });
}
