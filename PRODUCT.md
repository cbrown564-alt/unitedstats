# UnitedStats Product Context

## Product Definition

UnitedStats is a pattern-discovery product for Manchester United history.

It gives stats-heavy United fans a deep, trustworthy way to explore every recorded match from Newton Heath to today: results, competitions, managers, opponents, scorers, attendance, Elo movement, and coverage depth. The product should feel like a floodlit match-night ledger: atmospheric enough to make history feel alive, disciplined enough that every number can be traced back to the fixture record.

The product is not official Manchester United media. It is an independent historical and analytical archive built from open and curated data.

## Register

Product. Design serves exploration, comparison, reading, filtering, and verification.

## Primary Audience

Stats-heavy Manchester United fans with researcher-grade trust expectations.

These users enjoy records, debates, eras, managers, opponents, and weird historical cuts. They are willing to read dense information, but they should not have to fight the interface to find a pattern or verify a claim.

Secondary audiences:

- Researchers and historians who care about provenance, corrections, and completeness.
- Casual United fans arriving from search, anniversaries, arguments, or shared links.
- Contributors who may correct canonical JSON or add richer historical coverage.

## Core Promise

Help fans explore United history and notice meaningful patterns, without losing confidence in the data underneath.

**The answer is the front door; exploration is the follow-on.** A user arrives with
a question — late goals, bogey sides, the longest run — and the product's first job
is to answer it directly, with the slice, the coverage grade, and the matches behind
it. From that answer the trail opens: a user follows it from one stat to a match,
from that match to an era, from that era to a myth, and leaves with a sharper view
than they expected. Exploration is what an answer earns, not the first move it asks
of the reader.

This is a clarification of the model, not a break from it: the discovery layer was
always question-led. The shift is one of hierarchy — the homepage and discovery IA
lead with the answer rather than with the trail, so a casual arrival gets a finding
before it is asked to browse.

## Product Model

The fixture record is the spine. Question-led analysis is the discovery layer. People are the emotional entry points.

- Matches and seasons are the canonical structure. Every aggregate should be traceable back to actual fixtures.
- Analytics should increasingly become guided question modules rather than a loose chart gallery.
- Player, manager, and opponent pages should lead back into patterns, not stop at profile summaries.
- Every major aggregate needs a path toward "show the matches behind this."

## Main User Win

Explore and discover patterns.

Examples:

- Were United really late-goal specialists, and in which eras?
- Which opponents are true bogey sides once venue and era are considered?
- Did European nights change nearby league form?
- Which managers changed the shape of wins, losses, goals, and late scoring?
- When did Old Trafford look most like a fortress, and what does "fortress" mean in the data?

## Discovery Stance

Guided prompts, not punditry.

UnitedStats should suggest interesting cuts and myth-testing trails, then let the data, coverage, and match trail carry the claim. The product voice can be curious and interpretive, but should avoid verdict-heavy editorial takes when the evidence is mixed.

Preferred prompt type: myth-testing.

Good prompts:

- "Were the late goals concentrated in specific eras?"
- "Which sides were genuinely difficult away?"
- "Did a manager bounce show up in results, goals, or Elo?"
- "Were cup runs built on home draws, away wins, or neutral stages?"

Avoid:

- Hot-take copy.
- Unsupported superlatives.
- Claims that cannot link to a match set or coverage note.

## Trust Model

Trust appears at decision points.

Coverage, provenance, and caveats should be visible where they change interpretation: charts, rankings, records, player totals, lineup-derived analysis, scorer-derived analysis, and any myth-testing result. Full source detail can live deeper, but the user should never have to wonder whether a chart is based on complete results, partial scorer data, or sparse lineup data.

Tone for mixed evidence: exploratory.

Use framing like:

- "There is a signal here, but it changes by era."
- "The result-level record is complete; scorer-minute coverage is partial."
- "This is true for recorded goal events, not yet for full lineup history."

Avoid framing like:

- "Proves that..."
- "Definitely..."
- "The data says..." when coverage is incomplete or the slice is sensitive.

## Homepage Role

Lead with the answer, then open the trail.

The homepage is an answer-first front door, not a brochure, not only a status
dashboard, and no longer a flat portal of routes. The first screen leads with the
question field, a launcher of curated question Cuts (each opening its full answer
page), and a trust strip that communicates scope and provenance. Recent changes,
notable patterns, and the routes into matches, seasons, players, opponents,
managers, and analytics still belong on the page — but demoted beneath the answer
layer rather than competing with it. The goal is unchanged (pull users into the
record); the hierarchy is sharper (a finding first, browsing second).

## Discovery Surface (Explore)

One surface, three strips, a single framework: **exploring, asking, and answering
questions.** `/explore` is the jumping-off point for all three — a set of curated
previews, not a portal of links — ordered along a curation gradient, most curated
at the top to least at the bottom, so the visual sophistication falls as the
freedom rises.

- **Answering — Questions.** A curated set of meaningful questions, each a quick
  answer and a piece of inspiration. The richest, most finished strip.
- **Asking — Comparisons.** The same pattern narrowed to the one endlessly
  extensible question — *who was better than who at X?* Semi-curated.
- **Exploring — the Cut.** A blank canvas: group dimensions, measures, and filters
  freely and choose your own adventure. Least curated, plainest.

