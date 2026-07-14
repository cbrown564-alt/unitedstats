# Post-launch product implementation plan

**Status:** Phases 1–9 implemented and verified in production; representative-fan validation pending
**Approved:** 14 July 2026  
**Owner:** Product implementation  
**Review evidence:** [`reviews/red-thread-product-review-2026-07-14.html`](reviews/red-thread-product-review-2026-07-14.html)

This is the canonical execution plan for the post-launch product pass. It turns
the accepted review into a sequence of bounded changes. `PRODUCT.md` continues
to own the product promise, `DESIGN.md` owns durable interface rules, and
`STATUS.md` owns current state. This file owns only the order, scope, and exit
criteria for the work below.

## Outcome

Make one sequence work throughout Red Thread:

> broad invitation → served night → what it meant → evidence → next thread

The site already has the record, visual language, Stories, authored questions,
and evidence objects needed to do this. This pass connects and edits those
parts. It does not add another product layer.

## Settled decisions

### Keep the 20-second opening excerpt first

The homepage opens with the silent, autoplaying, one-pass Best/Ronaldo excerpt.
It broadens the frame before the site serves one match, uses the strongest
imagery and motion already available, and asks for no interaction. User feedback
found a match-first opening too narrow and initially confusing.

The order is therefore fixed:

1. 20-second opening thread;
2. served match-night;
3. record, search, and discovery routes.

This plan does **not** move the excerpt, add a play gate, restore the 90-second
embed, add sound, or make it loop. Reduced-motion behavior remains the static
poster. The served night must follow the excerpt without an unrelated section
between them.

### Make the night-to-thread transition the main implementation target

The largest remaining gap is between the emotional entry and the auditable
record. Important match pages need enough context to say what the night meant
before showing the timeline and teamsheet. Entity recommendations need to say
why a particular match belongs there.

### Remove the last user-facing loom

The custom comparison creator will leave the promoted product. Curated
comparisons remain. Existing valid comparison URLs get a compatibility period
so shared links do not break abruptly.

### Make Discover a doorway again

Promoted Questions and curated Comparisons remain. The generic Curated Cuts
strip leaves `/explore`. A cut may return only after it has been rewritten as an
authored question or comparison that passes the lens test below. The cut query
and machine-answer infrastructure may remain as foundation capability while it
has consumers.

### Unify night behavior, not necessarily night URLs

The homepage, `/surprise`, `/on-this-day`, match pages, and entity rails may keep
distinct URLs and search roles. They must share selection rules, presentation
rules, and honest fallbacks where the subject is a match-night.

### Demote secondary record tools; do not delete the foundation

Analytics, Transfers, Data, corrections, exports, and the API remain available.
They should not receive the same first-level navigation weight as Stories,
Discover, Matches, Seasons, and Players.

### Do not grow content to fill a shelf

There is no quota for new Stories or Questions. A new authored lens may ship
only when it passes the publication gate. Eight to ten excellent lenses is a
possible long-term ceiling, not a delivery target.

## Product and evidence guardrails

- Every historical claim must resolve from canonical data or an explicit
  authored record. Never fill missing context by inference.
- Match context must add stakes or consequence; it must not restate the visible
  score, round, scorers, or date without adding meaning.
- Generated context must stay plain and bounded. No verdict-heavy season prose,
  unsupported “iconic” labels, or false certainty.
- Important aggregates must continue to link toward the matches behind them.
- Coverage notes remain at interpretation points. Demoting `/data` in navigation
  does not weaken provenance or correction access.
- The 20-second homepage excerpt, five current Stories, dark visual register,
  result palette, match flow, teamsheet, and record surfaces are protected work.
- No new top-level route is part of this plan.
- A phase may simplify or delete code made obsolete by its change. It must not
  introduce speculative shared infrastructure for later phases.

## Lens publication gate

A Question, Comparison, or promoted cut must answer yes to all of these:

1. Does the frame guarantee a meaningful read for every choice it permits?
2. Does it use role- and era-appropriate measures?
3. Does it expose material coverage limits where they affect the answer?
4. Can the user inspect the underlying matches or source record?
5. Is the question fan-sayable and specific?
6. Does it add something that an existing Story, Question, or record page does
   not already say?
7. Can its main claim be described in one sentence without hype?

