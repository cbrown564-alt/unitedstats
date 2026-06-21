# Copy Voice

The finalization spec for tone of voice and copy across UnitedStats. This expands the
**Copy Voice** section of `DESIGN.md` into a per-surface register map with rules and worked
examples. DESIGN.md owns the one-paragraph principle; this document is what a copy pass is
written *against*.

It was written in the copy-finalization phase (mid-2026) after a scan of the comparable
landscape — Manchester United fan blogs (Republik of Mancunia, The Busby Babe, Stretty
News), polished sports journalism (The Athletic), the archival-curiosity register (the
Guardian's *The Knowledge*), data storytelling (Opta / OptaJoe), and clinical reference
(FBref, Opta event definitions).

## The decision

Three things were settled before this spec was written, and they are not re-litigated here:

1. **Voice dial: Floodlit Guide.** Refine the existing trajectory rather than pivot. The
   thesis ("a floodlit match-night ledger") already promises romance; the job is to make
   every surface live up to the best sentences already in the product, not to invent a new
   voice or to cool the product down into a pure reference tool.
2. **Wit is quarantined.** Personality, dry humour, and any point of view appear *only* on
   questions/myths and on authored hero intros. They never touch a scoreline, a record, a
   win-rate, or a coverage note. Our credibility is that the numbers are not spun; the copy
   must never put that in doubt.
3. **Spec first.** This document, then the rewrite pass against it.

## House style in one line

> Precise about the record, romantic only about its reach, and silent where a number speaks
> for itself.

The single best sentence already shipped is the model for the whole product:

> "…many historical fees were never disclosed, so the money is a floor and the early years
> sit flat on the line."

It states a hard data limitation *and* paints it, in one breath, without a single adjective
of hype. That is the target register. Everything below is in service of making more
sentences read like that one — and of getting *out of the way* everywhere that one isn't
warranted.

## The core idea: one voice is wrong; assign a register per surface

The failure mode of every comparable site is a single voice used everywhere — the fan blogs
editorialize the *result*; the reference sites are dry even where a human is *wondering*. The
register a sentence should use depends on what the reader is doing at that moment:

| Surface | Register | The reader is… | Rule of thumb |
|---|---|---|---|
| **Authored heroes** (home, section indexes, transfers, analytics landings) | **Floodlit Guide** | arriving, being shown the whole subject | One true, evocative line that depicts the whole. Earned, never decorative. |
| **Questions / myths** (`/questions`, "Test a myth") | **Knowing Companion** | curious, following a trail | Dry wit allowed. A point of view about the *question* — never the *answer*. |
| **Records** (`RecordCards`, `Leaderboard`, all-time peaks) | **Opta framing** | wanting the *ooh* | Scope, reach, and comparison do the work. No adjectives. |
| **Result reporting** (scorelines, W-D-L, match rows, tables) | **Instrument** | scanning facts | Neutral. The objects carry the meaning; copy labels, never colours. |
| **Coverage notes / slices / labels / hints** (`CoverageNote`, nav hints, eyebrows) | **Archivist** | about to trust or interpret | Clinical, exact, zero romance, zero filler. Absence of voice *is* the trust signal. |

The same page moves between registers as the reader moves down it: the transfers hero is
Floodlit Guide ("A century and a half of business, in and out"), its coverage note is
Archivist ("Slice: every recorded arrival and departure…"). That is correct and intended.

## The registers

### 1. Floodlit Guide — authored heroes

One evocative line, true to the data, depicting the whole subject. Romance comes from
**historical reach and place**, not from intensifiers. This is the only surface allowed to be
beautiful, and it gets exactly one swing per hero — the body beneath it returns to the
answer-object vocabulary.

- **Do:** reach for span and place — "From Newton Heath to today", "Mangnall to now",
  "A century and a half of business, in and out".
- **Do:** let the hero line carry the atmosphere a metric grid couldn't (this is the copy
  half of the front-door-hero rule in DESIGN.md).
- **Don't:** use "ultimate", "definitive", "complete guide", "everything you need".
- **Don't:** write a second romantic sentence in the same hero. The subtitle is functional:
  scope and an invitation, not more poetry.

> **Hero title** (romantic): "Every match Manchester United ever played"
> **Hero subtitle** (functional): "6,012 matches across 140 years of league, cup, and
> European football — start with a question, a name, or a season."

### 2. Knowing Companion — questions and myths

The one surface with a personality. It is built on the *Knowledge* premise: someone wondered,
so we checked. It may be wry, may have a point of view about whether a question is *worth*
asking — but the moment it reaches the answer, it hands off to the evidence and goes quiet.

- **Do:** pose the question the way a fan would actually phrase it — "Do United really score
  late?", "How much of a fortress is Old Trafford?", "Who saved their goals for cup nights?"
- **Do:** allow dry, true wit in the *framing* ("the era best left folded into a summary").
- **Don't:** answer with a verdict adjective. "of timed United goals come after the 85th
  minute, roughly double an even spread" is right; "an *astonishing* surge" is not.
- **Don't:** let the wit imply a result is good or bad. We frame the *curiosity*, the data
  settles the *claim*.

### 3. Opta framing — records

A bare record lands through *reach and comparison*, not enthusiasm. Give a figure its scope
and a thing to be measured against, and the reader supplies the "ooh" themselves.

