# Pull the Thread end card

**Status:** approved and promoted in `european-post-punk-song-90`
**Last updated:** 13 July 2026

## Purpose

Document the promoted **Pull the Thread** ending in the 90-second Factory
machine-funk film. It remains a film-specific sonic treatment rather than a
replacement for the selected Human / tactile brand mnemonic.

The closing action should feel physical: a hand finds the thread, tension builds,
the filament releases, the evidence receipt lands and one resonance continues.
The sound and motion should describe the same action without requiring lyrics.

## Problem in the current ending

The current animation draws the thread diagonally with a smooth interpolation.
It has no stored tension or release, so the pull reads as a layout transition.

The apparent overshoot and half-empty phone screen have a specific geometric
cause. The source still is a 390×844 phone viewport. It is displayed at 380px
wide inside an 816px-high viewport, leaving only about 6px of legitimate vertical
travel, but the animation translates it upward by 390px. The source therefore
ends long before the viewport does.

## Motion treatment

The revised motion uses a full-page mobile capture but deliberately stops before
the page bottom, preserving the strongest composed phone frame:

1. **Catch, frames 2560–2582:** the pull begins slowly and the filament bows as
   tension accumulates.
2. **Release, frames 2582–2620:** the pull accelerates decisively toward the
   receipt.
3. **Contact, around frame 2620:** the proof dot lands at the phone edge and a
   restrained contact ring appears.
4. **Settle, frames 2620–2654:** one small damped recoil moves across the thread;
   it does not repeat or leave the endpoint.
5. **Phone lands, around frame 2644:** the phone reaches full size and holds the
   top of the page with the scoreline visible. No page movement happens during
   the landing.
6. **Mobile scroll, frames 2645–2658:** only after landing, the page moves through
   the match timeline and Starting XI to the selected intermediate position.
7. **Final hold, frames 2658–2700:** the phone stops completely. The Threadline
   finishes independently while the phone composition remains unchanged.

The recoil is intentionally small. It should communicate tension in a physical
filament, not a playful UI bounce or elastic logo reveal.

## Selected sonic cue

The first cue was rejected: its series of little clicks reads as shells or small
mechanical parts. Three four-second, level-matched candidates tested a smoother,
textile-first action:

| Candidate | Material | Intended distinction |
| --- | --- | --- |
| 01 · Wool draw | Soft wool yarn through fingertips | Warmest, softest and least percussive |
| 02 · Woven cloth | Dense cotton cloth against cloth | Broadest friction body and strongest weave |
| 03 · Thread through felt | Cotton thread through thick felt | Finest filament detail and clearest tension point |

**Thread through felt is selected.** It enters the working film at frame 2550 /
85.0s, at 0.34 gain over the Factory machine-funk ending. Its tension point
lands close to the Threadline contact. The review files are normalized to
−18 LUFS and contain no voice, beat, crowd, anthem, notification sound,
exaggerated whoosh or cartoon boing.

Files:

- audition page: `public/video/audio/pull-the-thread/samples/index.html`
- review samples: `public/video/audio/pull-the-thread/samples/*-review.mp3`
- prompts and provenance: `public/video/audio/pull-the-thread/samples/manifest.json`
- generator: `scripts/generate-pull-the-thread-cue.mjs`

Regenerate deliberately with:

```bash
npm run video:audio:pull-the-thread -- --force
```

## Evaluation

Judge the combined ending, not the sound in isolation:

1. Does the pull feel stored and released rather than merely drawn?
2. Does the sound reinforce the same catch, tension, contact and continuation?
3. Is the recoil physical and restrained rather than playful?
4. Does the phone stop on the selected match-and-lineup composition without
   drifting during the final second?
5. Does the final frame feel composed and settled before cut?
6. Does the cue add identity without fighting the existing score?

This treatment remains specific to the film ending. It should not automatically
become a site interaction sound.
