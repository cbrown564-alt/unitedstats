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

`/dev/glyphs` (development only) shows every shipped glyph idle and lit, with
coverage weaves at several fractions.

## Motions

| Motion | Where | Behaviour |
| --- | --- | --- |
| Sew-in | `tg-host` hover | Thread dash-draws in, gold beads fade-scale in |
| Sewn on show | `tg-sew-now` | The same draw, once, when a confirmation appears |
| Sewn link | `.sewn-link` (`EvidenceLink`) | Underline thread drawn left to right, fastened with a gold bead: the link leads to proof |
| Running stitch | `StitchLoader` | Stitches travel along a thread while filters or search load; static under reduced motion |
| Bead switch | Players register Assists switch | A bead slides along a thread that reddens when on |

## Rules

- A bead is gold only when it stands for something proven. Decoration uses `br` or `bp`.
- Never draw a coverage grade that the record does not state. `CoverageWeave`
  takes real counts; prose coverage gets no mark, because it may describe a
  complete facet.
- Stitched threads (`st`) never carry `pathLength`, so their dash pattern stays in user units.
- Motion follows DESIGN.md: state-based, never on load, and nothing is required
  to finish before the control can be used.