- **Do:** anchor in span and rank — "Longest unbeaten run · wins and draws, official
  matches", "All-time peaks across official competitions".
- **Do:** name the scope precisely so the record is unimpeachable ("official competitions",
  "20+ meetings").
- **Don't:** editorialize the record ("a *staggering* 45 matches"). The number and its scope
  are the entire payload.

### 4. Instrument — result reporting

Scorelines, results, W-D-L, match rows, sortable tables. Copy here is a *label*, not a
sentence. The visual objects (`MatchFlow`, the skyline, `WdlBar`) already encode the meaning;
prose must not re-describe or colour what the object shows.

- **Do:** use the football shorthand the audience scans by — W-D-L, H/A/N, FT, AET.
- **Don't:** narrate a result. No "a hard-fought win", no "a disappointing draw".
- **Don't:** restate a heading or a visible figure in body copy (the "one element per fact"
  rule, applied to words).

### 5. Archivist — coverage, slices, labels, hints

The clinical register, and the one with the most cleanup to do. This is where trust is built
and where the product currently drifts into flat filler. Coverage notes should read like
FBref definitions: exact, unadorned, complete. Nav hints and eyebrows are *information*, not
taglines.

- **Do:** state the slice and the floor plainly — "known-fee transfers, attributed to the
  manager in charge on the transfer date."
- **Do:** make every hint *say something specific*. "1886–87 to today" is good; "Elo, eras,
  records" is a list pretending to be a hint — rewrite to what the reader will *find*.
- **Don't:** add romance, wit, or reassurance to a coverage note. "Result data is complete;
  lineup coverage is still growing" is the whole job.
- **Don't:** let a complete facet author a coverage line at all (the `CoverageNote` graded
  contract: silence means complete, never forgotten).

## Universal rules (every register)

- **Coverage honesty over confidence.** Where data is partial, the claim is hedged and the
  slice is shown. "There is a signal here, but it changes by era" beats any verdict.
- **No hype lexicon, anywhere:** ultimate, definitive, insane, unbelievable, staggering,
  astonishing, must-see, everything-you-need.
- **Never restate a heading or a visible number in the body.**
- **British English**, football vocabulary, the club's historical labels (Newton Heath, eras,
  grounds, competitions) used where they aid scanning.
- **Numbers are mono** (the `stat-num` / IBM Plex Mono convention) — a typographic rule, but
  it shapes copy: write so figures sit as discrete tokens, not spelled into prose.

## Open convention to resolve: the em dash

DESIGN.md lists em dashes under **Avoid** in product copy, but the live copy uses the spaced
em dash constantly and load-bearingly — "league, cup, and European football —", "Mangnall to
now", "start with a question, a name, or a season." The rule and the practice contradict each
other.

**Recommendation:** keep the dash — it is doing real work in the house style and removing it
would flatten the best sentences — but standardise it. Pick one of:

- **(a) Spaced en dash** ` – ` (currently mixed with em dashes), or
- **(b) Spaced em dash** ` — ` (the more common form in the live copy).

Then reclassify the DESIGN.md line from "avoid em dashes" to "use the chosen dash, spaced,
sparingly; never the unspaced em dash mid-word." This needs a one-time decision and a
find-and-replace pass; it is flagged here rather than silently chosen.

## Worked rewrites (the cleanup, made concrete)

These are real strings from the product, showing where each register is already right and
where the drift is. The pattern is consistent: heroes are strong, the *small* copy is flat.

| Where | Now | Register | Verdict / direction |
|---|---|---|---|
| Home hero title | "Every match Manchester United ever played" | Floodlit Guide | Keep. Model line. |
| Transfers hero | "A century and a half of business, in and out" | Floodlit Guide | Keep. Model line. |
| Transfers coverage | "…the money is a floor and the early years sit flat on the line." | Archivist | Keep. The single best sentence in the product. |
| Featured myth | "Do United really score late?" | Knowing Companion | Keep. Exactly the fan-phrasing target. |
| Nav hint (Analytics) | "Elo, eras, records" | Archivist | **Fix.** A list, not a hint. → what the reader will *find* there. |
| Nav hint (Matches) | "filter 6,000+ fixtures" | Archivist | **Soft fix.** "filter" is an instruction, not a draw; lead with the record's span. |
| Records footnote | "All-time peaks across official competitions, each card opening the match or run that holds it." | Opta framing | Keep. Scope + reach, no adjectives — correct. |

The audit's headline finding: **there is no voice problem in the heroes; there is a
consistency problem in the small copy.** The rewrite pass is mostly Archivist-surface
cleanup — turning instruction-shaped and list-shaped micro-copy into specific, record-anchored
lines — plus one decision on the dash. The romantic surfaces are already there.

## How the pass runs

1. **Resolve the dash convention** (one decision above), then sweep it.
2. **Inventory the Archivist surfaces** — nav hints, eyebrows, `StatTile` labels, `SectionHead`
   asides, empty states — and rewrite the flat ones to specific, record-anchored lines.
3. **Confirm the quarantine** — grep result-reporting and coverage copy for any stray
   adjective or wit; it belongs only on heroes and questions.
4. **Leave the heroes and the best coverage sentences alone.** They are the standard, not the
   work.
