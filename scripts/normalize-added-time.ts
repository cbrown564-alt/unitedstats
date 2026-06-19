/**
 * Normalise stoppage-time goal minutes so the clock always reads to the period
 * boundary, with the overflow held in `addedTime`. A goal recorded as minute 96
 * becomes `minute: 90, addedTime: 6`; "90+6" and "96" are then the same fact and
 * sort and render consistently across every source.
 *
 * Scope is deliberately narrow and safe:
 *   - Only the 90' boundary, and only in matches that did NOT go to extra time —
 *     there, any minute past 90 can only be second-half stoppage. Extra-time
 *     matches (where 91–120 are real playing minutes) are left untouched; their
 *     stoppage is captured from explicit "90'+x" / "120'+x" source notation by the
 *     MUFCInfo lanes instead. Extra time is detected defensively — the `aet` flag,
 *     a penalty shootout, OR any event past minute 100 — because the `aet` flag is
 *     not set on every extra-time match in the archive.
 *   - Only the plausible second-half stoppage window (minutes 91–99) is collapsed;
 *     a minute of 100+ is treated as real playing time and left alone.
 *   - The 45' boundary is intentionally skipped: first-half stoppage is recorded
 *     inconsistently across sources (a bare "47'" is ambiguous), so it is only set
 *     when a source gives the explicit "+" form, never inferred from an integer.
 *   - Idempotent: events already at/under 90, or already carrying `addedTime`, are
 *     left alone.
 *
 * Dry run by default; pass --write to save.
 *
 * Usage:
 *   tsx scripts/normalize-added-time.ts            # dry run
 *   tsx scripts/normalize-added-time.ts --write
 */
import { listSeasonFiles, loadSeasonFile, saveSeasonFile } from "./lib";

const WRITE = process.argv.includes("--write");

function main() {
  let touchedEvents = 0;
  let touchedMatches = 0;
  const touchedSeasons: string[] = [];

  for (const file of listSeasonFiles()) {
    const season = file.replace(".json", "");
    const sf = loadSeasonFile(season);
    let seasonTouched = false;

    for (const match of sf.matches) {
      // Skip any match that went to extra time: 91–120 are real playing minutes
      // there. The `aet` flag is unreliable in the archive, so also treat a penalty
      // shootout or any event past minute 100 as proof of extra time.
      const events = match.events ?? [];
      const maxMinute = events.reduce((mx, e) => Math.max(mx, e.minute ?? 0), 0);
      if (match.score.aet || match.score.pens != null || maxMinute >= 100) continue;

      let matchTouched = false;
      for (const e of events) {
        if (e.minute == null || e.minute <= 90 || e.minute >= 100 || e.addedTime != null) continue;
        const added = e.minute - 90;
        touchedEvents++;
        matchTouched = true;
        console.log(`${WRITE ? "write" : "dry"} ${match.id}: ${e.type} ${e.minute}' -> 90+${added}`);
        if (WRITE) {
          e.minute = 90;
          e.addedTime = added;
        }
      }
      if (matchTouched) { touchedMatches++; seasonTouched = true; }
    }

    if (seasonTouched) {
      touchedSeasons.push(season);
      if (WRITE) saveSeasonFile(sf);
    }
  }

  console.log(
    `normalize-added-time ${WRITE ? "write" : "dry-run"}: ${touchedEvents} events ` +
      `${WRITE ? "normalised" : "normalisable"} across ${touchedMatches} matches in ${touchedSeasons.length} seasons`,
  );
}

main();
