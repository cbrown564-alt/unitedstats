# Handoff: Phase 16 Habit And Creator Tail Pass 1

Date: 2026-06-23
Builder: Codex
Evaluator: Claude Opus

## Scope

Implemented:

- `/on-this-day/[monthDay]` static route for all 366 UTC month/day keys.
- Deterministic on-this-day facts from the local match database, including February 29 fixtures.
- Accountless `/collection?c=...` saved collections with URL-encoded Cuts, 12-Cut cap, 1800-character cap, preserved coverage/evidence links, and `noindex`.
- `/embed/cut/[slug]` static embed pages for curated Cut slugs only, with `noindex`.
- Explicit `/embed/:path*` cache/framing headers in `next.config.ts`.
- Public docs for on-this-day, collections, embed params, limits, no mutation endpoints, and noindex behavior.

Deferred:

- Non-cut embeds and image-based embed cards.
- A curated on-this-day index page.

Out of scope:

- Accounts, persisted server-side collections, or arbitrary embed query builders.

## Changed Files

| File | Purpose |
| --- | --- |
| `lib/onThisDay.ts` | UTC 366-key generation and deterministic match facts. |
| `app/on-this-day/[monthDay]/page.tsx` | Static on-this-day detail pages. |
| `lib/collections.ts` | Saved collection encode/decode, caps, and Cut execution. |
| `app/collection/page.tsx` | URL-encoded collection renderer with noindex metadata. |
| `lib/embeds.ts` | Curated Cut embed data and frame/cache headers. |
| `app/embed/cut/[slug]/page.tsx` | Static curated Cut embed pages with noindex metadata. |
| `next.config.ts` | Adds `/embed/:path*` `Cache-Control` and `Content-Security-Policy: frame-ancestors *` headers. |
| `app/sitemap.ts` | Adds 366 on-this-day routes. |
| `docs/HABIT-CREATOR.md` | Public docs for supported params, caps, noindex, and embed headers. |
| `tests/phase16-habit-creator.test.ts` | Golden tests for all Phase 16 criteria. |

## Artifacts And Evidence

| Artifact | Evidence |
| --- | --- |
| 366 on-this-day routes | `monthDayKeys()` and `generateStaticParams()` both assert length 366; `npm run build` route table shows `/on-this-day/[monthDay]` with `01-01`, `01-02`, `01-03`, and `+363 more paths`. |
| February 29 fixture | Test pins `1896-02-29-burton-wanderers-h` and `Saturday 29 February 1908: United 1-0 Birmingham City.` with match evidence link. |
| On-this-day evidence | Test renders `/on-this-day/05-26` and asserts `United 2-1 FC Bayern Munich` plus `/match/1999-05-26-bayern-munich-n`. |
| Collection round trips | Tests encode/decode one Cut, curated multi-Cut set, and 12-Cut max set. |
| Collection caps | Tests assert 13 Cuts throw and encoded strings over 1800 chars return an error object. |
| Collection noindex | Test asserts collection metadata `{ index: false, follow: true }`. |
| Embed bounded slugs | Tests assert embed static params equal `CURATED_CUTS`, valid slug renders, arbitrary fork returns `null`. |
| Embed headers | Tests assert `EMBED_FRAME_HEADERS` and `nextConfig.headers()` include `/embed/:path*` with cache and `frame-ancestors *`. |
| Embed noindex | Test asserts embed metadata `{ index: false, follow: false }`. |

## Acceptance Map

| AC ID | Status | Evidence |
| --- | --- | --- |
| X1 | Met | Determinism command generated on-this-day, month-day count, collection encoding/decoding, embed payload, and embed headers twice; `diff -ru` produced no output. No wall-clock timestamps. |
| X2 | Met | New Phase 16 generators read local SQLite, local Cut registry, and URL payloads only; no network calls. |
| X3 | Met | `tests/phase16-habit-creator.test.ts` adds golden assertions under `node:test`. |
| X4 | Met | `npm run knip`, `npm run validate`, `npm run build:db`, `npm test`, `npm run build`, and `npm run check:static` pass. |
| X5 | Met | On-this-day, collections, and embeds reuse Phase 0 citable units via `onThisDayRef`, `collectionRef`, and `embedRef`. |
| X6 | Met | Tests assert exact fact text, exact evidence links, noindex metadata, cap errors, rendered embed text, route table output, and headers. |
| X7 | Met | Read local Next docs before edits: `page.md`, `use-client.md`, `linking-and-navigating.md`, and `next-config-js/headers.md`. |
| 16.1 | Met | Fixtures pin several dates, including February 29 and May 26, with evidence links. |
| 16.2 | Met | All 366 keys are generated and `onThisDay(key)` resolves for every key; build prerenders all 366 route params. |
| 16.3 | Met | Collection encoding round-trips at 1 Cut, curated multi-Cut, and 12-Cut max; over-cap inputs are rejected without truncation. |
| 16.4 | Met | Collection page preserves each Cut's coverage/evidence links and returns `noindex, follow`. |
| 16.5 | Met | Embed pages render representative curated Cut content and headers declare cache/framing behavior. |
| 16.6 | Met | `docs/HABIT-CREATOR.md` states supported embed params/limits and no mutation/secrets/unbounded query surfaces; implementation only exposes curated slug params. |

