# Status

Living project status for Red Thread (repo: **unitedstats**). Updated 2026-07-14.
This document records the state visible in the current codebase and recent
history. Product principles and surface decisions remain in `PRODUCT.md` and
`CONTEXT.md`; small defects and polish belong in `BACKLOG.md`.

---

## At a glance

Red Thread is a working, data-backed Manchester United archive rather than a
prototype. The repository currently ships the match record, entity and archive
pages, public API and flat exports, five standalone editorial stories, the
rediscovery system, and a rendered 90-second Remotion film. The recent work has
shifted from inventing more product surfaces to packaging and presenting the
record: the Stories collection grew from three chapters to five, its index was
rebuilt as an editorial thread, and the film now carries those same ideas in a
data-generated master.

The homepage now opens with a silent, one-pass 20-second Best/Ronaldo excerpt,
then moves directly into the served match-night. This order is settled: it gives
the product a broad, low-demand invitation before choosing one specific game.
The post-launch product pass is now active, beginning with a measured baseline
and one complete 1999-final journey before the pattern spreads.

The other active repository work is player-media coverage. The exhaustive roster
ledger is present and merged locally: eight research batches, media
merging/checking tools, manifest changes, and new cached portraits are now in
the current codebase. The remaining work is a slower Wikimedia cache retry and
portrait-quality review, so it is tracked below as **in progress**.

One operational defect was found during this review: the scheduled results
workflow still invokes the removed `generate:history-digests` command. A new
result would therefore reach that stale step after rebuilding/exporting data.

---

## Shipped product

### Record, data, and operations

- **6,028 matches across 126 seasons (1886–present)**, with **6,022** validated
  United starting XIs; six matches remain without a validated XI.
- Canonical JSON compiles to a read-only SQLite application database, with Elo
  and other aggregates prepared at build time.
- **984-player career register**, **1,967 transfers**, recorded match events,
  managers, opponents, league tables, stadiums, media attribution, and source
  provenance.
- Public read-only API under `/api/v1/*`, CSV/JSON exports under `/dataset/*`,
  a human-facing coverage ledger at `/data`, and `/llms.txt` for machine readers.
- Structured corrections and feedback flows at `/corrections` and `/feedback`.
- Scheduled result ingest from openfootball, enrichment, validation, database
  rebuild, export, optional Vercel Blob upload, and path revalidation. The stale
  history-digest call noted under **Open now** must be removed before this lane
  can be considered fully healthy.

### Live surfaces

| Surface | Current state |
|---|---|
| `/` | Silent 20-second Best/Ronaldo opening thread, followed by `TonightHero`, record skyline, search, and rediscovery entry points |
| `/matches` and `/match/[id]` | Filterable archive; evidence-rich match detail with flow, lineups, receipts, sticky hero, and mobile tabs |
| `/players` and `/player/[id]` | Career register and leaders; player detail includes season record, curated Tableau goals/assists lane, and assist partnerships where covered |
| `/seasons/[season]`, `/manager/[id]`, `/opponent/[id]` | Entity histories with related-night rediscovery rails |
| `/explore` | Approved three-strip Discover hub: questions, curated debates, and curated cuts |
| `/questions/[slug]` | Four promoted myths plus retained routable archive questions; archived material is not promoted |
| `/compare` | Curated debates plus custom player comparison |
| `/analytics` | Elo history, reliability, and Monte Carlo season replay |
| `/transfers` | Season ledger and featured record deals |
| `/surprise`, `/on-this-day` | Rediscovery and calendar-history routes |
| `/stories` | Editorial thread leading to five standalone, chrome-off, `noindex` chapters |

The retired surface decisions still hold: `/history-changed`, `/collection`, and
`/embed` are gone; `/cut` forks redirect into curated discovery; `/opponents`
redirects to search; `/questions` resolves to Explore; and the old `/journey*`
entry points redirect to canonical Stories URLs.

### Stories — five chapters complete

The chapter registry in `lib/journey.ts` is the source of truth:

1. **Two No. 7s** — Best and Ronaldo across shirt, fifth-season peak, European
   Cup, and final goal.
