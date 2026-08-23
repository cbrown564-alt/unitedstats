# Vercel Hobby assessment

Status: Moves 6 and 7 landed on 2026-08-22. The sitemap is a curated discovery
set (`lib/discovery.ts`) and the app is a real `output: "export"` static site.
`PERF.md` owns ongoing performance budgets; this document is the decision
record for those two moves.

## Measurement period

After deploying the static export, compare project-level totals and daily rates
for:

- Fast Origin Transfer
- ISR reads and writes (should be unused)
- Blob Data Transfer (should stay near zero)
- Fluid Active CPU and function invocations (should be unused)
- Image Optimization transformations (disabled; `images.unoptimized`)
- Edge Requests

Record the deployment date when interpreting the charts. Older ISR, Blob, and
function usage remains visible until it ages out of Vercel's rolling window.

## Move 6 — reduce crawler discovery (landed)

`lib/discovery.ts` owns the sitemap and robots policy:

1. Homepage, stories, questions, seasons, managers, major players (≥150
   appearances or curated debate IDs), and selected match nights stay in the
   sitemap.
2. Utility pages, the 366 calendar receipts, opponents, and the full match
   dump are out of the sitemap.
3. `robots.txt` disallows `/api/`, `/dataset/`, `/search`, `/matches`,
   `/surprise`, `/compare`, `/cut`, `/on-this-day`, and `/dev/`.
4. Vercel managed AI-bot deny and general bot challenge remain a platform
   follow-up: stage as log first; do not publish from this repo until measured.
5. Measure search impressions and indexed pages after the first export deploy.

Tradeoff: lower crawler load in exchange for reduced long-tail search
coverage. Entity pages still exist; they are just not advertised.

## Move 7 — true static export (landed)

The live architecture is a real `output: "export"` build: HTML, RSC,
JavaScript, JSON, and pre-sized media with no Vercel Functions, ISR, runtime
SQLite, or Blob dependency.

What changed:

1. `next.config.ts` sets `output: "export"` and `images.unoptimized`.
2. Date-based homepage spark and Surprise re-rolls run in the browser over
   build-generated catalogs.
3. Search and match filters read `/data/search-index.json` and
   `/data/matches-catalog.json`. Request-shaped APIs return unfiltered
   snapshots or were removed (`/api/search`, `/api/search/click`,
   `/api/revalidate`).
4. Middleware is gone. Legacy redirects and `/data/*` cache headers live in
   `vercel.json`.
5. Portraits are cached local WebPs served without the image optimizer.
6. Compare is curated debates only. Corrections no longer prefill from query
   strings. Preview entity IDs outside the sample 404. Copy Studio cannot POST.
7. Every data update requires a complete build and deployment.

Expected effect: Blob transfer, Fluid Active CPU, function invocations, and
ISR usage approach zero; Edge Requests and ordinary data transfer remain.

## Decision rule

Stay on Hobby if Edge Requests and Fast Origin Transfer stay inside the plan
after the first export deploy and crawler follow-up. Return to Pro only if
host limits, not architecture, become the constraint.
