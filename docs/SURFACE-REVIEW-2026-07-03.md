# Surface review — a fresh look, 2026-07-03

A full pass over every major surface: what exists, how well it works, and how well
it could work. Method: rendered all ~20 routes end-to-end (desktop 1280 full-page,
mobile 390) against a local dev server, read the code where something looked off,
and held each surface against the bar in `PRODUCT.md` / `CONTEXT.md` (spark →
deepening → foundation; *lens, not loom*).

**Verdict in one paragraph.** The foundation — record, provenance, corrections,
API — is genuinely excellent, and the home-page spark is close to right. The
weakness is exactly where the product thesis lives: the *moment* surfaces
(`/match/[id]`, `/on-this-day`) and the *deepening* layer (questions, compare) are
the thinnest things on the site, while the record surfaces (players, seasons,
transfers, analytics) are the most built. The site today is a superb archive with
a beautiful front door, and the corridor between them is missing. Two concrete
defects surfaced along the way.

---

## 1. Two defects worth fixing regardless

### 1.1 "14th league title on record" — the exact trap PRODUCT.md names

The 1998-99 season brief says "Won the Premier League — the club's **14th** league
title on record." Every fan says **12th**. `titleCountThrough`
(`lib/narrative.ts:34`) counts any `type = 'league'` first place, so the 1935-36
and 1974-75 **Second Division** titles inflate the ordinal.

PRODUCT.md Principle 1 is explicit: *"United have won 20 league titles — the
number every fan knows — not the 22 the data technically holds."* That principle
is violated on the flagship season's own page, in the sentence describing the
Treble. (The `/seasons` index hero gets it right — it says 20.)

Fix: restrict the count to top-flight competitions (`first-division`,
`premier-league`), or add a tier column and count tier 1.

### 1.2 `/on-this-day` dead-ends for roughly a quarter of the year

On 3 July the page renders a near-empty screen: *"No official United match is
recorded on 3 July — step a day either way."* Summer is when this surface is a
nostalgia product's best friend — transfer anniversaries, birthdays, pre-season
boredom — i.e. peak demand, and the surface serves nothing.

Minimum fix: fall through to the nearest recorded night. Better: serve non-match
events already in the DB — signings and sales from `transfers` (1 July is the
busiest anniversary date in football), debuts, births where recorded.

### Not bugs (verified)

Two things that looked broken in full-page screenshots and are not: the sidebar
overlapping the season hero (fixed-position artifact of `fullPage` capture) and
blank "Latest results" / match-group rows (`content-visibility: auto` in
`app/globals.css` — offscreen content legitimately skips rendering). Both render
correctly in a live viewport. One genuine loose end: the **mobile** home hero
shows an odd blur on the scorer list under the headline — reads as a glitch, not
depth-of-field. Worth a look on a real device.

---

## 2. Surface by surface

### Home `/` — works

The served night with the thread running down the goal markers, "another night"
re-roll, the 140-year W/D/L strip, one featured question. The best-designed screen
on the site, and honest to the spark-first thesis. Below the strip, "Start with a
question" / latest results / all-time record are competent but generic next to the
hero — acceptable foundation beat, nothing more.

### Match page `/match/[id]` — the biggest is/could-be gap on the site

Checked against the Camp Nou 1999 final, the hardest possible test and the one the
product exists for. The hero scoreline is strong. But the "Match" tab is a goal
timeline, an XI diagram, and a large field of empty dark space. Everything with
emotional charge — the Elo swing, pre-match expectancy, previous meetings, venue,
attendance — is parked behind the Details / Previous / Sources tabs. And there is
**no narrative at all**: nothing that says this was the Treble, that Bayern led
from the 6th minute until injury time, that this is still the latest any European
final has been turned around. (That last sentence *does* exist on the site — on
the Treble question page, one URL away.)

The product's canonical unit — the night — is its least atmospheric page. This is
the surface the home hero pours all its earned emotion into, and it currently
drops it.

### `/questions/treble` — the best thing on the site

Narrative → three-night timeline → full-season strip → decisive-leg evidence →
definition → coverage → "every match behind this answer" → related answers. The
lens-not-loom idea fully realised. It should be the explicit template for match
pages and entity rails.

The problem is supply: Discover says "**4 questions**." The richest strip in the
product has four items (the catalogue's rejects are in
`docs/archived-questions.md`, correctly cut). The deepening layer — the stated
differentiator, the "white space" — is the least-stocked shelf in the shop.

### Discover (`/explore` = `/questions` = `/cut`) — good doorway, cold edges

