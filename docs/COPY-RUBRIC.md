# Copy rubric

Operational checklist for the pre-launch voice rewrite. Source of brand voice:
`docs/BRANDING.md` § Voice. This file is the short form the Copy Studio shows
beside every string — not liturgy.

## Checklist (every string)

1. **Fan-sayable** — Would a United fan say this out loud, or only a brochure?
2. **Precise** — Concrete claim, date, or measure — not soft mush
   (“journey”, “legacy”, “tapestry”, “carried the season”).
3. **Evidence-honest** — No fake certainty (“proves”, “official”) when coverage
   is partial; say what the record shows.
4. **Curious guide** — Not pundit hot-take, not heritage brochure.
5. **One job** — Cut throat-clearing openers and parallel triplets that pad
   without adding a fact.
6. **Templates** — If generated: does every instance still sound human?

## Preferred vocabulary

Use: thread, evidence, answer, cut, record, coverage, source.

Use carefully: proof (only when evidence is strong), archive (not the lead
frame), stats (SEO/context, not brand centre).

Good anchors from branding: “Follow the evidence.” · “Every match behind the
answer.” · “United history, evidenced.”

## Smell list (linter + human flag)

Phrases and patterns that usually mean AI filler or off-voice. Not automatic
rejects — flags for a human look.

### Phrases

- carried the season / carried the night
- journey / legacy / tapestry / storied / iconic (as empty intensifier)
- delve / dive into / unpack / explore the rich
- in a world where / when it comes to
- it's worth noting / needless to say / at the end of the day
- stands as a testament / etched into / forever remembered
- the beautiful game (unless quoting)
- proves / official (club-affiliation or overclaim)

### Cadence

- Three parallel clauses with the same rhythm (“X, Y, and Z” as decoration)
- Opening with a generic “Every fan knows…” / “You grew up hearing…” when the
  next clause already carries the fact (trim the throat-clear if the fact is
  enough)
- Template sentences that only swap a percentage (“Home form carried…”)

### Product anti-patterns

- Generic “stats database” framing as the lead
- Hot-take punditry
- Over-romantic heritage copy that hides the data contract

## Tooling

- `npm run copy:extract` — refresh catalog + merge queue
- `npm run copy:persist` — write live Studio queue into `content/copy-queue.json`
- `npm run copy:lint` — smell check (Tier A new hits fail; `--update-baseline` accepts debt; `--strict` fails all Tier A; `--all` prints B/C)

## Status meanings (queue)

| Status | Meaning |
|--------|---------|
| `todo` | Not yet judged |
| `rewritten` | Edited in source; re-extract to sync catalog text |
| `keep` | Reviewed; leave as-is |
| `skip` | Out of scope for this pass (e.g. archived, chrome) |

## Review order

1. Home + site tagline
2. Explore deks + question card glosses
3. Question findings (one slug at a time)
4. Compare / cuts hooks
5. Tier B connective
6. `lib/narrative.ts` templates
7. Screenshot deck gate