2. **Eleven days in May** — the Treble's three must-win matches and the bench
   interventions that decided them.
3. **Fortress OT** — the post-1984 home-league lead-held run and its three
   rescued cracks.
4. **Fergie time** — three 2–1 comeback shapes across 1993, 1999, and 2023.
5. **A thread of nights** — ten authored archive knots from 1909 to 2024.

The `/stories` index was rebuilt on 2026-07-11 as one continuous editorial
thread rather than a card shelf. Chapter facts are derived from the same match,
event, lineup, comparison, and trail queries used by the application and are
pinned by `tests/journey.test.ts`.

### Rediscovery and mobile

- Charge × fadedness scoring in `lib/rediscovery.ts`, with optional era bias,
  powers entity rails, homepage suggestions, and `/surprise`.
- Curated nights remain a deliberate editorial layer over the record rather
  than an automated “greatest matches” ranking.
- Mobile Waves 0–2 remain complete: navigation and sheets, match filters,
  detail tabs, register/season/archive card treatments, analytics pager, and
  homepage polish. Remaining mobile notes are optional refinement.

### Film and campaign assets

- `red-thread-master-v8` is the current rendered master: **1920×1080, 30 fps,
  2,700 frames / 90 seconds**.
- The film moves through four match signatures, the Best/Ronaldo rhyme, the
  Treble, the shared Fergie-time clock and late-goal bloom, Fortress OT, and a
  real 1954 Chelsea match receipt.
- Film facts are frozen from the canonical database by
  `scripts/generate-video-data.ts`; editorial emphasis lives in a separate
  featured-match manifest.
- The master uses an authored generated score, licensed/attributed media, no
  broadcast footage, a mute/caption composition, and a VTT caption file.
- Earlier prototype and v2–v7 renders remain comparison artifacts. Short and
  vertical distribution cuts are not yet shipped.

### Development and quality gates

CI currently runs `knip`, canonical-data validation, database build, media
cache/check, unit tests, the production Next build, and the static-render
disposition check on Node 24. The scheduled updater separately fetches and
commits new results when available.

A dev-only OpenGraph lab now exists at `/dev/og-lab` with three design
directions. It returns 404 in production and has not changed the production OG
renderer; it is exploration, not a shipped social-card redesign.

---

## Recent milestones

| Date | Milestone |
|---|---|
| 2026-07-03 | Rediscovery engine shipped across entity pages, homepage, and `/surprise` |
| 2026-07-09–10 | First three evidence-led Stories chapters completed and canonicalized under `/stories/*` |
| 2026-07-10 | Fergie-time and ten-night archive chapters added, taking Stories to five |
| 2026-07-11 | Stories index redesigned as an editorial thread; Remotion film workspace and data fixture established |
| 2026-07-12 | 90-second master advanced through v8, with final-goal/lineup evidence and the expanded Best/Ronaldo comparison |

---

## In progress

### Player-media coverage and research merge

The current media manifest explicitly represents the exhaustive verified roster:
**359 resolved records and 797 entries in the missing ledger**. Eight alphabetic
research batches cover all **1,130** canonical identities: **349 candidates
found, 765 unresolved, and 16 ambiguous**. The merge preserves existing curated
records, adds 219 new candidates, and keeps legacy player-record aliases
explicit in the missing ledger.

The roster and research validators pass, the bundled SQLite database has been
rebuilt, and the full test suite passes. **218 of the 359 player records have
local WebP assets; 141 remain fallback-only** because Wikimedia rate-limited the
cache pass. The records retain their verified Commons URLs and attribution for a
later retry. The media audit currently flags 14 era mismatches, 15 non-portrait
filename heuristics, and 8 duplicate Commons files for human review.

The intended end state is:

- every verified player remains explicit in either `records` or `missing`;
- research batches are disjoint and schema-valid before merge;
- cached files and attribution metadata pass media validation for the 218 local
  player assets; the remaining 141 need a later Wikimedia retry;