One failed answer blocks promotion. The work may remain as an internal query,
API answer, or archive tool.

## How the work will run

- Complete one phase at a time.
- Use the narrow checks while iterating and the phase gate before moving on.
- Any UI phase requires desktop and phone screenshots from the real route.
- The representative viewport is 1280×900 for desktop and 390×844 for phone.
- Exercise reduced motion wherever the opening excerpt, Stories, charts, or
  transition behavior is present.
- Do not mark a phase validated from implementation and screenshots alone.
  “Validated” requires representative fan feedback or observed use.
- If a phase changes a durable product or design rule, update its owner document
  in the same change.

## Execution record — 14 July 2026

The repository-controlled work is implemented. The words below follow the
project completion vocabulary: screenshots and automated checks are verification,
not fan validation.

| Phase | State | Evidence and remaining gate |
| --- | --- | --- |
| 0 — Baseline | Verified locally | A clean preview-profile build produced 204 static pages and a 166.1 MB `.next` tree. Desktop and 390×844 screenshots cover `/`, the 1999 final, Rooney, Explore, Compare, and 14 July. The five transitions remain observable by route/manual session, so no speculative event framework was added. |
| 1 — 1999 loop | Implemented and verified | The approved sentence is rendered in server HTML between the score and evidence, with one link to `/questions/treble`; tests pin copy, order, and destination. The representative-fan checkpoint remains open. |
| 2 — Match context | Implemented and verified | All 21 curated nights have reviewed authored context. Deterministic computed rules cover finals, semi-finals, penalty outcomes, recorded half-time comebacks, and decisive stoppage-time goals; an ordinary match renders no context block. |
| 3 — Rediscovery | Implemented and verified | Visible rails lead with a defensible reason. Player rails require an appearance or recorded contribution, and the generic fallback is suppressed. |
| 4 — Calendar and Surprise | Implemented and verified | All 366 dates resolve to an exact match, exact transfer, or explicitly nearby reviewed anniversary. A separate debut fallback is not reachable in the current contract because every canonical debut date already resolves at the higher-priority official-match step; no synthetic fixture was added to satisfy the example. Surprise now serves match nights only. |
| 5 — Discover and Compare | Implemented and verified | Explore contains Questions and curated Comparisons only. The unrestricted creator is gone, while valid incoming arbitrary comparison URLs remain readable and unlisted for the compatibility release. Saved cut receipts are `noindex` and absent from the sitemap and user-facing suggestions. |
| 6 — Navigation | Implemented and verified | Stories, Discover, Matches, Seasons, and Players are primary. Managers, Analytics, Transfers, and Data sit under More on desktop and mobile. Footer utilities preserve Data, API, corrections, and feedback access. |
| 7 — Player mobile | Implemented and verified | The identity-band direction was selected after a two-direction Rooney study. Appearance endpoints moved into the Career tab on phones; Rooney, no-portrait, one-season, 15+ season, 390×844, 430×932, and tablet cases were inspected. |
| 8 — Quality cleanup | Implemented and verified | Essential faint text now clears 4.5:1 on pitch and panel, affected phone actions meet 44 px, the unused cut hero was deleted, and no prefetch override was added without production evidence. The clean preview recheck is 166.3 MB. The clean full build is 3,026.0 MB against the evidence-backed 3,250 MB full-profile limit; maximum HTML/RSC/JS remain 147.1/88.4/101.7 KB. |
| 9 — Release and learn | Released and verified; validation open | Preview `dpl_C3Hxt4xVLzBSkwTi8UQCoxvV9Cbe` passed the representative server loop. Production `dpl_H2iWS1ZW3bku1JZSxSUH6dduPhRx` completed the full 7,829-page build and is live at `https://utdred.com`. Production HTTP, database health, phone overflow, nav focus/Escape/disclosure, and reduced-motion checks pass. Unprompted representative-fan feedback remains required before calling the sequence validated. |

### Cut publication audit

| Cut | Lens-gate result | Disposition |
| --- | --- | --- |
| `opponents-by-win-rate` | Fails role/era interpretation as a cold universal ranking. | Retain for API, machine-answer, and saved-receipt consumers; do not promote. |
| `managers-by-points` | Raw points compare unequal tenures and contexts. | Retain for API, machine-answer, and saved-receipt consumers; do not promote. |
| `seasons-by-points` | League formats and season lengths make the unrestricted frame misleading. | Retain for API, machine-answer, and saved-receipt consumers; do not promote. |

