# Red Thread — Product Context

*(Red Thread is the brand and product; "UnitedStats" is the repository/codebase name.)*

## Product Definition

Red Thread is a nostalgia product for Manchester United history.

It exists to make a United fan *feel* their history — to rediscover a night they'd
forgotten, return to one they lived, or get close to one they never saw — and then
to deepen that feeling with authored lenses on a complete, trustworthy record:
results, competitions, managers, opponents, scorers, attendance, Elo movement, and
coverage depth from Newton Heath to today. It should feel like a floodlit
match-night ledger: atmospheric enough to make history feel alive, disciplined
enough that every number traces back to the fixture record.

The product is not official Manchester United media. It is an independent
historical archive built from open and curated data — free, open, and honest.

## Register

Product with atmosphere. Design serves the spark first, then the deepening lens,
then reading and verification — emotion and trust ahead of machinery.

## Primary Audience

The nostalgist — as a mindset, not a demographic.

Nostalgia here is a frame anyone can be invited into, not a segment to target —
including a 19-year-old who never saw George Best but can still be brought close to
him, to Munich, to the Treble. The one job has three modes: **rediscover** a night
you'd forgotten, **return** to one you lived exactly as you felt it, or **get close
to** one you never saw. Broad appeal is possible, but only by striking the right
note — never by chasing a wider segment. Honest about reach: this is likely a quiet,
personal thing, not a viral growth play, and the product shouldn't pretend otherwise.

Explicitly **not** built for content creators, nor for the xG / spider-diagram
stats-maker as such. Historians are served **incidentally** — they will dig
regardless, so the product is not curated for them.

Secondary, served only as a consequence:

- Casual United fans arriving from search, anniversaries, or shared links.
- Researchers and historians who care about provenance, corrections, and completeness.
- Contributors who may correct canonical JSON or add richer historical coverage.

## Core Promise

Make a fan feel their United history — then deepen the feeling — on a record they
can trust.

**The spark is the front door; the deepening is the follow-on.** First contact must
make a fan feel something the live-score apps (FotMob, SofaScore) structurally
can't — the nostalgic jolt of a real match-night, chosen for them and rendered to
land whether they lived it, forgot it, or never saw it. That spark is the necessary
condition for everything downstream: no spark, no return visit, no word of mouth.
From the spark the trail opens into the *deepening* — an authored lens that turns the
memory into curiosity and brings the fan closer (Best and Ronaldo both peaking in
their fifth season, on one normalized scale) — all of it resting on the complete,
traceable record that makes the nostalgia honest.

This supersedes the earlier "the answer is the front door" model: the front door is
not a question field or a finding, it is the spark.

## Product Model

Soul + foundation. The **soul** is two beats — the *spark* (trigger the feeling) then
the *deepening* (an authored lens that brings you closer). The **foundation** is the
complete, trustworthy fixture record, which is **load-bearing for the soul**, not
grudging plumbing: the jolt only lands because the record is whole, correct, and
traceable, with more waiting behind it.

- Matches and seasons are the canonical spine. Every aggregate traces back to actual
  fixtures.
- The deepening layer is a few **authored lenses**, not a loose chart gallery and not
  a build-anything tool (see *The Bar*, below).
- Player, manager, opponent, and season pages should lead back into the thread — a
  moment, or a connection across eras — not stop at profile summaries.
- Every major aggregate needs a path toward "show the matches behind this."

**The white space it owns.** Greats are usually presented two ways — *peak moments in
rich detail* or *career in broad strokes* — with nothing in between. That empty
middle (connective, textured, cross-era) is the real differentiator, and the
deepening lives there.

## The Bar — lens, not loom

Every surface and component must clear one bar. Three positions; only the third
qualifies:

- **View** — only what the author hand-built; too narrow to anticipate *your*
  connection.
- **Loom** — compare or build anything; too open, so it leaves the meaning for the
  user to supply, and most won't. It emits cold permutations.
