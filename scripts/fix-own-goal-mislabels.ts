/**
 * Reclassify own goals that were never own goals.
 *
 * A genuine `own-goal-for` (a goal credited to United) is, by definition, put
 * through by an opponent — so an `own-goal-for` whose scorer was in *United's*
 * own lineup for that same match is mislabelled: it is a normal United goal that
 * was typed as an own goal. (Roger Byrne's 1951-52 forward goals are the worst
 * cluster; MUFCInfo lists several of these as ordinary goals, no "(o.g.)" tag.)
 *
 * This corrects them in canonical JSON: type → `goal`, side → `united`, the
 * scorer attached to the United player id from that match's lineup. Ex-United
 * players who scored genuine own goals while at other clubs (Phil Neville, Wes
 * Brown, …) are NOT in United's lineup that day, so they are left untouched.
 *
 * Dry run by default; pass --write to save.
 *
 * Usage:
 *   tsx scripts/fix-own-goal-mislabels.ts
 *   tsx scripts/fix-own-goal-mislabels.ts --write
 */
import { loadSeasonFile, listSeasonFiles, saveSeasonFile } from "./lib";
import { normalizedSlug } from "./player-resolver";

const WRITE = process.argv.includes("--write");

function cleanScorer(playerName: string | null | undefined, detail: string | null | undefined): string {
  const raw = playerName ?? detail ?? "";
  return raw.replace(/,?\s*own[\s-]*goal/gi, " ").replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
}

function main() {
  let reclassified = 0;
  const samples: string[] = [];
  const touchedSeasons: string[] = [];

  for (const file of listSeasonFiles()) {
    const season = file.replace(/\.json$/, "");
    const sf = loadSeasonFile(season);
    let seasonTouched = false;

    for (const match of sf.matches) {
      const united = (match.lineup ?? []).filter((l) => l.playerSide === "united" && l.player);
      if (united.length === 0) continue;
      // index United lineup by player id and by name slug
      const byId = new Map(united.map((l) => [l.player as string, l]));
      const bySlug = new Map(
        united.filter((l) => l.playerName).map((l) => [normalizedSlug(l.playerName as string), l]),
      );

      for (const event of match.events ?? []) {
        if (event.type !== "own-goal-for") continue;
        const name = cleanScorer(event.playerName, event.detail);
        if (!name) continue;
        const slug = normalizedSlug(name);
        const lineupEntry = byId.get(slug) ?? bySlug.get(slug);
        if (!lineupEntry) continue; // scorer not in United's XI → genuine own goal, leave it

        reclassified++;
        seasonTouched = true;
        if (samples.length < 20) samples.push(`${match.id}: ${name} ${event.minute ?? "?"}'`);
        if (WRITE) {
          event.type = "goal";
          event.player = lineupEntry.player;
          event.playerName = lineupEntry.playerName ?? name;
          event.playerSide = "united";
          if (event.detail && /own[\s-]*goal|\(og\)/i.test(event.detail)) event.detail = null;
        }
      }
    }

    if (seasonTouched) {
      touchedSeasons.push(season);
      if (WRITE) saveSeasonFile(sf);
    }
  }

  for (const s of samples) console.log(`  ${s}`);
  console.log(
    `fix-own-goal-mislabels ${WRITE ? "write" : "dry-run"}: ` +
      `${reclassified} mislabelled own goals ${WRITE ? "reclassified to United goals" : "to reclassify"} ` +
      `across ${touchedSeasons.length} seasons`,
  );
}

main();
