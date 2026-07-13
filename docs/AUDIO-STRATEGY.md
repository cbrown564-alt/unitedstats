# Red Thread audio: current state and future exploration

**Status:** exploration brief
**Last updated:** 13 July 2026

## Purpose

Audio should help Red Thread reveal patterns, give individual stories a distinct
identity and make short-form work recognisable before the logo appears. It should
not turn the project into generic football campaign media. The useful territory
is authored, precise and slightly unexpected: sound that behaves like the data
and the moving thread.

This document records the music currently associated with the 90-second film,
the experiments conducted so far and the next surfaces worth testing. It is a
direction-setting document, not approval to add autoplaying sound across the
site.

## Current 90-second film music

There are three relevant soundtrack states in the repository, plus the three
named 30-second story-single sources held in the ElevenLabs account.

### Original authored score

The base `european-master-90` edition uses `master-v3.mp3`, an instrumental
Lyria 3 Pro score. It is modern cinematic minimalism with tactile analogue
electronics, prepared-piano ticks, sub-bass, bowed-wire texture and restrained
percussion. Its timestamped prompt and provenance live beside the audio in
`public/video/audio/master-v3.json`.

This score established several useful principles: the red thread can have a
material sound, the 90+ sequence benefits from harmonic subtraction, and the
ending should open rather than resolve triumphantly. In practice, the result is
polished but can feel like a tasteful documentary bed rather than a distinctive
Red Thread identity.

### Published Factory machine-funk film

The current `post-punk-song` plan and the film currently used on YouTube and
the site use the later ElevenLabs **Factory machine-funk** treatment:

`public/video/audio/elevenlabs-manchester-bakeoff/01-factory-machine-funk.mp3`

It is a 90-second, 118 BPM Manchester-coded post-punk treatment with melodic
electric bass, rigid drum machine, clipped guitar harmonics, mono-synth pulses,
dub space and a low spoken-sung British vocal. This is the current published
film source, not a pending soundtrack experiment.

The release record, including hashes, is in `video/RELEASES.md`.

### Current code selection

The published film overlays **Thread through felt** on Factory machine-funk for
the final four seconds. It was chosen from three isolated textile-first
**Pull the Thread** candidates and promoted on 13 July 2026. The cue brief,
motion correction and review status live in
`docs/PULL-THE-THREAD-END-CARD.md`. Keep `video/audio/plans.ts`,
`video/README.md`, `video/RELEASES.md`, `video/SOURCES.md` and this document
aligned if the experiment is promoted.

## Experiments conducted

### Repository bake-offs

The ElevenLabs work has moved through several deliberate rounds:

1. **Initial instrumental routes:** analogue forensic, data pulse, archive
   mechanical and human momentum.
2. **Wide divergence:** electroacoustic thread, dub space, deconstructed garage,
   vocal canon, art-pop, post-punk broadcast, jazz time-loop and other broad
   treatments.
3. **Convergence:** refined UK pulse, time-loop jazz, post-punk, broken metre,
   red-line transmission and seventh-record directions.
4. **Post-punk finals:** an editorial transmission, a more song-like treatment,
   continuous takes and reference-leaning takes.
5. **Manchester bake-off:** machine-funk, Haçienda/acid-house, baggy groove,
   post-punk/UK-garage and industrial dub.
6. **Lyric bake-off:** factual ledger, poetic red line and the hook-led “Right on
   time” voice over a fixed Factory machine-funk sound.

The broad lesson is that a detailed 90-second prompt can produce coherent,
competent music without producing a memorable identity. Prompting for many acts,
instruments and emotional turns at once tends to average out the most distinctive
idea. The vocal experiments add character, but a continuous lyric also competes
with dense on-screen copy.

### Browser-generated 90-second instrumental tests

Three lyric-free directions were tested with ElevenLabs Music v2:

- **Industrial electroacoustic:** tactile metal, prepared piano, bowed wire and
  mechanical pulse. The concept fit the archive but the full result felt
  underpowered.
- **Deep dub / broken UK rhythm:** sub-bass, broken drums, delay and negative
  space. This was one of the more promising 90-second routes, but still behaved
  more like an accompaniment than a signature.
- **Minimal chamber jazz:** upright bass, bass clarinet, prepared piano,
  vibraphone and brushes. The palette was appealing, but the long-form cue lacked
  a decisive hook.

