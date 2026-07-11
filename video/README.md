# Red Thread film compositions

The render workspace for `docs/SIZZLE-REEL-SCOPE.md`.

## Master v4 — 84 seconds

`red-thread-master-v4` is the motion- and sound-refined master:

1. follows the chronological line from the first match in 1886 through 1909 and
   1954, giving 1968, 1999 and 2008 special European-Cup status;
2. reaches Ronaldo in 2008, then draws a complete time loop through Best in
   1968 and returns through 1999;
3. lands the full rhyme: European Cup, final goal, Ballon d'Or and club peak in
   each player's fifth United season;
4. returns to 1999 and enters an escalating eleven-day Treble fuse: each danger
   score lands before the substitute changes it, the gaps contract from six
   days to four, and Barcelona holds at 90 minutes before the double reversal;
5. expands three Fergie-time echoes into all 671 recorded post-85′ goals;
6. expands again into the 395-match verifiable Fortress record;
7. finishes on all 6,028 matches and the line continuing beyond now.

Master v3 remains at `output/video/red-thread-master-v3.mp4` as the comparison
cut that used the calmer Treble orbit.

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
npm run video:render
```

The data fixture is rebuilt locally by `npm run video:prepare`. The master score
is an authored, timestamped Lyria 3 Pro generation cached at
`public/video/audio/master-v3.mp3`; regenerate it deliberately with
`npm run video:score:force`, not on every render. The current master is written
to `output/video/red-thread-master-v4.mp4`; use
`npm run video:render:prototype` only to reproduce the earlier 14-second study.

## Source contract

- `generated-master-data.json` is the frozen master data fixture.
- `film-data.ts` is the earlier prototype's claim and asset manifest.
- The Best monument is CC0 (Hans Peters / Anefo).
- The Ronaldo monument is CC BY 2.0 (Gordon Flood).
- No broadcast footage, commentary, crowd recording or commercial music is used.
- The master uses an instrumental Lyria 3 Pro score generated from the authored
  structure in `scripts/generate-video-score.mjs`; its prompt and provenance are
  stored alongside the audio in `master-v3.json`.
- Master: 1920×1080, 30 fps, 2,520 frames / 84 seconds.
- Prototype: 1920×1080, 30 fps, 420 frames / 14 seconds.
