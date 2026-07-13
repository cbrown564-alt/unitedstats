# Red Thread film releases

Composition names are semantic and stable. A release is identified by its edition, source commit, data hash and audio hash—not by renaming the React component.

## Current source of truth

- Edition: `european-post-punk-song-90`
- Historical iteration: Factory machine-funk with promoted Pull the Thread ending
- Composition: `red-thread-european-post-punk-song-90`
- Output: `output/video/releases/post-punk-song-90/film.mp4`
- Audio plan: `post-punk-song`

## Additional editions

- `european-master-90`: instrumental Lyria v3 reference edition retained at
  `output/video/releases/european-master-90/film.mp4`.
- `match-timeline-24`: restrained five-match timeline including Chelsea 6–5 in 1954.
- `red-thread-loop-prototype`: archived visual study; not a story or release reference.

Old numbered renders and review folders remain iteration records. Do not use their filenames to infer the current source implementation.

## Current soundtrack release — post-punk song

- Selection date: 2026-07-13
- Edition: `european-post-punk-song-90`
- Composition: `red-thread-european-post-punk-song-90`
- Output: `output/video/releases/post-punk-song-90/film.mp4`
- Audio plan: `post-punk-song`
- Selected treatment: ElevenLabs Factory machine-funk with Thread through felt end-card cue
- Base audio asset: `public/video/audio/elevenlabs-manchester-bakeoff/01-factory-machine-funk.mp3`
- End-card audio asset: `public/video/audio/pull-the-thread/samples/03-thread-through-felt-review.mp3`
- Source revision at render: `933a392` plus the documented working-tree end-card changes
- Data fixture SHA-256: `EA1C5EDD42F219990600920D5DF7D07648C9BB021BA48C02709ED3C69B816C60`
- Base audio SHA-256: `E5C26295269F51ED3BB2B840B46E6909FC6287C1CB8726FC751404BAF12CDFD9`
- End-card cue SHA-256: `42BC9C7DE110B3AF282A7E8F484BA6BDB0C852ABBB5136256386DA0F1075D76E`
- Film SHA-256: `0FC16C6C8846835E58ACBB873B52C6409482424F99B311332AD4B8461005FE90`
- Delivery: H.264 video with AAC 48 kHz stereo audio, 1920×1080, 30 fps,
  90.048 seconds, 27,018,800 bytes
- Verification frame: `output/video/releases/post-punk-song-90/verification-frame.png`

The earlier Continuous Takes 1–6 remain comparison records. Changing the current
treatment requires an explicit update to `video/audio/plans.ts` and a fresh
render.

The Pull the Thread ending was approved and promoted on 13 July 2026. The phone
lands on the Chelsea 5–6 scoreline, scrolls to the composed timeline-and-lineup
frame, then holds while the Threadline finishes. **Thread through felt** runs as
the selected four-second tactile cue over the Factory machine-funk ending.

## Release checklist

1. Run `npm run video:prepare` and the video TypeScript check.
2. Render representative stills and compare the approved master before a structural release.
3. Render the named edition, then record its Git commit, data fixture hash, audio asset hash, duration and dimensions in the release folder.
4. Update this file only after visual and audio review.
