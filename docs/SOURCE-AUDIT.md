# Source Audit

Phase 4 widens the match sheet beyond United scorers. This audit records what
each candidate source can provide, where it is safe to automate, and how it
should enter the canonical record.

## Import priority

| Priority | Source | Best use | Access caveat |
|---|---|---|---|
| 1 | football-data.org | Modern goals, assists, bookings, lineups, benches, substitutions, attendance | Token required; free tier is rate-limited and historical depth varies |
| 2 | Wikipedia season and match articles | Scorers, attendance, rounds, final/late-round lineups | Wikitext tables vary; deterministic parser plus validation required |
| 3 | RSSSF | Historical competition results and scorer cross-checks | Citation granularity varies by page |
| 4 | Official competition sites | Modern match centres, disciplinary records, lineups | Terms, URL stability, and historical range vary by competition |
| 5 | Club yearbooks, programmes, books, newspapers | Older opposition scorers, lineups, wartime, friendly, and tour detail | Manual curation; capture publication, issue/date, page, or archive reference |
| 6 | FBref/Stathead-style sources | Modern event/stat cross-checks where licensing permits | Do not scrape or redistribute restricted data without explicit permission |

## football-data.org

- **Provides:** match metadata, attendance, goals, assists, bookings,
  substitutions, lineups, and benches where exposed by the v4 match resource.
- **Range:** modern coverage depends on competition and plan. Use the API itself
  as the contract for a season rather than assuming all historical matches are
  detailed.
- **Importer:** `npm run ingest:football-data -- <season>` dry-runs by default;
  add `-- --write` to persist canonical JSON changes.
- **Failure modes:** rate limits, missing folded detail, unmatched opponent
  names, partial historical lineups, null attendance, and provider ids changing
  for players.
- **Canonical rule:** United players may be added to `players.json`; opposition
  players remain event or lineup display names with provider ids.

## Wikipedia

- **Provides:** season fixture tables, scorers, attendance, cup rounds, and
  standardized final/late-round match article lineups.
- **Range:** broad but uneven. European and cup detail is often stronger than
  routine domestic lineup data.
- **Importer:** `npm run ingest:wikipedia` for season tables and
  `npm run ingest:lineups` for dedicated final/late-round match articles.
- **Failure modes:** inconsistent table headers, redirects, article rewrites,
  scorer cells with ambiguous own goals or multiple minutes, and venue/date
  quirks.
- **Canonical rule:** parsed facts are accepted only after validation. Dedicated
  match articles are preferred for full lineups.

## RSSSF

- **Provides:** competition result and scorer references, especially where
  modern APIs do not cover historical material.
- **Range:** strong for many historical competitions, but page structure and
  attribution depth vary.
- **Importer priority:** prototype source-specific parsers only for pages with
  stable structure and reusable competition coverage.
- **Failure modes:** ambiguous club names, missing minute detail, and pages that
  summarize rounds without match-level citations.
- **Canonical rule:** use as a source facet or curated correction when the page
  supports the exact match fact being added.

## Official Competition Sites

- **Provides:** match centres with goals, bookings, lineups, substitutions, and
  sometimes assists.
- **Range:** strongest for modern UEFA/FIFA/FA/EFL competitions; historical URLs
  and fields vary.
- **Importer priority:** prototype only after checking terms, URL stability, and
  whether the same parser can cover a meaningful range.
- **Failure modes:** redesigns, region restrictions, JavaScript-only match
  centres, missing archived pages, and renamed competitions.
- **Canonical rule:** cite stable match URLs and keep provider ids where exposed.

## Books, Programmes, Yearbooks, Newspapers

- **Provides:** older lineups, opposition scorers, attendance corrections,
  wartime/friendly/tour records, abandoned-match context, and contemporary
  citations.
- **Range:** high-value for pre-war and early post-war detail where open
  structured data is thin.
- **Importer priority:** curated PRs first. Automate only when a digitized
  archive has a stable, licensed, reusable export path.
- **Failure modes:** OCR errors, conflicting reports, variant player initials,
  and unclear official/non-official match status.
- **Canonical rule:** use `curated` or `book-archive` with notes that name the
  publication, issue/date, page, or archive reference.

## Licensing guardrails

- Do not add scraped data from sources whose terms prohibit redistribution.
- Prefer provider ids and display names for opposition players; do not expand
  the United player identity table with non-United players.
- Keep dry-runs reviewable. A source importer should summarize matched,
  enriched, skipped, and unmatched rows before any write.
- Every aggregate-facing fact must land with a source id so the UI can expose
  its coverage facet.
