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

## Phase 2 — Query understanding (no LLM)  ← **DONE**

Shipped as `lib/search/`: `fold.ts` (shared fold/trigram primitives), `resolve.ts`
(`resolveEntity()` — the entity resolver over `search_index`, prefix-FTS then
trigram fallback, kind-filterable), and `intent.ts` (the parser + template
registry). `shapedAnswers()` now runs a scope parser (venue, decade, season,
manager, competition/type) that strips recognised fragments and leaves a residual
name, then dispatches to template families — `comparison` (player vs player),
`superlative` (biggest win / heaviest defeat / best attended, era/opponent-scoped),
`headToHead` (venue-aware, resolves from a bare opponent phrase), record-under-
manager, era/competition-scoped, and a bare-season record — all fed by one shared
`recordFor()` built on the matches-page `matchWhere()` so a shaped answer reads the
exact rows the browser would. `late goals under …` is preserved verbatim. Scoping
operators `player:` / `season:` / `vs:` parse in `runSearch()`.

Verified (tests in `tests/golden.test.ts`, all 31 pass) + live API: "arsenal away
record"→venue-aware H2H, "biggest win in the 90s"→9–0 v Ipswich (Mar 1995),
"rooney vs charlton"→comparison (never a Charlton-Athletic H2H), "united in
europe"→P430 W230… record, `player:giggs`/`vs:liverpool` operators, "roony"→Rooney.

## Phase 3 — Surface & ergonomics  ← **DONE**

- `components/SearchResults.tsx` — shared keyboard-driven listbox (`role="option"`,
  `aria-selected`), used by both the dropdown and the palette; `useSiteSearch.ts`
  is the shared debounced fetch hook.
- `components/CommandPalette.tsx` — ⌘K / Ctrl-K overlay, mounted once in the root
  layout; full keyboard nav, focus on open, Esc/backdrop close.
- `app/search/page.tsx` — server results page: shaped answers, a kind facet rail
  with counts, entity groups (capped with "See all N →" → kind facet), per-kind
  pagination (`Pager`), and a fuzzy "did you mean" zero state. Plain GET form so it
  works without JS and is URL-shareable.
- Dropdown/palette gained a "See all N results → / Open the results page →" footer;
  Enter with no row highlighted opens the results page.
- Empty state (`SearchEmptyState.tsx`): recents (localStorage via a cached external
  store + `useSyncExternalStore`), worked example questions, operator hints.
- Accessibility: input is a real `role="combobox"` with `aria-expanded` /
  `aria-controls` / `aria-activedescendant` pointing at the active option.
- Stadium/city coverage: indexed in `build-db.ts` (grounds that actually staged a
  match) with `/matches?stadium=`/`?city=` destinations (`MatchFilter` +
  `matchWhere()` + matches-page chips + `stadiumById()`).

## Phase 4 — Learn & measure (LLM deferred here)  ← **DONE (telemetry); LLM design-only**

- `lib/search/log.ts` — append-only JSONL telemetry (the main DB is read-only).
  `GET /api/search` logs `{kind:"query", q, resultCount, shaped, ts}`;
  `POST /api/search/click` (beacon from `lib/search/clientLog.ts`, fired on select)
  logs `{kind:"click", q, href, resultCount, ts}`. Best-effort: a read-only FS
  (serverless) just drops the write — telemetry can never break search. Path is
  `SEARCH_LOG_PATH`-overridable, `SEARCH_LOG=0` disables; default sidecar is
  git-ignored. This is the raw material for feeding `prominence` + popular-questions.
- Top-hit prefetch rides Next's `<Link>` prefetch (hover / viewport) in the shared
  results list, holding the latency budget.
- **LLM fallback — design only, not built.** Trigger: a query the deterministic
  parser leaves with *no shaped answer and no/weak entity hits* (exactly the
  `resultCount:0, shaped:0` rows the query log now captures). Shape:
  1. a gated, cached (hash→plan) server route — never on the typeahead hot path;
  2. the model emits a **constrained query plan** (a JSON object: one of the
     existing template names + typed slots — opponent/manager/player/season/
     venue/era/competition), **never raw SQL**;
  3. validate every slot against the `search_index` resolver + a schema allowlist,
     reject anything off-list, then run it through the *same* `intent.ts` templates
     so the answer and evidence link are identical to a deterministic hit.
  Prefer the Vercel AI Gateway with a small model and zero data retention.
  Revisit once the zero-result logs show which phrasings deterministic parsing
  actually misses — build the templates those rows demand before reaching for a model.

## Phase 5 — Search-to-Matches parity  ← **DONE**

