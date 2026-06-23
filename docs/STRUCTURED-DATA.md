# Structured data and machine answers

Phase 14 makes UnitedStats easier for crawlers and assistants to cite without
turning generated facts into unattributed snippets. The selected launch surfaces
are match entity pages, history-changed answer pages, curated Cut answer APIs,
and history-digest answer APIs.

## Mapping

| Surface | Route | schema.org type | Required fields | Provenance fields |
| --- | --- | --- | --- | --- |
| Match entity | `/match/[id]` | `SportsEvent` | `@id`, `identifier`, `url`, `name`, `description`, `startDate`, `sport`, teams, optional venue | `isBasedOn[]` from `sourcesForMatch()` via Phase 0 `matchSourceProvenance()` |
| History-changed answer | `/history-changed/[id]` | `CreativeWork` | `@id`, `identifier`, `url`, `name`, `description`, `version`, `about`, `citation[]` | `isBasedOn[]` from the digest artifact's Phase 0 provenance |
| Curated Cut answer API | `/api/v1/answers/cuts/[slug]` | JSON answer payload, not JSON-LD | answer `ref`, Cut `ref`, `version`, `question`, `answer`, evidence links, data | Result-source provenance built from canonical `match_sources` rows with `facet=result` |
| History-digest answer API | `/api/v1/answers/history-digests/[id]` | JSON answer payload, not JSON-LD | answer `ref`, `version`, `question`, `answer`, digest claim data | Digest artifact provenance |

`SportsEvent` is used only for match pages, where the page is an actual
completed football fixture. History-changed pages use `CreativeWork` rather
than `ClaimReview` because UnitedStats is not reviewing a third-party claim; it
is publishing generated notes from its own canonical record. Cut answer APIs are
plain JSON because the public contract is the `/api/v1` data model, not an HTML
page.

## ID and version policy

All public IDs come from `lib/citations.ts`:

- Match JSON-LD uses `matchRef(match.id)`.
- History-changed JSON-LD uses the digest's checked-in `historyDigestRef`.
- Curated Cut answers use `cutRef(curatedCut)` plus
  `answerRef("cut-headline", cutKey(cut), "/api/v1/answers/cuts/[slug]")`.
- History-digest answers use
  `answerRef("history-digest", matchId, "/api/v1/answers/history-digests/[id]")`.

Machine-answer `version` values are `claimVersion()` hashes of the stable answer
payload. They contain no wall-clock timestamps and change only when canonical
inputs or generated claim content changes.

## Crawl policy

`/api/v1` is a read-only public data surface, so robots allows `/api/v1/` and
the answer-shaped routes beneath it. Side-effect endpoints remain excluded:
`/api/search/click` is disallowed. `/llms.txt`, `/sitemap.xml`, JSON-LD source
names, and `apiJson` attribution all use the same source name:
`UnitedStats, the open Manchester United match history`.

The answer routes currently remain dynamic because the surrounding `/api/v1`
route handlers read SQLite on demand. They return the shared immutable dataset
cache headers via `apiJson`: browser `max-age=300`, edge `s-maxage=86400`, and
`stale-while-revalidate=604800`.