Each strip is the same shape: a full-bleed feature view the reader moves across
horizontally, a rail of summary cards beneath so the set can be skimmed without
swiping, and from either, a jump to the canonical full page. The dedicated depth
always lives one click away (`/questions/[slug]`, `/compare`, the `/cut` engine);
`/explore` previews and routes into it rather than reproducing it. The standalone
`/questions` index is folded into the Answering strip — the curated set is surfaced
once, as previews, not maintained as a parallel page.

## Search Direction

Hybrid command search.

Search should support normal lookup and suggested question templates:

- Lookup: "Rooney", "Arsenal", "1998-99", "Ferguson", "FA Cup".
- Guided query: "record away at Arsenal", "late goals under Ferguson", "European home nights", "biggest cup upsets".

The future search experience should feel like an invitation to explore, not a database form as the first move.

## Detail Page Behavior

Detail pages should encourage pattern trails.

When a user lands on a match, player, manager, season, or opponent, the next step should usually be a related pattern, not only previous/next navigation.

Examples:

- Match page: "How this moved Elo", "other late goals that season", "previous meetings with this opponent".
- Player page: "goals by minute", "best scoring runs", "matches scored in by competition", "assist partnerships where coverage exists".
- Manager page: "first 10 matches", "record after European fixtures", "home/away split", "late goals under this manager".
- Opponent page: "away record", "cup meetings", "longest winless run", "biggest swings".

## Success Principles

Success is depth of exploration.

High-value behavior:

- Users follow trails across matches, seasons, people, opponents, and analytics.
- Users cite or share a pattern with its underlying match set.
- Users return after matches, anniversaries, arguments, or curiosity loops.
- Users trust the dataset enough to correct it or build from it.

Lower-value behavior:

- A user reads one total and leaves with no path forward.
- A chart attracts attention but cannot be verified.
- A page is complete but does not suggest the next interesting question.

## Product Anti-References

Avoid a dry database table site.

The data must remain dense and queryable, but UnitedStats should never feel like a warehouse with a football skin. The product should carry emotional charge: United history, eras, floodlights, rivalry, strange records, and the pleasure of following a thread.

Also avoid:

- Generic sports dashboard energy: neon betting app, live-score clutter, glossy cards.
- Official club mimicry: crests, replica brand systems, campaign gloss.
- Fan-site nostalgia overload: memorabilia cues competing with data.
- Black-box analytics: impressive charts without provenance or match trails.

## Research Anchors

Nielsen Norman Group defines dashboards as focused views that communicate critical information quickly and notes that analytical dashboards should still support fast at-a-glance understanding. This supports making UnitedStats pattern-led while keeping charts and entry points clear: https://www.nngroup.com/articles/dashboards-preattentive/

NN/g also recommends using length and 2D position for quantitative reading, with color as a secondary grouping cue. This supports simple bars, lines, ordered tables, and restrained semantic color over decorative chart forms.

Sports Reference positions Stathead as a power-search layer for quickly answering sports database questions. UnitedStats should borrow the power-search spirit, but aim it at club-specific pattern discovery rather than only retrieval: https://www.sports-reference.com/stathead/

Craft's Baseball Reference redesign case study identifies discoverability, customization, and nostalgia as opportunities for historical sports data products. UnitedStats should use nostalgia as resonance, not decoration, and keep discoverability as a core product function: https://madebycraft.co/work/baseball-reference

## What exists

- **The Record** — every match from Newton Heath (1886) to today: results,
  competitions, managers, opponents, scorers (with minutes where recorded),
  attendance, Elo. `/matches` is the canonical filterable home.
- **Entity pages** — `/seasons`, `/player/[id]`, `/manager/[id]`,
  `/opponent/[id]`, each leading with a computed answer-object and the auditable
  record beneath.
- **Analytics** — `/analytics`: Elo/strength timeline, trends, records,
  attendance, goal timing, data-depth ledger.
- **The front door** — `/questions` (curated question Cuts), `/explore`
  (one jumping-off point across questions, comparisons, and the Cut),
  `/compare`, `/surprise`, `/on-this-day`, `/history-changed`.
- **Trust + corrections** — coverage grades at every interpretation point, full
  source provenance, a public correction workflow into reviewed PRs.
- **Auto-update pipeline** — new results flow in via GitHub Actions after each
  match; no servers, no paid APIs (see `docs/PIPELINE.md`).

## What's next

The current front door answers novelty questions better than the ones fans
actually argue about, and the slice-sprawl offers too many ways to cut a thin
core. The active direction (see `docs/RESTRAINT-PASS.md`):

1. **Re-aim the questions** at what the data can carry honestly — the
   post-Ferguson decline, named rivalry ledgers, the Treble, Ferguson vs the
   field, best/worst seasons, United in Europe. Same question format; real
   contents.
2. **Collapse the slice-sprawl** — one obvious way to slice, not nine; cut
   redundant analytical machinery (`/collection`, generic `/cut` builder,
   `/embed`), keep the strong surfaces (`/matches`, `/explore`, entity pages).
3. **Rewrite the on-site copy** in a plain human voice — the templated
   connective copy is the same AI-voice disease as the docs being cut.
4. **Make rediscovery real** — a forgotten-but-charged match engine that earns
   the kept nostalgia surfaces, instead of a calendar lottery.