Three aliases render one page; fine as redirects, but pick one canonical URL. The
Questions and Debates strips are good. The **Curated Cuts** strip ("All opponents,
ranked by win rate" — 95% v Wigan) is the coldest content on the page: closer to a
pub-quiz table than a lens. It guarantees a *number*, not a *meaning*.

Sharper miss: the Best/Ronaldo *normalized fifth-season* insight that both
PRODUCT.md and CONTEXT.md hold up as the canonical deepening example **does not
exist on the site**. The debates lead with raw totals (Rooney 253–249 Charlton) —
debate-settling, the thing the discovery stance says to avoid. The goals-per-season
chart inside the debate view is career-aligned, so the axis machinery is half
there; the authored lens is not.

### `/compare` — half-reshaped

Six authored debates, each with a one-line reason to exist (good), sitting on top
of a "Build a custom matchup" free-input form — the loom CONTEXT.md §4 already
sentenced — and a mostly empty page below the fold. The verdict was right; it
hasn't been executed.

### Entity pages (player / manager / opponent / season) — polished ledgers that stop at the ledger

Rooney's page: hero stats, career timeline with peak-season pin, goals/assists
chart, sortable season table, coverage note. Clean and trustworthy. But
PRODUCT.md's own bar — *"lead back into the thread — a moment, or a connection
across eras — not stop at profile summaries"* — is not met. There is no moment on
the page. No "five nights that made him" (the last-minute derby winner and the
2011 overhead kick are both *in the events table*).

- `/managers` index: genuinely good information design — era-grouped reigns,
  dominant-reign bands for Busby and Ferguson, tenure timelines per row.
- `/opponent/[id]`: closest to the thread idea already — longest runs with dates,
  cup meetings, best-season pin.
- `/seasons/[season]`: strong on the record, weak on the story — and the one
  story paragraph is the templated AI-voice copy ("Home form carried the season")
  the docs already diagnosed, plus the title-ordinal bug above.
- `/seasons` index: a ~20,000px decade ledger. Era tabs make it navigable;
  `content-visibility` keeps it fast. Honest, if a wall.

### Record surfaces (`/matches`, `/players`, `/analytics`, `/transfers`, `/data`) — the most finished part of the site

The matches facet-chip system, the coverage heat-map and correction contract on
`/data`, the public API register, the Elo act structure with its calibration proof
and plain-language season replay — this is trust-at-decision-points done properly,
and almost nobody in the genre does it. `/data` may be the best page of its kind
anywhere.

The structural criticism: this lane is **over-served relative to the soul lane**.
Six mature record surfaces vs. one mature deepening surface is the inverse of the
product's stated priority.

### `/search` — decent lookup, oversold empty state

Operators and question templates are nice. But "shaped questions that compute an
answer" writes cheques the Tier-0 routing layer can't cash (by design — it routes,
it never answers). Promise less on the empty state, or the first miss reads as a
broken product.

### `/surprise` — fine

One card, one link, one re-roll. Does its small job; the card could carry a touch
more texture (date, competition) without breaking the format.

---

## 3. Cross-cutting themes

1. **The spark fires once, then the thread frays.** Home earns real emotion and
   hands it to a match page that doesn't repay it. The corridor from spark to
   deepening is the product's entire theory, and it's the least-built path.
2. **The brand primitive is missing from the IA.** *Red Thread* exists as a
   decoration on the home hero and nowhere else. Surfaces are islands joined by
   breadcrumbs; nothing structurally *threads* — match → what it meant → the era →
   the player whose night it was.
3. **Voice.** The templated connective copy (season briefs especially) is the
   AI-voice disease PRODUCT.md already names. It reads as machine filler exactly
   where a human sentence would carry the nostalgia.
4. **Restraint has been executed on the loom, not yet on the cold lenses.** The
   fork builder and history-changed are gone (good), but win-rate-ranked cuts and
   the custom matchup form survive, and raw-total debates still lead where the
   normalized lens should.

---

## 4. Blue sky — how well could this work

The thread as the site's structural primitive, not a logo:

1. **Every match gets the served-night treatment.** The home hero is a renderer —
   point it at all 6,028 fixtures. A match URL opens with atmosphere (headline
   sentence, the thread, the stakes: "United kicked off 38% to win"), then the
   record beneath. The machinery (`lib/greatNights.ts`, question headlines, Elo
   expectancy) already exists; this is assembly, not invention.
2. **Rediscovery rails everywhere (Phase 3a — the docs are right that it's the
   crux).** Player pages: "the nights that made him," computed from late winners,
   finals, hat-tricks, debuts. Season pages: "the three nights this season turns
   on." Opponent pages: "the meeting everyone remembers." Every rail lands on a
   match page that (per 1) can now hold the emotion. This one mechanic converts
   the entire archive into spark inventory.
3. **Ship the fifth-season lens.** The normalized-career comparison is the
   product's one named, defensible, cross-era insight and it's still vaporware.
   One authored template — careers aligned to season N, one normalization, every
   pairing guaranteed to land — earns the right to delete the custom-matchup form.
4. **Questions as a slow drumbeat.** Four live questions at Treble quality beats
   forty re-skins, but four is below critical mass for the "richest strip." Get to
   8–10 that each produce a revelation, then stop. The engine is built; the
   marginal cost is editorial.
5. **On-this-day as the daily ritual.** Never empty, includes transfers / debuts /
   births, feeds a shareable card. The only surface with a built-in reason to
   return every day — the honest retention loop for "a quiet, personal thing."
6. **Kill the last cold edges.** Opponents-by-win-rate (or reframe as "true bogey
   sides," which *is* a lens), the custom matchup form, the alias routes, the
   templated season-brief voice, the title ordinal. None big; together they're the
   difference between "the record, felt" and "a dashboard with a poem on the
   front."

---

## 5. Ranked priorities

1. **Match-page transformation** — it's where the spark already lands and dies.
2. **Rediscovery rails** on player / season / opponent pages (Phase 3a).
3. **On-this-day fallbacks** — never render empty.
4. **The fifth-season lens** on /compare; retire the custom matchup.
5. Defect fixes (§1) woven in immediately — the title ordinal is a
   trust-model violation, not a nit.

The foundation has earned the right to stop being improved for a while. The soul
hasn't caught up to it yet.
