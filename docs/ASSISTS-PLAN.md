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

### Phase A — Max out the source already wired — DONE (floor confirmed, nothing to recover)

**Verdict (2026-06-13): the transfermarkt-datasets assist floor is 2012-13 and is
already fully ingested.** A cloud dry-run over 2009-10→2013-14
(`.github/workflows/transfermarkt-assist-floor.yml`, with assist-availability
reporting added to the ingester) matched 102 United games but **enriched 0** —
canonical already holds everything the dataset offers. The per-season assist
breakdown lists only `2012-13` and `2013-14`; 2009-10, 2010-11, and 2011-12
contribute zero, i.e. the dataset carries no `game_events` for those seasons.
The 2010-11/2011-12 gap is therefore **not recoverable from transfermarkt** — the
data is absent at source, not merely un-ingested. No write was warranted.

Net: modern assist coverage from open/CC0 sources is maxed out at 2012-13+. The
1992–2012 Premier League window (and the 2006–2012 Opta window within it) can
only be served by the Phase C headline lane or proprietary/curated sources.

### Phase B — MUFCInfo verification spike + parser extension — CLOSED (negative)

**Verdict (2026-06-13): MUFCInfo match pages carry no per-goal assists.** The
spike ran on GitHub-hosted runners (open egress reaches mufcinfo.com) via
`.github/workflows/mufcinfo-assist-spike.yml`, inspecting match pages across
1968, 1985, 1994, 2008, and 2017. On every page the goal summary is plain
"Scorer minute', minute'" text (United and opposition in separate cells), with
no "assisted by" / "made by" wording and no player link in the goal cell. The
conservative ingester behaved correctly — `parseGoals()` found nothing and a
1998-99 dry-run attached zero assists — so no source change is warranted.
Per-match assist backfill from MUFCInfo is not possible; the assist gap before
2012 must be served by the Phase C headline lane (or left as honestly
unrecorded). MUFCInfo's own assist numbers live on aggregate stat pages
(career/season), not match pages — that is the Phase C input to evaluate.

Historical detail of the now-closed spike:
`scripts/ingest/mufcinfo-events.ts` (`npm run ingest:mufcinfo-assists`) is in
place. It reuses the cached MUFCInfo match pages and the player-resolution
approach of `scripts/ingest/mufcinfo-lineups.ts`, and is strictly additive: it
attaches an assist to an **existing** United `goal`/`pen-goal` event only when
the assister resolves to a known United player id — never creating, removing, or
re-scoring events, and never touching the opposition. Dry-run by default;
`--write` persists.

The one open unknown is the **goals-section HTML format** on the match pages,
which is not yet pinned to a checked-in fixture (mufcinfo.com is not reachable
from ad-hoc sessions; it is allowlisted in the pipeline). The ingester therefore
ships an `--inspect` mode that makes the spike a single command:

```
npm run ingest:mufcinfo-assists -- --inspect 1999-05-26   # then 1994, 1968, 2008…
```

`--inspect` dumps every page region carrying a minute marker, a player-archive
link, or an assist keyword, plus what `parseGoals()` currently extracts. Steps:

1. Run `--inspect` on a few matches across eras in the pipeline env.
2. If per-goal assists exist, adjust `GOAL_KEYWORDS` / `ASSIST_KEYWORDS` /
   `parseGoals()` to the confirmed wording and add a fixture-backed test; then
   dry-run a season, review, and `--write`. Could plug 1992–2012 and possibly
   earlier in one stroke.
3. If the pages carry only career assist totals (no per-goal creator), stop here
   and fall back to Phase C.

The parse → resolve → conservative-attach mechanics are verified end-to-end
against a synthetic page (scorer name variants such as "Edward Sheringham" →
`teddy-sheringham` resolve correctly); only the real-page goal-cell wording
remains to be confirmed.

### Phase C — Headline assist-totals lane — CLOSED (negative)

**Verdict (2026-06-13): MUFCInfo publishes no structured assist data to import.**
A read-only cloud probe (`.github/workflows/mufcinfo-assist-records-probe.yml`)
checked the aggregate stat pages and individual player-archive pages. Assists
appear only as SEO/meta keywords (`current_season_stats`), narrative editorial
prose (the "who leads… 2026" article), or unrelated biography ("assistant
coach/manager"). The goals/career/all-time tables have no assist column, and the
individual player pages — including Giggs's 2.2MB archive page and Charlton's
1.8MB page — carry zero structured assist figures. The "Giggs 265 assists"
number that circulates online comes from Transfermarkt-style aggregators, not
MUFCInfo. So there is no MUFCInfo headline assist lane to build.

The original plan was to mirror the two-lane design with a
`data/canonical/player-assist-records.json` (analogous to `player-records.json`)
sourced from MUFCInfo career-assist tables. Those tables do not exist, so this
phase is closed.

## Conclusion — current end state

All three open/redistributable lanes are exhausted with evidence:

- **Phase A** (transfermarkt-datasets): assists exist only from 2012-13; already
  fully ingested. Floor confirmed.
- **Phase B** (MUFCInfo match pages): no per-goal assists in any era.
- **Phase C** (MUFCInfo aggregate/career pages): no structured assist data at all.

**There is no open, redistributable, structured source for Manchester United
assists before 2012-13.** Pre-2012 assists exist only in proprietary datasets
(Opta from 2006-07; Transfermarkt.com and FBref/StatsBomb for the modern era),
whose terms the project's licensing guardrails forbid redistributing. The honest
position is therefore:

1. Keep the complete 2012-13+ coverage from `transfermarkt-datasets` (CC0).
2. Treat pre-2012 assists as **unavailable from open sources**, stated plainly in
   the coverage ledger rather than presented as a fillable gap.
3. Only Phase D (curated, cited per-match assists for landmark goals) can add
   anything before 2012, at low volume and high manual cost.

### Phase D — Curated long tail
- RSSSF / Wikipedia / Opta-era citations via curated PRs for notable matches and
  goals only.

### Cross-cutting
- Dry-run-first ingesters, deterministic validation, honest source facets,
  attribution captured, and expectations framed (no pre-1990 assists exist to
  recover).

## Status

All open lanes investigated and closed (see Conclusion above). The remaining
open question is a product decision, not a sourcing one: whether to invest in
Phase D curated landmark-goal assists, or to leave pre-2012 assists explicitly
unavailable in the coverage ledger. No further automated ingestion is warranted.
