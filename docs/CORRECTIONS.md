# Corrections

UnitedStats corrections are public suggestions until a maintainer verifies the
source and changes canonical JSON in a pull request. The site never writes
canonical data directly.

## Public workflow

1. A match, player, or event page opens `/corrections` with target fields
   prefilled.
2. The browser validates the payload, previews a field-level diff, and opens a
   prefilled GitHub issue.
3. Public status is the filtered issue queue:
   <https://github.com/cbrown564-alt/unitedstats/issues?q=is%3Aissue%20label%3Acorrection%20sort%3Aupdated-desc>.
4. A maintainer verifies the evidence, edits canonical JSON, runs validation,
   and submits a reviewed PR.

## Payload schema

Correction payloads are built by `lib/corrections.ts`.

| Field | Required | Meaning |
| --- | --- | --- |
| `target.kind` | yes | `match`, `player`, or `event`. |
| `target.id` | yes | Stable target key, such as match id or player id. |
| `target.label` | yes | Human-readable target label. |
| `fieldPath` | yes | Canonical field path, such as `matches[id=1999-05-26-bayern-munich-n].attendance`. |
| `currentValue` | yes | Current canonical value as displayed by the entry point. |
| `proposedValue` | yes | Suggested replacement value. |
| `pagePath` | yes | Site-relative page where the issue originated. |
| `citableId` | yes | Phase 0 citable ID for the page/evidence unit. |
| `sourceUrl` | one of source/archive | HTTP(S) source URL. |
| `archiveRef` | one of source/archive | Archive, book, programme, newspaper, or attachment reference. |
| `explanation` | yes | Why the field should change. |
| `attachmentNote` | no | Notes about screenshots, scans, or uploads to attach in GitHub. |
| `reporterContact` | no | Optional contact detail for follow-up. |

The generated issue title, issue body, labels, field diff, and correction request
ID are deterministic for the same payload. Issue URLs are capped at 6000
characters so over-large suggestions fail locally before GitHub opens.

## Maintainer workflow

For a match correction, edit the season file under
`data/canonical/matches/[season].json`. For a player correction, edit
`data/canonical/players.json`. Event corrections are changes to the relevant
match's `events[]` row.

The fixture workflow used by tests applies a sample correction to a temporary
canonical copy:

```bash
tmp=$(mktemp -d)
cp -R data/canonical "$tmp/canonical"
npx tsx scripts/apply-correction-fixture.ts tests/fixtures/corrections/sample-attendance.json --canonical "$tmp/canonical"
UNITEDSTATS_CANONICAL_DIR="$tmp/canonical" npm run validate
rm -rf "$tmp"
```

Before merging a real correction PR, run:

```bash
npm run validate
npm run build:db
```

## Threat model

- Correction requests are public GitHub issues.
- The browser builds an issue URL; there is no backend mutation endpoint.
- Canonical JSON is never changed automatically from a public suggestion.
- Maintainers verify cited evidence before editing data.
- Pull requests and CI validation remain the only path into the canonical
  record.
- Optional reporter contact is user-supplied text inside the public issue body,
  not account data stored by UnitedStats.