### Thirty-second identity tests

Shorter prompts deliberately tested one strong musical mechanism instead of a
complete film score:

- **The impossible clock:** a mechanical rhythm that appears to accelerate while
  remaining at a fixed tempo. This was liked and has a direct conceptual
  relationship to Fergie time, pressure and recurrence.
- **Bass-clarinet pursuit:** a sly three-note bass-clarinet motif answered by
  upright bass and tight percussion. This was liked and suggests that Red Thread
  can have wit and human performance without becoming nostalgic.
- **Dangerous minimalism:** a severe repeating piano figure with a deliberately
  missing beat, accumulating pizzicato cello, muted bass and dry electronics.
  This was liked and may be the strongest brand-level grammar: repetition,
  variation, missing information and eventual connection.

The 30-second tests were more successful because each could make one legible
claim. They should become the default format for finding a motif. A winning idea
can then be extended, rearranged or used as the basis of a family; it should not
be assumed that a 90-second generation will discover the idea on its own.

The three account-held candidates for the next story-single bake-off are:

- **The impossible clock:** `Mechanical Paranoia`
- **Bass-clarinet pursuit:** `The Alignment Pattern`
- **Dangerous minimalism:** `Missing Beat Minimalist Cue`

Their exported source files now live under
`public/video/audio/story-singles/`. The earlier files under
`public/video/audio/elevenlabs-convergence-bakeoff/` remain related audition
records, not substitutes for these named account songs.

## What audio could add

Audio is most valuable when it does at least one of the following:

- makes a pattern perceptible before it is fully explained;
- gives a story a memory hook;
- turns time, recurrence or pressure into something physical;
- creates continuity between otherwise different formats;
- rewards intentional listening without penalising muted use;
- communicates the Red Thread brand without sounding like a football anthem.

It adds little when it merely supplies energy, restates visible copy or fills
silence.

## Near-term exploration

### 1. Thirty-second story singles

The clearest next step is a set of self-contained 30-second films, each built
around one story and one musical device. These are spin-offs, not extracts from
the 90-second master.

| Story | Musical mechanism | Possible vocal or jingle idea |
| --- | --- | --- |
| Fergie time | The impossible clock; fixed tempo with apparent acceleration | Sparse count or one dry line: “The clock says late. The record says wait.” |
| Ronaldo / Best | One motif played forty years apart in two contrasting timbres | “Same number. Same final. Forty years.” |
| Eleven days in May | Three harmonic doors or three increasingly compressed cadences | “Eleven days. Three turns. No margin.” |
| Fortress Old Trafford | A bass figure that repeatedly absorbs and redirects impacts | A low two- or three-note mnemonic; words may be unnecessary |
| Chelsea 5–6 | An additive metre that reaches eleven attacks before resolving | “Eleven goals. One surviving line.” |

The words should behave like titles or punctuation, not narration. One line,
refrain or brand sign-off is more promising than a verse/chorus song competing
with the edit.

### 2. `/stories` listening editions

Each story could offer an explicit **Play the pattern** control near its opening.
The audio would be a 20–40 second composed interpretation of the story rather
than a looping background track.

Useful models include:

- a one-shot cue synchronised to the central visual proof;
- a short instrumental theme followed by a single spoken or sung proposition;
- a user-triggered “audio caption” that sonifies the pattern while highlighting
  corresponding evidence;
- a story theme that returns, transformed, at the end of the page.

This should be opt-in, work fully without sound, expose a pause/mute control and
respect reduced-motion and data-saving preferences. Avoid continuous ambient
music underneath reading.

### 3. A Red Thread sonic mnemonic

The mnemonic must be designed upstream of the existing story music. It is not a
two-to-four-second extract from Dangerous minimalism, Bass-clarinet pursuit, The
impossible clock or the current film score. Those are useful story mechanisms;
they do not define the brand.

The product's smallest audible proposition is:

> Two pieces of evidence become one intelligible thread.

The emotional movement is **disturbance → connection → recognition → onward**.
The opening should be dry, exact and slightly enigmatic. Warmth arrives when the
relationship becomes perceptible. The ending should continue beyond the visual
resolution rather than announce victory or closure.

#### Primary territory: Two Marks, One Thread

