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

There are three relevant soundtrack states in the repository.

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

### Reviewed ElevenLabs release

The documented post-punk release uses ElevenLabs `music_v2` **Continuous Take
5**:

`public/video/audio/elevenlabs-post-punk-finals/post-punk-song-continuous-take-5.mp3`

It was selected from six stochastic performances of one composition plan. The
plan uses a continuous 122 BPM electronic post-punk arrangement, dry motorik
drums, mono bass, clipped guitar harmonics and a British spoken-sung vocal. The
review decision chose the best performance, diction and mix rather than a new
composition.

The release record, including hashes, is in `video/RELEASES.md`.

### Current code selection

The current `post-punk-song` audio plan points to the later ElevenLabs
**Factory machine-funk** treatment:

`public/video/audio/elevenlabs-manchester-bakeoff/01-factory-machine-funk.mp3`

This is a 90-second, 118 BPM Manchester-coded post-punk treatment with melodic
electric bass, rigid drum machine, clipped guitar harmonics, mono-synth pulses,
dub space and a low spoken-sung British vocal. It is the current source
selection for a fresh `video:render:post-punk:song` render.

The code selection and the reviewed release record therefore describe different
audio assets. That is acceptable during exploration, but the next approved
render should reconcile `video/audio/plans.ts`, `video/README.md`,
`video/RELEASES.md`, `video/SOURCES.md` and the published film record.

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

Test a two-to-four-second brand sound derived from the product idea rather than
from football culture. The best candidates are:

- the missing beat from Dangerous minimalism resolving when the thread appears;
- the three-note Bass-clarinet pursuit motif passed between timbres;
- a short mechanical acceleration from The impossible clock ending in one warm
  pitched thread tone.

The mnemonic could close films, open story singles and accompany selected motion
marks. It should survive on phone speakers, remain recognisable at low volume and
avoid resembling a broadcaster ident, betting product or club anthem.

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

1. Generate several variations of the three promising 30-second mechanisms,
   keeping each mechanism recognisable across takes.
2. Choose one story for each mechanism and cut picture to music, rather than
   judging audio in isolation.
3. For each winning instrumental, test three vocal loads: no voice, one line and
   a short repeated hook.
4. Extract candidate two-to-four-second mnemonics and test them blind on phone
   speakers.
5. Prototype one opt-in `/stories` “Play the pattern” experience.
6. Only then decide whether the 90-second film needs a newly extended score or
   should remain its own musical object.

The first three story prototypes should be Fergie time with The impossible
clock, Ronaldo/Best with Bass-clarinet pursuit, and Eleven days in May with
Dangerous minimalism. This gives each promising mechanism a subject it can
actually explain.

## Evaluation rubric

Judge the next tests against these questions:

1. Can the central idea be described in one sentence?
2. Is there a recognisable moment within the first three seconds?
3. Does the sound reveal or embody the story rather than just matching its mood?
4. Does it leave enough room for on-screen evidence?
5. Is it still clearly Red Thread without a football crowd, chant or anthem?
6. Does it work on phone speakers and at restrained loudness?
7. Can a useful two-to-four-second mnemonic be extracted from it?
8. Does the clip remain understandable and complete when muted?
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