---

## Phase 0 — Lock the baseline and instrumentation

**Goal:** Make later comparisons honest without turning analytics into a new
product project.

### Work

- Record the current production behavior for:
  - homepage excerpt → served night;
  - homepage → match;
  - match → Question or Story;
  - entity → recommended match;
  - Discover → Question or Comparison.
- Confirm what existing Vercel page analytics can show without adding custom
  tracking.
- If path-level analytics cannot answer a phase question, define one small
  event rather than a general event framework.
- Capture current desktop and phone screenshots for the representative routes:
  `/`, the 1999 final, Rooney, `/explore`, `/compare`, and 14 July.
- Run a clean performance baseline before accepting the earlier `.next` output
  warning as a current build defect. Record whether the build was preview or
  full.

### Likely files

- `components/WebVitals.tsx` only if a missing observation cannot be recovered
  from existing analytics;
- `docs/PERF.md` only if the measurement method changes;
- this plan for the recorded baseline.

### Checks

- Production route screenshots at 1280×900 and 390×844.
- No new analytics event without a named decision it will inform.
- Clean preview build first; full build only when the environment and time allow.

### Exit gate

- The baseline records the build profile and date.
- Each product transition above is observable or has an explicit manual test.
- No code is added merely to collect “interesting” data.

---

## Phase 1 — Prove the complete loop on the 1999 final

**Goal:** Build one representative slice from entry to next thread before
generalizing match context.

### Experience

Keep the current homepage opening. When the served night or another link lands
on `1999-05-26-bayern-munich-n`, the match page must establish the stakes before
the goal flow and teamsheet:

> Bayern led from the sixth minute. Two stoppage-time goals completed the Treble.

The exact final copy must pass `docs/COPY-RUBRIC.md`. It should link to one
canonical deepening route, defaulting to `/questions/treble` unless the
implementation review finds a clearer single owner. Do not present both the
Question and Story as equal calls to action in the same block.

### Work

- Add one small match-context object for the 1999 final using existing canonical
  match facts and the curated stakes line.
- Render it between the score hero and the primary match evidence.
- Keep the block to stakes, consequence, and one next-thread link.
- Verify that MatchFlow and FormationPitch remain the evidence objects; do not
  duplicate their event details in another timeline.
- Verify the return path from the deepening route to the relevant matches.
- Add structured tests for the context and route link.

### Likely files

- `lib/curatedNights.ts` or a small adjacent `lib/matchContext.ts`;
- `app/match/[id]/page.tsx`;
- one focused component only if the markup cannot stay local to the match page;
- `tests/great-nights.test.ts`, `tests/journey.test.ts`, or a new focused
  `tests/match-context.test.ts`.

### Checks

- The 1999 final at 1280×900 and 390×844.
- Keyboard and screen-reader order: score → context → tabs/evidence.
- Reduced motion does not hide context.
- The context is present in server HTML.
- Narrow tests, `npm run lint`, and `npm run knip`.

### Exit gate

- A reader can say what was at stake without knowing the match already.
- The page still reads as one match object, not a mini Story stacked over a
  receipt.
- The context claim is pinned by a test and links to one deeper authored route.
- One representative United fan can follow the loop without explanation. This
  is the first validation checkpoint.

---

## Phase 2 — Extend match context without manufacturing importance

**Goal:** Turn the proven 1999 treatment into a bounded system for the matches
that can honestly support it.

### Context levels

1. **Authored context** — the curated-night pool and a small explicit registry
   of major matches. Stakes and related route are reviewed by hand.
2. **Computed context** — only when canonical fields establish a clear fact:
   final or semi-final, comeback from recorded half-time score, stoppage-time
   winner, penalty outcome, debut/final appearance, or other tested rule.
3. **Plain receipt** — no context block when the record does not support a
   meaningful sentence. An ordinary match is allowed to be an ordinary match.

### Work

- Define a server-safe `MatchContext` data shape containing:
  - context level;
  - one stakes/consequence sentence;
  - the facts used to produce it;
  - optional related label and URL;
  - optional coverage note when the fact depends on partial event data.
