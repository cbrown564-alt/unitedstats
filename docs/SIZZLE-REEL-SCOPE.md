# The line through time — immersive film scope

**Status:** discovery draft for decision-making  
**Date:** 11 July 2026  
**Parent:** [`docs/JOURNEY.md`](./JOURNEY.md)  
**Working title:** *The line through time*

**Hybrid master v7 — built 12 July 2026:** a 90-second evaluation master
renders from `video/RedThreadMasterV2.tsx` to
`output/video/red-thread-master-v7.mp4`. The opening keeps four canonical-data
match signatures (1886 lineup, 1968 extra-time burst, 1999 bench reversal,
2008 penalty constellation) inside the lean 18s window. From the Best↔Ronaldo
comparison through Fergie bloom, the cut restores the fuller v5 middle: four
rhyme facts (including Ballon d’Or and fifth United season), the eleven-day
Treble fuse, and the stories/fergie-time shared countdown (one clock, six
strikes) blooming into the late-goal scatter. Fortress OT and the 1999 final
receipt close the film.

**Prior hybrid master v6 (76s, 12 July 2026):** four opening cards with a lean
two-fact rhyme, Treble spin-off pocket, Fergie clock hero, Fortress, and
receipt — kept as a comparison artifact at `output/video/red-thread-master-v6.mp4`.

**Prior match-rich master v6 (84s, 11 July 2026):** five opening signatures,
four rhyme facts, Fortress act, and closing KPI strip — still a comparison
artifact for inventory density.

The opening signatures are driven by the same match events, lineups and player
media as `/match/[id]` and `/player/[id]`. An authored manifest selects what each
match foregrounds, while the facts and receipt paths remain generated. A new
procedural effects stem gives the lineup assembly, eleven goals, extra-time
burst, substitute reversal and shoot-out distinct but related sonic identities.

The Treble passage replaces v3's calm circular summary with a tightening
eleven-day fuse. Each match begins in jeopardy, the substitute intervention
lands as evidence, the recovery gaps contract from six days to four, and the
European final holds at 90 minutes before the two-goal reversal. V5 remains a
comparison artifact at `output/video/red-thread-master-v5.mp4`. V5 added an
authored effects stem and music duck around 90:00, removed one opening archive
stop so the central loop began two seconds earlier, and resolved the final
filament into a real match receipt before “Pull a thread.”

This document scopes the first cinematic compression of Red Thread: an authored,
animated journey through Manchester United history that can stand alone as a
short film and act as the product's sizzle reel.

It is deliberately not a production brief yet. The ambition is high enough that
story, format, rights, sound and the rendering pipeline must be proven before a
full build is commissioned.

---

## 1. Decision summary

### Recommended direction

Make a **75–90 second, sound-led, deterministic animated film** whose protagonist
is the red thread. The thread moves through the complete record, changes shape
when history rhymes, and opens brief pockets when a night, place or campaign
deserves to be entered. The film borrows the strongest discoveries from the five
stories without summarising all five or giving them equal time.

Build the master as a **frame-addressable React composition in Remotion**, backed
by a small film-specific story manifest and the same verified data used by the
site. Rebuild selected journey primitives for film rather than trying to record
the live pages. Use SVG/CSS/Canvas for most scenes, with one optional depth/3D
shot only if a prototype proves that it adds wonder. Finish picture, mix and
grade in DaVinci Resolve/Fusion or an equivalent editor.

### Why this direction

- It keeps the film tied to the project's strongest asset: a complete,
  traceable record, not a collection of borrowed football clips.
- It can reuse the visual thinking and some pure React/SVG primitives from the
  five stories without inheriting scroll, DOM measurement or Next.js concerns.
- It gives every frame a deterministic timecode, which makes sound, captions,
  review and alternate edits tractable.
- The same composition can produce a film file, an embedded player, social cuts
  and stills without screen-recording the app.
- It leaves room for specialist craft—music, sound design, grading and one-off
  3D—where those disciplines create the most value.

### What not to do

