# Red Thread film releases

Composition names are semantic and stable. A release is identified by its edition, source commit, data hash and audio hash—not by renaming the React component.

## Current source of truth

- Edition: `european-master-90`
- Historical iteration: v8 copy-reviewed working state
- Composition: `red-thread-european-master-90`
- Output: `output/video/releases/european-master-90/film.mp4`
- Audio plan: `european-score-v3`

## Additional editions

- `match-timeline-24`: restrained five-match timeline including Chelsea 6–5 in 1954.
- `red-thread-loop-prototype`: archived visual study; not a story or release reference.

Old numbered renders and review folders remain iteration records. Do not use their filenames to infer the current source implementation.

## Release checklist

1. Run `npm run video:prepare` and the video TypeScript check.
2. Render representative stills and compare the approved master before a structural release.
3. Render the named edition, then record its Git commit, data fixture hash, audio asset hash, duration and dimensions in the release folder.
4. Update this file only after visual and audio review.