- Move the 1999 slice onto this shape.
- Add authored context for the existing curated-night pool only after every
  sentence receives copy review.
- Add computed rules one at a time with golden tests and known counterexamples.
- Suppress the block when no rule clears the bar.
- Keep context resolution server-side and deterministic.

### Likely files

- `lib/curatedNights.ts`;
- `lib/matchContext.ts`;
- `lib/trails.ts` where an existing tested fact already belongs;
- `app/match/[id]/page.tsx`;
- `tests/match-context.test.ts` and existing golden fixtures.

### Checks

- Golden cases: 1968 European final, 1999 European final, 2008 European final,
  one comeback, one defeat, and one ordinary league match.
- Counterexamples where scorer minutes or half-time data are absent.
- `npm test`, `npm run copy:lint`, `npm run lint`, `npm run knip`.
- Screenshots for one authored, one computed, and one plain receipt on desktop
  and phone.

### Exit gate

- Every curated night resolves to reviewed context.
- Computed context never depends on an unavailable field.
- A plain match renders without an empty heading, placeholder, or apology.
- Match-page HTML and RSC sizes remain within the existing budgets.

---

## Phase 3 — Make every rediscovery recommendation explain itself

**Goal:** Replace generic “Remember this?” links with a visible, defensible
reason for the recommendation.

The current scoring engine already records reasons such as a final, comeback,
stoppage-time winner, or heavy scoreline. `RediscoveryRail` does not currently
show that reason. Start by using the information already present before adding
new scoring machinery.

### Work

- Add a dedicated reason field to the client-safe rediscovery prompt instead of
  requiring UI code to parse `line`.
- Rewrite the rail as reason → score/opponent/date, for example:
  - “His first European final — United 4–1 Benfica, 1968.”
  - “Two stoppage-time goals — United 2–1 Bayern, 1999.”
- For player rails, add player-specific reasons only when lineup or event data
  proves the connection: debut, final appearance, goal, assist, hat-trick, or
  other explicit event.
- For season and opponent rails, use existing trail facts before adding new
  queries.
- Hide the rail when its best available reason is the generic fallback “a
  charged night.”
- Preserve the `sinceYear` behavior and the current deterministic selection.

### Likely files

- `lib/rediscovery.ts`;
- `lib/rediscovery-prompt.ts`;
- `components/RediscoveryRail.tsx`;
- `components/EntityRediscoveryRail.tsx`;
- `lib/trails.ts` for already-owned standout reasons;
- `tests/rediscovery.test.ts`.

### Checks

- Rooney, 1998–99, and Bayern entity rails.
- At least one entity with sparse event coverage.
- Server fallback and hydrated API result show the same reason.
- No reason overclaims scorer, assist, or lineup coverage.
- Phone screenshot confirms the rail remains a compact sentence, not a card.

### Exit gate

- Every visible recommendation answers “why this match?” before the click.
- Generic fallback reasons never reach the interface.
- Sparse entities degrade by omitting the rail, not by inventing significance.

---

## Phase 4 — Make calendar and surprise entry points reliable

**Goal:** Keep their distinct URLs while giving every entry point one honest
night/moment selection contract and no empty calendar page.

### Calendar fallback order

For an exact date:

1. official matches on that month/day;
2. an exact-date transfer or debut already present in canonical data, selected
   by a documented deterministic rule;
3. a nearby curated anniversary, explicitly labelled as nearby rather than “on
   this day.”

Do not add births, external anniversaries, or unsourced events without a
canonical source and owner document.

### Work

- Define a small `CalendarMoment` union for match, transfer, debut, and nearby
  match. Each variant carries its own evidence URL and label.
- Extend `onThisDay()` without weakening its current exact-match rhythm data.
- Add a deterministic transfer/debut chooser using existing career and transfer
  records. Document the tie-break.
- Add the nearby fallback only after exact-date canonical moments are exhausted.
- Render fallback wording that makes the date relationship explicit.
- Share the match-night presentation rules with `/surprise` and the homepage
  where the selected object is a match; do not force transfers into a match UI.
- Remove generic cuts from the user-facing Surprise pool so the route becomes a
  reliable rediscovery path rather than a mixed content randomizer.

### Likely files