- Do not concatenate screen recordings of the five stories.
- Do not make a feature checklist set to music.
- Do not make match footage the foundation; rights and availability would own
  the story, and the result would resemble official club media.
- Do not make every transition a new visual trick. The thread remains the one
  visual system.
- Do not begin with the full 90-second build. First prove a 12–15 second
  “impossible transition” with final-quality motion and sound.

---

## 2. The job

The film has two simultaneous jobs, in this order:

1. **Create wonder.** Make a supporter feel that 140 years are present at once,
   and that nights they know are connected to nights they do not.
2. **Reveal the product.** Show that Red Thread can find, evidence and let them
   enter those connections.

The emotional promise is not “look how many records we have.” It is:

> The whole history is here. Pull one thread and distant nights touch.

The product proof should be felt before it is explained: a name resolves into a
goal clock; a number opens into a match receipt; a loop between 1968 and 2008
lands on two final goals; the filament then continues because the archive does.

### Canonical terminology

- **Film** — the authored, fixed-duration master described here.
- **Sizzle cut** — a shorter edit of the film for a specific channel.
- **Interactive companion** — a later web experience driven by the same scene
  model. It is not required to ship the film.
- **Receipt** — the source-facing proof behind a film claim: match, season,
  lineup, event or comparison.
- **Monument** — a licensed still or place image treated as atmosphere, never as
  unsupported documentary footage.

This distinction matters: “video” must not blur together a finished film, a
scroll experience and a social ad. They have different timing, accessibility
and technical requirements.

---

## 3. Audience and contexts

### Primary viewer

The same nostalgist-as-mindset defined in `CONTEXT.md`: they may have lived the
night, half-remember it, or know it only as inherited history. They do not need
to be a statistician or understand the app before the film starts.

### Priority viewing contexts

1. Embedded on the Red Thread site with sound opt-in and captions available.
2. A full-screen portfolio, pitch or launch presentation.
3. Social distribution as 60, 30 and 15 second cuts, including a vertical edit.

The master should survive silent autoplay, but the intended experience is with
sound. Social performance is useful distribution, not the creative yardstick.

### Desired viewer response

In order:

1. “I know that year/night.”
2. “I did not know those moments connected.”
3. “This contains the whole history, not just the famous clips.”
4. “I want to follow one of those threads myself.”

---

## 4. Creative thesis

### The protagonist is the thread

The film does not have a presenter. The red thread is camera path, timeline,
match clock, chart line, underline, stitch and transition. It is allowed only
the three verbs already proven by the stories:

- **Follow** — travel through chronology.
- **Loop** — bring distant moments into contact when their shape rhymes.
- **Spin off** — enter a dense pocket around a singular campaign, place or night,
  then return to the main record.

The camera appears to follow the thread through one continuous historical space.
Cuts may occur, but motivated transitions should disguise the assembly: a goal
knot becomes a year; a circular clock becomes the loop neck; a formation dot
becomes one of hundreds of match marks.

### The film has one argument

**This history is not a row of isolated highlights. It is a living network of
repeating shapes, places, people and nights—and the record lets us see it.**

That is broader than any one story and more distinctive than “140 years of
Manchester United.”

### Visual register

- Floodlit darkness, warm paper-white type, devil-bright filament, gold only for
  a landed discovery.
- Photography is large, cropped, monochrome and partially dissolved into space.
  It supplies human or place texture; it never becomes a conventional slideshow.
- Data surfaces arrive as physical evidence: slips, rails, scoreboards, lineups
  and constellations—not browser windows or floating dashboard cards.
- Numbers remain exact and legible long enough to register. Wonder comes from
  staging true facts, not from hiding them in particle effects.
- No official crest, replica brand language, broadcast graphics or heritage-prop
  pastiche. Red Thread remains an independent archive.

### Motion principles

1. **Continuous intention.** Motion always follows, loops or departs/returns.
2. **Anticipation before speed.** Hold long enough to orient; accelerate through
   archive scale; hold again at the connection.
3. **One hero transformation at a time.** Type, camera, thread and photography do
   not all demand attention simultaneously.
4. **Motion proves the thought.** The 1968↔2008 loop must make the forty-year
   rhyme clearer than a static comparison. Otherwise it is decoration.