- unresolved players degrade honestly to initials rather than disappearing;
- the strict roster gate is considered for CI once the manifest has stabilized.

---

## Open now

1. **Repair the scheduled update workflow.** Remove or replace the stale
   `npm run generate:history-digests` call in
   `.github/workflows/update-results.yml`; the freshness-loop script and package
   command were removed during the restraint pass.
2. **Execute the post-launch product plan.** Lock the baseline, then prove the
   complete night-to-thread loop on the 1999 final before spreading match
   context or changing navigation. The phase order and gates live in
   `docs/POST-LAUNCH-IMPLEMENTATION-PLAN.md`.
3. **Retry and review player-media caching.** Re-run the cache after the
   Wikimedia rate-limit window, then inspect the 14 era mismatches, 15
   non-portrait heuristics, and 8 duplicate Commons files before treating the
   portrait lane as fully polished.
4. **Reconcile `BACKLOG.md` with the new media model.** Its “~17 missing” and
   “~850 outside media cohort” language predates the exhaustive `records` +
   `missing` roster ledger and no longer describes the same coverage contract.
5. **Decide whether to productionize the OG lab.** If continued, test real
   question, match, player, and story payloads before changing `lib/og-card.tsx`.
6. **Choose a film distribution target before making derivatives.** The 90s
   master exists; 60/30/15-second and 9:16 cuts, a full-film web embed, and any
   formal campaign release remain separate decisions.

### Minor known backlog

- Strict player-media coverage is not yet part of CI.
- Pre-war own-goal scorers without identities still render as `Unknown`.
- Opponent monograms, compact pitch surnames, and surviving three-letter club
  codes are intentional product choices, not defects.

---

## Closed decisions

| Item | Decision |
|---|---|
| Expanded questions catalogue | No volume target. Keep the four promoted myths until a new lens passes the publication gate in the post-launch plan; archived slugs may remain routable and `noindex`. |
| `/explore` restructure | Superseded 2026-07-14. Reduce the promoted doorway to Questions and curated Comparisons; audit and demote the Curated Cuts strip during Phase 5. |
| Freshness/history-digest surface | Removed as outside the product purpose. The lingering workflow invocation is a bug, not a reason to restore the surface. |
| Broad chart consolidation | Parked until a concrete user-visible problem or broader chart pass justifies it. |
| Compare custom picker removal | Superseded 2026-07-14. Remove the creation UI in Phase 5; keep valid incoming comparison URLs temporarily so shared links do not break abruptly. |
| More Stories chapters | No active chapter roadmap. The current collection is five; another chapter must earn a distinct evidence-backed beat sheet. |
| Homepage opening order | Keep the silent, one-pass 20-second Best/Ronaldo excerpt before the served night. Do not restore sound, looping, or the 90-second embed. |

---

## Documentation health

The code, tests, and current manifests were treated as authoritative in this
review. Two narrative documents contain stale framing:

- `docs/JOURNEY.md` still has an implementation-location paragraph that names
  only the first three routes even though the same file later documents chapters
  four and five.
- `docs/SIZZLE-REEL-SCOPE.md` retains discovery-stage recommendations and open
  pre-production questions above/below notes for already rendered masters.

Those docs remain useful design records, but their old “next move” sections
should not be read as current project status.

## References

| Document | Role |
|---|---|
| `PRODUCT.md` | Product definition and promise |
| `docs/POST-LAUNCH-IMPLEMENTATION-PLAN.md` | Active phase order, implementation scope, and exit gates |
| `CONTEXT.md` | Audience, soul + foundation, lens-not-loom, and surface verdicts |
| `BACKLOG.md` | Small bugs and intentional non-fixes; media entries need reconciliation |
| `docs/DATA-MODEL.md` | Canonical data and SQLite model |
| `docs/SOURCE-AUDIT.md` | Provenance and coverage limits |
| `docs/PIPELINE.md` | Update/deploy architecture |
| `docs/JOURNEY.md` | Stories design and implementation record |
| `video/README.md` | Current film composition and render contract |
| `docs/OG-DESIGN-LAB.md` | Dev-only OG exploration handoff |