Start with the following 2.5-second grammar:

| Time | Event | Meaning |
| --- | --- | --- |
| 0.00s | One dry, close evidence mark | A fact enters the record |
| 0.45s | A second, slightly distant mark | A separate fact answers it |
| 0.55–1.75s | A narrow tone travels between them | The evidence trail forms |
| 1.75s | Contact reveals a compact warm interval | The connection becomes intelligible |
| 1.75–2.50s | One fine resonance continues | The thread remains open |

The fixed identity is the spacing of the two marks, the contour of the travelling
tone, the interval revealed at contact and the continuing resonance. Material,
scale and arrangement are variable. This is a sonic behaviour before it is a
melody or an instrument choice.

The first matched audition should keep that grammar fixed across three executions:

1. **Human / tactile:** muted physical marks, a tensioned-string or breath-like
   filament and a warm acoustic contact.
2. **Forensic / precise:** dry archive ticks, a pure moving partial and a compact
   tuned proof tone.
3. **Temporal / uncanny:** a distant first mark and immediate second mark, with
   a travelling line that briefly appears to reverse before connecting them.

The test is whether listeners still perceive the same Red Thread action when the
material changes. It is not a vote for the most attractive instrumental palette.

**Initial decision, 13 July 2026:** Candidate A, **Human / tactile**, was selected
as the strongest of the three matched executions in the principal blind listen.
This selects a material direction for refinement; it does not yet demonstrate
that listeners consistently perceive the intended two-marks-and-connection
action. The next test should stay inside this family and compare small structural
variations rather than reopening the palette bake-off.

The second-round audition keeps Candidate A as its control and changes one
structural emphasis at a time:

- **A1 · Clearer connection:** make the two marks and the moment the filament
  joins them more legible.
- **A2 · Warmer recognition:** give the contact interval more human warmth
  without turning it into a sentimental cadence.
- **A3 · Stronger onward:** let the fine final resonance carry more of the
  identity after contact.

All four review files are loudness-matched. Choose first on whether the action is
clearer than the control; palette preference is no longer the question.

#### Why this territory

Famous signatures solve different jobs. Intel makes an invisible component
noticeable with a compact five-note packet; Netflix marks the threshold into a
world; THX demonstrates its promise through convergence; Mastercard holds a
melodic identity across many arrangements; and the Champions League anthem turns
a repeated ceremonial moment into prestige. Red Thread should do something
different: **reveal a connection**.

Useful references:

