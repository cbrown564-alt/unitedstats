# Assists Coverage Plan

Goals and appearances are comprehensive; assists are not. This document records
the measured gap, an honest assessment of which sources can plug it, and a
phased plan. It is the agreed reference before any new ingester work.

## The gap, measured

Counting every United goal event (`goal` + `pen-goal`) in `data/canonical`:

| Era | United goals | with assist | coverage |
|---|---|---|---|
| 1880s–2000s | ~8,600 | 0 | 0% |
| 2010s | 973 | 568 | 58% |
| 2020s | 541 | 386 | 71% |
| **All time** | **10,141** | **954** | **9.4%** |

Assists begin abruptly at **2012-13**. Even `2010-11` (111 goals) and `2011-12`
(117 goals) carry zero. Every recorded assist comes from a single source: the
CC0 `transfermarkt-datasets` `game_events.player_assist_id` column, attached to
`Goals` events from 2012-13 onward (see `scripts/ingest/transfermarkt-datasets.ts`).

The data model is not the constraint. The canonical event schema, the SQLite
`match_events` columns, `player_totals.assists`, the assist-partnership queries,
and the `assists` coverage facet are all already wired (`lib/queries.ts`,
`scripts/build-db.ts`, `docs/DATA-MODEL.md`). The constraint is source data.

## Reality check: assists are an Opta-era construct

The "assist" was not systematically recorded by anyone before the 1990s and only
became a reliable, standardised statistic from **2006-07** (Opta's real-time
collection). Consequences:

- No source — MUFCInfo, books, RSSSF, or otherwise — holds systematic per-match
  assist data for 1892–1990. That portion of the gap is **unrecorded by
  history**, not merely unsourced. The plan states this rather than chasing it.
- The achievable target is the **modern era**: ideally back to 1992 (Premier
  League launch), realistically strong from 2006 (Opta), with 2012– already done.

## Source assessment

Egress note: source verification that hits `mufcinfo.com`, `wikipedia.org`, or
the transfermarkt R2 bucket must run in the pipeline (GitHub Actions) environment
where those hosts are allowlisted. They are blocked from ad-hoc web sessions.

| Source | Assist data? | Verdict |
|---|---|---|
| **MUFCInfo** (already cached and parsed for lineups) | Tracks assists for the modern era (publishes goals-and-assists pages and career-assist leaders). Unknown whether per-match pages annotate the creator of each goal. | Highest leverage. Already licensed, cached, trusted, and parsed by this repo. Needs a verification spike. |
| **transfermarkt-datasets** (in use) | Yes, 2012-13→. Possibly 2010-12 unread. | Quick win, bounded, free, CC0. |
| **Opta / PL official / theanalyst / manutd.com** | Yes, 2006-07→ | Proprietary; redistribution restricted. Curated citations only, not bulk import. |
| **FBref / StatsBomb** | Full events 2017-18→ | `SOURCE-AUDIT.md` forbids scraping/redistributing restricted data. Off the table. |
| **Wikipedia / RSSSF** | Rare, prose only for big matches | Curated PRs for finals/notable goals only. |
| **Books / programmes** | Essentially none (assists weren't recorded) | Not viable for assists. |

## Plan (phased, lowest-risk first)

### Phase A — Max out the source already wired
- Re-run `npm run ingest:transfermarkt-datasets` across all modern seasons in the
  pipeline env; check whether `game_events` carries assists for 2010-11/2011-12
  and recover them if present.
- Update the coverage ledger and README numbers.

### Phase B — MUFCInfo verification spike + parser extension (the big one)
- In the pipeline env, pull MUFCInfo match pages across several eras (e.g. 1968,
  1994, 1999, 2008) and inspect the goals/scorers section for any creator
  annotation ("made by" / "assisted by").
- If per-goal assists exist: add a `mufcinfo-events` ingester (sibling to
  `scripts/ingest/mufcinfo-lineups.ts`, reusing its player-resolution machinery)
  that writes `assist`/`assistName` onto existing goal events — conservative,
  dry-run-first, only when the assister resolves to a United id. Could plug
  1992–2012 and possibly earlier in one stroke.
- If only career assist totals exist: fall back to Phase C.

### Phase C — Headline assist-totals lane (honest fallback)
- Mirror the existing two-lane design: build
  `data/canonical/player-assist-records.json` (analogous to `player-records.json`)
  from MUFCInfo career-assist tables, surfaced on player pages and clearly
  labelled "career total, not match-attributed" — the same way `player_records`
  and `player_totals` already coexist.

### Phase C′ — Curated Tableau season aggregate (delivered)
A hand-curated Tableau workbook now supplies season-level goals **and assists**
by player/opponent/competition for **1987-88 → 2014-15** — richer than career
totals and covering the pre-2012 era this gap is about. It is normalized into
`data/canonical/tableau-goals-assists.json` (2,469 assists) but is **not
match-attributed** (no dates/minutes), so it lands as its own season-level lane
rather than `match_events`, exactly like the `player_records` headline lane.
See `docs/TABLEAU-GOALS-ASSISTS.md`. Wiring it into `build:db` and player pages
(clearly labelled "curated, season-level") is the open follow-up.

### Phase D — Curated long tail
- RSSSF / Wikipedia / Opta-era citations via curated PRs for notable matches and
  goals only.

### Cross-cutting
- Dry-run-first ingesters, deterministic validation, honest source facets,
  attribution captured, and expectations framed (no pre-1990 assists exist to
  recover).

## Open decision

The pivotal unknown is **what MUFCInfo match pages contain per goal**. It decides
whether Phase B is a sweeping backfill or whether the work falls to the Phase C
headline lane. Resolve it first (Phase B spike) before committing to an importer.
