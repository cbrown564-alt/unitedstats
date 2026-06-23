# Handoff: Phase 15 Correction As A Product Pass 1

Date: 2026-06-23
Builder: Codex
Evaluator: Claude Opus

## Scope

Implemented:

- Static `/corrections` page with a client-side correction builder.
- Match, player, and event correction entry points with prefilled field path, current value, page path, and citable ID.
- Deterministic GitHub issue title/body/URL generation, labels, request ID, and field-level diff preview.
- Payload validation for required fields, source/archive evidence, URL format, field/value limits, and maximum issue URL length.
- Public correction status link to the filtered GitHub issue queue.
- Maintainer workflow fixture that applies a sample correction to a temporary canonical copy and validates it.
- Public docs with payload schema, maintainer workflow, and threat model.

Deferred:

- First-party correction status page. Phase 15 architecture pins public status to GitHub issue search.
- File uploads. The payload carries an attachment/archive note; actual attachments are handled by GitHub issue comments.

Out of scope:

- Any backend mutation endpoint or automatic canonical write.
- Applying a real data correction to checked-in canonical JSON.

## Changed Files

| File | Purpose |
| --- | --- |
| `lib/corrections.ts` | Browser-safe correction payload schema, validation, diff preview, deterministic issue generation, prefill URLs, status URL. |
| `app/corrections/page.tsx` | Static correction route shell. |
| `app/corrections/CorrectionBuilder.tsx` | Client-side builder that reads prefill params, previews diff/body, and opens GitHub issue URL. |
| `app/match/[id]/page.tsx` | Adds match attendance and event correction entry points. |
| `app/player/[id]/page.tsx` | Adds player-name correction entry point. |
| `app/data/page.tsx` | Links correction builder and public correction status. |
| `app/sitemap.ts` | Adds `/corrections`. |
| `docs/CORRECTIONS.md` | Public correction contract, payload schema, maintainer workflow, threat model. |
| `scripts/apply-correction-fixture.ts` | Applies a correction fixture to a supplied canonical directory. |
| `scripts/lib.ts` | Adds `UNITEDSTATS_CANONICAL_DIR` override for temp-copy validation. |
| `tests/phase15-corrections.test.ts` | Golden tests for entry links, validation, issue generation, escaping, max URL, status URL, temp-copy validation. |
| `tests/fixtures/corrections/*.json` | Valid and malformed correction fixtures. |

## Artifacts And Evidence

| Artifact | Evidence |
| --- | --- |
| `/corrections` page | `npm run build` route table shows `○ /corrections`. |
| Match correction entry | `tests/phase15-corrections.test.ts` renders `app/match/[id]/page.tsx` and asserts a `/corrections?...kind=match...field=matches[id=...].attendance...cite=us:match...` link. |
| Event correction entry | Same test asserts a `/corrections?...kind=event...field=matches[id=...].events[N].minute...` link. |
| Player correction entry | Same test renders `app/player/[id]/page.tsx` and asserts a `/corrections?...kind=player...field=players[id=...].name...cite=us:entity...` link. |
| Payload schema | Tests assert complete fixture has zero validation errors and malformed missing-source fixture fails before issue URL generation. |
| Diff preview | `fieldPatch()` is golden-locked with exact `field`, `- current`, `+ proposed` lines. |
| Issue URL/body | Tests assert deterministic URL, labels, title, body request ID, maintainer checklist, escaping, missing optional fields, and max URL enforcement. |
| Maintainer workflow | Temp-copy command applies `sample-attendance.json` to copied canonical JSON and `UNITEDSTATS_CANONICAL_DIR=... npm run validate` passes. |
| Public status | Tests assert `CORRECTION_STATUS_URL` is a filtered GitHub issue search with `label:correction`. |

## Acceptance Map

