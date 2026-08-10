# Media sprint capability audit

Date: 2026-08-10

## Corrected capability map

| Record or decision | Classification | Correction |
|---|---|---|
| First-wave ElevenLabs request failed because `.env` contained an API key ID | **False block: local credential precedence** | A usable centrally managed key existed. `.env.local` precedence was corrected; read-only usage probes, generation and normalization then succeeded. Central ElevenLabs is an available route. |
| Audio assets marked `reserve pending listening` | **Real review gate, not capability block** | The files exist and validate. Listen before promotion or refinement. Do not regenerate merely because this project cannot audition them autonomously. |
| “Stems remain unavailable” in `AUDIO-GAP-AUDIT.md` | **Real provider/output limitation unless a stem-capable export is selected** | ElevenLabs sound-generation returned mixed files. Do not call EQ bands stems. Revisit only with a documented provider stem export. |
| No audio added to the final transition batch | **Intentional skip** | Evidence lock, Loop and Spin-off cues already cover those functions. Another cue would duplicate the reserve. |
| Phase-two motion components were rendered locally and deterministically | **Local-access omission, not a Gemini capability block** | Central Gemini web Video can complete 10-second jobs. Local absence of a callable video tool must not close the lane. Route approved jobs centrally. |
| Temporary Gemini web Video service errors | **Retryable provider condition** | Retry once within the bounded job. Pause only after repeated failure; do not classify a temporary error as unavailability. |
| No fabricated portraits, matches, kits, crowds, grounds, commentary or archive scenes | **Real policy/source/rights boundary** | This remains mandatory. Gemini may animate abstract identity material, not invent documentary history. Licensed photographs remain source evidence and must not be made to perform fabricated action. |

No sprint checkpoint explicitly claimed that Gemini web Video was impossible. The
misunderstanding is visible in the untested central-video lane: motion was treated as
local-only even after the reusable identity components existed.

## Remediation queue

All jobs are non-shipping experiments. Submit one at a time to **central Gemini web
Video**, allow one retry for a temporary service error, strip any returned audio, and
retain the existing deterministic MP4 plus PNG fallback as the safe alternative.

### GVID-01 — Follow → evidence handoff

- **Source asset:** `output/media-sprint/transitions/transition-evidence-handoff-fallback.png`
- **Intended use:** bridge one verified story segment into the next through a proof point.
- **Prompt:** “Create a 10-second, text-free abstract motion study from this source frame. One uniform devil-red line travels left to right across a warm near-black paper/emulsion field, lands once on the small gold proof point, holds briefly, then continues as exactly one unbroken line. Preserve sparse pale evidence ticks and large negative space. Quiet tactile analogue movement, restrained grain, no camera spectacle. No people, faces, footballers, kits, balls, grounds, crowds, trophies, match scenes, documentary imagery, words, numbers, logos, crests, smoke, neon or invented archive material. If audio is generated, treat it as removable and do not make it resemble match audio.”
- **Fallback:** existing deterministic `transition-evidence-handoff.mp4` and PNG.
- **Destination:** central Gemini web Video.

### GVID-02 — Loop fold and onward return

- **Source asset:** `output/media-sprint/transitions/transition-loop-fold-fallback.png`
- **Intended use:** bridge a chronological story into a verified cross-era comparison, then visibly return to the onward record.
- **Prompt:** “Create a 10-second, text-free abstract motion study from this source frame. Exactly one thin devil-red line enters from the left, folds into one elegant loop around the distant comparison space, touches the gold connection point, returns to the same path and exits right. The completed onward exit must remain legible. Warm near-black paper/emulsion, sparse off-white evidence ticks, restrained physical grain. No infinity symbol, logo, chart, map, people, faces, football imagery, grounds, crowds, trophies, documentary scenes, text, numbers, smoke, neon or fantasy portal. Any generated audio is removable and must not imply a real match.”
- **Fallback:** existing deterministic `transition-loop-fold.mp4` and PNG.
- **Destination:** central Gemini web Video.

### GVID-03 — Receipt pass-through

- **Source asset:** `output/media-sprint/transitions/transition-receipt-pass-fallback.png`
- **Intended use:** move from authored interpretation back into the auditable fixture record.
- **Prompt:** “Create a 10-second, text-free abstract motion study from this source frame. One devil-red line enters an abstract warm-charcoal evidence frame, causes three simple rule marks to resolve, then exits right as the same unbroken line. The frame is a generic proof object, not a literal historical document. Keep motion precise, quiet and tactile with a stable readable final state. No words, digits, badges, logos, real paper records, people, faces, footballers, kits, balls, stadiums, crowds, trophies, match scenes or fabricated documentary imagery. Remove or disregard any generated audio.”
- **Fallback:** existing deterministic `transition-receipt-pass.mp4` and PNG.
- **Destination:** central Gemini web Video.

## ElevenLabs queue decision

No remedial ElevenLabs generation is queued. Central ElevenLabs is proven available,
but the current eight masters and review proxies already cover archive bed, pressure,
evidence lock, thread crossing, Follow, Loop and Spin-off/return. The next bounded
ElevenLabs job should be selected only after listening identifies a specific missing
function. This is scope control, not an access block.
