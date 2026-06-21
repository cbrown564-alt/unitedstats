# Search — first-class experience plan

The homepage frames UnitedStats as a search-first product ("start with a question,
a name, or a season"). The underlying relational data is rich; the search layer
currently exercises a fraction of it. This document is the durable plan for closing
that gap, sequenced so each phase ships standalone value.

## Where we started (assessment)

The engine was `lib/search.ts`: `entityResults()` ran 5–6 separate `LIKE '%q%'`
queries (players/managers/opponents/competitions/seasons/dates) and
`shapedAnswers()` matched 5 hardcoded regex templates. The UI
(`components/SearchCommand.tsx`) is a `/`-to-focus dropdown with arrow/enter/esc.

Graded against a best-in-class bar (StatMuse for sports NLP; current typeahead /
command-palette UX consensus):

| Criterion | Grade | Why |
|---|---|---|
| Instant & forgiving | D | substring `LIKE` only; no fuzzy/typo/diacritic/alias handling. "Solskjaer" (ASCII) returned **nothing** — stored name is "Solskjær". |
| Ranked relevance | D+ | no score; players sorted by career `goals DESC`, prefix vs mid-string indistinguishable |
| Entity coverage | C | stadiums/cities/transfers unsearchable; matches only by exact ISO date |
| Query understanding | C− | 5 brittle regexes; only near-exact phrasings work |
| Zero/empty states | F | `<2 chars` blackout; no recents/suggestions/"did you mean" |
| Result legibility | C | no match highlighting; no "see all"; no results page |
| Command-palette ergonomics | C+ | good `/` + arrows, but no ⌘K, no scoping, not an ARIA combobox |
| Learns & measured | F | no query/zero-result/click logging |

## Criteria for "first-class" search

1. **Instant & forgiving** — <100ms, typo/diacritic tolerance, nickname/alias/abbreviation handling.
2. **Ranked relevance** — best match first by a real score (prefix > substring, prominence, recency).
3. **Entity coverage** — everything in the model reachable, not just six kinds.
4. **Query understanding** — NL questions resolve to computed answers, not exact-phrase regex.
5. **Strong zero/empty states** — recents, popular/suggested, "did you mean".
6. **Result legibility** — grouped headers, match highlighting, a full results page.
7. **Command-palette ergonomics** — ⌘K, full keyboard nav, scoping, ARIA combobox.
8. **Learns & is measured** — zero-result + click-through logging feeding ranking.

References: StatMuse (NLP sports search), Meilisearch typeahead guidance,
uxpatterns.dev command-palette pattern, advanced-search-UX consensus (UXPin/LogRocket).

---

## Phase 1 — Foundation: relevance + forgiveness  ← **DONE**

Shipped: `search_index` + `search_fts` in `scripts/build-db.ts` (1,409 entities),
`data/canonical/search-aliases.json`, FTS ranking + trigram typo fallback in
`lib/search.ts`, matched-term highlighting in `components/SearchCommand.tsx`.
Verified: typecheck, lint, knip, 19 tests pass; live API + dropdown screenshots
confirm "solskjaer"→Solskjær, "roony"→Rooney, "spurs"/"cr7"/"becks" aliases, and
prominence-ordered prefix ranking.


Core move: a single FTS5-backed index built at DB-build time, queried with real
ranking. No new infra (FTS5 ships with `better-sqlite3`).

- **`scripts/build-db.ts`** — add `search_index` (content table: kind, entity_id,
  label, detail, href, `name_norm` folded, `aliases` folded, `prominence` 0..1) +
  `search_fts` (FTS5 external-content over `name_norm`, `aliases`). Populated in JS
  after all reference inserts, reusing existing aggregates (player_totals,
  match counts). `prominence` = normalised goals+apps / matches managed / meetings.
- **Folding** — `fold()` = NFD strip-diacritics + lowercase + alphanumeric tokens.
  Fixes the Solskjær class of bug.
- **Aliases** — historical opponent names from existing `opponent-aliases.json`,
  plus a new curated `data/canonical/search-aliases.json` (player nicknames:
  Becks/CR7/Ole…; opponent shorts: Spurs/Man City/West Brom…).
- **`lib/search.ts`** — `entityResults()` becomes one FTS query: `bm25()` blended
  with a prefix-match boost and `prominence`. LIKE-on-`name_norm` fallback when FTS
  is empty (no regression). Returns match offsets for highlighting.
- **`components/SearchCommand.tsx`** — highlight matched substrings.

**Kinds in scope:** player, manager, opponent, competition, season.
**Deferred:** stadiums/cities — no destination route exists yet; they join in Phase 3
alongside a `matches?stadium=` facet (avoids indexing rows that go nowhere).

Acceptance: "solskjaer", "becks", "man utd"→United-adjacent, "spurs", "char" all
return the right entity first; one DB query per keystroke; matched text highlighted.

## Phase 2 — Query understanding (no LLM)

- Refactor `shapedAnswers()` into a parser + template registry (`lib/search/intent.ts`):
  tokenize → resolve entities via the Phase-1 index (fuzzy) → map filled slots to a
  template, decoupling phrasing from computation.
- Templates (reuse `rec()`/`recText()` and the matches-page sorts): `record`,
  `headToHead` (venue-aware), `superlative` (biggest win / heaviest defeat / best
  attended, era-scoped), `comparison` (player vs player), `eraScoped`.
- Keep the 5 current regexes as trigger aliases → zero regression.

Acceptance: "Arsenal away record", "biggest wins in the 90s", "Rooney vs Charlton",
"United in Europe" all resolve to a computed answer with an evidence link.

## Phase 3 — Surface & ergonomics

- ⌘K command palette (extract shared `SearchResults` from `SearchCommand`).
- `app/search/page.tsx` results page: grouped, paginated, faceted (kind, competition,
  era, venue — reuse matches-page vocabulary + `queryString()`). Dropdown gains a
  "See all N results →" footer.
- Empty state (recents in localStorage + popular questions from homepage `MYTHS` +
  syntax hints); zero state with "did you mean" via fuzzy fallback.
- Scoping operators (`player:`, `season:`, `vs:`).
- Accessibility: real `role="combobox"`/`listbox`/`option` + `aria-activedescendant`.
- Add stadium/city coverage here (with a destination).

## Phase 4 — Learn & measure (LLM deferred here)

- Log `{q, resultCount, ts}` + click-through (main DB is readonly → append-only file
  or a small writable SQLite). Feeds `prominence` and popular-questions.
- Prefetch top hit on hover; hold the <100ms budget.
- **LLM fallback — design only, not built.** When the deterministic parser can't
  resolve a question, a gated/cached route translates NL → a *constrained, validated
  query plan* against a schema allowlist (never raw model SQL) → existing templates.
  Revisit once zero-result logs show what deterministic parsing actually misses.

## Sequencing

1 → 2 → 3 → 4. Phase 1 is the prerequisite (FTS index + fuzzy resolution) that 2 and
3 build on. Each phase leaves the site shippable; `build-db.ts` regenerates the DB
from canonical JSON, so schema changes revert cleanly.