- `lib/onThisDay.ts`;
- `app/on-this-day/[monthDay]/page.tsx`;
- `lib/surprise.ts` and `app/surprise/page.tsx`;
- `lib/greatNights.ts` only where selection contracts overlap;
- `tests/on-this-day.test.ts`, `tests/great-nights.test.ts`, and new fallback
  fixtures.

### Checks

- 26 May, 29 May, 14 July, 29 February, and a date with several matches.
- One transfer fallback, one debut fallback, and one nearby fallback.
- Every fallback links to canonical evidence.
- Sitemap and SEO copy still describe the page honestly.
- No date returns a blank card.

### Exit gate

- All 366 valid month/day routes return a meaningful, traceable object.
- The page never labels a nearby moment as occurring on the requested date.
- Homepage, Surprise, and On This Day use the same match presentation rules
  without becoming one oversized shared component.

---

## Phase 5 — Remove the loom and reduce Discover

**Goal:** Make `/explore` a small doorway to authored depth.

### Work

- Remove the custom player/manager picker from the promoted `/compare` screen.
- Keep the curated debate registry and role-correct comparison views.
- Preserve valid incoming arbitrary comparison URLs as unlisted receipts for
  one release. Do not expose creation controls or link to them.
- After the compatibility release, use available request evidence to choose
  between continued unlisted support and redirecting non-curated pairs to the
  Compare index.
- Remove the Curated Cuts strip from `/explore`.
- Audit every `CURATED_CUTS` entry with the lens publication gate:
  - promote as an authored Question/Comparison;
  - demote to match filters, API, or machine answers;
  - remove if it has no remaining consumer.
- Remove cut outcomes from user-facing related/surprise suggestions.
- Keep `/explore` to Questions and curated Comparisons, each previewing and
  routing into canonical depth rather than reproducing it.
- Do not add replacement content merely to balance the page.

### Likely files

- `app/compare/page.tsx`;
- `lib/compare.ts`;
- `app/explore/page.tsx`;
- `lib/cut.ts`, `lib/related.ts`, `lib/surprise.ts`;
- `components/explore/CutHero.tsx` and `components/cut/CutChart.tsx` only if
  `knip` shows they have become unused;
- `lib/machineAnswers.ts` and dataset documentation if machine consumers change;
- focused render tests plus `tests/question-cards.test.ts`.

### Checks

- Curated player and manager debates still work.
- Existing arbitrary comparison URL compatibility is tested.
- `/explore` contains no generic cut strip or empty replacement region.
- `npm run knip` identifies any source made unused by the removal.
- `npm run copy:lint`, `npm test`, `npm run lint`.
- Desktop and phone screenshots for Explore and Compare.

### Exit gate

- A user cannot create an unrestricted comparison from the interface.
- Every promoted Discover item passes the lens gate.
- Machine/API cuts remain only where a named foundation consumer still needs
  them.
- Explore is shorter and has fewer equal choices than before.

---

## Phase 6 — Reduce primary navigation weight

**Goal:** Make the product hierarchy visible without removing expert access.

### Default hierarchy

Always visible:

1. Stories
2. Discover
3. Matches
4. Seasons
5. Players

Secondary disclosure:

- Managers
- Analytics
- Transfers
- Data

Search remains persistent. Data, corrections, feedback, API, and exports remain
available from utility/footer paths. No new “People” or “Record” landing route is
needed.

### Work

- Update the desktop sidebar to show the five primary destinations and one
  collapsed secondary group.
- Use the same hierarchy and words in the mobile navigation sheet.
- Preserve active-route indication when the current page lives inside the
  secondary group.
- Preserve direct URLs, sitemap entries, SEO, breadcrumbs, and search results.
- Review footer routes so Data, corrections, feedback, and machine access remain
  easy to locate.
- Before changing `<Link>` prefetch behavior, read the repository's installed
  Next.js linking and prefetching guides under `node_modules/next/dist/docs/`.

### Likely files

- `lib/navSections.ts`;
- `components/SidebarNav.tsx`;
- `components/mobile/MobileNavSheet.tsx`;
- `components/mobile/MobileBottomNav.tsx` only if labels or active state require
  it;
- `components/SiteShell.tsx` for utility/footer links.

### Checks

