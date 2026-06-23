# Process Decisions And Escalations

This file is append-only. New decisions go at the top with the current date.

## 2026-06-23 - Provenance Dates And Determinism

Generated claims may include provenance dates only when those dates already
exist in canonical data, such as a source `retrieved_at` or `stats_as_of` field.
If a source has no canonical as-of date, the generated claim omits that field.
The current wall-clock date is never used as a provenance fallback. Build
metadata may exist outside claim artifacts, but it must not affect claim
versions, golden outputs, or history-changed digest content.

## 2026-06-23 - Ratify Phase 0 Before Phase 13

Phase 13 depends on stable IDs and provenance, so the ID/provenance contract is
pulled forward as Phase 0. Phase 13 may not generate public digest artifacts
until Phase 0 passes review.

## 2026-06-23 - Digest Recompute Policy

History-changed digest pages recompute from current canonical data. Their
logical ID and canonical URL remain stable, but each digest carries a claim
version derived from its content/canonical revision. Corrections can therefore
update old digest content without breaking the stable URL, while citations can
pin the version they saw.

## 2026-06-23 - Phase 15 Correction Architecture

Phase 15 uses a static prefilled GitHub issue workflow with a client-side
correction builder and field-level diff preview. Public status is a filtered
GitHub issue search. Canonical data changes still land through
maintainer-reviewed PRs and CI validation.

## 2026-06-23 - Robots And Machine-Facing Answers

Phase 14 must make crawl policy coherent with machine-facing answers. The
preferred direction is to allow read-only `/api/v1` and answer-shaped surfaces
while disallowing side-effect endpoints such as click logging.

## 2026-06-23 - Phase 16 Bounds

On-this-day uses UTC month/day and static routes for all 366 keys. Saved
collections are capped at 12 Cuts or 1800 URL characters. Embeds use explicit
framing/cache headers and non-curated embed/collection surfaces are noindex.
