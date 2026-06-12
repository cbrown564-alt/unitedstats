/**
 * One-off repair: earlier final-lineups runs matched semi/quarter-final rounds
 * (round contains "final") and a date-blind fallback assigned them the FINAL
 * article's lineup tables — e.g. Juventus's 1997 final XI stored as United's
 * lineup for the Porto quarter-final.
 *
 * A match's lineup is removed when it exactly reproduces (player/shirt/role/
 * start/on/off) a lineup table parsed from the final article that the buggy
 * title lookup would have used. Matches whose ids overlap but details differ
 * are only reported for review.
 *
 * Usage: tsx scripts/fix-final-lineup-bleed.ts
 */
import fs from "node:fs";
import path from "node:path";
import { LineupEntry, listSeasonFiles, loadSeasonFile, saveSeasonFile, slugify } from "./lib";
import { articleTitles, CACHE, parseFinalArticle } from "./ingest/final-lineups";

const ONE_OFF_FINALS = new Set(["charity-shield", "uefa-super-cup"]);

function entryKey(e: LineupEntry): string {
  return [e.player, e.shirt ?? null, e.role ?? null, e.start, e.on ?? null, e.off ?? null].join("|");
}

/** Reproduce exactly what the writer would have stored for a parsed table. */
function tableToEntries(rows: ReturnType<typeof parseFinalArticle>[number]["teams"][number]): LineupEntry[] {
  const lineup: LineupEntry[] = [];
  const seen = new Set<string>();
  for (const r of rows) {
    if (!r.start && r.on == null) continue;
    const pid = slugify(r.name);
    if (seen.has(pid)) continue;
    seen.add(pid);
    lineup.push({ player: pid, shirt: r.shirt, role: r.role, start: r.start, on: r.start ? null : r.on, off: r.off });
  }
  return lineup;
}

let removed = 0;
let review = 0;
const removedIds = new Set<string>();

for (const file of listSeasonFiles()) {
  const season = file.replace(".json", "");
  const sf = loadSeasonFile(season);
  let touched = false;

  for (const m of sf.matches) {
    if (!m.lineup || m.lineup.length === 0) continue;
    const oneOff = ONE_OFF_FINALS.has(m.competition) && !/group/i.test(m.round ?? "");
    if (/^final/i.test(m.round ?? "") || oneOff) continue; // legitimate targets
    const titles = articleTitles(m.competition, m.date);
    if (!titles) continue;
    const cacheFile = path.join(CACHE, `${slugify(titles[0])}.wikitext`);
    if (!fs.existsSync(cacheFile)) continue;

    const blocks = parseFinalArticle(fs.readFileSync(cacheFile, "utf8"));
    const mine = m.lineup.map(entryKey).sort().join("\n");
    const mineIds = new Set(m.lineup.map((e) => e.player));

    for (const blk of blocks) {
      for (const table of blk.teams) {
        const expected = tableToEntries(table);
        if (expected.length === 0) continue;
        const key = expected.map(entryKey).sort().join("\n");
        if (key === mine) {
          console.log(`REMOVE ${m.id} (${m.round}): lineup is a table from "${titles[0]}"`);
          for (const id of mineIds) if (id) removedIds.add(id);
          delete m.lineup;
          touched = true;
          removed++;
        } else if (
          expected.length === mineIds.size &&
          expected.every((e) => mineIds.has(e.player ?? ""))
        ) {
          console.log(`REVIEW ${m.id} (${m.round}): same players as a "${titles[0]}" table, details differ`);
          review++;
        }
        if (!m.lineup) break;
      }
      if (!m.lineup) break;
    }
  }

  if (touched) saveSeasonFile(sf);
}

console.log(`\nremoved ${removed} bled lineups, ${review} flagged for review`);
console.log(`player ids referenced by removed lineups: ${removedIds.size}`);
fs.writeFileSync(
  path.join(__dirname, "..", "data", "raw", "lineup-bleed-removed-ids.json"),
  JSON.stringify([...removedIds].sort(), null, 2),
);
