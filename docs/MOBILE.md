# Mobile Experience — Wishlist & Roadmap

**Status:** in progress — Wave 0, Sheet Phase A, filter sheet, match-detail disclosure, and register primitive (first consumers) shipped; Wave 1 reading track active.
Captured 2026-06-30; revised after register-layout review same session.
**Foundation shipped:** app-like mobile shell — floating glass-pill bottom nav
(home / section picker / search / menu), swipe-to-dismiss nav sheet, search overlay
sliding from the top, safe-area padding, a first density pass, sticky subnav offsets,
match-detail mobile hero polish, and **narrow-shell layout** (sm–lg: pill/sheets capped
to phone width so half-screen desktop doesn't inherit full-bleed mobile chrome). Desktop
(lg+) keeps the collapsible sidebar unchanged. See `components/mobile/`, the `mobile-*`
rules in `app/globals.css`, and `lib/navSections.ts`.

### Completed phases

| Phase | Shipped | Highlights |
|---|---|---|
| **Foundation** | pre-roadmap | Glass-pill bottom nav, nav sheet, search overlay, safe-area padding, narrow-shell cap |
| **Wave 0** | 2026-06-30 | `MatchFlow` + `HistorySkyline` label tiers; sheet exit animations; `ShareCite` on lists/search/compare/detail; search-first home; `DetailBreadcrumb` |
| **Sheet Phase A** | 2026-06-30 | Reusable `BottomSheet` — exit animation, focus trap, swipe dismiss; consumed by nav + filters |
| **Post-Wave 0 polish** | 2026-06-30 | Narrow-shell pill search; mobile search UX; transparent sticky breadcrumb on heroes |
| **Wave 1 — filter sheet** | 2026-06-30 | Matches search + filters in the floating pill below lg; filter sheet via `BottomSheet`; desktop keeps `MatchControlDeck` |
| **Wave 1 — match-detail disclosure** | 2026-06-30 | `MatchSectionTabs` on mobile; hero + `MatchFlow` first; teamsheet in Match tab scroll; desktop `<details>` for secondary sections |
| **Wave 1 — register primitive (partial)** | 2026-06-30 | `DataTable` `registerCards` + `LeagueTable` mobile rows — **leaderboard** for ranked lists (`/players`, `LeagueTable`, manager bounce); **metrics** for timelines and coverage grids (`PlayerSeasonTable`, `/data`). |

This doc is the durable home for the mobile redesign: the scene reframe, the full
wishlist organised by theme, and a sequenced roadmap with rough effort/impact. Read it
alongside `DESIGN.md` (the product's design thesis) — nothing here overrides those
principles; it applies them to the phone.

### Three viewport tiers (don't conflate them)

The shell is **not** binary phone vs desktop. Three tiers matter for layout and QA:

| Tier | Breakpoint | Shell | Layout notes |
|---|---|---|---|
| **Phone** | `< sm` (&lt; 640px) | Mobile pill + sheets | Full-bleed sheets and overlay; home may show `MobileSearchPrompt` above the foundation plate. |
| **Narrow shell** | `sm`–`lg` (640px–1023px) | Same mobile components | Half-screen desktop, tablet landscape — pill capped to ~26rem and centred. **Section picker + inline search field** in the pill (results pull up above it); no hamburger (section dropdown opens the nav sheet). Home search prompt hidden. |
| **Desktop** | `lg+` (≥ 1024px) | Collapsible sidebar | Inline `SearchCommand` on home; no bottom pill. |

**Why narrow shell exists:** below `lg` we correctly hide the sidebar, but a resized
desktop browser can be 700–960px wide and *tall* — not a phone. Without the cap,
phone-tuned `rem` sizing and `inset-inline: 0` sheets read as massively oversized.
Narrow shell is the same interaction model with phone-proportioned chrome.

**QA matrix:** always verify mobile changes on (1) a real phone, (2) a half-screen
desktop window in the sm–lg band, and (3) full desktop at lg+. **Agent workflow:** any
UI change on this track must be confirmed with a screenshot shown to the user — see
`AGENTS.md` (Playwright via `scripts/shot.mjs`, phone width 390×844 unless the change
targets narrow shell or desktop).

---

## 0. The reframe: who's holding the phone, and when

`DESIGN.md`'s scene is the **evening deep-dive on a laptop/tablet** — dim room, willing
to follow a trail. Mobile is a *different scene*, and most of this wishlist falls out of
naming it honestly:

- **The argument-settler.** A mate makes a claim in a group chat. Phone out, look it up,
  share the answer back in. Fast in, fast out, shareable.
- **The second screen.** A United match is on; the phone carries the **historical lens**
  — what happened here before, the record against this opponent, on-this-day parallels.
  Not live scores or post-match recaps; people already have FotMob for that.
- **The daily ritual.** "On this day", a surprising record, a changed stat — a thing
  worth opening for 30 seconds while the kettle boils.
- **The fragmented browse.** Train, queue, sofa — one hand, intermittent attention,
  possibly bad signal.

None of these is "sit down and audit the ledger". They're **in-the-moment, social,
triggered by an external event**. Mobile leans harder on *answer-first*, *share*,
*reversible exploration*, and *search* than desktop does.

### Persona priority (when they conflict)

**Search first.** This is a place people come when they want to find something about
the past they couldn't elsewhere. The argument-settler is the primary mobile persona;
everything else is secondary.

When above-the-fold space or engineering priority conflicts:

1. **Search** — one tap from the pill, fast path to an answer, share on the answer.
2. **Argument-settler** — search → answer → share (link + OG unfurl is sufficient).
3. **Fragmented browse** — reversible trails, sheets, scroll restoration.
4. **Daily ritual** — on-this-day / surprise modules on home, when they earn the space.
5. **Second screen** — optional historical thread when something is happening today; never
   compete with live-score apps on fixtures, kick-off, or "what just happened".

**Restraint:** connecting today's live context to the archive (e.g. "United have won
here 7 of the last 9" while a match is on) is a nice second-screen or repeat-visitor
touch. Building toward FotMob-style match-day takeover, upcoming-fixture surfaces, or
post-match freshness feeds is **feature creep** — out of scope.

### Success signals (lightweight)

| Persona | Signal |
|---|---|
| Argument-settler | Share taps; search-to-share time |
| Fragmented browse | Sheet dismiss without losing place; scroll restoration |
| Daily ritual | Return visits; on-this-day / surprise module taps |
| Second screen | Historical-context module engagement during match windows (if shipped) |

---

## 1. Wishlist by theme

### 1.1 Mobile home — search-first, `TonightHero` evolved

Desktop home leads with `HistorySkyline` + search. Mobile home is **not** a miniaturised
desktop hero and **not** a live-score feed. It is:

1. **Search within immediate reach** — the pill's search button (and overlay) is the
   primary entry for the argument-settler on **phone and narrow shell**. On phone only,
   `MobileSearchPrompt` on the foundation plate is an extra affordance; from `sm` up
   (still below `lg`) the pill alone is enough — avoid duplicating search CTAs in the
   page body. Consider elevating search further: default overlay from home, long-press on
   the pill, or a "settle it" mode tuned to records / streaks / H2H.
2. **`TonightHero` + foundation, evolved** — the spark/foundation fusion already on
   `app/page.tsx` is the right bones. Extend it thoughtfully, not wholesale replace it.

**When "today" modules earn space:**

- **On-this-day** — when the calendar date has significant United history,
  `TonightHero` already leads with it (`greatNights()` tier 1). Keep and polish.
- **Classic served night** — on many dates there are *no* matches on this day in the
  archive, or none worth leading with. The curated rotating pool (`↻ another night`) is
  *more useful* than forcing empty "today" feed tiles. Don't show on-this-day chrome on
  days with nothing to say.
- **Surprise record / recently changed evidence** — add as home modules only when they
  add honest value, not as permanent filler. A quiet second row below the hero, not a
  competing feed.
- **Historical thread during a live match** (optional, restrained) — if we surface
  anything during an active United match, it is *archive context* (venue record, H2H,
  on-this-day parallel), not kick-off, line-ups, or full-time. Ship only if it reads as
  lens, not live tracker.

- **Full-bleed match-night cards** for list items — a match or season rendered
  edge-to-edge with the floodlit plate, not a dense row.

> North-star framing: mobile home is **search-first** with a **conditional** timely
> spark (`TonightHero` when the date earns it, classic nights when it doesn't); desktop
> home stays the exploration console.

### 1.2 Navigation & wayfinding in a deep archive
The glass pill + nav sheet is a strong shell. The pill keeps **two essentials** on every
page: the **section picker** (opens the nav sheet) and **search**. A separate menu
hamburger was dropped — the section control already opens sections. On **phone**, search
is an icon that opens the top overlay; on **narrow shell** (sm–lg), search is an inline
field in the pill with results pulling up above it.

The harder mobile problem is **not getting lost six taps deep**.

- **Phased sheet strategy** — don't jump straight to intercepting routes:
  - **Phase A:** Reusable bottom-sheet primitive (exit animations, focus trap, swipe
    dismiss) — unblocks filter sheet and quick previews.
  - **Phase B:** List → detail preview in sheet without route interception; validate the
    "reversible trail" feel.
  - **Phase C:** Full stacked drill-down via intercepting/parallel routes only if Phase B
    doesn't deliver. Handles deep-link, refresh, and scroll-restoration edge cases.
- **Stacked sheet drill-down** (Phase C goal) — tapping a match in a list opens it as a
  bottom sheet *over* the list, so dismissing returns you exactly where you were.
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
- **Player / manager / opponent tables** — on narrow viewports, drop the horizontal-scroll
  table in favour of a register list. **Ranked registers** (players, managers, opponents
  sorted by a measure) must preserve **column scan on the active sort** — same rhythm as
  `Leaderboard` / `IndexRow`: rank · identity · headline figure; quiet subline under the
  name, not a multi-metric stat grid per row. **Timelines and season splits** can use a
  labelled metrics grid when every field earns its place. Lead with the computed answer
  (`HaulCards`, `RecordCards`, `Leaderboard`); keep the sortable register as the appendix.
- **Shared responsive register primitive** — ✅ landed on `DataTable` (`registerCards`,
  `registerLayout`: `"leaderboard" | "metrics"`). Column `card` roles opt rows in;
  `registerSubline`, `registerFigureTone`, and `registerHref` configure leaderboard mode.
  Table unchanged at `sm+`. Wire remaining consumers: `LeagueTable`, `/data`, question
  modules. Do **not** use a stat-dashboard card for ranked lists — fans scan the sort
  column, not a profile grid.
- **Seasons scroll** — a card-based momentum stream with sticky era/decade headers, not a
  wall of rows.
- **Analytics chapters** — one question per screen-height chapter (chart + interpretation +
  coverage), swipeable between chapters. `ChartPanel` becomes the vertical-rhythm unit.
- **Filter bars** (`MatchFilterBar`, `FacetCombobox`) → a bottom-sheet filter panel with
  applied-filter chips, instead of a cramped inline row. Lands on Phase A sheet primitive.

### 1.4 Data viz on touch
The "shape in SVG, labels in HTML" rule (DESIGN.md) is the foundation. Mobile adds the
**touch + small-width** problems.

- **Flagship label collision pass** — `MatchFlow` and home `HistorySkyline` share the
  same failure mode (colliding x-axis / event labels on narrow viewports). Fix as one
  Wave-0 track: mobile label tiers (fewer labels by default, tap-to-reveal, stacked lanes
  or compact event list below threshold).
- **MatchFlow** (named pain point) — tighter lane-staggering at narrow widths;
  tap-a-dot-to-reveal-label on busy matches; or content-swap to a compact stacked-scorer
  read below a width threshold while keeping the coloured lead bar.
- **Touch inspection replaces hover** — the Quiet Analyst Tooltip needs tap-to-pin /
  tap-elsewhere-to-dismiss, with a touch target larger than the SVG point.
- **Small-multiple legibility audit** — `MinuteRidge`, `CoverageMatrix`, the index
  scatters, career sparklines: verify each reads at 360px; swap to vertical/paged layout
  where it doesn't.
- **Charts horizontally pannable** where the x-axis is genuinely long (Elo over 135 years),
  with a sticky y-axis — a deliberate, well-handled horizontal scroll, not an accidental
  overflow.

### 1.5 Gestures & motion

**Gesture priority** — several gestures compete on the same surfaces; define ownership
before shipping:

| Priority | Gesture | When active |
|---|---|---|
| 1 | Vertical scroll | Always, unless at scroll top |
| 2 | Pull-to-refresh | Scroll top only (home, match detail revalidation) |
| 3 | Horizontal section swipe | Hero / tab region only (match-detail tabs, analytics chapters) |
| 4 | Edge-swipe back | When no sheet is open |
| 5 | Sibling swipe (`Pager`) | Disabled while a sheet is open |
| 6 | Sheet swipe-dismiss | On sheet grab handle / backdrop |

- **Pull-to-refresh** on home and match detail (re-fetch revalidated evidence).
- **Swipe between siblings** (next/previous match, next season — the `Pager` made tactile)
  and **between pinned sections** (see 1.2).
- **Sheet choreography** — enter *and* exit animations; shared-element transitions where a
  list card "expands" into its detail hero. Respect `prefers-reduced-motion` (already in
  `globals.css`); no haptics when reduced motion is on.
- **Section micro-interactions** — quiet, state-based, within DESIGN.md's 150–250ms /
  no-bounce rules. Skeleton/shimmer for chart panels on slow networks so layout doesn't jump.
- **Haptics** on key confirmations (pin a section, copy link) where supported — restrained,
  like the motion.

### 1.6 Share-native & the social loop
The authored half is already built — OG cards in the site's own faces (Archivo + Plex
Mono), the Share-only control grammar. **`ShareCite` already wires `navigator.share`**
on plates and match detail; link share + good OG unfurl is **sufficient** — we are not
pursuing per-object share images (attaching card files caused duplicate pastes on macOS;
the link already unfurls to the route's OG card).

- **Extend `ShareCite` coverage** — lists, record cards, search results, question modules,
  compare answers: every answer-object gets the same one-tap share affordance.
- **"Settle it" entry point** — search result → answer → share, as a deliberate fast path
  (pairs with search-first home, §1.1).
- **Deep-link landing polish** — two distinct problems when someone taps a shared link:
  1. **Orient** — "Where am I?" (breadcrumb, §1.2).
  2. **Hook** — answer-object visible without scroll; share CTA in reach. Breadcrumb alone
     doesn't convert a WhatsApp tap into a reader.

### 1.7 Answer surfaces beyond match detail
Argument-settlers often land on share-native pages that aren't match detail. These need
the same mobile reading treatment (answer-first, progressive disclosure, share on the
answer):

- **Question modules** (`/questions/*`) — long vertical pages (~10k px on mobile). Lead
  with the chart/answer per module; collapse methodology and raw tables. Pacing aids
  between modules (sticky chapter nav or section breaks).
- **Compare flows** (`/compare`, `CompareTable`) — especially painful on narrow viewports;
  card rhythm for the comparison answer, ledger as appendix. High share value when
  settling "who was better" arguments.
- **Explore / surprise / leaderboard surfaces** — answer-objects (`Leaderboard`,
  `RecordCards`) already lead; ensure share + mobile density on the rows that get
  screenshotted.

### 1.8 Performance & resilience
- **Perceived performance on 4G** — prioritise the answer-object's first paint; defer
  charts/ledger. Static rendering + revalidation is the backbone. Explicit React
  `Suspense` / streaming boundaries on match detail and player pages — not just visual
  skeletons.
- **Image/card weight budget** for full-bleed heroes — atmosphere must not cost a second
  on cellular.
- **Graceful partial-data states** — the "render only the facets the data can fill" rule
  matters more when every pixel counts; no empty tiles.

### 1.9 Ergonomics & accessibility
- **Tap targets** — the 44px coarse-pointer lift exists; audit dense rows and chart dots
  against it.
- **One-handed reach** — keep primary actions in the bottom third; extend the pill's logic.
- **Dynamic type / text scaling** — dense tables must survive a larger system font.
- **Outdoor / sunlight contrast** — deferred decision. `DESIGN.md`'s scene is a dim room;
  second-screen use may happen in lit rooms. Revisit when touching surfaces; may need
  stronger ink tiers or a high-contrast bump — not necessarily full light mode.

### 1.10 Technical footnotes (capture early)
- **iOS Safari** — bottom pill + virtual keyboard, `100dvh`, sticky subnav with nested
  overflow: test on real devices, not just 390px viewport audits.
- **Narrow shell (sm–lg)** — half-screen desktop Safari is a common dev/review posture;
  rules live in `app/globals.css` under the `mobile-shell-max-width` comment block. Pill
  search uses `pillSearch` on `SearchCommand` (`MobileBottomNav`). Don't regress full-bleed
  phone layout below `sm` when editing sheet/pill CSS.
- **`prefers-reduced-motion`** — sheet choreography and haptics must respect it (see §1.5).
- **Screenshot tests** — add for `MatchFlow` and `HistorySkyline` on high-event / full-span
  data after the label-collision pass.

---

## 2. Roadmap

Effort: **S** (hours–1 day) · **M** (a few days) · **L** (a week+ / architectural).
Impact weighted toward argument-settler and fragmented browse.

### Wave 0 — Fix-its & quick wins ✅
*Shipped 2026-06-30. Tap-target audit and screenshot tests remain as footnotes.*

| Item | Effort | Impact | Notes |
|---|---|---|---|
| Flagship label collision pass — `MatchFlow` + `HistorySkyline` (1.4) | S–M | **High** | ✅ Mobile label tiers + compact event list / pinned edge labels. |
| Sheet exit animations (1.5) | S | Med | ✅ `useAnimatedOverlay` + symmetric exit on nav/search sheets. |
| Extend `ShareCite` coverage (1.6) | S–M | **High** | ✅ Lists, search results, questions, compare, detail plates. |
| Search prominence on home (1.1) | S | **High** | ✅ Pill + overlay; `MobileSearchPrompt` phone-only. |
| Tap-target + reachability audit (1.9, 1.2) | S | Med | Partial — 44px lift exists; full audit deferred per surface. |
| Deep-link landing — orient + hook (1.2, 1.6) | S–M | Med | ✅ `DetailBreadcrumb` sticky orient line; hook per page. |

### Wave 1 — The reading track
*Incremental, page-by-page. Rows ship independently.*

| Item | Effort | Impact | Notes |
|---|---|---|---|
| Sheet primitive Phase A (1.2) | M | **High** | ✅ `BottomSheet` in `components/mobile/`. |
| Match-detail progressive disclosure (1.3) | M | **High** | ✅ `MatchSectionTabs`; hero + MatchFlow first; teamsheet/ledger behind tab/disclosure. |
| Tables → card/list via shared register primitive (1.3) | L* | **High** | *Mostly done ✅ — `DataTable` + `LeagueTable`; `/players`, `PlayerSeasonTable`, `/data`, manager bounce wired. Any new `DataTable` sites inherit the primitive. |
| Filter → bottom-sheet + applied chips (1.3) | M | Med | ✅ Filter button in pill on `/matches`; sheet via `BottomSheet`; page deck hidden below lg. |
| Touch chart inspection (1.4) | M | Med–High | Tap-to-pin/dismiss + bigger target. Shared chart layer. |
| Answer surfaces — questions + compare (1.7) | M | **High** | Share-native pages beyond match detail. |
| Seasons scroll → cards w/ sticky era headers (1.3) | M | Med | Momentum stream, not a row wall. |
| Analytics chapters (1.3) | M–L | Med | One question per screen-height, swipeable. |

### Wave 2 — Structural polish
*What makes exploration feel native on a phone — not a live-score app.*

| Item | Effort | Impact | Notes |
|---|---|---|---|
| `TonightHero` home evolution (1.1) | M | Med–High | Conditional on-this-day vs classic nights; optional restrained historical thread during live matches. No fixture takeover. |
| Sheet Phase B → C — list drill-down (1.2) | L | **High** | Preview in sheet first; intercepting routes only if needed. **Before/alongside tables→cards** — avoids rebuilding list→detail twice. |
| Full-bleed match-night hero cards (1.1) | M | Med | Edge-to-edge floodlit-plate cards for list items. |

### Deferred — platform / install framing
*Revisit later. High effort, uncertain payoff for this audience. Does not gate reading
polish or search-first work.*

| Item | Notes |
|---|---|
| PWA (installable home screen) | Manifest, icons, standalone splash |
| Push notifications (on-this-day) | Needs infra + opt-in; niche install rates |
| Offline / cached reading | Service worker over static pages |
| Voice search | Patchy Safari support; search is already one tap |

### Cross-cutting (thread through every wave, don't batch)
- **Perceived performance** (1.8) — answer-object first paint, `Suspense` boundaries,
  skeletons on slow nets. M / Med–High.
- **Pull-to-refresh + sibling/section swipe** (1.5) — M / Med. Respect gesture
  priority table; land with home evolution and pinned sections respectively.
- **Dynamic type** (1.9) — S–M / Med. Verify as each surface is touched.
- **Outdoor contrast** (1.9) — decision deferred; revisit when second-screen modules ship.

---

## 3. Recommended path

1. ~~**Wave 0 in full**~~ — done.
2. ~~**Sheet Phase A**~~ — done; filter sheet is the first new consumer (also done).
3. **Wave 1 reading track** — page-by-page, in roughly this order:
   - ~~Filters → bottom sheet + applied chips~~ — done.
   - ~~Match-detail progressive disclosure~~ — done.
   - ~~Shared register primitive~~ — done for current surfaces (`DataTable`, `LeagueTable`, `/players`, `PlayerSeasonTable`, `/data`, manager bounce).
   - Touch chart inspection; answer surfaces (questions + compare); seasons cards; analytics chapters.
4. **Wave 2 in parallel when ready** — `TonightHero` evolution, sheet Phase B (list preview),
   full-bleed match-night list cards. Phase B before committing to Phase C intercepting routes.
5. **Ignore deferred platform work** until there is an explicit decision to pursue install /
   push — it shouldn't gate anything above.

**Sequencing risk cleared:** sheet primitive landed — tables→cards can proceed without
rebuilding list→detail twice.

**Suggested next dive:** touch chart inspection (tap-to-pin/dismiss on flagship charts), then answer surfaces polish on questions + compare — seasons cards and analytics chapters can follow.
