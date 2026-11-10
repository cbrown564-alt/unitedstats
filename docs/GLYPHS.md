# Thread glyphs

Red Thread's icons, event marks and small motions share one grammar: a red
thread running through a pale record, with gold beads only where something is
proven. The shipped set is **Cord** (November 2026), drawn for the lifted
charcoal canvas. The gallery is `/dev/glyphs` (development only); the earlier
exploratory lab is [`mockups/glyph-lab.html`](mockups/glyph-lab.html).

## Shipped glyphs

All three families are thin wrappers over `CordGlyph`
(`components/glyphs/cord/CordGlyph.tsx`), which holds every drawing and its
hover motion.

| Family | Component | Glyphs |
| --- | --- | --- |
| Sections | `NavIcon` (`components/nav/NavIcons.tsx`) | Stories (floodlight and loop), Discover (needle), Matches (ticket stub, stitched), Seasons (one lap), Players (shirt), Managers (spool), Opponents (overlapping records), Analytics (Elo over baseline), Transfers (splice), Data (weave), More (slack middle thread) |
| Chrome | `UtilGlyph` (`components/glyphs/UtilGlyph.tsx`) | Search (loop lens), Home (roofline), Filter (abacus), Close (woven X), Share (one thread, three beads), Sewn (tick knotted off; the copy-link confirmation) |
| Record | `RecordGlyph` (`components/glyphs/RecordGlyph.tsx`) | Darn (report a correction), Spiral (on this day), Tangle (pull a random night), Stitch (partial coverage) |
| Loading | `CordLoader` (`components/glyphs/cord/DataGlyphs.tsx`) | The needle orbiting a closed loop while filters or search load |
| Coverage | `CoverageWeave` (`components/glyphs/cord/DataGlyphs.tsx`) | One cord woven through the record for the covered share; open rows for the rest. Used by `CoverageNote` for graded counts only |
| Campaigns | `TrophyIcon`, `MedalIcon`, `TrophyGlyphFilled` (`components/CampaignIcons.tsx`) | A solid cup whose handles and stem are one cord; a medal hung from its ribbon; the cabinet cup at full tone. Monochrome in currentColor, so gold, silver and competition tones carry through |
| Facets | `FacetIcon` (`components/FacetIcon.tsx`) | The match-filter facets (competition shield, manager, player, scorer target, margin, round tag, country flag, era hourglass, venue, stadium, ground pin, date, minute) as plate plus cord |
| Rediscovery | `ThreadSignalKnot` | A slack thread tying one loop round a proven gold bead, beside a rediscovery prompt |
| Best season | `IdentityPlate`, `PlayerPlate` | A gold bead (proof) before the season, in place of a star |

## Hosts and states

- `cord-host` on a link or button: hovering or focusing it lights the cord red,
  beads gold and the plate a step brighter, and runs the glyph's motion (below).
  Hover motion only runs on hover-capable devices without reduced motion.
- `cd-lit` on a host or the glyph: always coloured. Use it for the current
  section and the primary search entry.
- `cd-now` on the glyph: run its motion once, on the state change that shows it
  (the share confirmation). Remount to replay.

## Other thread motions

| Motion | Where | Behaviour |
| --- | --- | --- |
| Sewn link | `.sewn-link` (`EvidenceLink`) | Underline thread drawn left to right, fastened with a gold bead: the link leads to proof |
| Bead switch | Players register Assists switch | A bead slides along a thread that reddens when on |
| Loose thread | `LooseThread` (`app/not-found.tsx`) | The record runs ticked to a pin, then hangs loose and frays; the pointer pulls the end. Sleeps once settled; one static frame under reduced motion |

## Rules

- A bead is gold only when it stands for something proven. Decoration uses `thread` or `pale`.
- Never draw a coverage grade that the record does not state. `CoverageWeave`
  takes real counts; prose coverage gets no mark, because it may describe a
  complete facet.
- Dashed cords never carry `pathLength`, so their dash pattern stays in user units.
- Motion follows DESIGN.md: state-based, never on load, and nothing is required
  to finish before the control can be used.

## First generation

The original set was drawn as hairline outline (red thread, pale stroke and
mask-cut crossings, coloured from `--tg-*` tokens) for the near-black canvas.
After the palette was lifted to warm charcoal those hairlines read thin and
fussy. Cord replaced every one of them, and the first-generation primitives and
styles are gone.

## Cord

Cord gives the glyphs mass. It lives in `components/glyphs/cord/`, with styles
and motion in `app/cord.css`.

### Grammar

