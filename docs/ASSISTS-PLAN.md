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

### Phase C — Headline assist-totals lane (honest fallback)
- Mirror the existing two-lane design: build
  `data/canonical/player-assist-records.json` (analogous to `player-records.json`)
  from MUFCInfo career-assist tables, surfaced on player pages and clearly
  labelled "career total, not match-attributed" — the same way `player_records`
  and `player_totals` already coexist.

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
headline lane. The importer now exists; resolve the unknown with
`npm run ingest:mufcinfo-assists -- --inspect <date>` in the pipeline before any
`--write`.
