# Scope: indexable match and player pages

Scoped 2026-11-10. Status: proposal, nothing built.

## Why

Search engines supply about 95% of referred visitors (Umami, 29 Sep – 10 Nov
2026), and people enter on individual records, not the homepage. Since the
2026-09-23 footprint cut only 84 matches, 19 players and 17 seasons are
prerendered. Every other match, player, opponent and season URL is redirected
(307) to `/record` or `/matches`, and `/record` is `noindex`. The cut was made
for Vercel deployment-storage limits; production moved to Cloudflare on
2026-10-07.

## Measured today (full local build, commit c1b21e9)

| | Value |
|---|---|
| Export | 14,186 files, 394.8 MB (budget 500 MB) |
| Static generation | 9,128 routes in 62 s |
| Prerendered match | 9 files, about 390 KB; HTML alone 110–157 KB (about 22 KB gzipped) |
| Prerendered player | 9 files, about 1.7 MB (these 19 are the longest careers) |
| Largest directories | `api/` 8,523 files, `on-this-day/` 3,300 files |

Each page is one `.html`, one `.txt` and a folder of six RSC segment files.

Cloudflare Workers static assets allow 20,000 files per version on Free and
100,000 on Paid, 25 MiB per file, and state no total-size limit.

## Options

| | A: prerender everything as-is | B: prerender, ship HTML only for records |
|---|---|---|
| Added files | about 62,300 | about 6,900 |
| Total files | about 76,500 | about 20,300 (about 17,400 if `on-this-day` segments are pruned too) |
| Added size (upper bound) | 2.3 GB matches, plus players | about 0.9 GB matches, plus players |
| Cloudflare plan | Paid required | Free is borderline; Paid comfortable |
| Extra work | none beyond the common changes | postbuild prune of RSC files for record routes |

Sizes are upper bounds: the 84 prerendered matches are finals and authored
nights, and the 19 players are the biggest careers. Ordinary records should be
smaller; this has not been measured.

Option B relies on record links already being native anchors (PR #77), so the
RSC payloads for those routes should be unused. That needs proving before the
prune ships.

A third option, rendering records in the Worker at request time, adds no files
but reintroduces a runtime path. The June outage and `docs/PERF.md` both rule
that out.

## Recommendation

Option B, in three steps.

1. **Spike (half a day).** Build once with every match and player. Record real
   page sizes, file count, build time and Cloudflare upload time. Prove that
   navigation into a record still works with its RSC files removed.
2. **Players, seasons, opponents (about 1,300 pages).** Fits either plan. Ship
   with the sitemap and canonical changes below and watch search entries for
   three to four weeks.
3. **All matches (about 6,000 pages).** Go ahead if step 2 moves search
   entries and the spike numbers hold.

## Common changes (either option)

- `generateStaticParams` in `app/match`, `app/player`, `app/opponent`,
  `app/seasons` returns every id in full builds; `lib/discovery.ts` keeps the
  curated lists for promotion only.
- `app/sitemap.ts` lists every prerendered record.
- `lib/recordHref.ts` links to `/match/{id}` and `/player/{id}` again;
  `/record` remains as a `noindex` fallback for unknown ids.
- The Worker redirect needs no change: static files already take precedence.
- Revise the export budget in `scripts/check-perf-budgets.mjs` and the decision
  in `docs/PERF.md`.

## Spike results (2026-11-10)

One full build with every match, player, opponent and season prerendered, in
an isolated worktree.

| | Today | Option A | Option B |
|---|---|---|---|
| Files | 14,186 | 79,637 | 20,487 |
| Export size | 395 MB | 3.6 GB | about 2.0 GB |
| `next build` | about 1.5 min | 4 min 23 s | same as A, plus the prune |

| Route | Pages | Median HTML | 95th percentile | Largest |
|---|---|---|---|---|
| Match | 6,043 | 167 KB | 209 KB | 249 KB |
| Player | 985 | 94 KB | 479 KB | 1,830 KB |
| Opponent | 238 | 129 KB | 1,132 KB | 1,421 KB |
| Season | 127 | 453 KB | 516 KB | 541 KB |

Navigation with the RSC files removed, served from the pruned export:

- Match to player, player to season, homepage night to match, and browser Back
  all landed on the right page.
- Each of those was a full document load, not a client transition.
- `next/link` still prefetches `__next._tree.txt` for every record link in
  view. One short session produced 173 failed requests in the console. About
  34 files under `app/` and `components/` link to records through `next/link`.

Also found: prerendered match and player pages carry no canonical link tag.

Not measured: Cloudflare upload time, and the local build needs about 8 GB of
free disk (the first attempt filled the disk).

### Revised recommendation

Option B still, with one added task: record links must stop prefetching, by
using native anchors (as PR #77 already did for the archive lists) through one
shared link component. Option A works on Workers Paid without that task but
starts at 80% of the 100,000-file limit.

## Decided (2026-11-10)

- The Cloudflare account is on Workers Paid, so the 100,000-file limit applies.
- Result-only pre-war match pages go in the sitemap.

## Open questions

- Weekly deploy time once every record is rebuilt each Monday.
