# Thread glyphs

Red Thread's icons, event marks and small motions share one grammar: a red
thread running through a pale record, with gold beads only where something is
proven. The exploratory lab is [`mockups/glyph-lab.html`](mockups/glyph-lab.html);
this document owns what has shipped.

## Primitives

All glyphs sit on a 24 × 24 grid and are built from `components/glyphs/primitives.tsx`:

| Primitive | Mark | Means |
| --- | --- | --- |
| `T` | Red thread (solid, or stitched with `st`) | Continuity; the part that lights up |
| `P` | Pale stroke (optionally dashed or fine) | The record, frames, ticks and other strands |
| `B` | Bead: `b` gold, `br` thread, `bp` pale, `bo` hollow, `fw`/`fd`/`fl` result | A fact. Gold is reserved for proof |
| `Under` | Mask-cut crossing | Over-under without a halo colour, so it reads on glass |

Colour and weight come from `--tg-thread`, `--tg-pale`, `--tg-bead` and
`--tg-sw` in `app/thread.css`. Idle glyphs default to `currentColor` for all
three, so they sit quietly in chrome.

## Hosts and states

- `tg-host` on a link or button: hovering or focusing it lights the thread red
  and the beads gold, and sews the thread in (≈420 ms dash draw, then a 200 ms
  bead fade-scale). It only runs on hover-capable devices without reduced motion.
- `tg-lit` on a host or the glyph itself: always coloured. Use it for the current
  section and for the primary search entry.

## Shipped glyphs

| Family | Component | Glyphs |
| --- | --- | --- |
| Sections | `NavIcon` (`components/nav/NavIcons.tsx`) | Stories (loop-fold), Discover (needle), Matches (ticket stub), Seasons (bracketed run), Players (laced collar), Managers (spool), Opponents (twisted pair), Analytics (Elo over baseline), Transfers (splice), Data (weave), More (slack middle thread) |
| Chrome | `UtilGlyph` (`components/glyphs/UtilGlyph.tsx`) | Search (loop lens), Home (roofline), Filter (abacus), Close (woven X), Share (one thread, three beads), Sewn (tick fastened with a bead; the copy-link confirmation) |
| Record | `RecordGlyph` (`components/glyphs/RecordGlyph.tsx`) | Darn (report a correction), Spiral (on this day), Tangle (pull a random night), Stitch (partial coverage) |
| Coverage | `CoverageWeave` | Rows woven in proportion to covered / total; the last row stitched part-way. Used by `CoverageNote` for graded counts only |

`/dev/glyphs` (development only) is now the Cord gallery (below); it keeps the
shipped section glyphs beside their Cord redraws for comparison.

## Motions

| Motion | Where | Behaviour |
| --- | --- | --- |
| Sew-in | `tg-host` hover | Thread dash-draws in, gold beads fade-scale in |
| Sewn on show | `tg-sew-now` | The same draw, once, when a confirmation appears |
| Sewn link | `.sewn-link` (`EvidenceLink`) | Underline thread drawn left to right, fastened with a gold bead: the link leads to proof |
| Running stitch | `StitchLoader` | Stitches travel along a thread while filters or search load; static under reduced motion |
| Bead switch | Players register Assists switch | A bead slides along a thread that reddens when on |
| Loose thread | `LooseThread` (`app/not-found.tsx`) | The record runs ticked to a pin, then hangs loose and frays; the pointer pulls the end. Sleeps once settled; one static frame under reduced motion |

## Rules

- A bead is gold only when it stands for something proven. Decoration uses `br` or `bp`.
- Never draw a coverage grade that the record does not state. `CoverageWeave`
  takes real counts; prose coverage gets no mark, because it may describe a
  complete facet.
- Stitched threads (`st`) never carry `pathLength`, so their dash pattern stays in user units.
- Motion follows DESIGN.md: state-based, never on load, and nothing is required
  to finish before the control can be used.

## Cord (second generation, not yet shipped)

The thread set above was drawn as hairline outline for the near-black canvas.
After the palette was lifted to warm charcoal (November 2026) those hairlines
read thin and fussy, so Cord redraws the set with mass. It lives in
`components/glyphs/cord/` with styles and motion in `app/cord.css`, and is shown
at `/dev/glyphs`. Nothing in the product uses it yet; ids match `NavIcon`,
`UtilGlyph` and `RecordGlyph`, so adoption is one import per call site.

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

Result colour is always paired with position, so none of these depends on colour.

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