## Commands

```text
npm run knip
# PASS

npm run validate && npm run build:db && npm test
# validate: OK — 6027 matches across 126 seasons, 0 errors, 39 warnings
# built /Users/cobro/code/unitedstats/data/united.db: 6027 matches (1886-10-30 → 2026-05-24), 19661 events, 6022 matches with lineups
# tests 77
# pass 77
# fail 0

npm run build
# ✓ Compiled successfully
# Finished TypeScript
# ✓ Generating static pages using 7 workers (7812/7812)
# Route table includes:
# ● /on-this-day/[monthDay]
#   ├ /on-this-day/01-01
#   ├ /on-this-day/01-02
#   ├ /on-this-day/01-03
#   └ [+363 more paths]
# ● /embed/cut/[slug]
#   ├ /embed/cut/opponents-by-win-rate
#   ├ /embed/cut/managers-by-points
#   └ /embed/cut/seasons-by-points

npm run check:static
# ✓ static-render guard: 7 static pages, 5 SSG routes, 7809 prerendered paths.

tmp=$(mktemp -d); for run in a b; do out="$tmp/$run"; mkdir -p "$out"; npx tsx -e 'import fs from "node:fs"; import { onThisDay, monthDayKeys } from "./lib/onThisDay"; import { encodeCollection, decodeCollection } from "./lib/collections"; import { CURATED_CUTS, curatedCut } from "./lib/cut"; import { cutEmbed, EMBED_FRAME_HEADERS } from "./lib/embeds"; const out=process.argv[1]; const encoded=encodeCollection(CURATED_CUTS.map(curatedCut)); fs.writeFileSync(`${out}/on-this-day-02-29.json`, JSON.stringify(onThisDay("02-29"), null, 2)+"\n"); fs.writeFileSync(`${out}/month-day-count.txt`, `${monthDayKeys().length}\n`); fs.writeFileSync(`${out}/collection.txt`, `${encoded}\n`); fs.writeFileSync(`${out}/collection.json`, JSON.stringify(decodeCollection(encoded), null, 2)+"\n"); fs.writeFileSync(`${out}/embed.json`, JSON.stringify(cutEmbed("opponents-by-win-rate"), null, 2)+"\n"); fs.writeFileSync(`${out}/embed-headers.json`, JSON.stringify(EMBED_FRAME_HEADERS, null, 2)+"\n");' "$out"; done; diff -ru "$tmp/a" "$tmp/b"; find "$tmp/a" -type f -maxdepth 1 -print | sort; rm -rf "$tmp"
# diff -ru produced no output.
# Generated files:
# collection.json
# collection.txt
# embed-headers.json
# embed.json
# month-day-count.txt
# on-this-day-02-29.json
```

## Rendered/API Evidence

```text
tests/phase16-habit-creator.test.ts:
- on-this-day exposes all 366 UTC month/day keys
- on-this-day fixtures pin deterministic facts including February 29
- on-this-day all keys resolve without crashing and fallback is deterministic
- saved collections round-trip one, many, and max-size Cut sets
- saved collections reject over-cap inputs without truncating state and are noindex
- cut embeds are bounded to curated slugs, render content, and are noindex
- embed headers declare cache and framing behavior
```

## Risks And Known Gaps

- `/collection` is dynamic because it decodes arbitrary URL payloads, but it is accountless, backendless, capped, and noindex.
- The embed framing policy intentionally allows framing via `frame-ancestors *`; this is creator-distribution behavior, not a private UI surface.
- On-this-day pages currently show earliest matching facts first, capped at eight facts per date.

## Prior Review Disposition

No prior Phase 16 review.