- [Intel's three-second, five-note signature](https://timeline.intel.com/1995/the-intel-bong)
- [Netflix retaining its sound while evolving the ident](https://about.netflix.com/en/news/your-new-netflix-ident-animation-cue-netflix-sound)
- [THX describing the Deep Note as a link across its history](https://www.thx.com/about/)
- [Mastercard's adaptable sound architecture](https://newsroom.mastercard.com/news/press/2019/february/sound-on-mastercard-debuts-sonic-brand/)
- [The Champions League anthem's fixed ceremonial placement](https://www.uefa.com/uefachampionsleague/news/022d-0e1636f1244a-c916aa410dad-1000--uefa-champions-league-anthem/)
- [Research distinguishing sonic-logo recognition from sung recall](https://www.repository.cam.ac.uk/items/903c50f3-6d66-4721-af94-7c037073b139)

The mnemonic could close films, open story singles and accompany selected motion
marks. It should survive on phone speakers, remain recognisable at restrained
volume and avoid resembling a broadcaster ident, betting product, club anthem or
generic premium-tech confirmation sound.

## Less-obvious opportunities

### Data sonification as evidence

Use pitch, density, position or rhythm to encode a real distribution rather than
adding decorative music. Examples include late goals sounding closer together as
the clock compresses, home unbeaten runs accumulating into a stable low interval,
or the same player pattern recurring in a different instrumental register forty
years later.

The mapping must be explainable and deterministic. If listeners cannot learn
what a sound represents, it is atmosphere rather than evidence.

### Audible matchflow scrubbing

On selected interactive matchflows, dragging through time could produce subtle
pitched ticks for goals, substitutions and state changes. This would make the
shape of a match tactile without reproducing crowd or commentary audio. It is a
candidate for a focused experiment, not a site-wide interaction sound system.

### Shareable audio cards

Generate a visual-and-audio card from a selected match or pattern: 8–15 seconds,
one fact, one deterministic sonification and the brand mnemonic. This could make
sharing a record feel authored without requiring a full video edit every time.
Templates must limit the number of possible audio combinations so the result
still feels composed.

### “Hear the pattern” comparison mode

For comparisons such as Best and Ronaldo, allow the same motif to be auditioned
through two eras, players or statistical shapes. The interaction would make
similarity and difference audible, then reveal the underlying facts. This is
more distinctive than placing a song beneath a comparison page.

### Editorial chapter punctuation

Use sub-second or two-second cues only at meaningful state changes: opening an
archive layer, completing a loop, resolving a match receipt or pulling a new
thread. A small, related vocabulary could make screen recordings and future
motion work recognisably Red Thread without turning the website into a noisy
interface.

### Short-form recurring formats

Develop repeatable editorial formats with their own sonic rule:

- **The clock:** 15–30 seconds built around time distortion.
- **The echo:** one motif passed between two seasons or players.
- **The receipt:** a dry factual line followed by the evidence and mnemonic.
- **Eleven:** eleven rapid events encoded as one accumulating rhythm.
- **Pull a thread:** a surprising fact opens into its connected story.

Consistent formats are more likely to build recognition than giving every clip a
new genre.

### Human voice without full songs

The vocal can be treated as an instrument or editorial signature rather than a
lyric track. Options include one deadpan proposition, a sung three-word hook, a
count that reveals structure, or the final “Pull a thread” sign-off. Testing
different voices against the same cue will reveal whether the character comes
from writing, performance or music.

Avoid faux commentary, terrace voices and copy written merely to rhyme.

## Recommended experiment sequence

1. Generate the three matched **Two Marks, One Thread** treatments, record their
   prompts and hashes, and test the shared action before discussing palette.
2. Test the candidates blind on phone speakers, then pair each with the Threadline
   motion to check whether sound and image describe the same event.
3. Use the three exported account songs as story-mechanism winners and record
   their source metadata and hashes.
4. Choose one story for each mechanism and cut picture to music, rather than
   judging audio in isolation.
5. For each winning instrumental, test three vocal loads: no voice, one line and
   a short repeated hook.
6. Prototype one opt-in `/stories` “Play the pattern” experience.
7. Only then decide whether the 90-second film needs a newly extended score or
   should remain its own musical object.

The first three story prototypes should be Fergie time with The impossible
clock, Ronaldo/Best with Bass-clarinet pursuit, and Eleven days in May with
Dangerous minimalism. This gives each promising mechanism a subject it can
actually explain.

The initial vocal-load bake-off is now generated by
`npm run video:audio:story-singles`. Its nine review files and manifest live in
`public/video/audio/story-singles/vocal-tests/`, including
`index.html` for grouped listening and `manifest.json` for source, voice,
timing and SHA-256 provenance. The voice tests use one dry line or a repeated
hook; they are not intended as final singing or narration decisions. The current
decision is to use the instrumental version for all three story singles and
retain the voice-load mixes only as comparison records.

## Evaluation rubric

Judge the next tests against these questions:

1. Without seeing the logo, do listeners describe two things connecting, a trail
   forming, something clicking into place or a resolution that keeps going?
2. Does the shared action survive all three material treatments?
3. Is the signature recognisable rather than merely pleasant or hummable?
4. Does it feel precise without becoming cold, corporate or technological?
5. Is it still clearly Red Thread without a football crowd, chant or anthem?
6. Does it work on phone speakers, in mono and at restrained loudness?
7. Does it leave enough room for dialogue and on-screen evidence?
8. Does the paired visual remain understandable and complete when muted?
9. Are generation prompt, model, rights, source asset and final edit recorded?

## Guardrails

- No autoplay on editorial pages.
- No broadcast commentary, match audio or unlicensed crowd recordings.
- No generated audio presented as authentic historical sound.
- No essential fact should exist only in audio.
- Provide captions or a textual equivalent for any meaningful words.
- Keep music, voice, effects and atmosphere separable wherever the workflow
  permits.
- Record prompts, generation settings, selected takes, edits and final hashes.
- Prefer a small coherent sonic vocabulary over unrelated genre experiments once
  exploration moves into production.