5. **Final states exist.** Every scene has a readable still state for captions,
   thumbnails, reduced motion and review.

---

## 5. Proposed master arc

Target: **82 seconds at 30 fps** for the first animatic. Timing is provisional;
music and comprehension tests should move it.

| Time | Act | What happens | Story material | Product proof |
|---:|---|---|---|---|
| 0–7s | **A line appears** | Darkness. A point at 1886 catches; the thread draws forward. Hundreds of match marks wake briefly around it. | Continuous-thread grammar | Scale of the match archive |
| 7–18s | **The archive has texture** | The camera rushes through selected knots: 1909 first Cup, 1954's eleven goals, 1976's cut, 2001's reversal, 2024 at 120′. Each is a distinct rhythmic shape, not a card. | *A thread of nights* | Match events and receipts |
| 18–34s | **Distant years touch** | 1968 and 2008 separate in depth, then the filament loops through the same red seven. Career-five peaks align; two European final goals land. | *Two No. 7s* | Compare → European finals → match/lineup |
| 34–49s | **Time opens a pocket** | The loop collapses into 1999. Three May knots orbit a tight eleven-day pocket. “Three must-wins” becomes “all three, from the bench”; a blank starting XI and two bench goals make the climax. | *Eleven days in May* | Season, substitutions, match events, lineup |
| 49–60s | **A place holds** | The pocket becomes the Old Trafford bowl/outline. Three cracks tear a wall of 395 marks; each closes without defeat. | *Fortress OT* | Derived slice and evidence coverage |
| 60–70s | **The clock echoes** | One crack becomes a digital 90+. 1993, 1999 and 2023 strike the same 0–1→2–1 shape around it. | *Fergie time* | Goal-minute record and late-goal lens |
| 70–78s | **The record opens** | Camera pulls back: loops, pockets, match slips, season lines, people and places are one field. A few app surfaces resolve cleanly from that field—never as a UI montage. | All five | Breadth: matches, seasons, players, managers, questions, compare |
| 78–82s | **The line continues** | The thread passes “now” and leaves frame. Title and invitation: “Follow the line through United history.” Red Thread mark; independent-archive line. | Door | Site URL / Stories or chosen landing page |

### Editorial weighting

- *Two No. 7s* and *Eleven days in May* carry the central emotional reveal.
- *A thread of nights* creates breadth and pace; it does not replay ten receipts.
- *Fortress OT* contributes place and scale.
- *Fergie time* contributes sound, clock tension and a final cross-era echo.
- The film may omit a favourite component if it slows the one argument. It is a
  new work built from story grammar, not a highlights package of the stories.

### Copy stance

Aim for **35–55 on-screen words**, excluding small evidence labels and credits.
No voiceover in the first animatic. The thread, scoreboards and sound should tell
the story. A later voiceover is a conscious creative branch, not assumed polish.

Candidate copy spine:

> 1886.  
> One match, then another.  
> Some nights stand alone.  
> Some return forty years later.  
> Three must-wins. All three, from the bench.  
> Three cracks. No defeats.  
> 0–1. 90+. 2–1. Again.  
> The whole history is here. Follow the thread.

Every line remains subject to the copy rubric and a fact-to-receipt check.

---

## 6. Sound is half the film

A spectacular picture with stock “epic” music will feel like campaign gloss.
Sound needs its own authored thread.

### Sonic system

- A quiet tactile pulse begins with the first match mark.
- The filament has a restrained material sound—wire, bow or electrical hum—that
  changes with tension but never becomes a lightsaber effect.
- Match knots use designed impacts derived from a small palette, not ten unrelated
  whooshes.
- The 90+ sequence introduces clock/tape tension and briefly removes harmonic
  support before the two late goals.
- Crowd texture should be designed or properly licensed atmosphere, not ripped
  broadcast audio or audio presented as if it came from a depicted match.
- The score should have stems so 90/60/30/15-second edits can be musically
  restructured rather than simply faded out.

### Recommended approach

