# Dataset license

The UnitedStats dataset — the canonical JSON in `data/canonical/`, the compiled
SQLite database `data/united.db`, and the exports in `public/dataset/` — is
licensed under **Creative Commons Attribution-ShareAlike 4.0 International
(CC BY-SA 4.0)**: https://creativecommons.org/licenses/by-sa/4.0/

Match results, dates, and scores are factual records. The CC BY-SA license
applies to the compilation: the curation, normalization, identifiers, source
facets, and corrections layered on top of the sources below. Several enrichment
facets (scorers, attendance, lineups) are derived from Wikipedia article text,
which is itself CC BY-SA — share-alike is therefore both a choice and an
obligation.

## Attribution

When reusing the dataset, credit **UnitedStats** with a link to this
repository, and preserve the source attributions below.

## Sources

| Source | What it provides here | Its terms |
|---|---|---|
| [engsoccerdata](https://github.com/jalapic/engsoccerdata) (James Curley) | League and FA Cup results, 1886–present | R package licensed GPL (≥ 2); results used as factual records with attribution |
| [openfootball](https://github.com/openfootball) | Current-season results | CC0 / public domain |
| [Wikipedia](https://en.wikipedia.org) season and match articles | Cup/European results, attendance, scorers, finals lineups | CC BY-SA 4.0; parsed deterministically from wikitext |
| [Wikidata](https://www.wikidata.org) / [Wikimedia Commons](https://commons.wikimedia.org) | Player records, portrait references | CC0 (Wikidata); each Commons image carries its own license, recorded per file in `data/canonical/player-media.json` and displayed with attribution in the UI |
| [transfermarkt-datasets](https://github.com/dcaribou/transfermarkt-datasets) | Modern lineups, goal events, cards, substitutions | CC0 (dataset project) |
| [football-data.org](https://www.football-data.org) | Match-sheet enrichment (token-gated; not redistributed raw) | Per their terms of use |

Per-match provenance is recorded in `match_sources` (see `docs/DATA-MODEL.md`)
and surfaced on every match page.

## Corrections

The dataset is plain JSON and corrections are welcome — see the correction
contract on the `/data` page or `docs/DATA-MODEL.md`. Corrections submitted as
pull requests are accepted under this same license.
