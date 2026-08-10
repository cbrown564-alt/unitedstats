# First-wave audio gap audit

Date: 2026-08-09

## Existing library

- 82 MP3 files, five WAV files and multiple review manifests are present under `public/video/audio/`.
- Long-form soundtrack exploration is already broad: post-punk finals, Manchester variants, wide bake-off, convergence bake-off and three lyric treatments.
- Signature punctuation is already comparatively mature: the Red Thread mnemonic and refinement set, Pull the Thread textile candidates, procedural film SFX, and story-single vocal tests.
- Existing releases are story-specific and several audition directories retain near-neighbour iterations as decision records.

## Functional gaps worth generating

1. **Reusable seamless instrumental beds.** Existing full scores are tied to the 90-second European film, its lyrics, or a fixed act structure. The kit lacks short neutral loops that can sit under future data-led stories.
2. **Neutral evidence punctuation.** Existing mnemonic cues are brand-specific. A quieter cue is needed for an ordinary verified-stat reveal without turning every reveal into a sonic logo.
3. **Abstract late-pressure cue.** The library needs tension that cannot be mistaken for broadcast or depicted-match audio and does not rely on a literal clock or heartbeat.
4. **General transition material.** Pull the Thread is an end-card decision. A shorter fibre/paper crossing is needed for ordinary movement between photograph, data and receipt.
5. **Stems remain unavailable.** The existing ElevenLabs sound-generation endpoint returns mixed assets. True stems require a provider/export path that exposes them; do not imply that derived EQ bands are stems.

## First queue

- Two distinct 30-second seamless beds: tactile archive pulse and sparse industrial-dub ledger.
- Two short cues: evidence lock and late pressure.
- One tactile thread/paper transition.

All five prompts are recorded in the sprint manifest. Generation completed on 2026-08-09 after wiring the established central local credential into ignored `.env.local`; the stale identifier in `.env` remains untouched. The batch produced five stereo MP3 masters and five level-normalized review copies for 803 provider-reported units. Assets remain `unreviewed` until auditioned.

## Capability correction — 2026-08-10

The earlier credential failure was a **local configuration misunderstanding**, not
an ElevenLabs provider block. A centrally managed usable credential existed, the
read-only account probe succeeded, and the sprint subsequently generated and
normalized all eight queued audio assets. Do not describe ElevenLabs audio as
unavailable merely because a project-local process cannot see the central secret
or callable route. Route the bounded job through the central ElevenLabs workflow.

Two limits remain real:

- The existing sound-generation output is a mixed file. True stems remain a
  provider/export capability question; fabricated frequency splits are not stems.
- `reserve pending listening` is a review gate, not an access failure. It should be
  resolved by auditioning the existing proxies before requesting another similar
  generation.