Commission or license a restrained original score and a short bespoke sound
design/mix once the animatic is locked. If budget permits only one external
specialist, sound is the highest-leverage choice after motion direction.

Deliver stereo at a platform-safe loudness, preserve a dialogue/VO lane even if
unused, and keep music, effects and atmosphere as separate stems.

---

## 7. Format and deliverables

### Required

- 16:9 master, 3840×2160, 30 fps, 75–90 seconds.
- High-quality mezzanine master (ProRes 422 HQ or equivalent).
- Web delivery encode (H.264 MP4, 1920×1080) with poster frame.
- Caption file (`.vtt`/`.srt`) and a burned-caption review export.
- Music/effects/atmosphere stems and final stereo mix.
- End-credit/asset-attribution card plus a durable web credits page.
- 60-, 30- and 15-second 16:9 cuts derived from the locked master.

### Strongly recommended

- A separately composed 9:16 cut. Do not centre-crop the master; the thread path,
  type and monuments need a vertical layout.
- A 1:1 or 4:5 cut only when a real channel requires it.
- Six to ten 4K still frames for the site, deck and launch materials.
- A silent-autoplay web variant with persistent essential copy.

### Later, not a launch dependency

- Interactive Remotion Player or a scroll-driven companion using the same scene
  manifest.
- User-selectable exits from scenes into the exact match/season/comparison.
- Parameterised seasonal or “on this day” variants.

---

## 8. Technology assessment

### Option A — React + Remotion master **(recommended)**

**Fit:** strongest. Remotion makes frames and time explicit, renders through a
CLI/server API, supports image sequences and video formats, and provides a React
Player for runtime-customised embeds. It matches the current React/TypeScript
capability and the data-driven nature of the stories.

**Use it for:** master timeline, typography, SVG paths, charts, photos, camera
transforms, audio placement, captions, alternate aspect ratios and exports.

**Costs/risks:** existing journey components are scroll- and DOM-oriented; they
cannot simply be imported. Film-safe primitives need pure props and frame-based
progress. Browser rendering can expose font/media timing or GPU differences, so
renders need pinned dependencies and golden-frame QA. Remotion licensing must be
checked against the production context before adoption.

