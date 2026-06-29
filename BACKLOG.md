# Backlog

Open bugs, polish, and intentional non-fixes. Closed items live in git history.

## Open

| Priority | Item | Where | Notes |
|----------|------|-------|-------|
| P1 | ~18 players still have no Commons image | `data/canonical/player-media.json` `missing[]` | e.g. Joe Spence, Lou Macari, Gary Pallister — initials fallback; down from ~25 after legend overrides |
| P2 | Long tail (~850 players) outside media cohort | ingest selection logic | Accept initials, or expand cohorts thoughtfully |
| P2 | `check:media --strict-coverage` not yet in CI | `scripts/check-media.ts` | `check:media` runs in CI; strict coverage flag deferred until `missing[]` stabilises |
| P3 | Pre-war OG scorers show as `"Unknown"` | `components/OwnGoalProfile.tsx` | Data-correct; visually flat |
| Low | `/player/[id]` "How he scored & created" / curated Tableau block lower on scroll stack | player page | Surfacing the curated Tableau lane is also an open data-wiring task (see `SOURCE-AUDIT.md`) |

## Intentional (do not "fix" without a product decision)

- **Pitch surnames vs teamsheet full names** — compact pitch labels vs full names in list/bench (`FormationPitch.tsx`).
- **Opponent monograms, not crests** — `ClubBadge` is a monogram by design (licensing); long-tail European names can produce weak monograms.
- **Three-letter codes still exist** — `lib/clubNames.ts` `code` tier, used outside the match hero; not removed.