The subject × metric × scope grammar can now answer richer questions than the
Matches browser can visibly reproduce. The next move is to make every search
answer that says "Show the matches" land on an exact, inspectable `/matches`
slice. Treat `/matches` as the evidence surface: search computes the answer,
Matches proves the rows.

### Filter contract

Keep two layers distinct:

| Layer | Params | Meaning |
|---|---|---|
| Match-level | `competition`, `opponent`, `manager`, `season`, `venue`, `result`, `type`, `stadium`, `city`, `from`, `to`, `sort` | What fixtures are in the slice. |
| Participant/event-level | `player`, `scorer`, `assister`, `goalWindow`, `goalFrom`, `goalTo` | Which matches are included because a recorded United lineup row or goal event exists. |
| Match-state | `aet=1` | Fixtures that went to extra time, regardless of who scored when. |

Existing "ghost filters" already work through `MatchFilter` and chips but are not
first-class in the form: `manager`, `scorer`, `player`, `stadium`, and `city`.
Expose them deliberately rather than adding parallel concepts.

### Goal timing semantics

Prefer `goalWindow` for stable named filters; keep `goalFrom`/`goalTo` as the
lower-level custom range that named windows compile to.

| Query idea | URL shape | Event predicate |
|---|---|---|
| first-half goals | `goalWindow=firstHalf` | `minute BETWEEN 1 AND 45` |
| second-half goals | `goalWindow=secondHalf` | `minute >= 46` |
| late goals | `goalWindow=late` | `minute >= 86` |
| stoppage-time goals | `goalWindow=stoppage` | `added_time > 0`, plus non-AET rows stored as `minute > 90` |
| extra-time goals | `goalWindow=extraTime` | `m.aet = 1 AND minute > 90`, excluding rows stored as `90+N` via `minute=90, added_time=N` |
| custom range | `goalFrom=70&goalTo=80` | inclusive minute bounds |

`late` stays the canonical product definition: after the 85th minute. It can
overlap stoppage time. `stoppage` is event-level; it means a recorded United goal
in stoppage time, not simply a match that had stoppage time. `extraTime` also has
two surfaces: `aet=1` for matches that went to extra time, and
`goalWindow=extraTime` for United goals scored in extra time.

Goal-event filters should count United goals: `goal`, `pen-goal`, and
`own-goal-for` for team-level goal windows; `goal` and `pen-goal` when a `scorer`
is a United player. Do not make opposition goals part of this first parity pass.

### Search links to update

- `late goals against Bayern` → `/matches?opponent=<resolved-bayern-id>&goalWindow=late`.
- `late goals by Cantona` → `/matches?scorer=eric-cantona&goalWindow=late`.
- `Rooney assists vs Arsenal` → `/matches?assister=wayne-rooney&opponent=arsenal`.
- `Rooney appearances vs Liverpool` already maps cleanly to
  `/matches?player=wayne-rooney&opponent=liverpool`; make the UI control visible.
- `Ferguson record vs Arsenal` already maps cleanly to
  `/matches?manager=alex-ferguson&opponent=arsenal`; make the UI control visible.

### Matches UI draft

Keep the first row boring and fast: opponent search, competition, season, submit.
Put parity controls in `More filters`, grouped by what they act on:

- **Fixture** — venue, result, match type, date range, went to extra time.
- **People** — manager, player appeared, scorer, assister.
- **Place** — stadium, city.
- **Goal events** — goal timing: any, first half, second half, late, stoppage
  time, extra time; later add custom minute range if users need it.

When any event-level filter is active, the match list should show a trailing badge
with the matching evidence, for example `2 goals · 86, 90+2` or
`Rooney · 73`. This stops a filtered result list from feeling mysterious: the
reader sees why each match survived the filter.

### Shipped implementation

Shipped in this phase:

- `MatchFilter`, `matchWhere()`, `matchesSummary()`, `matchesSequence()`, and
  `/api/v1/matches` now understand `aet`, `assister`, `goalWindow`, `goalFrom`,
  and `goalTo`.
- Golden tests prove search answer counts and `/matches` result counts agree for
  late/scorer/assister windows.
- Matches chips and visible controls cover the new params plus the existing ghost
  filters.
- Event-filtered match rows carry a trailing badge such as `1 goal · 86` or
  `2 assists · 22, 74`.
- `intent.ts` links timing and assist answers to exact evidence params instead of
  broad scope-only links.

## Sequencing

1 → 2 → 3 → 4 → 5 — all shipped. Phase 1 was the
prerequisite (FTS index + fuzzy resolution) that 2 and 3 built on. Each phase left
the site shippable; `build-db.ts` regenerates the DB from canonical JSON, so the
stadium/city schema change reverts cleanly.
