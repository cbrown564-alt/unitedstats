# Habit and creator surfaces

Phase 16 adds three static-friendly distribution surfaces.

## On this day

`/on-this-day/[MM-DD]` is a pure UTC month/day lookup over the local official
match database. The route statically generates all 366 possible keys, including
`02-29`. Empty days render a deterministic fallback instead of redirecting or
guessing.

Each fact links back to `/match/[id]` as its evidence path.

## Saved collections

`/collection?c=...` stores a small set of Cuts in the URL. There are no accounts
and no server-side saved state.

Limits:

- 1 to 12 Cuts.
- Encoded payload at most 1800 characters.
- Over-cap or malformed payloads are rejected as a whole; the app does not
  truncate partial state.

Collections preserve each Cut's coverage note and evidence links. Collection
pages are `noindex, follow` because they are user-created forks rather than
curated canonical pages.

## Embeds

The supported embed surface is:

- `/embed/cut/[slug]` for curated Cut slugs from `CURATED_CUTS`.

Embed routes are static, `noindex`, and bounded to the curated slug registry.
They expose no mutation endpoint, no secret-bearing params, and no arbitrary
query surface. `/embed/:path*` responses carry explicit cache/framing headers:

- `Cache-Control: public, max-age=300, s-maxage=86400, stale-while-revalidate=604800`
- `Content-Security-Policy: frame-ancestors *`
