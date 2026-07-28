# Transfer history A0 — evidence and feasibility audit

Generated 2026-07-28 from the bundled database built 2026-07-12T16:23:51.483Z.

## Decision

**Pass for a descriptive study with limits. Probability modelling and a best-value ranking remain closed.**

The candidate cohort contains **747 permanent incoming transfers**. **239** carry a published fee; **227** of those can be joined to match-attributed spell appearances and **224** have a broad position.

The present record does not contain signing age or prior Premier League experience. The Premier League comparison asset retains season counts, means, and adjustment factors across **4471** deals, but not the row-level corpus needed to reconstruct percentiles. No success label or composite score has been created.

## Cohort

All recorded permanent incoming transfers; academy promotions and loans are excluded.

- Latest match in the audited database: 2026-05-24 (2025-26).
- Active candidates: 19. This is an inference from no recorded exit plus an appearance in the latest match season; it is not a canonical squad-status field.
- Repeat signings: 28 players across 58 signing rows.
- The generated candidate table is `a0-candidate-cohort.csv`.

## Published-fee permanent signings by era

| Era | Candidate signings | Published fee | Fee + spell appearances | Fee + position |
| --- | ---: | ---: | ---: | ---: |
| Unknown date | 14 | 1 | 0 | 1 |
| Pre-1945 | 448 | 56 | 55 | 54 |
| 1945–91 | 121 | 82 | 79 | 79 |
| 1992–present | 164 | 100 | 93 | 90 |

## Coverage matrix

| Field | Covered | Source | Missing means | Precision | Redistribution position |
| --- | ---: | --- | --- | --- | --- |
| signing_date | 733/747 (98.1%) | MUFCInfo transfer archive | Unknown, not zero | Day/month/year precision is retained | Internal derived use is permitted by the project source policy; review source terms before redistributing a frozen row-level research dataset. |
| manager_id | 681/747 (91.2%) | Transfer date × canonical manager tenures | Unknown when the signing date or tenure boundary is unavailable | Inherits transfer-date precision | Derived from the project fixture record and CC BY-SA/CC0-attributed enrichments; retain source attribution. |
| age_at_signing | 0/747 (0.0%) | No canonical birth-date field | Unavailable | Not calculated | No source selected |
| position_group | 619/747 (82.9%) | Wikidata P413 | Unknown; never inferred | Broad primary-position bucket | Wikidata attribution required |
| prior_pl_experience | 0/747 (0.0%) | No licensed prior-club appearance history | Unavailable | Not calculated | No source selected |
| fee_gbp | 239/747 (32.0%) | MUFCInfo transfer archive | Unknown, free, or undisclosed is distinct from zero | Published nominal GBP amount | Internal derived use is permitted by the project source policy; review source terms before redistributing a frozen row-level research dataset. |
| fee_pl_mean_multiple | 96/747 (12.9%) | PL season mean index | Unavailable before 1992 or without a published fee | Relative to season mean, not a percentile | Aggregated comparison corpus; do not redistribute raw scraped rows |
| fee_pl_percentile | 0/747 (0.0%) | Row-level PL comparison corpus not retained | Unavailable | Cannot reconstruct from season means | Requires a licensed/reusable row-level corpus |
| market_value_eur | 79/747 (10.6%) | transfermarkt-datasets | Unknown, not zero | Nearest recorded estimate at transfer time | CC0 dataset attribution retained |
| spell_appearances | 651/747 (87.1%) | Canonical match lineups | Unavailable without player/date linkage | Bounded by recorded signing/exit dates; imprecise dates remain flagged | Derived from the project fixture record and CC BY-SA/CC0-attributed enrichments; retain source attribution. |
| honour_seasons_involved | 651/747 (87.1%) | Canonical match participation and trophy rules | Empty means no qualifying involvement only when spell stats are covered | Five league appearances or one cup appearance in a winning campaign | Derived from the project fixture record and CC BY-SA/CC0-attributed enrichments; retain source attribution. |
| exit_event | 555/747 (74.3%) | MUFCInfo transfer archive | No recorded exit is not proof of an active spell | First non-loan departure before a repeat signing | Internal derived use is permitted by the project source policy; review source terms before redistributing a frozen row-level research dataset. |
| known_exit_fee_gbp | 105/555 (18.9%) | MUFCInfo transfer archive | Unknown/free/undisclosed is distinct from zero | Published nominal GBP amount | Internal derived use is permitted by the project source policy; review source terms before redistributing a frozen row-level research dataset. |

Active censoring applies to `spell_appearances`, `honour_seasons_involved`, and exit fields even where the compact table above does not repeat the note. See the machine-readable audit JSON for each field's explicit `activeCensoring` value.

## Premier League comparison corpus

- Source: Sky Sports-style PL mean fee index (transfermarkt.co.uk scrape + tim-hy seed fallback)
- Range: 1992-93 to 2024-25
- Seasons: 33
- Retained corpus count: 4471
- Mean-relative cost: supported for descriptive use.
- Percentile bands: not supported from the retained aggregate.

Use the index for descriptive mean-relative cost only. Do not publish percentile bands until a licensed row-level comparison corpus is retained and audited.

## Gate result

- Coverage matrix: complete for the proposed A0 fields.
- Missingness: explicit; unknown, free, undisclosed, zero, and not applicable are not collapsed.
- Descriptive feasibility: supported for the known-fee cohort, with era and position stratification.
- Probability model: closed.
- Best-value ranking: closed.
- Success label: not created.

The next research action is A1 only after real transfer receipts exist for review. The next experience action is the three season/window exemplars.
