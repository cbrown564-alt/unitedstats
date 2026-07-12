# ElevenLabs audio range and soundtrack recommendation

Research checked 12 July 2026 against current ElevenLabs documentation.

## What ElevenLabs can produce

- **Music v2:** instrumental or vocal tracks from 3 seconds to 5 minutes, with section-by-section composition, mid-track style changes, inpainting and embedded sound effects. Prompt generation is useful for exploration; structured composition plans are the better fit for a picture-locked 90-second film.
- **Sound Effects v2:** prompted effects from 0.5–30 seconds, optional seamless looping, controllable prompt adherence, with WAV 48 kHz available from the Creative UI. Useful here for filament movement, paper/projector texture, restrained impacts and room-tone beds.
- **Voice:** narration, dialogue and multi-speaker voiceover are available, but are not recommended for this film. Its typography is already the narrative voice; spoken copy would duplicate information and reduce pace.
- **Rights caveat:** ElevenLabs describes Music as cleared for broad commercial use, but plan-specific terms apply and its earlier launch material explicitly called out some film/TV usage as Enterprise. Confirm the applicable Music Terms for the intended distribution before release.

## Applicable soundtrack range for this film

The picture is not a conventional football montage. It is a caption-led cinematic data visualisation with a moving red filament, archival facts and five changes of dramatic state. Suitable directions therefore range from music-led to sound-design-led:

1. **Analogue forensic minimalism** — prepared piano, bowed wire, warm pulse and tape texture. Strongest overall brand candidate.
2. **Clean data pulse** — modular rhythm, soft glitches and filtered noise. Strong motion synchrony; risk of generic technology branding.
3. **Archive-mechanical soundscape** — paper, projector, pencil and metal used musically. Most distinctive; risk of insufficient emotional lift.
4. **Human momentum** — brushed drums, upright bass, felt piano and texture-only strings. Most emotional; highest risk of sports-documentary cliché.
5. **Near-silent material design** — no conventional score, only filament, impacts and rooms. A valid control candidate if all music versions overcrowd the facts.

Avoid stadium chants, commentary, whistles and literal match ambience: they imply broadcast footage and a crowd perspective the visual language does not use. Avoid heroic/triumphal scoring because the film's proposition is discovery—“pull a thread”—rather than club advertising.

## Bake-off design

Audition the same `00:38–01:08` picture window for all candidates. This contains the Treble fuse, three fact landings, a major transition and the negative-space match-clock sequence. It is more diagnostic than the atmospheric opening.

Start with four Music v2 prompt generations. Double-weight fact legibility and filament fit; reject anything below 3/5 for restraint. Expand only the winner to a 90-second composition plan matching these picture acts:

- `00:00–00:18` archive ignition
- `00:18–00:38` forty-year rhyme loop
- `00:38–00:54` eleven-day Treble fuse
- `00:54–01:14` late pressure and goal bloom
- `01:14–01:24` fortress
- `01:24–01:30` receipt / open-ended invitation

## Primary sources

- [Music overview](https://elevenlabs.io/docs/eleven-creative/products/music)
- [Music v2 composition plans](https://elevenlabs.io/docs/eleven-api/guides/how-to/music/composition-plans)
- [Compose Music API](https://elevenlabs.io/docs/api-reference/music/compose)
- [Music inpainting](https://elevenlabs.io/docs/eleven-api/guides/how-to/music/inpainting)
- [Sound Effects API](https://elevenlabs.io/docs/api-reference/text-to-sound-effects/convert)
- [Eleven Music API launch and commercial-use note](https://elevenlabs.io/blog/eleven-music-now-available-in-the-api)