Official references: [Remotion rendering](https://www.remotion.dev/docs/render),
[Remotion Player](https://www.remotion.dev/docs/player),
[licensing/compliance](https://www.remotion.dev/docs/license).

### Option B — capture the existing stories

**Fit:** useful only for the animatic or “current product” inserts. Playwright can
drive known scroll positions and FFmpeg can assemble captures.

**Advantages:** fastest way to test sequence and show live product truth.

**Limits:** scroll easing, responsive layout, font loading and dropped frames are
hard to control; camera transitions between pages remain edits; 4K and vertical
recomposition become expensive. This cannot deliver the continuous impossible
camera move that defines the ambition.

### Option C — After Effects or Fusion as the master

**Fit:** excellent for a specialist motion designer and final finishing; weaker as
the single source of truth for hundreds of data-derived marks.

**Advantages:** mature timeline, typography, compositing, grading, plugins and
sound/editor hand-off.

**Limits:** facts and geometry are duplicated into a manual project; variants and
later data changes are costly; code components cannot become a live embed.

**Use in the recommendation:** finishing, compositing exceptional shots, final
grade and sound—not ownership of the whole data-driven master unless the team is
motion-design-led rather than code-led.

### Option D — Three.js/WebGL or Blender-led film

**Fit:** selective. Depth can make the thread feel like a world rather than an SVG
line, but a full 3D pipeline would dominate schedule and art direction.

**Good candidate:** one signature pull-back in which decades of match knots reveal
themselves as a single field, or a macro camera move along the filament.

**Gate:** prototype the shot in monochrome. Keep it only if viewers describe a
clearer sense of scale/time, not merely “3D.” Three.js supports browser animation
and imported glTF animation; Blender can render a deterministic image sequence
for compositing. [Three.js animation system](https://threejs.org/manual/en/animation-system.html).

### Supporting tools and their boundaries

| Tool | Best role | Boundary |
|---|---|---|
| SVG + React | Thread, clocks, score rails, lineups, exact type and data marks | Default visual engine |
| Canvas/WebGL | Dense particle/mark fields and a depth shot | Only where SVG DOM count or depth becomes limiting |
| GSAP ScrollTrigger | Later interactive companion; scrub/pin web prototype | Not the film clock; Remotion frames own master time. [Official docs](https://gsap.com/docs/v3/Plugins/ScrollTrigger/) |
| Rive | Isolated interactive vector emblem or web micro-animation | Not master timeline; separate authoring source. Rive can export MP4/PNG/WebM and run state machines ([export](https://rive.app/docs/editor/exporting/exporting-for-video-and-static-design), [runtime](https://rive.app/docs/runtimes/state-machines)) |
| DaVinci Resolve/Fusion | Editorial conform, grade, final composite, mix and delivery | Changes after picture lock must be reconciled back to the source timeline |
| FFmpeg | Transcode, mux, loudness/QC probes, contact sheets | Operational tool, not creative editor. [Official documentation](https://ffmpeg.org/ffmpeg.html) |
| Generative image/video | Mood boards, texture exploration, non-historical abstract plates | Never fabricate documentary moments or become a dependency for faces, kits, scores or venues |

### Technical recommendation in one line

**Remotion owns time; React/SVG owns the visual grammar; the verified record owns
the facts; Resolve owns finishing; 3D and generative tools must earn individual
shots.**

---

## 9. Proposed production architecture

The film should live beside the app but not inside its runtime bundle. Exact
location is a spike decision; a `video/` workspace or separately scoped package
is preferable to adding render-only dependencies to the Next.js app.

```text
verified DB / pure query exports
              │
              ▼
film manifest (beats, claims, receipts, assets, timings)
              │
       ┌──────┴────────┐
       ▼               ▼
film primitives     audio/caption cues
(thread, knot,       (timecoded stems,
 receipt, clock)      copy, captions)
       └──────┬────────┘
              ▼
Remotion compositions (16:9 / 9:16 / short cuts)
              │
              ▼
image sequence or mezzanine → Resolve/Fusion → delivery encodes
```

### Film manifest

Every claim shown on screen should be a typed object with:

- stable scene and beat ID;
- start/end frame or named timing marker;
- exact copy;
- data payload or pure selector;
- receipt URL(s) and source note;
- asset IDs and licence record;
- safe-area/reflow hints by aspect ratio;
- caption and audio-cue IDs.

This is the film equivalent of the app's evidence contract. It prevents a motion
project from becoming the only place a historical claim exists.

### Component boundary

Extract or recreate only pure pieces. A film primitive may accept `progress`,
dimensions and data; it must not read scroll position, measure a live page, query
SQLite during a frame, or depend on a Next route. Generate/freeze the film data
before rendering.

Likely reusable ideas, not necessarily reusable files:

- `stageMath.ts` geometry helpers;
- `RhymeMorph` loop construction;
- `TrebleSpinoff`, `FortressSpinoff` pocket grammar;
- `StoppageEcho` clock and `BenchLatency` timing;
- `ThreadOfNights` seam/knot grammar;
- `MatchFlow`, `FormationPitch`, career and finals data shapes.

### Determinism and QA

- Pin Node, Chromium, Remotion, fonts and render settings.
- Render from a frozen film-data fixture, with a command that regenerates it and
  reports claim changes.
- Golden-test key frames at act boundaries and factual landing frames.
- Probe every output for duration, frame rate, dimensions, audio channels and
  codec; visually inspect a contact sheet and the final master.
- Keep a no-audio and missing-image failure mode obvious; never silently render a
  blank or stale receipt.

---

## 10. Asset, rights and identity workstream

This is a launch gate, not end-of-production paperwork.

### Existing position

The journey already has a useful start: selected portraits and monuments carry
per-file Wikimedia Commons licence, artist, source and credit metadata. That does
not automatically clear every asset for a film. Each file's terms and the way it
is transformed must be checked; Commons explicitly instructs reusers to inspect
the individual file licence and provide required attribution. [Wikimedia reuse
guidance](https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia/en).

CC BY allows adaptation with attribution. CC BY-SA also requires adapted material
to be shared under the same terms; the scope of the adaptation/collection in a
mixed film should be reviewed rather than guessed. [Creative Commons licence
summary](https://creativecommons.org/share-your-work/cclicenses/).

### Required asset ledger

For every photo, texture, sound, font and piece of music:

- local asset ID and file hash;
- creator and source URL;
- licence/version and commercial-use status;
- whether cropping, colour treatment or animation counts as an adaptation;
- exact credit line and where it appears;
- evidence of purchased/commissioned permission where applicable;
- expiry, territory or platform restrictions;
- replacement status if clearance fails.

### Hard rules

- No broadcast match footage, commentary, crowd recordings or commercial music
  without an explicit licence for the intended uses and territories. UK guidance
  notes that licences can be purpose-, time- and place-limited. [GOV.UK copyright
  guidance](https://www.gov.uk/using-somebody-elses-intellectual-property/copyright).
- Do not assume a photograph is cleared because it appeared on Wikipedia; verify
  it is on Commons and inspect the file page.
- Keep the existing no-crest/no-official-mimicry rule.
- End with “An independent historical archive” and avoid language or presentation
  implying endorsement by Manchester United, competitions or broadcasters.
- Obtain legal review before a paid campaign, broadcast placement, sponsorship or
  any use materially beyond the site's current independent archive context.

The document is production guidance, not legal advice.

---

## 11. Accessibility and responsible representation

- Essential meaning must survive mute playback; never encode a fact only in
  sound or colour.
- Captions are authored with the film, not transcribed after it. Avoid covering
  match clocks, receipts or the thread.
- Maintain readable contrast and minimum dwell time for essential copy.
- The web embed must expose pause, seek, captions, volume and a transcript.
- A reduced-motion alternative should be a short sequence of landed tableaux or
  a poster-led summary—not the same film with CSS motion disabled.
- Portrait treatments must not imply fabricated action or put a historical person
  into a scene they did not inhabit.
- Generative tools may create abstract atmosphere only when the result cannot be
  mistaken for archival evidence; label process notes internally.

---

## 12. Success criteria

### Creative comprehension

Test the animatic and prototype with 8–12 supporters spanning lived-memory and
inherited-history audiences. Without explaining the premise first:

- At least 8/12 can describe the thread as connecting moments across time.
- At least 8/12 recall one non-obvious connection, not only “lots of history.”
- At least 6/12 correctly understand that the claims come from a browsable record.
- No more than 2/12 believe this is official Manchester United media.
- The central 1968↔2008 and 1999 reveals remain legible on a phone with sound off.

These are directional prototype gates, not statistically meaningful research.

### Craft and technical quality

- No factual claim exists only in animation copy; every claim maps to a receipt.
- The thread reads without a legend and uses only follow/loop/spin-off.
- The film maintains a stable frame rate and has no font/media-loading flicker.
- The 9:16 edit is deliberately recomposed.
- Captions, credits and attribution ship with the master.
- Product inserts feel born from the historical field, not pasted screenshots.

### Product response

Instrument the embedded version for play, 25/50/75/100% completion, sound enable,
caption enable and the final door click. Do not use view count as the creative
success definition; the internal yardstick remains depth for one nostalgist.

---

## 13. Principal risks and mitigations

| Risk | Consequence | Mitigation / gate |
|---|---|---|
| Film becomes five trailers | Repetition, no new thesis | One master arc; unequal story weighting; animatic before build |
| Spectacle obscures facts | Beautiful but generic sports ident | One claim per landing; hold exact receipt; fan comprehension test |
| Reuse promise is overstated | DOM/scroll code fights frame rendering | Reuse data shapes and geometry first; rebuild film-safe primitives |
| Full 3D expands without limit | Art pipeline consumes project | One monochrome signature-shot spike with a keep/kill criterion |
| Photography/licensing fails late | Forced recut or blocked launch | Asset ledger and replacement plan before picture lock |
| Music feels like club campaign gloss | Violates independent, archival voice | Original restrained score; approve against a temp-music anti-reference |
| Mobile/social cuts become crops | Broken type and thread grammar | Aspect-ratio compositions share beats, not coordinates |
| Manual finishing drifts from source | Web/master/short cuts disagree | Locked manifest and conform notes; source changes trigger rerender |
| Render stack bloats app or CI | Slow builds, unused-file failures | Separate video workspace/entry points; explicit `knip` and CI scope |
| Current-season facts change | Film dates immediately | Prefer closed historical claims; stamp data snapshot; isolate “now” copy |
| Viewer assumes official endorsement | Brand/legal confusion | Independent-archive line, no crest, restrained club references |
| AI imagery reads as fake archive | Trust damage | Abstract-only AI boundary; no fabricated historical scenes |

---

## 14. Phased production plan

Effort assumes one strong code/motion generalist with focused help for sound and
finishing. Calendar time changes materially with review availability and rights.

### Phase 0 — lock the question (3–5 working days)

- Decide primary context and master duration.
- Audit candidate imagery, fonts, sound and music routes.
- Build the claim/receipt ledger for the proposed arc.
- Collect creative references and anti-references.
- Write v1 copy spine and choose the final door.

**Gate:** a rights-safe paper edit in which every beat advances the one argument.

### Phase 1 — boards and sound-first animatic (1–2 weeks)

- Storyboard 10–14 key frames.
- Cut a rough animatic with stills, primitive thread motion and temporary sound.
- Test 16:9 and vertical spatial plans before detailed animation.
- Conduct the first supporter comprehension sessions.

**Gate:** viewers understand the line, recall a connection and want to enter it.

### Phase 2 — the impossible-transition prototype (1–2 weeks)

**Status — built 11 July 2026:** the first 14-second 16:9 prototype is in
`video/` and renders to `output/video/red-thread-loop-prototype.mp4`. It travels
through the 1909 and 1954 archive knots, opens the forty-year Best↔Ronaldo span,
closes the loop through the shared No. 7 and lands on both European-final goal
receipts. It uses the existing licensed monuments and a deterministic original
stereo sound bed; no broadcast media is present. This is now an evaluation
artifact, not evidence that the full-film stack is locked.

Build 12–15 seconds at near-final quality:

1. travel through 1909 and 1954 knots;
2. accelerate into 1968;
3. loop to 2008 through the red seven;
4. resolve one exact final-goal receipt;
5. include final sound design, one monument and a vertical reframe.

This slice deliberately tests dense marks, continuous camera logic, photography,
type, a cross-era loop, data proof, audio and export—most of the unknowns in the
smallest useful sequence.

**Gate:** stable 4K render; loop reads without explanation; imagery is licensable;
vertical version works; frame pipeline is reproducible. If not, simplify the
camera/stack before expanding.

### Phase 3 — full production (3–6 weeks)

- Build the pure film primitives and frozen data fixture.
- Animate acts in risk order, not chronology: central loop, Treble pocket,
  archive field, Fergie clock, Fortress place, opening/close.
- Compose/commission score against locked timing, then sound-design each act.
- Review factual landings and rights weekly.

**Gate:** picture lock and signed claim/asset ledgers.

### Phase 4 — finish and variants (1–2 weeks)

- Grade, composite, mix and master.
- Author captions, transcript, credits and poster.
- Recompose 9:16; cut 60/30/15 variants from musical stems.
- Encode, probe and visually QA all deliverables.
- Embed behind an intentional play/sound/caption experience and add analytics.

**Gate:** delivery checklist passes and every published asset has an owner/source.

### Realistic planning range

A polished code-led master is roughly **7–12 weeks** after the key decisions and
rights path are available. A small team can overlap sound, asset clearance and
vertical design, but the animatic and picture-lock gates remain sequential. A
2–3 week version is a prototype or motion study, not the ambition described here.

---

## 15. Team and ownership

One person may hold several roles, but the responsibilities must exist:

- **Creative director/editor:** protects the one argument and decides what to cut.
- **Motion engineer/designer:** owns Remotion, SVG/Canvas, timing and renders.
- **Data/fact editor:** owns the claim ledger, frozen fixture and receipts.
- **Art/asset producer:** sources, treats and clears imagery; maintains credits.
- **Composer/sound designer/mixer:** owns score, motif, effects, stems and mix.
- **Finishing editor/colourist:** conform, composite, grade and masters.
- **Reviewers:** 8–12 supporters plus accessibility and legal/rights review at the
  appropriate distribution level.

The creative director and fact editor should not be the same approval gate at
picture lock: emotional pressure is exactly when unsupported shorthand enters.

---

## 16. Open decisions, in dependency order

These are questions to resolve one at a time. The recommendation is stated so a
default exists; changing an early answer may change later ones.

### P0 — before boards

1. **What is the primary first showing?**  
   *Recommend:* the Red Thread site and full-screen pitch/launch playback share
   priority; social is derivative. This permits an 82-second master with a real
   emotional build rather than a hook-every-second ad.

2. **Is the film's lead promise history or product?**  
   *Recommend:* history first, product revealed as the instrument that makes the
   connections visible. Product-first would turn the same scenes into a demo reel.

3. **Is voiceover part of the identity?**  
   *Recommend:* no voiceover for the first animatic; test whether image, type and
   sound carry it. Add voice only if comprehension—not grandeur—needs it.

4. **What is the rights posture?**  
   *Recommend:* open/cleared stills, commissioned sound and data-native visuals;
   no broadcast footage. This preserves independence and schedule control.

5. **Where does the final door lead?**  
   *Recommend:* `/stories` for the first public film; it is the bridge between the
   compressed master and the five complete chapters. A campaign-specific landing
   page is justified only if it adds transcript, credits and scene deep-links.

### P1 — before technical prototype

6. **How much literal 3D?**  
   *Recommend:* one signature archive pull-back only, subject to the proof gate.

7. **How recognisable should the existing UI be?**  
   *Recommend:* exact component grammar and data, cinematic layout. Reserve one
   clean, brief live-product resolve near the end so viewers know it is usable.

8. **Should portraits anchor the central rhyme?**  
   *Recommend:* yes, as licensed atmospheric monuments around the No. 7; never as
   lip-synced, animated or fabricated action.

9. **What is the musical register?**  
   *Recommend:* intimate pulse → widening harmonic field → silence/tension at 90+
   → unresolved continuation. Avoid trailer percussion, stadium chants and hymn.

10. **What fact is the film's climax?**  
    *Recommend:* the 1999 blank starting XI / two bench goals, because it combines
    familiar emotion with a fresh, provable way of seeing it. The 1968↔2008 loop
    is the thesis reveal; 1999 is the emotional climax.

### P2 — before full production

11. Master duration after animatic: 75, 82 or 90 seconds?
12. 25 vs 30 fps? *Recommend 30 fps for web/social; test motion cadence.*
13. Commissioned score, library track with stems, or hybrid?
14. Resolve/Fusion finish or Remotion-only master?
15. Which six photographs survive the rights and quality audit?
16. Do short cuts preserve the same arc or each sell one connection?
17. Does the web embed use a normal video element or Remotion Player?
18. Is a reduced-motion tableau edit required at launch?
19. Who has final picture, factual and rights sign-off?
20. What distribution would trigger formal trademark/copyright counsel?

---

## 17. Recommended immediate next move

Do not install a production stack yet. Run a five-part pre-production sprint:

1. Answer P0 question 1: identify the primary first showing.
2. Create a claim ledger for the proposed 82-second arc.
3. Audit the 10–12 likely hero images and choose six rights-safe candidates.
4. Make 10–14 storyboard frames plus a crude sound-led animatic.
5. Only then scaffold the 12–15 second Remotion prototype and compare its render
   quality/workflow against a hand-built Fusion/After Effects sample if expertise
   is available.

The first artefact worth judging is not a technology demo. It is the moment when
the camera races along the complete record, 1968 bends toward 2008, and one true
goal receipt appears exactly where the loop closes. If that feels inevitable and
magical, the rest of the film has a spine.
