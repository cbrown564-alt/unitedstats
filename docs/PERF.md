# Performance

## Current performance work — 10 November 2026

**Integration scope:** the Lighthouse comparison below was captured before the
indexable-record expansion from `c6aac3b` was merged with the design/performance
branch. The merged default branch publishes every player, opponent, and season.
The 52.79% result remains evidence for the measured pre-expansion build, not a
new Lighthouse measurement of the merged publication scope.

**Scope:** establish the local baseline for the approved Cord design at
`ca0d5bfe0e21827ee12fa0d351fd88e48763d9b0`, then improve its loading and
responsiveness without changing that design. The audit does not establish that
the latest visual commits caused a regression: there is no comparable earlier
Lighthouse measurement. The baseline below was captured before the implementation
pass; the follow-up sections record the implementation passes separately. No deployment or field
validation is claimed.

**Framework follow-up (10 November):** after the Vercel cleanup, the hand-drawn charts and the
single-markup Seasons ledger, `/seasons` mobile scores 99 (LCP 1516 ms, TBT 67 ms, 153 KiB of
script; `output/performance/2026-11-10-after-steps-1-3`). An Astro port of `/seasons` cut HTML
and script roughly in half but tied on score. We stay on Next; see
[ADR 0005](adr/0005-stay-on-next-after-astro-seasons-spike.md).

### Measurement method

The full `npm run build` passed, including the existing postbuild budgets.
It generated 9,212 static pages including API exports; `.next` was 421.4 MiB
and `out/` 408.4 MiB. The media reconciliation reported no changes. The generated
dataset manifest timestamp is not a source change for this audit.

Production measurements use Lighthouse **13.6.0**, headless Chrome **157**, Node
**24.19.0**, on a **16 GB Apple M1** Mac. The unchanged static export is served
over localhost with `serve` and Brotli compression. Each route has three
sequential browser-cold runs for each device; browser storage is reset by
Lighthouse. The local server remains running between runs. Mobile uses the
standard simulated network and 4× CPU slowdown, at 412 × 823; desktop uses
the 1350 × 940 desktop preset with 1× CPU slowdown. No build or repository checks run alongside these
measurements.

This is a shared laptop, not an isolated performance runner. An unrelated
TypeScript compilation was observed during collection. Keep all runs, report
medians and ranges, and repeat under quiet conditions before attributing an
isolated long-task spike to application code. The preliminary probe made while
the build was running is excluded from the baseline.