- **Lens** — the author designs a thoughtful frame and the user points it; the
  meaning is baked into the lens, so it pays off whatever the user brings to it. ✓

**Operational test:** does the frame *guarantee meaning regardless of what the user
points it at*, or does it make the user supply the meaning? One or two
meaning-preserving knobs is a lens; many free knobs is a loom. The craft is choosing
the knobs so that every setting still lands.

This is **respect for the user**, made concrete: reliable, normalized data so the
thread won't lead you down the garden path, *and* real raw material to explore — not
a box. Restraint governs the *set of lenses* (a few, each load-bearing, each earning
its slot); build-anything machinery dies, not because comparison is cold but because
self-serve slicing abdicates authorship.

Two rules govern the lenses:

1. **"Best" means what a United fan means.** Rank by trophies and canonical
   achievement, not by whatever number a query makes easy. United have won **20**
   league titles — the number every fan knows — not the 22 the data technically
   holds. A metric is honest only if it lands on the answer a fan would defend.
2. **Compare like with like, on the right axis.** Defenders earn their place on clean
   sheets and goals conceded; forwards on goals and assists. "The right axis" *is* the
   authored lens — the design principle of the entire deepening layer, and where
   era-awareness and metric-honesty get baked in.

## Main User Win

Feel a United night again — and then see it in a new light.

The win is emotional first, analytical second. A fan lands on a night that means
something, feels the jolt, and then follows an authored lens that *deepens* it:

- Rediscover the 2015 Europa League exit you'd half-forgotten.
- Stand again in stoppage time at the Camp Nou in 1999.
- See that Best and Ronaldo both peaked in their fifth season, on one scale.
- Be brought close to a side you never saw, on a record you can trust.

Pattern-discovery questions (late goals by era, true bogey sides, the fortress) still
exist where they read as *moments or genuine lenses* — but they are no longer the
headline win, and the ones that read as cold arguments do not earn the front door.

## Discovery Stance

Authored lenses, not punditry.

Red Thread offers authored questions and myth-testing trails, then lets the data,
coverage, and match trail carry the claim. The voice can be curious and interpretive
about the *question*, but avoids verdict-heavy editorial takes about the *answer*,
especially where the evidence is mixed.

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

Fire the spark in the first five seconds.

The front door **is** the gate: its entire purpose is to make a fan feel the nostalgic
jolt before anything else. The first screen leads with a single served **match-night**
— a real night, chosen for the reader, rendered to land whether they lived it, forgot
it, or never saw it — not a question field, not a metric grid, not a portal of routes.
Beneath the spark sits the *foundation beat* (scope, the record, search) that says why
the jolt is honest and why you stay; the routes into matches, seasons, players,
opponents, and managers live below that. Done is depth, not reach: the moment must land
for one nostalgist, reliably.

## Discovery Surface (Explore)

`/explore` is a **doorway**, not a catalogue — a small set of authored lenses, each of
which guarantees meaning whatever the reader brings to it. It is no longer a "curation
gradient" that ends in a blank canvas; that blank canvas (the group-by-anything Cut)
was a **loom** and has been removed.

- **Questions.** A curated set of meaningful questions, each a moment or a genuine lens
  rather than a cold argument. The richest, most finished strip.
- **Comparisons.** A few authored templates — the Best/Ronaldo normalized-career lens —
  where the chosen axis carries the meaning, not "rank any two players on any metric."

Each strip is a full-bleed feature view with a rail of summary cards beneath, and from
either a jump to the canonical depth (`/questions/[slug]`, `/compare`). `/explore`
previews and routes into that depth rather than reproducing it; the standalone
`/questions` index is surfaced here as previews, not maintained as a parallel page.

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

Success is depth, not reach. The finish line is not "ready for a traffic spike"; it is
"**the moment lands for a single nostalgist**," reliably. Reach is a consequence, never
the target.

High-value behavior:

- A fan feels the spark on first contact — something the live-score apps can't give them.
- The spark becomes curiosity: the fan follows an authored lens and leaves closer to the
  history than they arrived.
