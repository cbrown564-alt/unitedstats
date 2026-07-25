# Vercel Hobby assessment

Status: deferred options recorded on 2026-07-25. The project remains on Vercel
Pro while usage is measured after the first cost-reduction pass.

`PERF.md` owns the active performance strategy. This document records two larger
moves to consider only if removing runtime Blob downloads, dense-link
prefetching, per-request homepage rendering, and unnecessary portrait transforms
does not create enough headroom for Hobby.

## Measurement period

Allow at least one representative rolling usage window after deploying the
first pass. Compare project-level totals and daily rates for:

- Fast Origin Transfer
- ISR reads and writes
- Blob Data Transfer
- Fluid Active CPU
- Image Optimization transformations
- Edge Requests

Record the deployment date when interpreting the charts. Blob transfer should
fall close to zero after production no longer defines
`UNITEDSTATS_DB_BLOB_URL`; older usage remains visible until it ages out of
Vercel's rolling window.

## Move 6 — reduce crawler discovery

The current sitemap publishes the complete 7,787-URL corpus, including 6,028
matches, 985 players, and 366 on-this-day pages. `robots.txt` also explicitly
allows the public API and dataset paths. This is good for exhaustive discovery
but makes every archive receipt cheap for a crawler to enumerate and expensive
for the current ISR-backed deployment to serve.

Consider this move if Edge Requests or ISR reads remain above Hobby limits after
the first pass:

1. Keep the homepage, stories, questions, seasons, managers, major players, and
   selected matches in the sitemap.
2. Remove utility pages, all 366 calendar receipts, and low-value archive
   receipts from direct sitemap discovery.
3. Stop explicitly allowing `/api/v1/` and `/dataset/` in `robots.txt`; disallow
   crawler access to search, filtered utility routes, and APIs.
4. Enable Vercel's managed AI-bot deny rule and general bot challenge before
   relying on `robots.txt`, which cooperative crawlers may ignore.
5. Measure search impressions and indexed pages before and after the change.

Tradeoff: lower infrastructure usage in exchange for reduced long-tail search
coverage. This should be a measured product decision, not an automatic cleanup.

## Move 7 — true static export

The durable Hobby-oriented architecture is a real `output: "export"` build:
plain HTML, RSC, JavaScript, JSON, and pre-sized media with no Vercel Functions,
ISR, runtime SQLite, or Blob dependency.

The representative slice should prove one complete path before converting the
whole archive:

1. Export the homepage, one season, one player, one opponent, and a set of match
   pages with `dynamicParams = false`.
2. Move date-based homepage and Surprise selection to client code over generated
   static data.
3. Replace request-shaped API handlers with build-generated JSON files.
4. Replace middleware, server redirects, and custom response headers with static
   host equivalents or direct canonical links.
5. Serve local WebPs directly or introduce a build-time responsive-image step.
6. Verify navigation, no-JavaScript pages, search discovery, corrections, and
   data downloads on the exported slice.
7. Compare output size, build duration, Edge Requests, data transfer, and loss of
   server-only behavior before spreading the pattern.

Expected effect: Blob transfer, Fluid Active CPU, function invocations, and ISR
usage should approach zero; Edge Requests and ordinary data transfer remain.

Tradeoff: the public API and query-shaped experiences need static or client-side
replacements, and every data update requires a complete build and deployment.

## Decision rule

Remain on Pro if the first pass produces stable daily usage with comfortable
headroom and the operating cost is acceptable. Consider Move 6 when crawler
traffic is the remaining driver. Prototype Move 7 when ISR, function, or origin
usage remains structural even after crawler and prefetch reductions.