| AC ID | Status | Evidence |
| --- | --- | --- |
| X1 | Met | Determinism command generated issue title/body/URL/diff twice; `diff -ru` produced no output. No wall-clock timestamps appear in correction payloads or request IDs. |
| X2 | Met | New correction builders read URL params/local constants only. Fixture applicator and validation consume local canonical JSON only; no network calls. |
| X3 | Met | `tests/phase15-corrections.test.ts` and fixtures under `tests/fixtures/corrections/` add golden assertions using `node:test`. |
| X4 | Met | `npm run knip`, `npm run validate`, `npm run build:db`, `npm test`, `npm run build`, and `npm run check:static` pass. |
| X5 | Met | Entry-point citable IDs use Phase 0 `matchRef` and `entityRef`; correction request IDs use the same `us:correction:<stable-hash>` shape defined by Phase 0, without importing server-only citation helpers into the browser bundle. |
| X6 | Met | Tests assert rendered links, exact issue content, exact diff content, validation failures, status URL, route table, and maintainer workflow output. |
| X7 | Met | Read local Next docs before route/client edits: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md`, `node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-client.md`, and `node_modules/next/dist/docs/01-app/01-getting-started/04-linking-and-navigating.md`. |
| 15.1 | Met | Render tests cover match, player, and event correction entry points with prefilled field path, current value context, page URL, and citable ID. |
| 15.2 | Met | `CorrectionPayload` includes target, field path, current/proposed values, page path, citable ID, source URL/archive reference, explanation, attachment note, reporter contact, and generated title/body. |
| 15.3 | Met | Builder renders `fieldPatch()` diff preview; tests cover escaping, long values, and missing optional fields. |
| 15.4 | Met | Temp-copy fixture workflow applies `sample-attendance.json` and `npm run validate` passes; malformed missing-source fixture fails schema validation before issue generation. |
| 15.5 | Met | Tests assert deterministic issue URL, exact title/body content, labels, request ID, and `MAX_GITHUB_ISSUE_URL_LENGTH` enforcement. |
| 15.6 | Met | Public status is `CORRECTION_STATUS_URL`, a filtered GitHub issue search; `/data` and `/corrections` link it. No architecture change from `DECISIONS.md`. |
| 15.7 | Met | `docs/CORRECTIONS.md` includes a threat model: public issues, no backend mutation endpoint, no automatic canonical write, maintainer verification, PR/CI validation gates, optional contact as public issue text. |

## Commands

```text
npm run knip
# PASS

npm run validate && npm run build:db && npm test
# validate: OK — 6027 matches across 126 seasons, 0 errors, 39 warnings
# built /Users/cobro/code/unitedstats/data/united.db: 6027 matches (1886-10-30 → 2026-05-24), 19661 events, 6022 matches with lineups
# tests 70
# pass 70
# fail 0

npm run build
# ✓ Compiled successfully
# Finished TypeScript
# ✓ Generating static pages using 7 workers (7442/7442)
# Route table includes:
# ○ /corrections

npm run check:static
# ✓ static-render guard: 7 static pages, 5 SSG routes, 7440 prerendered paths.

npm test
# tests 70
# pass 70
# fail 0

tmp=$(mktemp -d); for run in a b; do out="$tmp/$run"; mkdir -p "$out"; npx tsx -e 'import fs from "node:fs"; import sample from "./tests/fixtures/corrections/sample-attendance.json"; import { correctionIssueBody, correctionIssueTitle, correctionIssueUrl, fieldPatch } from "./lib/corrections"; const out=process.argv[1]; fs.writeFileSync(`${out}/title.txt`, `${correctionIssueTitle(sample)}\n`); fs.writeFileSync(`${out}/body.md`, `${correctionIssueBody(sample)}\n`); fs.writeFileSync(`${out}/issue-url.txt`, `${correctionIssueUrl(sample)}\n`); fs.writeFileSync(`${out}/field.diff`, `${fieldPatch(sample)}\n`);' "$out"; done; diff -ru "$tmp/a" "$tmp/b"; find "$tmp/a" -type f -maxdepth 1 -print | sort; rm -rf "$tmp"
# diff -ru produced no output.
# Generated files:
# body.md
# field.diff
# issue-url.txt
# title.txt

tmp=$(mktemp -d); cp -R data/canonical "$tmp/canonical"; npx tsx scripts/apply-correction-fixture.ts tests/fixtures/corrections/sample-attendance.json --canonical "$tmp/canonical"; UNITEDSTATS_CANONICAL_DIR="$tmp/canonical" npm run validate; rm -rf "$tmp"
# applied correction fixture to .../canonical/matches/1998-99.json
# validate: OK — 6027 matches across 126 seasons, 0 errors, 39 warnings
```

## Rendered/API Evidence

```text
tests/phase15-corrections.test.ts:
- correction prefill links carry match, player, and event citable context
- correction payload schema accepts complete payloads and rejects malformed fixtures before issue generation
- correction issue title, body, diff, labels, and URL are deterministic
- correction issue body escapes fences and handles missing optional fields
- correction issue URLs enforce the documented maximum size
- sample correction applies to a temp canonical copy and passes validation
- public correction status uses the agreed filtered GitHub issue search
```

## Risks And Known Gaps

- Correction request IDs are generated by browser-safe stable-hash logic matching the Phase 0 `us:correction:<hash>` shape; this avoids importing server-only citation/cut modules into the client bundle.
- Event entry points target event array indexes in the canonical match file. If an event is reordered before a maintainer applies the issue, the maintainer must verify the page/source context before editing, as documented.
- The sample fixture changes attendance to a plausible validation-safe value in a temp copy only; it is not a factual data correction.

## Prior Review Disposition

No prior Phase 15 review.
