# Mobile Experience — Wishlist & Roadmap

**Status:** planning. Captured 2026-06-30, to be picked up next session.
**Foundation already shipped:** app-like mobile shell — floating glass-pill bottom nav
(home / section picker / search / menu), swipe-to-dismiss nav sheet, search overlay
sliding from the top, safe-area padding, a first density pass, sticky subnav offsets,
and the match-detail mobile hero polish. Desktop (lg+) keeps the existing sticky top
header unchanged. See `components/mobile/`, the `mobile-*` rules in `app/globals.css`,
and `lib/navSections.ts`.

This doc is the durable home for the mobile redesign: the scene reframe, the full
wishlist organised by theme, and a sequenced roadmap with rough effort/impact. Read it
alongside `DESIGN.md` (the product's design thesis) — nothing here overrides those
principles; it applies them to the phone.

---

## 0. The reframe: who's holding the phone, and when

`DESIGN.md`'s scene is the **evening deep-dive on a laptop/tablet** — dim room, willing
to follow a trail. Mobile is a *different scene*, and most of this wishlist falls out of
naming it honestly:

- **The argument-settler.** A mate makes a claim in a group chat. Phone out, look it up,
  screenshot the answer back in. Fast in, fast out, shareable.
- **The second screen.** A United match is on; the phone carries the historical lens and
  becomes the freshest evidence the moment it ends.
- **The daily ritual.** "On this day", a surprising record, a changed stat — a thing
  worth opening for 30 seconds while the kettle boils.
- **The fragmented browse.** Train, queue, sofa — one hand, intermittent attention,
  possibly bad signal.

None of these is "sit down and audit the ledger". They're **in-the-moment, social,
triggered by an external event**. That reframe is the spine of everything below: mobile
leans harder on *answer-first*, *share*, *timeliness*, and *reversible exploration* than
desktop does.

---

## 1. Wishlist by theme

### 1.1 A living "Today" front door
Desktop home leads with `HistorySkyline` + search. Mobile's first screen should be a
**timely, tappable feed**, not a miniaturised desktop hero.

- **Match-day takeover** — when there's a fixture, `TonightHero` becomes the whole top of
  the screen (opponent, venue, the historical lens — "United have won here 7 of the last
  9"). Post-match it flips to "the freshest evidence", pointing at the new match detail.
- **On-this-day card** as a permanent home module — one bespoke object (a famous result
  from today's date), tap to expand. (`/on-this-day`, `[monthDay]` route + data exist.)
- **One surprising record**, rotating daily, surfaced from `/surprise` / `/explore`.
- **Recently changed evidence** — the on-demand revalidation work makes "what's new in
  the archive" an honest feed.
- **Full-bleed match-night cards** for hero list items — a match or season rendered
  edge-to-edge with the floodlit plate, not a dense row.

> North-star framing: mobile home is a "Today" surface; desktop home stays the
> exploration console.

### 1.2 Navigation & wayfinding in a deep archive
The glass pill + nav sheet is a strong shell. The harder mobile problem is **not getting
lost six taps deep**.

- **Stacked sheet drill-down** — tapping a match in a list opens it as a bottom sheet
  *over* the list (presented-card style), so the trail stays visible behind and
  dismissing returns you exactly where you were. Serves the "follow a trail" thesis on a
  small screen — exploration becomes reversible and safe.
- **Edge-swipe back** that respects the real back-stack, with a peek of the previous
  surface.
- **Reachability** — keep high-value actions (search, back) off the top-of-screen reach;
  the bottom-anchored pill is the right instinct, extend it.
- **"Where am I" breadcrumb context** — a thin sticky line on detail pages
  (e.g. *Seasons › 1998–99 › this match*) so deep links from a shared screenshot orient
  a cold visitor.
- **Pinned-section swipe** — horizontal swipe between a page's pinned sections (match-detail
  tabs, player career tabs) with a segmented indicator.

### 1.3 Reading & density, page by page
The "answer-object first, raw ledger as auditable appendix" principle matters *more* on
mobile, where the ledger is unscannable.

- **Match detail** — hero + `MatchFlow` first; teamsheet pitch and full event ledger
  collapse behind progressive disclosure.
- **Player / manager / opponent tables** — `PlayerSeasonTable`, `DataTable`, `LeagueTable`,
  `CompareTable` **swap to card/list rhythm** on narrow viewports rather than
  horizontal-scrolling a dense grid. Lead with the computed answer
  (`HaulCards`, `RecordCards`, `Leaderboard`); keep the sortable register as the appendix.
- **Seasons scroll** — a card-based momentum stream with sticky era/decade headers, not a
  wall of rows.
- **Analytics chapters** — one question per screen-height chapter (chart + interpretation +
  coverage), swipeable between chapters. `ChartPanel` becomes the vertical-rhythm unit.
- **Filter bars** (`MatchFilterBar`, `FacetCombobox`) → a bottom-sheet filter panel with
  applied-filter chips, instead of a cramped inline row.

### 1.4 Data viz on touch
The "shape in SVG, labels in HTML" rule (DESIGN.md) is the foundation. Mobile adds the
**touch + small-width** problems.

- **MatchFlow label collisions / overflow** (named pain point) — tighter lane-staggering
  at narrow widths; tap-a-dot-to-reveal-label on busy matches; or a content-swap to a
  compact stacked-scorer read below a width threshold while keeping the coloured lead bar.
- **Touch inspection replaces hover** — the Quiet Analyst Tooltip needs tap-to-pin /
  tap-elsewhere-to-dismiss, with a touch target larger than the SVG point.
- **Small-multiple legibility audit** — `MinuteRidge`, `CoverageMatrix`, the index
  scatters, career sparklines: verify each reads at 360px; swap to vertical/paged layout
  where it doesn't.
- **Charts horizontally pannable** where the x-axis is genuinely long (Elo over 135 years),
  with a sticky y-axis — a deliberate, well-handled horizontal scroll, not an accidental
  overflow.

### 1.5 Gestures & motion
- **Pull-to-refresh** on the "Today" home and match detail (re-fetch freshest evidence) —
  ties to the revalidation work.
- **Swipe between siblings** (next/previous match, next season — the `Pager` made tactile)
  and **between pinned sections** (see 1.2).
- **Sheet choreography** — enter *and* exit animations; shared-element transitions where a
  list card "expands" into its detail hero.
- **Section micro-interactions** — quiet, state-based, within DESIGN.md's 150–250ms /
  no-bounce rules. Skeleton/shimmer for chart panels on slow networks so layout doesn't jump.
- **Haptics** on key confirmations (pin a section, copy a share card) where supported —
  restrained, like the motion.

### 1.6 Share-native & the social loop
The authored half is already built — OG cards in the site's own faces (Archivo + Plex
Mono), the Share-only control grammar. Mobile is *where sharing actually happens*.

- **Web Share API** one-tap on every answer-object → native share sheet → straight into
  WhatsApp/Messages. The argument-settler loop's payoff.
- **Per-object share images**, not just per-page — share *this record card*, *this
  MatchFlow*, *this leaderboard row* as an image, so what lands in the group chat is
  authored, not a cropped UI.
- **"Settle it" entry point** — search result → answer → share, as a deliberate fast path.
- **Deep-link landing polish** — when someone taps a shared link, the cold-start mobile
  landing must orient instantly (breadcrumb, 1.2).

### 1.7 Platform capabilities (the "app-like shell", completed)
- **PWA: installable to home screen** — manifest, icons, standalone display, floodlit-plate
  splash. Turns the shell into a real launch surface.
- **Offline / cached reading** — recently-viewed matches and the "Today" surface readable
  on the train; service worker over the static-rendered pages already built.
- **On-this-day notifications** — opt-in daily push: the ritual hook, the retention feature
  mobile uniquely enables here.
- **Add-to-calendar** for the next fixture from the match-day takeover.
- **Voice search** as a mobile search affordance (the argument-settler doesn't want to type).

### 1.8 Performance & resilience
- **Perceived performance on 4G** — prioritise the answer-object's first paint; defer
  charts/ledger. Static rendering + revalidation is the backbone.
- **Image/card weight budget** for full-bleed heroes — atmosphere must not cost a second
  on cellular.
- **Graceful partial-data states** — the "render only the facets the data can fill" rule
  matters more when every pixel counts; no empty tiles.

### 1.9 Ergonomics & accessibility
- **Tap targets** — the 44px coarse-pointer lift exists; audit dense rows and chart dots
  against it.
- **One-handed reach** — keep primary actions in the bottom third; extend the pill's logic.
- **Dynamic type / text scaling** — dense tables must survive a larger system font.
- **Sunlight contrast** — verify the dim-ink tiers (`ink-faint`) survive an outdoor screen
  at low brightness; the warm near-black is tuned for a dim room.

---

## 2. Roadmap

Effort: **S** (hours–1 day) · **M** (a few days) · **L** (a week+ / architectural).
Impact for the mobile personas (argument-settler / second-screen / daily-ritual).

### Wave 0 — Fix-its & quick wins
*Ship first: low effort, visible, unblock the rest.*

| Item | Effort | Impact | Notes |
|---|---|---|---|
| MatchFlow label collisions / overflow (1.4) | S–M | **High** | Named bug, one component. Tap-to-reveal on busy matches + tighter narrow staggering. |
| Sheet exit animations (1.5) | S | Med | Enter exists; add symmetric exit. |
| Web Share API one-tap (1.6) | S–M | **High** | Share grammar + OG cards exist; wire `navigator.share`. Unlocks the argument-settler loop cheaply. |
| Tap-target + reachability audit (1.9, 1.2) | S | Med | Audit dense rows & chart dots vs the 44px lift; confirm primaries stay bottom-third. |
| Deep-link landing breadcrumb (1.2) | S–M | Med | Sticky context line so shared links orient a cold visitor. Pairs with share. |

### Wave 1 — The reading track
*Incremental, page-by-page, high value regardless of north stars. Rows ship independently.*

| Item | Effort | Impact | Notes |
|---|---|---|---|
| Match-detail progressive disclosure (1.3) | M | **High** | Likely most-visited page. Hero + MatchFlow first; teamsheet/ledger collapse. |
| Tables → card/list swap (1.3) | L* | **High** | *Large in aggregate but per-table incremental (`PlayerSeasonTable`, `LeagueTable`, `CompareTable`, `DataTable`). Lead with answer-objects, ledger as appendix. |
| Filter → bottom-sheet + applied chips (1.3) | M | Med | Reuses the sheet primitive from Wave 2. |
| Touch chart inspection (1.4) | M | Med–High | Quiet Analyst Tooltip tap-to-pin/dismiss + bigger target. Shared chart layer — do once, benefits all. |
| Seasons scroll → cards w/ sticky era headers (1.3) | M | Med | Momentum stream, not a row wall. |
| Analytics chapters (1.3) | M–L | Med | One question per screen-height, swipeable. |

### Wave 2 — North stars
*The defining bets. What makes it feel like a mobile product, not a responsive site.*

| Item | Effort | Impact | Notes |
|---|---|---|---|
| "Today" front door (1.1) | M | **High** | Reuses `TonightHero`, `/on-this-day`, `/surprise`, revalidation feed. Best reframe-for-effort ratio. |
| Stacked sheet drill-down (1.2) | L | **High** | Structural unlock; Next App Router intercepting/parallel routes. **Do before/alongside tables→cards** — changes the list→detail model. Yields the reusable sheet primitive Wave 1's filter wants. |
| Per-object share images (1.6) | L | Med–High | Share *this record / MatchFlow / leaderboard row* as an authored image. Multiplies the Wave-0 share work. |
| Full-bleed match-night hero cards (1.1) | M | Med | Edge-to-edge floodlit-plate cards for hero list items. |

### Wave 3 — Platform ceiling
*Highest ceiling, highest effort. The "installed app with a daily hook" bet — pursue only
if we commit to the app framing.*

| Item | Effort | Impact | Notes |
|---|---|---|---|
| PWA: installable home-screen app (1.7) | M | Med–High | Manifest, icons, standalone, floodlit splash. Prereq for the next two. |
| On-this-day push notifications (1.7) | L | **High** (ceiling) | Daily-ritual retention hook. Needs push infra + opt-in + backend. Highest payoff *if* the audience installs. |
| Offline / cached reading (1.7) | L | Med | Service worker over the static-rendered pages. |
| Add-to-calendar / voice search (1.7) | S | Low–Med | Cheap garnishes; fold in opportunistically. |

### Cross-cutting (thread through every wave, don't batch)
- **Perceived performance** (1.8) — answer-object first paint, defer charts/ledger,
  skeletons on slow nets. M / Med–High.
- **Pull-to-refresh + sibling/section swipe** (1.5) — M / Med. Land with the Today home and
  pinned sections respectively.
- **Dynamic type + sunlight contrast** (1.9) — S–M / Med. Verify as each surface is touched.

---

## 3. Recommended path

1. **Wave 0 in full** — a week of visible wins plus the share unlock.
2. **Run Wave 1 and Wave 2 in parallel**, but start the **stacked-sheet primitive**
   (Wave 2) *first*: tables→cards and the filter sheet both lean on it. Then let the
   reading track grind page-by-page while the Today home gets built.
3. **Hold Wave 3** until we've decided whether "installed app with notifications" is a
   goal — it's a different commitment level (push infra, opt-in UX) and shouldn't gate the
   reading polish.

**Sequencing risk to respect:** don't do tables→cards before the sheet drill-down lands,
or the list→detail interaction gets rebuilt twice.

**Suggested first dive next session:** the stacked-sheet primitive spec — it's the
dependency root for Waves 1 and 2.
