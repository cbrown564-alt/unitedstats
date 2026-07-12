# Red Thread film releases

Composition names are semantic and stable. A release is identified by its edition, source commit, data hash and audio hash—not by renaming the React component.

## Current source of truth

- Edition: `european-master-90`
- Historical iteration: v8 copy-reviewed working state
- Composition: `red-thread-european-master-90`
- Output: `output/video/releases/european-master-90/film.mp4`
- Audio plan: `european-score-v3`

## Additional editions

- `european-post-punk-song-90`: selected soundtrack edition using ElevenLabs
  Continuous Take 5 through the stable `post-punk-song` audio plan.
- `match-timeline-24`: restrained five-match timeline including Chelsea 6–5 in 1954.
- `red-thread-loop-prototype`: archived visual study; not a story or release reference.

Old numbered renders and review folders remain iteration records. Do not use their filenames to infer the current source implementation.

## Selected soundtrack release — post-punk song

- Selection date: 2026-07-12
- Edition: `european-post-punk-song-90`
- Composition: `red-thread-european-post-punk-song-90`
- Output: `output/video/releases/post-punk-song-90/film.mp4`
- Audio plan: `post-punk-song`
- Selected performance: ElevenLabs Continuous Take 5
- Audio asset: `public/video/audio/elevenlabs-post-punk-finals/post-punk-song-continuous-take-5.mp3`
- Source commit at render: `2f247d1` plus the documented working-tree audio-plan selection
- Data fixture SHA-256: `EA1C5EDD42F219990600920D5DF7D07648C9BB021BA48C02709ED3C69B816C60`
- Audio SHA-256: `55909658D259E285C48CEA093EC4B9F0ACCEE9FC6F654DE152E9C1A9BC8ECB79`
- Film SHA-256: `49FF7B7F3F9CAA1CA587F612F2CEABE3050507E8C9F90D59DACC4C320C38C226`
- Delivery: H.264 video with AAC 48 kHz stereo audio, 1920×1080, 30 fps,
  90.048 seconds, 26,680,524 bytes
- Verification frame: `output/video/releases/post-punk-song-90/verification-frame.png`

Continuous Takes 1–6 share the exact same composition plan. Take 5 was chosen
for its stochastic vocal and instrumental performance; changing the selected
take requires an explicit update to `video/audio/plans.ts` and a fresh render.

## Release checklist

1. Run `npm run video:prepare` and the video TypeScript check.
2. Render representative stills and compare the approved master before a structural release.
3. Render the named edition, then record its Git commit, data fixture hash, audio asset hash, duration and dimensions in the release folder.
4. Update this file only after visual and audio review.