- A fan trusts the record enough to share a moment with its match set, or to correct or
  build from it.

Lower-value behavior:

- A user arrives and feels nothing — just data with no jolt.
- A chart attracts attention but cannot be verified.
- A surface emits cold permutations and leaves the meaning for the user to supply.

## Product Anti-References

Avoid a dry database table site.

The data must remain dense and queryable, but Red Thread should never feel like a warehouse with a football skin. The product should carry emotional charge: United history, eras, floodlights, rivalry, strange records, and the pleasure of following a thread.

Also avoid:

- Generic sports dashboard energy: neon betting app, live-score clutter, glossy cards.
- Official club mimicry: crests, replica brand systems, campaign gloss.
- Nostalgia as decoration: memorabilia props or sentimentality competing with the record. Nostalgia is the *purpose*, but it comes from the honest record, not from cheap cues.
- Black-box analytics: impressive charts without provenance or match trails.

## Research Anchors

Nielsen Norman Group defines dashboards as focused views that communicate critical information quickly and notes that analytical dashboards should still support fast at-a-glance understanding. This supports keeping Red Thread's foundation legible and its charts and entry points clear: https://www.nngroup.com/articles/dashboards-preattentive/

NN/g also recommends using length and 2D position for quantitative reading, with color as a secondary grouping cue. This supports simple bars, lines, ordered tables, and restrained semantic color over decorative chart forms.

Sports Reference positions Stathead as a power-search layer for quickly answering sports database questions. Red Thread borrows the power-search *spirit* for its foundation, but aims it at nostalgia and authored lenses rather than open-ended retrieval — the self-serve power-searcher is not the audience: https://www.sports-reference.com/stathead/

Craft's Baseball Reference redesign case study identifies discoverability, customization, and nostalgia as opportunities for historical sports data products. Red Thread treats nostalgia as the core resonance, not decoration, and keeps discoverability in service of it: https://madebycraft.co/work/baseball-reference

## What exists

- **The Record** — every match from Newton Heath (1886) to today: results,
  competitions, managers, opponents, scorers (with minutes where recorded),
  attendance, Elo. `/matches` is the canonical filterable home.
- **Entity pages** — `/seasons`, `/player/[id]`, `/manager/[id]`,
  `/opponent/[id]`, each leading with a computed answer-object and the auditable
  record beneath.
- **Analytics** — `/analytics`: Elo/strength timeline, trends, records,
  attendance, goal timing, data-depth ledger.
- **The front door** — a served match-night spark on the homepage; `/explore`
  (a doorway across authored questions and comparisons), `/questions`, `/compare`,
  `/surprise`, `/on-this-day`. (`/history-changed` and the group-by-anything `/cut`
  builder have been removed — the freshness loop and the loom are out of scope.)
- **Trust + corrections** — coverage grades at every interpretation point, full
  source provenance, a public correction workflow into reviewed PRs.
- **Auto-update pipeline** — new results flow in via GitHub Actions after each
  match; no servers, no paid APIs (see `docs/PIPELINE.md`).

## What's next

The pass that reshaped this product is recorded in `CONTEXT.md` (the shared
picture — who it's for, what it's for, the bar) and `docs/RESTRAINT-PASS.md` (the
live plan). In leverage order:

1. **Design the first-contact spark** — the homepage served-night and the
   rediscovery engine that generates it. This is the gate; it outranks everything
   else, because without a spark nothing downstream gets its turn.
2. **The surface-by-surface pass** — hold *lens, not loom* against every route:
   reshape `/compare` into a few authored lenses, keep the moments (`/match`,
   `/on-this-day`, `/surprise`), give entity pages a rediscovery rail, and finish
   removing build-anything machinery.
3. **Rewrite the on-site copy** in a plain, human voice — the templated connective
   copy is the same AI-voice disease as the docs already cut.

Slice-collapse and the `/history-changed` freshness loop are already done; the
group-by-anything `/cut` builder is retired.
