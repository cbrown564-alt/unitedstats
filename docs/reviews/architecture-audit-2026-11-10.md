# Architecture audit — 10 November 2026

**Question.** Would a fresh look at the stack (moving to Astro, or rewriting
client code in vanilla JS) make Red Thread meaningfully better, now that the
two November performance passes (`096f45f`, `b60ce42`) have landed?

**Short answer.** The performance passes took most of the gains available
in place. What remains is mostly the **framework floor**: React plus the Next
runtime cost about 120 KiB of script on every page, and the App Router inlines a
second copy of each page's tree into its HTML. Those can only be removed by
changing the framework. But every measured page already scores 98–100 with
LCP ≤ 1.51 s, so performance alone does not justify a migration. Do the cheap
in-place items below first, then decide on Astro with a **one-route spike
measured with the existing harness**, not by argument.

This is an evidence record. It does not replace `docs/ARCHITECTURE.md` or
`docs/PERF.md`.

## Evidence base

- Lighthouse corpus `output/performance/2026-11-10-budgets-verified/`
  (build `AuPsTnEBuNgfdtrbuVKk9`, 3 cold runs per route/device), the
  comparison recorded in `docs/PERF.md`.
- The same build's `out/` and `.next/` on disk, measured directly for chunk
  contents and HTML composition.
- A static inventory of every `"use client"` module at `b60ce42`.

## 1. Where the bytes go now

Script transfer per route (mobile unless noted), split into the shared
framework floor and everything else:

| Route | Script total | React DOM `4bd1b696` | Next runtime `3794` | Floor share | Rest |
| --- | ---: | ---: | ---: | ---: | ---: |
| Home | 163.2 KiB | 61.7 | 57.9 | 73% | ~44 |
| Seasons | 153.2 KiB | 61.7 | 57.9 | 78% | ~34 |
| Match browser | 199.6 KiB | 61.7 | 57.9 | 60% | ~80 |
| Rooney (desktop) | 304.9 KiB | 61.7 | 57.9 | 39% | ~185, of which Recharts `1269` is 94.3 |

Chunk identities were checked in the built files: `4bd1b696` contains
react-dom; `3794` is the App Router client (router, prefetching,
`useSearchParams`); `1269` is Recharts.

**Reading.** The two open script-budget misses (Home 163 > 150, Seasons
153 > 150) are the floor plus 34–44 KiB of app code. No app-level trimming gets
Home under 150 KiB while 120 KiB is fixed. The desktop Rooney miss is Recharts.

### HTML composition

| Page | HTML raw | HTML gzip | Inline RSC payload (`self.__next_f`), raw |
| --- | ---: | ---: | ---: |
| `/` | 445 KiB | 45 KiB | 285 KiB (64%) |
| `/seasons` | 2,827 KiB | 167 KiB | 1,686 KiB (60%) |
| `/player/wayne-rooney` | 1,831 KiB | 101 KiB | 1,067 KiB (58%) |
| `/matches` | 234 KiB | 23 KiB | 62 KiB (26%) |

On content-heavy pages about 60% of the HTML is the RSC flight payload the App
Router needs to hydrate and navigate on the client. Seasons' gzipped HTML
(167 KiB) is near the 180 KiB budget. Its longest main-thread task (255 ms on
mobile) is attributed to the document itself, not a script. That is parse/layout
cost from 2.8 MB of HTML.

### Main-thread cost

| Route (mobile) | Median TBT | Top long task |
| --- | ---: | --- |
| Seasons | 126 ms | document parse 255 ms |
| Match browser | 118 ms | Next runtime `3794` 224 ms (hydration) |
| Rooney | 98 ms | react-dom 130 ms |
| Home | 7 ms | — |

The two TBT misses have different causes. Seasons is page weight; Matches is
framework hydration of an interactive page.

## 2. Client-component inventory

95 modules are `"use client"`, about 15.4k lines. By area:

| Area | Modules | Verdict |
| --- | ---: | --- |
| Match filters, search, combobox, sheets, mobile nav | ~25 | **Genuinely interactive.** Would be islands under any framework. Vanilla JS would make these harder to maintain, not easier. |
| Journey stages (`useJourneyStage` scroll scenes) | 9 | **Genuinely interactive.** Scroll-driven; island candidates. |
| Recharts charts | 6 | **Replace.** Five use `useRouter` only to `push` on click; the SVG cords already prove hand-drawn charts fit the design better. Removes the 94 KiB chunk where charts are visible. Revisit ADR 0001. |
| Hookless or `useId`-only modules (`ShirtBadge`, `TrophyMarkerStrip`, `RediscoveryRail`, `EntityRediscoveryRail`, `JourneyBeat`) | ~5 | **Minor.** Could be server components, but most are imported by client parents, so the byte win is small. Clean up opportunistically. |
| Dev labs (`components/dev/*`) | 3 | Not shipped to public routes; ignore. |

**Reading.** The "built quickly" debt in client code is real but narrow: one
dependency (Recharts) and a handful of misplaced boundaries. Most of the client
code is client code for good reasons.

## 3. Platform residue from Vercel

