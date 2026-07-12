# Red Thread film compositions

The render workspace for `docs/SIZZLE-REEL-SCOPE.md`.

## European master — 90 seconds

`red-thread-european-master-90` keeps the four-card opening from the approved v8 cut, then
restores the fuller v5 middle, with the Fergie act using the stories shared
countdown:

1. opens four data-backed match signatures along the chronological line
   (1886 first XI, 1968 extra-time burst, 1999 bench reversal, 2008 penalty
   constellation) inside the lean 18s window;
2. reaches Ronaldo in 2008, then draws a complete time loop through Best in
   1968 and returns through 1999;
3. lands four rhyme facts: European Cup, both No. 7s scoring in the final,
   Ballon d’Or, and both peaking in their fifth United season;
4. enters the Treble as the eleven-day fuse (three jeopardy nights → every
   match-winner from the bench);
5. runs the stories/fergie-time shared countdown (one clock, six strikes),
   then blooms into all recorded post-85′ goals;
6. enters Fortress OT as a dense lead-held wall inside the stadium card
   (three rescued cracks);
7. finishes on the match field resolving into a real mobile capture of the
   1954 Chelsea 5–6 United match—scoreline, matchflow and lineup—beside
   “Pull a thread.”

`generated-master-data.json` is rebuilt from the canonical database by
`scripts/generate-video-data.ts`; it is not a hand-authored particle field.

## Loop prototype — 14 seconds

`red-thread-loop-prototype` is the superseded first proof. It remains available
for visual comparison, but its simultaneous Best/Ronaldo reveal broke chronology
and compressed the rhyme to the shirt/final goals. Do not use it as the story
reference.

## Preview and render

```bash
npm run video:studio
npm run video:render:opening
npm run video:render
npm run video:render:post-punk:song
```

The factual data fixture and edition contracts are checked by `npm run video:prepare`. The master score
is an authored, timestamped Lyria 3 Pro generation cached at
`public/video/audio/master-v3.mp3`; regenerate it deliberately with
`npm run video:score:force`, not on every render. Picture splices the cached 84s
score into its close tail to cover the 90s cut, using a short crossfade at the
edit and a clean fade at the end. V8 deliberately uses the score alone: the
older procedural SFX stems remain as iteration records but are not mixed into
the master.
The current master is written to `output/video/releases/european-master-90/film.mp4`; use
`npm run video:render:prototype` only to reproduce the earlier 14-second study.

## Selected post-punk soundtrack edition

The approved vocal soundtrack is **Continuous Take 5**, selected on 12 July
2026 from six stochastic renders of the same ElevenLabs `music_v2` composition
plan. The plan uses a continuous 122 BPM electronic post-punk arrangement with
a cool British spoken-sung vocal, dry motorik drums, mono bass and clipped
guitar harmonics. The selection decision was based on the generated
performance—voice, diction, phrasing, instrumental interpretation and mix—not
on a different prompt.

`post-punk-song` now resolves to
`public/video/audio/elevenlabs-post-punk-finals/post-punk-song-continuous-take-5.mp3`
in `audio/plans.ts`. Render the selected edition with
`npm run video:render:post-punk:song`; its release output is
`output/video/releases/post-punk-song-90/film.mp4`.

The signed-off 30-second reference and all full-length audition takes remain in
`public/video/audio/elevenlabs-post-punk-finals/index.html` as decision records.
They are not mixed into the selected film.

## Source contract

- `generated-master-data.json` is the frozen master data fixture.
- `data/match-library.ts` declares the factual matches available to films.
- `editions/` holds timing, copy, match selection and signature choices. The
  generated fixture contains scores, events, lineups and player media only.
- `audio/plans.ts` holds score edits, gains and fades independently of picture.
- `film-data.ts` is the earlier prototype's claim and asset manifest.
- The Best monument is CC0 (Hans Peters / Anefo).
- The Ronaldo monument is CC BY 2.0 (Gordon Flood).
- No broadcast footage, commentary, crowd recording or commercial music is used.
- The master uses an instrumental Lyria 3 Pro score generated from the authored
  structure in `scripts/generate-video-score.mjs`; its prompt and provenance are
  stored alongside the audio in `master-v3.json`.
- The selected post-punk edition uses ElevenLabs `music_v2` Continuous Take 5.
  Its shared composition plan and the stochastic bake-off manifest are stored in
  `scripts/generate-elevenlabs-post-punk-finals.mjs` and
  `public/video/audio/elevenlabs-post-punk-finals/manifest.json`.
- Superseded procedural SFX stems and their cue manifests remain under
  `public/video/audio/` for provenance and comparison. They are intentionally
  excluded from the European master after the final sound-design audit found that their tonal
  ticks and impacts competed with the score rather than clarifying the picture.
- Captions for mute/review playback: `public/video/captions/master-v8.vtt`; the
  silent composition burns the same cue list on-screen.
- Master: 1920×1080, 30 fps, 2,700 frames / 90 seconds.
- Prototype: 1920×1080, 30 fps, 420 frames / 14 seconds.