| Primitive | Mark | Means |
| --- | --- | --- |
| `Plate` | Tonal fill (`strong` for a denser one) | The record, the thing described. Stays pale when lit |
| `Cord` | One weighted, continuous red path | The thread. It is what moves; give it `pull` for a taut shape |
| `Strand` | Thin pale line | Secondary structure, used sparingly |
| `Bead` | `gold`, `thread`, `pale`, `hollow`, `w`/`d`/`l` | A fact. Gold is still reserved for proof |
| `Beneath` | Mask-cut crossing | Over-under on any ground |

- **Optical sizing.** `CordSvg` sets the cord weight from the rendered size
  (`opticalStroke`): about 2.4 grid units at 16px, 2.15 at 20px, 1.5 at 48px,
  1.1 at 96px. Never set `--cd-sw` by hand for a square glyph.
- **One cord per glyph** where possible, so the whole glyph sews in one pass and
  the needle head can ride it.
- **Lit** (`cd-lit`, or a hovered `cord-host`): cord United red, proof beads
  gold, plate a pale warm tint that brightens on hover. The plate never turns
  red; the red thread has to stay readable against it.

### Data glyphs

Drawn from real values, never from a metaphor (`DataGlyphs.tsx`):

| Glyph | Draws |
| --- | --- |
| `MatchThread` | Score state over match time: level, up a step per United goal, down per opponent goal; the end bead is the result. `stoppageZoom` widens time after 90′ and must be disclosed by the host; `axis` labels the ticks |
| `FormCord` | Results as beads above (W), on (D) or below (L) a cord |
| `SeasonLap` | One league season clockwise round a ring, beads outside / on / inside for W / D / L; a title lap closes on a gold bead |
| `CordLoader` | A closed loop the needle runs round while something loads |
| `CoverageWeave` | Covered / total as one cord woven back and forth through three warp bars, filled to the real fraction; the uncovered rows stay open (dashed). Only complete coverage ends on a gold bead |

| `SeasonLapMini` | A season lap reduced to its cord (no per-match beads), light enough to draw a hundred; a title lap is lit and closes on gold |

Result colour is always paired with position, so none of these depends on colour.

### On the surfaces

| Surface | Mark | Reads |
| --- | --- | --- |
| Match page, journey chapters, question modules | `MatchFlow` | The score-state cord at full width: level line, a step up per United goal and down per opponent goal, scorers tied above and below by tethers, the in-play result as the end knot. Stoppage time after 90′ gets a widened slice, marked on the axis and stated in a note. "Play the match" replays it: the cord is revealed left to right at match pace behind a playhead and each scorer lands as it passes (clip-path reveal, because the stretched viewBox keeps strokes at pixel weight with `vector-effect`, which breaks dash-based sewing) |
| Season page | `SeasonLapPlay` | The league season as a lap in the plate's leading slot; pressing it plays the lap |
| Seasons index | `DecadeLaps` | Each decade opens with a row of mini laps, oldest first; title laps are lit and gold-knotted, so the glory decades glow before any number is read |
| Opponent page | `RivalryCord` | The head-to-head balance over real time, first meeting to latest: up a step per United win, down per defeat. Pale beads mark where the upper hand changed; peak and trough are labelled; the end knot is today's balance. Replaces the plain span rail through `IdentityPlate`'s `span.rail` |

### Motion library

Tokens (`--m-*` durations, `--ease-*` curves) live at the top of `app/cord.css`.
Every glyph sews; a glyph names one signature with `data-motion`.

| Motion | Does | Timing | For |
| --- | --- | --- | --- |
| sew | Cord draws in behind a needle head | `--m-sew` 420 ms, `--ease-draw` | Every glyph |
| cinch | Beads pulled tight after the cord arrives | `--m-cinch` 220 ms, `--ease-cinch` | Every bead |
| run | A gold bead travels the whole cord | `--m-run` 760 ms, `--ease-run` | Search, discover, share, on this day |
| pull | Slack cord drawn taut (`d` interpolation; Safari shows the end state) | `--m-pull` 360 ms, `--ease-taut` | More, expanders |
| slide | Beads move along their strings | `--m-pull`, `--ease-taut` | Filters, switches |
| unravel | Cord pulled out through its end, then threaded again | 1.6 × `--m-sew` | Close, clear, reset |
| knot | Sew, cinch, then one ring from the knot | sew + 520 ms ring | Copied, saved, corrected |
| play | A data cord drawn at match pace; plate revealed with it, beads land as the needle reaches them | `--m-play` 2600 ms, linear | Match threads, season laps |
| tally | Beads counted on one by one | 42 ms stagger | Form, counts |
| orbit | Needle runs round a closed loop | `--m-loop` 1100 ms, infinite | Loading |

Triggers: a hovered `cord-host` (hover-capable devices only), or `cd-now` on the
glyph for a one-shot (remount to replay); `cd-play` and `cd-tally` for data
glyphs; `cd-taut` and `cd-slid` hold an end state. The rules above still hold:
never on load, never gating a control, and every motion rests on its final
frame under reduced motion.