The local server does not reproduce Cloudflare's CDN caching, HTTP/2 or HTTP/3,
internet latency, or real devices. Its cache-lifetime warnings do not establish
a production caching defect. It also omits `deploy/cloudflare-worker.ts`, which
redirects unexported entity and season URLs to `/record` or `/matches` after
static-file lookup. The 404 counts below are therefore defects of the plain
local-static path, not evidence of production 404s; production may pay redirect
cost instead. Explicit published-record destinations avoid both that local
failure and the production redirect. These are laboratory measurements; Lighthouse TBT
is not field INP. Google's [Web Vitals guidance](https://web.dev/articles/vitals)
requires field measurements at the 75th percentile to assess real-user LCP,
INP, and CLS. [Lighthouse's scoring guidance](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring)
also recommends considering a distribution of results.

Raw HTML and JSON reports, individual metrics, failed-request URLs, browser
settings, source revision, and build ID are retained locally under
`output/performance/2026-11-10/`. They are ignored by Git; this document owns
the durable baseline and targets. The runner refuses to overwrite an existing
benchmark directory.

To reproduce after building, start a server in one terminal:

```bash
npm run build
npx --yes serve@14.2.7 --no-clipboard --no-request-logging --no-port-switching -l tcp://127.0.0.1:4173 out
```

Then, with no build or checks running:

```bash
node scripts/benchmark-lighthouse.mjs http://127.0.0.1:4173 output/performance/new-baseline
```

The default corpus covers the homepage, seasons index, Rooney profile, 1999
European final, 1998–99 season, and match browser. It represents the recent
timeline, career, replay, and archive work; it does not cover every route or
post-load interaction. `RUNS`, `DEVICES`, and `ROUTES` can narrow a follow-up.
`SAVE_TRACE=1` additionally saves Lighthouse trace and DevTools network files.

### Production baseline

Values below are medians of three runs. Parentheses give the score range, not
an uncertainty interval. All 36 production runs reported **CLS 0** and no
Lighthouse runtime error or run warning. Initial LCP is already good throughout
this corpus; Rooney's mobile blocking time needs improvement. The 1998–99
mobile outlier had 2,343 ms TBT despite two runs at approximately 11 ms; retain
it as evidence of variability, not proof of a reproducible season-page stall.

| Page | Mobile score (range) | Desktop score (range) | Mobile LCP | Mobile TBT | Desktop LCP |
| --- | ---: | ---: | ---: | ---: | ---: |
| Homepage | 100 (97–100) | 100 (100–100) | 1.371 s | 13 ms | 0.328 s |
| Seasons index | 99 (93–99) | 100 (100–100) | 1.655 s | 52 ms | 0.406 s |
| Wayne Rooney | 94 (85–99) | 100 (100–100) | 1.662 s | 253 ms | 0.713 s |
| 1999 European final | 100 (99–100) | 100 (100–100) | 1.358 s | 44 ms | 0.326 s |
| 1998–99 season | 100 (71–100) | 100 (100–100) | 1.363 s | 11 ms | 0.327 s |
| Match browser | 99 (96–99) | 100 (100–100) | 1.363 s | 96 ms | 0.329 s |

Desktop median TBT is 0 ms for all six pages. A high Lighthouse score is not
evidence that a page makes only necessary requests or that its links work.

Network totals include automatic prefetching and dynamically imported scripts
observed during Lighthouse's navigation capture. KiB means 1,024 bytes. Each
pair below is **mobile / desktop**; failed requests are per run, not summed over
the three repetitions.

| Page | Total transfer, KiB | Script transfer, KiB | Requests | Failed requests |
| --- | ---: | ---: | ---: | ---: |
| Homepage | 479 / 1,044 | 235 / 278 | 45 / 263 | 0 / 111 |
| Seasons index | 1,557 / 1,774 | 246 / 280 | 363 / 393 | 108 / 108 |
| Wayne Rooney | 795 / 906 | 386 / 409 | 88 / 110 | 11 / 11 |
| 1999 European final | 631 / 780 | 276 / 311 | 88 / 111 | 9 / 9 |
| 1998–99 season | 463 / 613 | 236 / 270 | 40 / 63 | 3 / 3 |
| Match browser | 779 / 950 | 249 / 264 | 42 / 62 | 0 / 0 |

The sum of the 12 median navigation transfers is **10.52 MiB**. This is an
equally weighted comparison corpus, not an estimate of a real visitor's session.

### Local development comparison

Six additional desktop runs used the existing Next.js development server at
`http://localhost:3010`: three each on the homepage and seasons index. This was
an already-running server, not a measured cold development startup. Reports are
in `output/performance/2026-11-10-dev/`. To repeat against a running dev server:

```bash
BUILD_MODE=development RUNS=3 DEVICES=desktop ROUTES=/,/seasons node scripts/benchmark-lighthouse.mjs http://localhost:3010 output/performance/new-dev-baseline
```

| Page | Production / dev score | Production / dev observed server response | Production / dev script transfer |
| --- | ---: | ---: | ---: |
| Homepage | 100 / 100 | 10 / 285 ms | 278 / 889 KiB |
| Seasons index | 100 / 96 | 20 / 1,880 ms | 280 / 839 KiB |

Development seasons responses ranged from 1,880 to 2,033 ms; homepage responses
ranged from 213 to 752 ms. These are Lighthouse's observed server-response audit
values, separate from its simulated LCP. The roughly two-second development
response and roughly threefold script transfer are measured contributors to
local sluggishness. The Next dev process renders from the database, includes
development instrumentation, and does not reproduce production link prefetching.
Judge production loading against the static export; measure editing/compilation
and post-navigation interactions separately if development still feels slow.
This comparison does not establish the exact cause of every reported stall.

### Evidence-backed priorities

1. **Use direct record destinations and stop bulk prefetching.** The seasons mobile
   report contains 335 fetch requests, about 1.09 MiB transferred, and 108 HTTP
   404s for unpublished seasons. `ClubThread`, `CareerCord`, and `HistorySkyline`
   construct `/seasons/{season}` links without checking the exported set or
   disabling prefetch. `ClubThread` also prefetches manager pages. The seasons
   ledger already uses a published-season check and `/matches?season=…`
   fallback; reuse that behavior. Keep the cords, beads, labels, and accessible
   links. Check match endpoints as well: Rooney's debut/latest links include
   unexported matches. Fixing prefetch alone would leave local clicks dependent
   on a hosting redirect that plain `serve out` does not provide.
2. **Reduce initial player-page work, then long-ledger work.** Rooney loads a
   roughly 99 KiB transferred Recharts chunk
   (`09phafhbhb30w.js` in this build); Lighthouse estimates 44 KiB of unused code
   in that chunk on the first mobile run. Its chart wrapper uses `ssr: false`
   but imports as soon as the wrapper mounts; it does not wait for visibility.
   Measure chart visibility before deferring it, retain reserved dimensions, and
   keep the chart usable when reached. Lighthouse counts 9,815 DOM elements on
   Rooney and 12,803 on the seasons index. The index emits both the mobile card
   stream and desktop ledger, hiding one with CSS. Prove a smaller initial render
   on this representative page before spreading any rendering pattern; preserve
   the complete ledger, decade jumps, keyboard access, and responsive behavior.
3. **Enforce route totals, not just individual chunk sizes.** Every measured
   navigation exceeds the existing 150/200 KiB JavaScript aspiration, even
   though the build's single-chunk budget passes. Use the captured network and
   unused-code reports to identify actual route dependencies. The shared CSS
   chain also has roughly 480–580 ms of estimated mobile render-blocking savings
   in sampled reports; treat this as an estimate to test after the larger
   request/bundle issues. Do not infer that the new palette, SVG cords, or replay
   animations caused the sluggishness without a trace or before/after comparison.

### Improvement goal — targets, not achieved results

Complete one performance pass with the approved appearance and complete record
intact. Measure against the same six routes, both viewports, three runs each,
with the same Lighthouse version and compression:

| Measure | Acceptance target |
| --- | --- |
| Total transferred bytes across the 12 route/device medians | Reduce by at least 50%: 10.52 → ≤ 5.26 MiB; no individual route/device increases by more than 10% |
| Automatic requests on the homepage and seasons index | At most 60 per navigation on either viewport |
| Failed first-party requests and links to unpublished records | Zero in all measured runs; unpublished records use the existing archive/record fallback |
| Total JavaScript transferred during the navigation capture | ≤ 150 KiB per route; ≤ 200 KiB for chart routes, including automatically loaded and prefetched scripts |
| Mobile player-page TBT | ≤ 100 ms median, a reduction of at least 60% from this baseline |
| Other pages' TBT | ≤ 100 ms mobile / ≤ 50 ms desktop median |
| Lighthouse Performance | ≥ 98 mobile median / ≥ 99 desktop median; investigate any run below 95 under quiet conditions |
| LCP | ≤ 1.5 s mobile / ≤ 0.75 s desktop median |
| CLS | ≤ 0.05 in every run |

Before accepting the pass, directly exercise search selection, a match filter,
navigation into a record, and match/season replay at both viewports. Add an
action-to-paint baseline before changing those interactions, then target ≤ 200 ms
for each sampled local action. Navigation-mode Lighthouse does not measure this
loop or field INP. Scroll the long season ledger and inspect a performance trace
if jank remains. Compare before/after screenshots at the same viewports and
preserve keyboard access and reduced-motion behavior. Field INP remains a
separate ≤ 200 ms p75 target after an explicitly authorized deployment and real
traffic; this local audit cannot mark it achieved.

### Baseline verification

- Full production build, postbuild size budgets, and static-render guard passed.
- All 42 Lighthouse runs completed without runtime errors or run warnings;
  subresource 404s are recorded separately above.
- The new benchmark script passed syntax checking and focused ESLint. Repository
  ESLint reported 0 errors and 15 existing warnings when `.claude/**` was excluded;
  Knip passed with that same exclusion in a temporary configuration. Unmodified
  `npm run lint` and `npm run knip` fail because they traverse the pre-existing
  nested worktree and its generated `.next` files. No worktree or check
  configuration was changed to hide those results.
- `git diff --check` passed. Unit tests and canonical-data validation were not
  rerun: this change adds documentation and a benchmark runner, with no
  application, canonical-data, or visual changes.

## Implementation pass — 10 November 2026

The approved palette, typography, Cord drawings, layout, and replay animations
are unchanged. This pass changes loading, record destinations, and database work:

- `lib/publishedHref.ts` uses the same selected IDs as the static-page generators.
  Timelines, career endpoints, formations, cup ties, season tables, partnerships,
  and rediscovery links open a published page or the existing record/archive
  route directly. The public reference sets share the existing five-minute query
  cache and React render cache; API exports must not rebuild them for every link.
- Dense record links disable prefetch. `IntentLink` lets Next.js warm primary
  navigation and homepage doors after hover, keyboard focus, or a press, while
  retaining Next's own navigation and cache behavior. Unused search overlays no
  longer import at idle; visible page/tablet search fields still load normally.
- Mobile archive controls are split from unrelated pages and retain server
  rendering on `/matches`. Rooney's contribution chart starts loading within
  200 px of the viewport, reserves its original height, and falls back to loading
  normally when IntersectionObserver is unavailable. Visible desktop charts
  continue to load immediately.
- Archive views and facet counts reuse calculations while their inputs stay
  unchanged. Local search debounces for 100 ms instead of 150 ms; query-bound
  results and retry behavior are retained.
- `seasonCupLastResults` now groups the last date once per season/competition,
  then joins the matching results, instead of repeating a correlated maximum
  for every match. The join retains matching results when dates tie; a
  corpus-wide test verifies the current results are identical. Paired local
  query measurements returned **277 rows** in both cases:
  median **970.8 ms → 2.3 ms**. Those query timings are not page-load metrics.

An experimental deferred full-record chart on `/matches` was not accepted:
the first comparison produced a worse mobile LCP despite lower blocking time.
The original match-browser rendering was restored. The rejected candidate's
reports remain under `output/performance/2026-11-10-after/`; isolated follow-up
traces are under `2026-11-10-match-check*`. Do not pool those measurements with
the final build's results. A temporary copy of the baseline export was used for
a fresh control measurement; its original build ID is recorded in the control
manifest, and the control reports are retained.

### Final production comparison

The final build repeats the original six-page corpus with three browser-cold
runs per viewport, Lighthouse 13.6.0, the same Chrome 157 and device presets,
and the same Brotli static server. No build, browser QA, or repository checks
ran concurrently. Final reports and the machine-readable before/after comparison
are in `output/performance/2026-11-10-after-final/`. All 36 captures have zero
failed requests, zero CLS, and no Lighthouse runtime errors or run warnings.

Values below are medians; parentheses retain the mobile score range.
Desktop scores are 100 in every run. Rooney improves **94 → 99** on mobile;
the match browser improves **99 → 100**. Other median scores are retained.

| Page | Mobile score (range) | Mobile LCP | Mobile TBT | Desktop LCP | Desktop TBT |
| --- | ---: | ---: | ---: | ---: | ---: |
| Homepage | 100 (100–100) | 1.361 s | 9 ms | 0.329 s | 0 ms |
| Seasons index | 99 (98–99) | 1.664 s | 84 ms | 0.410 s | 16 ms |
| Wayne Rooney | 99 (99–99) | 1.658 s | 57 ms | 0.694 s | 0 ms |
| 1999 European final | 100 (100–100) | 1.358 s | 7 ms | 0.327 s | 0 ms |
| 1998–99 season | 100 (100–100) | 1.359 s | 11 ms | 0.328 s | 0 ms |
| Match browser | 100 (99–100) | 1.359 s | 90 ms | 0.331 s | 0 ms |

Network pairs below are **mobile / desktop**, using the same capture definition
as the baseline. Every route/device transfers fewer bytes than before.

| Page | Total transfer, KiB | Script transfer, KiB | Requests | Failed requests |
| --- | ---: | ---: | ---: | ---: |
| Homepage | 417 / 417 | 197 / 197 | 29 / 29 | 0 / 0 |
| Seasons index | 427 / 382 | 200 / 182 | 28 / 22 | 0 / 0 |
| Wayne Rooney | 548 / 616 | 234 / 326 | 43 / 40 | 0 / 0 |
| 1999 European final | 497 / 455 | 236 / 217 | 54 / 49 | 0 / 0 |
| 1998–99 season | 436 / 395 | 209 / 190 | 34 / 29 | 0 / 0 |
| Match browser | 769 / 726 | 237 / 218 | 41 / 34 | 0 / 0 |

### Progress against the targets

| Target | Final result | Status |
| --- | --- | --- |
| At least 50% less corpus transfer | 10.52 → 5.94 MiB, **43.5% less**; no individual increase | Not yet met |
| At most 60 automatic requests on Home and Seasons | Home 29/29; Seasons 28/22. Desktop Seasons falls **393 → 22**, about 94% fewer | Met |
| Zero failed first-party requests and direct published/fallback destinations | Zero failures in all 36 captures; all local links in the six hydrated pages resolve to exported files | Met for the corpus |
| JavaScript ≤ 150 KiB / 200 KiB on chart routes | See route totals above; shared scripts and visible charts remain above budget | Not yet met across the corpus |
| Rooney mobile TBT ≤ 100 ms and at least 60% less | **253 → 57 ms**, about 77% less | Met |
| Other TBT medians ≤ 100 ms mobile / 50 ms desktop | Maximum 90 ms mobile / 16 ms desktop | Met |
| Performance medians ≥ 98 mobile / 99 desktop; inspect runs below 95 | All mobile medians 99–100, desktop 100; minimum final run 98 | Met |
| LCP ≤ 1.5 s mobile / 0.75 s desktop | All desktop routes pass; Seasons and Rooney remain about 1.66 s on mobile | Partly met |
| CLS ≤ 0.05 in every run | 0 in every run | Met |

The transfer goal still needs about **0.68 MiB** removed from the equally
weighted corpus. The match catalog alone transfers about 352 KiB per uncached
match-browser load. Further shared-bundle and catalog representation work must
preserve the full fixture filters and the visible chart behavior; the target is
not relaxed to declare this pass finished. Field INP and real-user performance
remain unmeasured by this local work.

### Development and interaction follow-up

The original development server on port 3010 had stopped by the retest. The
failed connection attempt in `2026-11-10-dev-after/` is excluded. An isolated
Next.js 16.2.9 server on port 3011 used `.next/perf-dev`; both pages and their
browser assets were warmed before three browser-cold desktop runs per page.
Startup/compilation is excluded. Reports are in
`output/performance/2026-11-10-dev-after-isolated/`.

| Page | Observed server response, before → after | Dev score, before → after | Dev TBT, before → after |
| --- | ---: | ---: | ---: |
| Homepage | 285 → 251 ms | 100 → 100 | 5 → 4 ms |
| Seasons index | **1,880 → 1,233 ms** | 96 → 94 | 89 → 171 ms |

Seasons responses ranged from 1,097 to 1,422 ms in the retest: about 34% lower
at the median. This is a new development process, not a controlled comparison
of two identical long-running processes. The database-query improvement is
separately established above. Development rendering still costs substantially
more than serving the static export, and its score/blocking time did not improve
uniformly; do not claim every metric improved.

`scripts/check-perf-interactions.mjs` exercised the same actions against the
preserved original export and the final build, sequentially without builds or
checks running. These are single automation-observed action-to-frame samples,
including Playwright waiting/polling and two animation frames, not INP or p95.
Only the `2026-11-10-interactions-before-quiet/` and
`2026-11-10-interactions-after-quiet/` samples form this comparison; earlier
harness probes are excluded. Each pair is **mobile / desktop**, in ms.

| Action | Before | After |
| --- | ---: | ---: |
| Slash focuses page search | 62 / 41 | 61 / 46 |
| Cold Rooney search results | 250 / 232 | 232 / 232 |
| Search selection opens Rooney | 166 / 169 | 170 / 166 |
| Premier League filter | 119 / 149 | 105 / 164 |
| Match replay | 67 / 67 | 67 / 67 |
| Season replay | 67 / 68 | 66 / 66 |

The ≤ 200 ms sampled-action goal is partly met: cold search results remain above
it in this harness. Small differences are not evidence of real-user improvement.

### Implementation verification

- **304 tests passed**, including published/fallback destinations, rediscovery
  identity, and the corpus-wide cup-query equivalence check. Canonical-data
  validation passed with zero errors and 40 existing warnings.
- Full build, postbuild budgets, static-render guard, and `git diff --check`
  passed. Final output: 421.8 MiB `.next`, 408.3 MiB `out/`; 9,212 prerendered
  paths. No canonical-data or cached-media changes were made.
- Scoped ESLint passed with zero errors and 15 existing warnings; Knip passed
  using the temporary `.claude/**` exclusion described in baseline verification.
  The repository's check configuration was not changed to hide nested-worktree
  findings. The isolated dev server's generated TypeScript include changes and
  dataset-build timestamp were restored.
- Mobile and desktop screenshots of Seasons, Rooney, and Matches match the
  baseline exactly. Homepage screenshots also match exactly after fixing the
  existing SVG animation clock and rotating example for comparison only.
  Reached chart crops differ by at most one pixel. Evidence is retained in
  `output/performance/2026-11-10-ui-before/` and `2026-11-10-ui-after/`.
- Browser checks passed for first-use sidebar/mobile search at phone, tablet,
  and desktop widths; Cmd-K and Escape; search selection through generated JSON
  to the record reader; search-index failure and retry; an unpublished-season
  link; chart loading after scrolling and without IntersectionObserver; native
  summaries without JavaScript; and reduced-motion replay behavior. No console
  errors were observed in these checks.

## Second performance pass — JavaScript and transfer, 10 November 2026

**The 50% transfer goal is met; the JavaScript and responsiveness targets remain partly unmet.**
The final equally weighted corpus is **10.517 → 5.943 → 4.965 MiB**
(original baseline → first pass → this pass), **52.79% below the original baseline**.
No route/device transfer increased relative to that original baseline. Total script
transfer is **3.357 → 2.194 MiB**, a
**34.6% reduction**; 7 of 12 route/device script budgets pass.
No budget was raised.

### What changed

- The browser uses a versioned, lossless match catalog. Correlated reference fields
  share columns, players use references, goal events use columns, and dates use
  day differences. The decoder reconstructs all 6,043 original rows, including
  every event, starter, source, note, null, and exceptional ID. Corpus-wide deep
  equality and filter-parity tests pass. The readable catalog endpoint remains
  available. The browser-captured catalog response fell from **360,204 to 150,283
  bytes** (58.3% less); decoded JSON fell from 7,100,681 to 1,253,978 bytes.
- Decoding yields after each 256 records, with a timer fallback when browser task
  yielding is unavailable. The test checks that decoding yields and still returns
  the exact complete catalog. Long chart/ledger labels reuse one number formatter;
  parity tests cover grouping, rounding, decimals, nulls, negative zero, and
  non-finite values. Context consumers reuse the provider instead of subscribing
  to a duplicate local state.
- Full production builds use Next 16.2.9's supported Webpack path. A paired pilot
  reduced homepage script transfer from approximately 188 KiB with the second-pass
  Turbopack candidate to 163 KiB with Webpack. Preview builds and development keep
  Turbopack; the build wrapper follows the existing profile selection, honors
  explicit bundler flags, and removes an unused Webpack cache before a Turbopack
  build. Both artifact-budget thresholds remain unchanged.
- Mobile navigation/search sheets load on first use and remain mounted for their
  exit animation. First-open focus, swipe, backdrop, and Escape hooks wait for the
  portal. Search ranking code loads with the first query, unused photograph
  handling loads only when a night has an image, and Web Vitals observers load
  only when reporting or debug is configured. Umami remains enabled as before.
  The mobile Home link uses the existing intent-based prefetch behavior.
- The archive's URL reader has its own empty Suspense fallback. The browser
  observer previously recorded removal/recreation of the result count and summary
  during hydration; it records none after this change. The full archive chart is
  retained, including its original closed-summary behavior. Cold desktop paging
  also reproduced a failure on the saved committed build: a correct page-2 link
  left the URL on page 1. Pagination, sort, and facet controls now use Next's
  supported native-history integration over the already-loaded catalog. Direct
  filtered URLs, page counts, back/forward, sort, modifier-click/new tabs, and
  native summaries without JavaScript pass on both viewports. Other Pager users
  keep their normal route links.

### Final production measurement

Only **`output/performance/2026-11-10-budgets-verified/`** forms this comparison:
36 cold-browser runs, three per route/device, Lighthouse 13.6.0, Chrome 157,
the same Brotli server and device settings as the original baseline. Build ID:
`AuPsTnEBuNgfdtrbuVKk9`. Builds, checks, and other test browsers were stopped
while collecting these runs. This remains a shared-laptop laboratory measurement;
no development-server or field-performance improvement is claimed by this pass.

Earlier probes and intermediate full candidates are retained as diagnostics and
are not pooled with these results. They exposed long catalog/formatting tasks,
whole-archive hydration replacement, and the cold paging failure. The final
minimum score is **98**; all 36 runs have
**CLS 0**, zero failed requests, and
0 Lighthouse run warnings.

Values below are medians of three. Mobile TBT shows the accepted first pass and
this final pass, so improvements in transfer are not mistaken for uniform CPU
improvement. Parentheses show score ranges.

| Page | Mobile score (range) | Mobile LCP | Mobile TBT, first → second pass | Desktop score (range) | Desktop LCP | Desktop TBT |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Homepage | 100 (100–100) | 1.211 s | 9 → 7 ms | 100 (100–100) | 0.301 s | 0 ms |
| Seasons index | 98 (98–99) | 1.509 s | 84 → 126 ms | 100 (100–100) | 0.377 s | 24 ms |
| Wayne Rooney | 99 (99–100) | 1.508 s | 57 → 98 ms | 100 (100–100) | 0.679 s | 0 ms |
| 1999 European final | 100 (99–100) | 1.223 s | 7 → 6 ms | 100 (100–100) | 0.434 s | 0 ms |
| 1998–99 season | 100 (100–100) | 1.217 s | 11 → 3 ms | 100 (100–100) | 0.312 s | 0 ms |
| Match browser | 99 (99–99) | 1.222 s | 90 → 118 ms | 100 (100–100) | 0.315 s | 8 ms |

Each pair is mobile / desktop; KiB means 1,024 bytes. Script totals include all
scripts automatically loaded or prefetched during the navigation capture.

| Page | Total transfer, KiB | Script transfer, KiB | Requests |
| --- | ---: | ---: | ---: |
| Homepage | 382.7 / 382.7 | 163.2 / 163.2 | 27 / 27 |
| Seasons index | 352.8 / 352.8 | 153.2 / 153.2 | 19 / 19 |
| Wayne Rooney | 484.0 / 594.1 | 194.8 / 304.9 | 40 / 45 |
| 1999 European final | 428.5 / 428.5 | 193.3 / 193.3 | 50 / 50 |
| 1998–99 season | 367.9 / 367.9 | 164.5 / 164.5 | 27 / 27 |
| Match browser | 471.3 / 471.3 | 199.6 / 199.6 | 24 / 24 |

### Targets still open

- JavaScript remains above **150 KiB** on Home (**163.2 KiB** on
  each viewport) and Seasons (**153.2 KiB**). Desktop Rooney remains above
  its **200 KiB** chart budget at **304.9 KiB**. The other seven
  measurements meet their script budgets; Home and Seasons remain the two
  general-navigation routes, with the four profile/replay/spine routes at 200 KiB.
  The visible contribution chart still loads normally on desktop and adds roughly
  110 KiB of scripts relative to the phone's initial capture. Reducing shared
  chrome/Home code and that visible chart dependency remains implementation work.
- Mobile Seasons TBT is **126 ms** and Matches TBT is
  **118 ms**, above the 100 ms target. Faster diagnostic probes
  are not substituted for those final medians. Rooney meets the TBT target at
  **98 ms**, **61.3% below the original baseline**.
- Mobile LCP is **1.509 s** on Seasons and
  **1.508 s** on Rooney, narrowly above 1.500 s. The other median
  LCP, score, request-count, failed-request, and CLS targets pass.
- The strict report checker intentionally exits nonzero while these misses
  remain. It compares the complete corpus against the original baseline and
  writes `budget-comparison.json` beside the reports:

```bash
npm run check:perf:lighthouse -- output/performance/2026-11-10 output/performance/2026-11-10-budgets-verified
```

### Interaction and appearance checks

The same browser harness was rerun against the saved committed first pass and
this final source. These are single local action-to-frame samples, including
Playwright polling and two frames, not INP or p95. Pairs are mobile / desktop, ms.

| Action | First pass control | Final source |
| --- | ---: | ---: |
| slash focuses page search | 73 / 45 | 77 / 44 |
| Rooney search results | 233 / 234 | 249 / 232 |
| search selection opens Rooney | 165 / 167 | 183 / 199 |
| Premier League filter | 129 / 147 | 92 / 121 |
| match replay | 62 / 66 | 66 / 66 |
| season replay | 64 / 66 | 66 / 66 |

Cold search still misses the 200 ms sampled-action target. The other samples are
within it; small differences are not evidence of field improvement.

All six routes have zero changed screenshot pixels at both viewports after the
existing animation clock and rotating placeholder are normalized for comparison
only. Reached contribution-chart crops also match exactly. Evidence is under
`2026-11-10-budgets-ui-final/`; the last changed route, Matches, was rechecked
against the same saved baseline under `2026-11-10-budgets-ui-query/`, again with
zero changed pixels. Phone/tablet/desktop first-use search and command palette,
search-index failure/retry, first-open sheet focus restoration/swipe dismissal,
and decoder fallback without browser task yielding pass. The fallback retains
all 6,043 result-chart rectangles. Replay behavior and the approved CSS, drawing,
layout, and typography are unchanged.

### Build and data verification

- **308 tests pass**, including exact catalog round-tripping, exceptional IDs,
  asynchronous decoding, number-format parity, and the existing filter/query
  corpus tests. Validation reports 6,043 matches across 127 seasons, zero errors,
  and 40 existing warnings. No canonical data or cached media changed.
- Full production build, existing postbuild budgets, and full static-render guard
  pass: 9,212 prerendered paths, 13 static pages, and nine SSG route families.
  The measured full postbuild export is **404.8 MiB**; `.next` was **788.7 MiB**
  including the Webpack disk cache, below the unchanged 1,000 MiB full limit.
- The actual preview build and preview static guard also pass with the previous
  full build's unused Webpack cache removed: **236.813 MiB** `.next`,
  **237.638 MiB** export, **710** prerendered paths,
  below both unchanged 500 MiB preview limits. The measured full build and its
  generated client catalogs were restored after this check.
- Scoped ESLint passes with zero errors and 15 existing warnings; Knip passes
  with only the previously documented `.claude/**` exclusion. The tracked check
  configuration was not changed to hide the nested worktree. `git diff --check`
  passes. Only the generated dataset-manifest timestamp was restored.

## Default-branch integration — 10 November 2026

The design/performance branch (`b60ce42`) and the indexable-record expansion
(`c6aac3b`) are combined in merge commit `b15c715`. The integration preserves the
expanded static player, opponent, and season coverage, canonical tags, sitemap,
approved Cord design, and performance implementation. Publication helpers now
follow that expanded coverage; matches outside the selected set still use the
record reader.

A fresh isolated checkout with its own dependency installation verified the
combined code, separately from ongoing edits in the original working tree:

- All **308 tests pass**. Full ESLint has zero errors and 15 existing warnings;
  Knip passes without a nested-worktree exclusion. Validation has zero errors
  and 40 existing warnings across 6,043 matches and 127 seasons.
- Full production build and static-render guard pass: **10,513 prerendered
  paths**, 13 static pages, and nine SSG route families. This build used
  `NEXT_PUBLIC_SITE_URL=https://utdred.com` and Node 25.3.0.
- `.next` is **1,013.6 MiB** and `out/` is **1,021.0 MiB**, within the expanded
  publication limits already set by `c6aac3b`: 1,300 / 1,200 MiB. Per-page and
  JavaScript limits are unchanged. An initial build exceeded the `.next` limit
  by 13.4 MiB because compiler cache was included. Successful builds now remove
  the disposable Webpack cache before artifact checks; deployable content is
  retained and no threshold was increased for the merge.
- Phone and desktop checks pass for Home, Seasons, Jaap Stam, Fleetwood Rangers,
  and 2014–15. The newly published record pages return HTTP 200 with canonical
  URLs at the configured domain. Archive pagination and browser Back show the
  correct fixture counts, with no browser JavaScript errors. Home and Seasons
  screenshots were inspected at both viewports.

The Lighthouse comparison above remains a historical measurement of the
pre-expansion build. Lighthouse was not rerun for this merge, so its 52.79%
transfer reduction is not claimed as a measurement of the expanded publication
scope. Canonical data and cached media were not changed by the integration.

## Product measurement — 29 September 2026

Umami records `search_selection`, `search_empty` (settled empty search), `record_view` (loaded kind and ID), `night_click`, `related_content_click`, `story_start`, `story_complete` (end visible for one second), and successful `share`. Search selection is a navigation proxy, not proof the user found their answer. URL query strings and fragments are removed from analytics payloads; raw search text is never sent. Only record kind/ID and fixed page paths identify content. The Umami tracker is configured to omit query strings and fragments from automatic page views and to collect only on `utdred.com` and `www.utdred.com`.

Historical Vercel Web Analytics supplies the pre-migration page-view baseline; its custom-event reporting requires Pro or Enterprise ([provider documentation](https://vercel.com/docs/analytics/custom-events)). Named product events now go to the Umami Cloud EU site for `utdred.com`. The Cloudflare migration removes Vercel Speed Insights and Web Analytics scripts; Umami remains in the root layout. Production deployment and successful Umami collection must be checked before field metrics can be assessed. No field performance improvement is claimed from local checks. Compare completion and onward navigation by entry page/device after collecting a baseline; inspect suspected automated traffic separately. July/September usage counts alone do not validate the experience.


The site serves data that is **immutable between ingests** (`data/united.db` is a
pure build artifact of `data/canonical/*.json`, rebuilt in `prebuild`). The
performance strategy follows from that: prerender everything at build, touch
SQLite only at build, ship static HTML from the CDN.

## Update strategy (decided)

Post-launch the dataset grows by **one match at a time**, a few times a week.

**Decision, revised 2026-09-23: static export with a selected set of profile
pages and one scheduled data release per week.** The live site is
`output: "export"`. There are no Functions, ISR, or runtime SQLite. The full
fixture record stays in the match browser, build-generated JSON, and dataset.

| Phase | What runs | Build time |
| --- | --- | --- |
| Code deploy (PR / UI) | Preview build profile — sample SSG | ~2 min |
| Code deploy (production merge) | Full build — selected SSG pages | Measure after rollout |
| Data ingest (weekly, with manual corrections) | Full production build and deploy | Measure after rollout |

### How a data ingest works

```
GitHub Actions (enrich-results.yml, Mondays at 18:00 UTC)
  1. append new match to data/canonical/
  2. npm run validate && npm run build:db && npm run export:dataset
  3. git commit + push
  4. Cloudflare runs a full production static export and deploys `out/`
```

### Runtime database

`prebuild` compiles `data/united.db` from canonical JSON. `next build` reads it
once and writes HTML, RSC, and JSON into `out/`. The live site never opens
SQLite. Do not reintroduce `UNITEDSTATS_DB_BLOB_URL`.

## Baseline (2026-06-21, before the static-rendering campaign)

`next build` (Next 16.2.9, Turbopack), all 28 routes:

- **Render mode:** every route `ƒ (Dynamic)` — server-rendered per request —
  except `/_not-found`. Only 5 pages prerendered.
- DB: 6,027 matches (1886 → 2026), 984 players, 398 season-summary rows.
- Each request opens `united.db` via `better-sqlite3` and runs queries, despite
  the data being identical until the next deploy.

## Budgets (targets for the campaign)

| Metric | Target |
| --- | --- |
| Page render mode | `○` static or `●` SSG (params); no request-time Functions |
| TTFB (pages) | CDN-static (no per-request DB) |
| LCP | < 2.0s |
| INP | < 200ms |
| CLS | < 0.05 |
| First Load JS (per route) | < 150 KB; chart-heavy routes < 200 KB |
| Runtime DB access | none from page routes (build-time only) |
| Aggregate `.next` output | ≤ 500 MB preview; ≤ 1,300 MB full |
| Deployable `out/` export | ≤ 500 MB preview; ≤ 1,200 MB full, including all public site assets |

## Route disposition (achieved)

`next build` with `output: "export"` prerenders the archive as static files:

- **Static `○`:** `/`, `/managers`, `/transfers`, `/explore`, `/data`,
  `/analytics`, `/matches`, `/players`, `/seasons`, `/search`, `/compare`,
  `/cut`, `/surprise`. URL state is applied in the browser over exported JSON.
- **SSG `●` (`generateStaticParams` + `dynamicParams=false`):** `/match/[id]`,
  `/player/[id]`, `/seasons/[season]`, `/opponent/[id]`, `/manager/[id]`,
  `/questions/[slug]`, `/on-this-day/[monthDay]`, `/cut/[slug]`,
  `/stories/[slug]`. Full builds prerender selected match, player, opponent,
  and season ids; preview builds sample heavy routes. Other valid records open
  through `/record` or the filtered match browser.
- **API:** `/api/v1/*` and `/api/health` are build-generated JSON. Query-shaped
  match and search APIs were replaced by `/data/matches-catalog.json` and
  `/data/search-index.json`. The unfiltered `/matches` spine is omitted from
  the static HTML and rebuilt from the catalog in the browser.

## M3 — SQLite out of the request path

Every exported route touches SQLite **only at build**. The live site never
opens the database. Client search and match filters read the two JSON dumps
written by `scripts/export-client-data.ts`.

## M4 — bundle

_Superseded 2026-11-10: Recharts is gone; charts are hand-drawn and server-rendered (ADR 0004)._
recharts (~348 KB) was already route-split (the home page never loads it). Its
three charts now load behind `ssr: false` wrappers (`components/charts/lazy.tsx`)
with height-reserved skeletons, so the 985 `/player/[id]` pages and `/questions`
defer it past hydration with no layout shift. `/analytics` keeps it eager — its
Elo hero chart is above the fold.

## M5 — images and fonts

- **Fonts** are already optimal: `next/font/google` (Archivo + IBM Plex Mono)
  self-hosts the files, subsets to latin, and applies `font-display: swap` — no
  external font request, no FOIT.
- **CLS:** portraits render through `next/image` with explicit width/height in a
  fixed-size container, and club crests are pure CSS — no layout shift.
- **LCP:** the hero portrait on `/player/[id]` now sets `priority` (+ `sizes`),
  so the page's largest image isn't lazy-loaded.
- **Transformations:** fixed-size player and manager portraits are already
  compact, locally cached WebPs. `PlayerPortrait` serves them unoptimized to
  avoid paid width/format variants. Large editorial images ship at authoring size.

## M6 — regression guard

`scripts/check-static-render.mjs` (run as `npm run check:static`, wired into CI
after `npm run build`) reads `.next/prerender-manifest.json` and fails if any
expected static page or SSG route has regressed to dynamic, or if the
prerendered-path count collapses. A stray `searchParams`/`cookies()` read or a
dropped `generateStaticParams` will fail the build instead of silently shipping.

## Post-launch product-pass measurement — 2026-07-14

Both measurements started from a removed `.next` directory and used the preview
profile, so they describe current output rather than a stale development tree.

| Measurement | Before Phases 1–8 | After Phases 1–8 | Budget |
| --- | ---: | ---: | ---: |
| `.next` output | 166.1 MB | 166.3 MB | 2,000 MB |
| Largest gzipped HTML | 113.5 KB on Explore | 147.1 KB on Alex Ferguson | 180 KB |
| Rooney HTML | 94.8 KB | 95.2 KB | 180 KB |
| Largest gzipped RSC | not separately recorded | 88.4 KB | 120 KB |
| Largest gzipped JS chunk | 101.7 KB | 101.7 KB | 120 KB |

The clean preview recheck generated 204 static pages. The static-render guard
reported five static pages, five SSG route families, and 189 prerendered paths.

The 2026-07-25 Vercel usage review overturned the earlier dense-link prefetch
assumption: 1.2M Edge Requests and 4.1M ISR read units were disproportionate to
recorded browser traffic. Repeated archive and search-result links now set
`prefetch={false}`; primary navigation and authored editorial doors retained
automatic Next.js prefetching at that point. The November implementation above
replaces automatic prefetching for the primary sidebar and homepage doors with
prefetching after an interaction.

The clean full-profile build generated 7,829 static pages and 7,814 manifest
paths. Its `.next` tree is 3,026.0 MB. Investigation found 2.3 GB under the match
route family: 944 MB of HTML, 431 MB of full RSC, and about 860 MB of Next 16
segment-prefetch RSC across 6,028 receipts. This is aggregate corpus output, not
a large-page regression: the same build stays below the 180/120/120 KB
HTML/RSC/JS route limits. The full-profile aggregate budget is therefore 3,250
MB, while preview remains capped at 2,000 MB; one shared 3.25 GB limit would
hide preview amplification.

The Vercel CLI source manifest is a separate concern from `.next` output.
Without `.vercelignore`, local raw ingest data, rendered films, screenshots, and
working audio made the upload manifest 1.75 GB and included a local `.env`.
The deployment ignore list keeps canonical build inputs and the 493 KB homepage
clip while excluding those working trees. The verified production manifest is
1,028 files / 67.4 MB; both preview and full builds recreate `data/united.db`
from canonical JSON in Vercel.

## Build profiles

The 2026-09-23 full build against the current 6,035-match record generated 81
authored match pages, 19 player pages, 14 opponent pages, and 16 season pages.
It produced 394.7 MB in local `.next` and a 382.6 MB deployable export after the
working audio copy was removed. The previous full export was about 3.4 GB
locally, including 109 MB of working audio. The build and export budgets now
leave roughly 100 MB of export room before a release fails CI. Vercel's build
adapter produced 786.0 MB in `.next` for the same output; the 1,000 MB build
artifact budget accommodates that adapter while the export ceiling remains 500 MB.

**2026-11-10 revision.** Production moved to Cloudflare Workers static assets
(Paid plan: 100,000 files per version) on 2026-10-07, so the Vercel storage
limit behind the cut no longer applies. Every player (985), opponent (238) and
season (127) is prerendered again; matches remain the selected set of 84. The
full build now generates 10,429 routes in about 4 minutes and produces
25,893 files, 997 MB in `out/` and 1,010 MB in `.next`. The full-profile
ceilings are 1,200 MB (`out/`) and 1,300 MB (`.next`). See
`docs/INDEXABLE-RECORDS-SCOPE.md`.

Production deploys and CI use a **full** build profile: `prebuild` rebuilds the
DB, verifies media, exports the downloadable dataset, and prerenders selected
entity pages. `postbuild` removes film working audio copied into local `out/`;
`.vercelignore` already excludes it from remote build uploads. CI checks the
export ceiling after the build.

**Preview** builds (`UNITEDSTATS_BUILD_PROFILE=preview`; the retired Vercel
`VERCEL_ENV` signal no longer selects it) use a faster profile: `generateStaticParams` samples ~24 evenly spaced ids per heavy
route (other valid ids 404 — `dynamicParams = false`), and `export:dataset` is
skipped. Every other build is full.
Local fast iteration:

```bash
UNITEDSTATS_BUILD_PROFILE=preview npm run build
```