- Every current route has a correct navigation label and active state.
- Collapsed-sidebar tooltips still identify all visible icons.
- Mobile menu, keyboard traversal, focus return, and Escape behavior.
- Search can reach every demoted route.
- Desktop and phone screenshots on one primary and one secondary route.

### Exit gate

- No more than five destinations are visible before secondary disclosure.
- Demoted pages remain reachable in two actions or by search.
- The change does not create a new index route or duplicate navigation model.

---

## Phase 7 — Establish the mobile detail-page composition

**Goal:** Let identity, one headline answer, and the next action fit together on
a phone without flattening the desktop page.

The exact composition is not settled. Start with a small visual exploration on
the real Rooney page rather than editing every entity page at once.

### Explore two directions

- **Compact monument:** smaller portrait, name and career line beside/below it,
  one dominant goals figure, secondary measures condensed into a two-row band.
- **Identity band:** shallow image crop beside the name and main figure, with
  the career arc moved into the active Career tab.

Both must preserve attribution, correction access, and the honest stat lanes.
Choose one after screenshots at 390×844 and direct interaction, then implement
Rooney as the representative slice.

### Work after direction choice

- Keep one dominant player figure in the first viewport.
- Defer secondary measures that do not orient the first action.
- Ensure the Career/Goals/Transfers tabs and floating navigation pill do not
  compete for the same visual position.
- Keep portrait attribution readable and attached to the image.
- Test a player without a portrait, a short career, a long career, and sparse
  assist coverage.
- Extract a reusable entity pattern only after the Rooney slice works; do not
  force manager, opponent, and season pages into `PlayerPlate` markup.

### Likely files

- `components/PlayerPlate.tsx`;
- `app/player/[id]/page.tsx`;
- `components/mobile/DetailSectionTabs.tsx`;
- the narrow-shell sections of `app/globals.css`;
- page-specific tests where behavior, not layout, changes.

### Checks

- 390×844, 430×932, and tablet/narrow desktop.
- Rooney, a no-portrait player, a one-season player, and a 15+ season player.
- 44px tap targets, visible focus, correct source order, 200% text zoom.
- No horizontal scrolling or essential label under the floating pill.
- Reduced-motion behavior remains correct.

### Exit gate

- Player identity, headline stat, and primary tab/action are understandable in
  one phone viewport.
- Secondary data remains reachable without a new catch-all “More” tab.
- The chosen pattern works on the four representative data shapes.
- Only then may the pattern be considered for other entity pages.

---

## Phase 8 — Performance, accessibility, and source cleanup

**Goal:** Remove amplification exposed by the product cuts and restore every
documented quality budget.

### Work

- Re-run the clean build baseline after Phases 1–7.
- Investigate the `.next` output budget only if a clean full build still exceeds
  2 GB. Separate current output from stale dev/build artifacts before changing
  architecture.
- Audit automatic prefetch on dense link surfaces such as Explore, player
  archives, and long registers. Disable or defer it only where production
  evidence shows unnecessary work.
- Measure route JS/HTML/RSC after removing the custom picker and Discover cuts.
- Raise `--color-ink-faint` or narrow its permitted use so 10–12px essential
  captions meet 4.5:1 contrast on pitch and panel.
- Recheck focus, reduced motion, chart labels, and mobile tap targets on the
  changed routes.
- Delete components and helpers made unused by the cuts. Do not split large
  files solely because of line count; split when ownership or bundle evidence
  supports it.
- Fix any affected performance or architecture documentation in the owner file.

### Likely files

- `app/globals.css`;
- dense link components identified by measurement;
- `next.config.ts` only with a documented Next.js 16 reason;
- `docs/PERF.md`, `docs/ARCHITECTURE.md` if durable behavior changes;
- unused source reported by `knip`.

### Checks

- Read the installed Next.js 16 guide relevant to any caching, navigation,
  prefetch, or render-mode change before editing code.
- `npm test`
- `npm run copy:lint`
- `npm run lint`
- `npm run knip`
- `npm run validate`
- `UNITEDSTATS_BUILD_PROFILE=preview npm run build` during iteration
- applicable `npm run check:static` and `npm run check:perf`
- full production-profile build before a broad completion claim.

### Exit gate

- The clean build passes the documented budgets or the owner document records a
  deliberate, evidence-backed new budget.
