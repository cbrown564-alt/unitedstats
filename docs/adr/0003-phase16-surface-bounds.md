# Phase 16 — Surface bounds for rediscovery, collections, and embeds

Status: accepted

## Context

Phase 16 added daily-return, save-and-share, and embeddable surfaces. Several
carry concrete capacity/determinism bounds that a future change could silently
break. These bounds are recorded here as durable rules.

## Decision

- **`/on-this-day`** keys on **UTC month/day** and statically generates all 366
  keys. No runtime date computation in the route.
- **Saved collections** are capped at **12 Cuts or 1800 URL characters**. The
  collection is encoded entirely in the URL (`/collection?...`), so the cap keeps
  links shareable and the payload deterministic.
- **Embeds** use explicit framing and cache headers, and **non-curated
  embed/collection surfaces are `noindex`** so they cannot dilute the crawlable
  record.

## Consequences

- Collections and embeds are best-effort convenience surfaces, not part of the
  citable record (curated cuts and the `/api/v1` answers are). See
  `docs/process/PHASE0-CITABLE-CONTRACT.md` for what is citable.
- If `/collection` or `/embed` are retired (see `docs/RESTRAINT-PASS.md`
  Phase 3), these bounds retire with them.
