# Vercel Hobby assessment

Status: Moves 6 and 7 landed on 2026-08-22. The sitemap is a curated discovery
set (`lib/discovery.ts`) and the app is a real `output: "export"` static site.
`PERF.md` owns ongoing performance budgets; this document is the decision
record for those two moves.

## Account audit — 2026-09-10

Vercel reports a team soft block for `FAIR_USE_LIMITS_EXCEEDED`, specifically
`edgeRequest`, applied on 2026-09-01 at 08:18:30 UTC. `https://utdred.com/`
returns HTTP 402 with `x-vercel-error: DEPLOYMENT_DISABLED`. Storage cleanup
does not establish that this request-limit block has been lifted.

The current production deployment is `dpl_DqVW3o9xTREUs4AeqjAAhHcV5FUc`,
created on 2026-08-31, commit `34af896a9fec773991c02c6da65695e988957a4e`.
Its build log lists static/SSG routes. The local checkout is older than that
production commit; do not redeploy it as a recovery shortcut.

Dashboard evidence during the audit:

- Last-30-days Edge Requests: unitedstats 349,830 (10.9%); clinical-extraction
  2,834,257 (88.6%). The primary request-overage contributor is therefore
  clinical-extraction, not unitedstats. Diagnose that project before making
  further Red Thread feature or crawler-discovery cuts.
- In the normal-service window Aug 24, 12:00–Aug 31, 12:00 (dashboard local
  time), unitedstats recorded 77,735 Edge Requests, no listed ISR Reads, and
  220.45 kB Fast Origin Transfer. That is approximately 333,000 requests per
  30 days if the rate holds. This supports the static-export decision, but
  does not guarantee future usage or account-wide headroom.
- Last-30-days ISR Reads still attribute 1,205,946 units (99.8%) to unitedstats;
  the post-export window above distinguishes that historical total from the
  current architecture.
- The last-30-days Deployment Storage view attributes 410.78 GB to
  unitedstats out of approximately 500.4 GB for the team. Other projects
  account for approximately 89.6 GB, including 75.98 GB for `local`.
  These are dashboard period figures, not a verified post-cleanup inventory.
- Functions Storage attributes 81.78 GB of the approximately 84.9 GB team
  total to unitedstats in that same 30-day view.
- Fast Origin Transfer attributes 11.27 GB (99.8%) to unitedstats in the
  30-day view; only 220.45 kB appears in the post-export week above.
- For Sep 3–10, Edge Requests shows 56,905 for the team and 46,296 for
  unitedstats. ISR Reads and Fast Origin Transfer show **No Data**.
- That entire seven-day window follows the team pause. Do not use its low
  traffic or missing runtime data to claim the running site fits Hobby.
- The accessible 12-hour request view shows 4xx responses and crawler traffic,
  including Semrush and Googlebot. It does not establish which sources caused
  the pre-pause overage. Historical detailed queries require Observability Plus.

Deployment retention was reduced and verified through the project API;
[`PIPELINE.md`](PIPELINE.md#deployment-retention) owns the ongoing policy.
Cleanup manifests and command receipts are kept locally under
`output/vercel-cleanup/2026-09-10/`. Successful deleted deployments appear in
Vercel's Recently Deleted view with a recovery period; storage reclamation
and already-recorded usage may lag deletion.

Cleanup completed: 401 of the initial 412 deployments were deleted. A fresh
API inventory contains exactly the 11 selected keep IDs: current production,
two previous ready production releases and eight active-branch previews.
The production deployment ID and all five production aliases are unchanged.
`verification.json` in the receipt directory records the final inventory and
retention settings. A post-cleanup HTTP check still returns
`DEPLOYMENT_DISABLED`; service has not been restored. No application source,
canonical data, media, plan subscription or other project's deployments were
changed. Documentation passed `git diff --check`; application tests and builds
were not run because there was no application-code change or new deployment.

The immediate remaining service issue is the team request-limit pause, with
clinical-extraction responsible for most reported requests. Review
Vercel's recovery options after cleanup; do not upgrade the plan or migrate
production without agreement on the destination and cost. Measure normal
traffic after service resumes before further crawler restrictions or feature
cuts. Other projects' retained storage requires a separate scoped cleanup.

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