- Essential small text meets WCAG AA contrast.
- No unused product code remains from the removed UI.
- Changed routes pass desktop, phone, keyboard, and reduced-motion checks.

---

## Phase 9 — Release and learn

**Goal:** Promote the connected product deliberately and use real feedback to
decide whether another lens or entity rollout is justified.

### Work

- Deploy the completed phases to a preview and exercise the full representative
  loop.
- Run the repository's full applicable checks.
- Release in small groups when practical:
  1. match context;
  2. explained rediscovery and calendar fallback;
  3. Discover/Compare and navigation cuts;
  4. mobile and performance hardening.
- Observe whether visitors continue from the excerpt to the served night, from
  the match to authored depth, and from entity pages to explained nights.
- Ask a small number of representative fans to use the loop without prompting.
- Record implementation state in `STATUS.md`; record durable design changes in
  `DESIGN.md`; keep this file focused on remaining work.

### Exit gate

- The complete loop is implemented and verified in production.
- Representative fan feedback supports the intended sequence before calling it
  validated.
- Remaining work is either a named defect, a measured optimization, or a new
  proposal that must independently earn scope.

## Cross-phase verification matrix

| Concern | Representative cases | Required evidence |
| --- | --- | --- |
| Opening | Homepage desktop, phone, reduced motion | 20-second excerpt stays first; one pass; muted; served night follows |
| Match meaning | 1999 final, 1968 final, ordinary league match | Context adds stakes; plain receipt remains honest |
| Rediscovery | Rooney, season, opponent, sparse player | Visible reason; no generic fallback |
| Calendar | 26 May, 14 July, 29 February | Exact or explicitly labelled fallback; evidence link |
| Discover | Questions, player debate, manager debate | No custom creator; no generic cut strip |
| Navigation | Primary and secondary routes | Five visible destinations; search and direct access preserved |
| Mobile | Portrait/no portrait, short/long career | Identity + headline + action fit; pill does not obscure content |
| Trust | Partial scorer/assist coverage | Caveat remains at interpretation point |
| Performance | Home, Explore, player, match | Existing route and build budgets pass |
| Accessibility | Keyboard, 200% zoom, reduced motion, contrast | No hidden content, lost focus, overflow, or essential low-contrast text |

## Decision ledger

| Question | Decision | Evidence | Consequence | Owner |
| --- | --- | --- | --- | --- |
| What opens the homepage? | Keep the silent 20-second Best/Ronaldo excerpt before the served night. | Current production plus user feedback that match-first narrowed the product too quickly. | No homepage reorder in this plan. | `PRODUCT.md`, `docs/HOMEPAGE.md` |
| What is the first implementation slice? | The 1999 final from stakes through evidence and next thread. | It is the hardest, clearest test of the product promise. | Prove before spreading. | This plan |
| Does the custom comparison stay? | Remove the creation UI; preserve incoming valid URLs temporarily. | It is a loom and conflicts with `PRODUCT.md`. | Curated debates own promoted comparison. | `PRODUCT.md`, `STATUS.md` |
| Does Discover keep three equal strips? | No. Questions and Comparisons remain; cuts must be promoted, demoted, or removed. | The third strip makes the doorway a catalogue and promotes cold rankings. | `/explore` becomes shorter. | `PRODUCT.md`, `STATUS.md` |
| Must night routes merge? | Share selection and presentation behavior; keep useful URLs. | Calendar, surprise, and search roles differ. | Avoid destructive route consolidation. | `docs/ARCHITECTURE.md` |
| Do record tools get deleted? | No; demote them in navigation. | They are high-quality foundation and expert access. | Search, footer, and secondary disclosure preserve reach. | `DESIGN.md`, `docs/ARCHITECTURE.md` |
| How many new lenses ship? | No quota; each must pass the gate. | Quality and authored meaning matter more than shelf size. | Current four may remain the full promoted set until a candidate earns a place. | `PRODUCT.md` |
| Is the build-size warning confirmed? | Not until reproduced by a clean, named build profile. | The review measured an existing `.next` tree. | Baseline before architecture work. | `docs/PERF.md` |

## Next step

The implementation and release work is complete. The remaining **Phase 9** gate
is unprompted feedback from representative fans using the production loop. That
evidence decides whether the pass is validated; it is not a reason to add
another lens or spread the player composition to other entity types now.
