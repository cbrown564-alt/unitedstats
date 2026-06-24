# Phase 13-16 follow-up notes

Date: 2026-06-23

This note captures the state after the generator/evaluator pass over ROADMAP
Phases 13-16, plus initial product feedback from the first human review. The
work is technically complete against the agreed acceptance criteria, but several
surfaces need taste and usability passes before they should be considered
polished product.

## What shipped

Phase 13 added the history-changed engine:

- deterministic digest generation in `lib/historyDigests.ts`;
- generated digest JSON artifacts in `data/history-digests/`;
- `/history-changed/[id]` pages and OG cards;
- update workflow hook after validation/DB build;
- detector tests and public digest docs.

Phase 14 added machine-readable source surfaces:

- JSON-LD on selected match and history-changed pages;
- `/llms.txt`;
- answer-shaped `/api/v1/answers/*` routes;
- crawl-policy alignment for read-only `/api/v1`.

Phase 15 added the correction workflow:

- static `/corrections` page and client correction builder;
- prefilled match, player, and event correction links;
- deterministic GitHub issue payload generation;
- temp-copy maintainer validation workflow;
- correction docs and threat model.

Phase 16 added habit/creator primitives:

- `/on-this-day/[monthDay]` for all 366 UTC month/day keys;
- `/collection?c=...` accountless saved Cut collections;
- `/embed/cut/[slug]` curated Cut embeds with explicit frame/cache headers.

All phases passed the Codex-builder / Claude Opus-evaluator process. Reviews
are in `docs/process/reviews/`.

## Human feedback

Initial human review identified three quality gaps:

1. The correction flow feels too form-like.
2. The correction form appears broken: clicking into an item to type does not
   focus or accept input.
3. The on-this-day public surface feels too thin.
4. The embedded Cut needs more design/product attention.
5. History changed is a good starting point, but still feels raw.

This feedback should be treated as product direction, not as a contradiction of
the acceptance reviews. The acceptance process proved determinism, static
behavior, ID/provenance shape, and basic rendering. It did not prove taste,
flow, or emotional product quality.

## Highest-priority follow-ups

### 1. Fix correction builder usability

Start here. A trust workflow that feels broken undermines the whole correction
product.

Files:

- `app/corrections/CorrectionBuilder.tsx`
- `app/corrections/page.tsx`
- `lib/corrections.ts`
- `tests/phase15-corrections.test.ts`

Questions to answer:

- Why do text inputs not accept focus/input in the current rendered app?
- Is the form trapped behind an overlay, hydration issue, readonly state, CSS
  issue, or browser/runtime error?
- Should the UI be reframed from a generic form into a guided correction
  workflow?

Suggested direction:

- Make the first screen a compact correction summary and field-level diff.
- Put source/evidence and proposed value in a clearer "make the claim" flow.
- Keep optional details secondary.
- Make the GitHub issue step feel like a transparent submission destination,
  not the primary mental model.

### 2. Productize on-this-day

The current surface is deterministic but too plain. It proves the data function,
not the habit loop.

Files:

- `lib/onThisDay.ts`
- `app/on-this-day/[monthDay]/page.tsx`
- `tests/phase16-habit-creator.test.ts`

Suggested direction:

- Add a lead fact with a stronger hierarchy.
- Show result rhythm for the date: W-D-L, biggest win, latest match, notable
  opponent repetition.
- Add previous/next day navigation.
- Consider a homepage/explore module once the page itself has a reason to visit.
- Decide whether facts should be earliest-first, latest-first, or editorially
  ranked by significance.

### 3. Improve embed design

The embed is currently a functional static card, not yet a creator-worthy object.

Files:

- `app/embed/cut/[slug]/page.tsx`
- `lib/embeds.ts`
- `next.config.ts`
- `tests/phase16-habit-creator.test.ts`

Suggested direction:

- Give the embed a fixed, documented aspect ratio.
- Add brand/source line, canonical link, and evidence link.
- Improve visual hierarchy around the headline metric.
- Test at realistic iframe dimensions.
- Consider a light/dark or compact/tall mode only if it can stay bounded.

### 4. Refine history-changed

The concept works, but the output still reads raw.

Files:

- `lib/historyDigests.ts`
- `app/history-changed/[id]/page.tsx`
- `docs/HISTORY-DIGESTS.md`
- `tests/history-digests.test.ts`
- `tests/history-digest-page.test.ts`

Suggested direction:

- Revisit claim ranking and grouping.
- Make the page explain "why this mattered" more clearly without overclaiming.
- Add sharper detector copy; current text can feel mechanical.
- Consider a single lead claim, then supporting changes.
- Add stronger links from match pages or Explore so the surface feels discovered,
  not orphaned.

## Product-readiness summary

Technically complete:

- Phase 13: yes
- Phase 14: yes
- Phase 15: yes, but correction builder has a usability defect
- Phase 16: yes, but public surfaces are minimal primitives

Taste-ready:

- History changed: ✅ done (2026-06-24, round two). Always-on result claim leads
  ordinary matches with the actual outcome; rank-change reduced to genuinely
  notable all-time standings; detector copy sharpened and era-correct; editorial
  weight reordered; latest ten regenerated; a Recently-changed strip now leads
  /explore and the homepage. See the ROADMAP Phase 13 follow-up note.
- Corrections: ✅ done — field-picker fixed (commit `d3f79dd`).
- On this day: ✅ done — lead fact, date rhythm, day nav, today door (`882b290`).
- Embeds: ✅ done — chrome-free creator card with brand/source (`3c52409`).

All four taste-pass surfaces are now product-quality. The remaining history-changed
caveat is structural, not taste: claim *text* is baked into the JSON artifacts, so
future wording changes still need a regeneration pass.