Cloudflare serves the site, but several pieces still assume Vercel. None of them
hurts performance; some are correctness or maintenance risks.

| Item | Risk | Action |
| --- | --- | --- |
| `lib/site.ts` falls back to `https://unitedstats.vercel.app` when `NEXT_PUBLIC_SITE_URL` is unset | **Wrong canonical/OG URLs** on any build that skips `scripts/build-cloudflare.mjs`, the only place that sets the variable (plain `npm run build` does not) | Fall back to `https://utdred.com` |
| `vercel.json` is the source of truth for Cloudflare `_redirects`/`_headers` (generated in `scripts/build-cloudflare.mjs`); its `routes` block is duplicated by hand in `deploy/cloudflare-worker.ts` | Two places to change one redirect | Move redirects/headers to a Cloudflare-owned file; delete `vercel.json` once rollback is retired |
| `@vercel/blob` dependency, `scripts/upload-db.ts`, `scripts/check-blob.mjs` | Dead path the docs forbid reintroducing | Remove |
| `scripts/smoke-check.mjs` defaults to the Vercel URL and bypass header | Smoke check targets the wrong host | Point at `utdred.com` |
| `VERCEL_ENV` preview detection (`lib/build-profile.ts`, `scripts/prebuild.mjs`, `scripts/check-perf-budgets.mjs`) | Dead branch: Cloudflare builds force `full`, so preview is reachable only through an explicit `UNITEDSTATS_BUILD_PROFILE` | Drop the `VERCEL_ENV` checks |
| `.vercelignore`; comments in `app/robots.ts`, `lib/db.ts`, `components/PlayerPortrait.tsx` | Misleading | Update with the above |
| `docs/ARCHITECTURE.md` still describes Vercel deploys, `vercel.json` redirects and `.vercelignore` | Doc drift | Reconcile when the items above change |

## 4. What Astro would and would not change

**Would change (estimates from the measured chunks, not measurements):**

- Static-only pages (Seasons, most of Rooney, story bodies) would ship roughly
  0–30 KiB of script instead of ≥ 153 KiB. The 120 KiB floor becomes per-island
  cost, and could fall further with Preact for islands.
- No inline RSC payload: Seasons HTML would fall from ~2.8 MB to roughly the
  ~1.1 MB of markup, and Rooney from ~1.8 MB to ~0.8 MB. That should take most
  of Seasons' document-parse long task with it.
- Interactive pages (Matches, search, Home's `TonightHero`) would gain less:
  they still hydrate a component tree, just without the App Router.

**Would not change:**

- LCP is already 1.2–1.5 s and set by HTML and fonts, not JavaScript.
- The ~40 interactive modules stay components (React/Preact islands).
- Build-time SQLite reads map directly onto Astro frontmatter; this is neutral,
  not a gain.

**Would cost:**

- Porting 9,200 prerendered paths, `opengraph-image.tsx` share cards, sitemap,
  robots, the static-render and perf-budget guards (both read `.next/`), and the
  view-transition navigation (Astro has an equivalent).
- Losing client-side navigation between pages unless replaced with Astro's
  router; the archive's in-place history updates would need reworking.
- Weeks of product freeze ahead of the Reddit launch.

## 5. Recommendation

1. **Fix the Vercel residue (§3).** Small, low-risk, and the `site.ts` fallback
   is a latent correctness bug. Independent of any framework decision.
2. **Replace Recharts with hand-drawn SVG and plain links.** Removes the
   largest app dependency and closes the desktop Rooney budget miss. It also
   matches the cord design language. Any future Astro port gets simpler too,
   because these charts become static markup.
3. **Reduce Seasons' page weight.** 2.8 MB of HTML for one index is a design
   and markup problem as much as a framework one. Fewer nodes help under any
   stack.
4. **Then run a one-route Astro spike**, in a worktree: port `/seasons` (static,
   heavy, budget-missing) and measure it with `scripts/benchmark-lighthouse.mjs`
   and `npm run check:perf:lighthouse` against the verified corpus. Migrate only
   if the spike shows a clear win on the misses that remain after steps 1–3, and
   the port of that route stays mechanical.

Not recommended: rewriting interactive components in vanilla JS. It trades a
component model for hand-managed DOM in exactly the parts of the product that
are hardest to get right.

## Open budget misses after `b60ce42`, and what addresses each

| Miss | Cause | In-place fix | Needs framework change? |
| --- | --- | --- | --- |
| Home JS 163 > 150 KiB | 120 KiB floor + app code | Trim shared chrome ~15 KiB | Probably, to get real margin |
| Seasons JS 153 > 150 KiB | Floor | Marginal | Yes |
| Desktop Rooney JS 305 > 200 KiB | Recharts | Step 2 | No |
| Seasons TBT 126 > 100 ms | 2.8 MB document parse | Step 3 | Helps (drops flight payload) |
| Matches TBT 118 > 100 ms | Next runtime hydration | Defer non-visible islands | Helps a little |
| Seasons/Rooney LCP 1.51 > 1.50 s | Page weight | Step 3 | Marginal |
