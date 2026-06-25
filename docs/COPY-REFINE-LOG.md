# Copy Refinement Log

This document tracks all user-facing copy refinements and typographic standardizations across the UnitedStats codebase. It serves as our guide for scaling these changes across all pages.

## Standards

1. **Connective breaks**: Always use a **spaced em dash** (` — `) with space on both sides.
2. **Ranges (years, dates)**: Always use a **closed en dash** (`–`) with no spaces (e.g., `1886–87`, `1998–99`).
3. ** Wit and Personality**: Quarantined strictly to Hero and Question/Myth surfaces. Keep result, metrics, and coverage tables clinical.

---

## Log of Changes

### 2026-06-25: Homepage & Core Definitions

#### 1. Hero Section & General Page Structure (`app/page.tsx`)
* **Hero Subtitle**: Modified from `"...football — start with..."` to `"...football — traced back to the fixture record."` (spaced em dash maintained).
* **Search Hint**: Modified from `"...search — names..."` to `"...search — names, seasons, or questions..."` (spaced em dash standardized, "shaped questions" simplified).
* **Entry Chips Header**: Modified from `"Or start from someone you remember"` to `"Or start with an era, a rival, or a name"`.
* **Section Header (What's Interesting)**: Modified from `"What's interesting right now"` to `"What the record holds today"`.
* **Section Header (Records)**: Modified from `"Records that pull you in"` to `"All-time peaks"`.
* **Section Header (One answer, in full)**: Modified from `"One answer, in full"` to `"Featured myth"`.
* **CTA Link (Late Goals)**: Modified from `"See the late-goals breakdown →"` to `"Go to the late-goals thread →"`.
* **All-time Record Description**: Modified from `"The win, draw and loss share of every match..."` to `"The win, draw, and loss share of official matches; the underline scales with volume, so the League matches are in proportion. Updated after every match — each row..."` (introducing Oxford comma and clearer volume explanation).

#### 2. Serendipity Cards (`components/WhatsInteresting.tsx`)
* **Card Eyebrow (Change)**: Modified from `"Just changed"` to `"The record updated"`.

#### 3. Curiosity Carousel (`lib/questions.ts`)
* **Late goals**:
  * Label: `"Late goals"` → `"Fergie time"`
  * Summary: `"How often United score..."` → `"Do United really score late? Track the post-85th minute edge by decade, from Bruce’s header to stoppage-time drama."`
* **Comebacks**:
  * Label: `"Comebacks"` → `"Comeback kings"`
  * Summary: `"How often United come back..."` → `"Test the legend of the fightback. How often United fell behind—and avoided defeat—replayed minute by minute."` (Closed en dash range standardized).
* **Great runs**:
  * Label: `"Great runs"` → `"Unbeaten streaks"`
  * Summary: `"United's longest..."` → `"Winning runs, clean-sheet streaks, and matches without defeat. The limits of United’s momentum over 140 years."`
* **Bogey teams**:
  * Summary: `"The opponents..."` → `"The sides United beat least often. The historical obstacles, filtered for opponents met at least twenty times."`
* **Manager bounce**:
  * Summary: `"Whether new..."` → `"Does a new manager change the tide? Compare each manager’s first ten matches against the form they inherited."`
* **Fortress OT**:
  * Summary: `"How rarely..."` → `"Lead at half-time at Old Trafford and the game is over. See how rarely United surrendered a break-time lead."`
* **Cup specialists**:
  * Summary: `"The United..."` → `"Who saved their goals for cup nights? The goalscorers whose records lean heavily toward domestic and European cups."`
* **Own goals**:
  * Summary: `"Whether own..."` → `"Is ‘Own Goal’ one of the club's leading goalscorers? The bizarre tally of opponent errors stacked against history’s legends."`
* **Away days**:
  * Summary: `"How far..."` → `"From Lancashire hops to European nights. Trace the geographic footprint of United’s away trips since 1886."`

#### 4. Entry Chips & Breadth Carousel (`lib/entryPoints.ts`)
* **Breadth Cards**: Standardized all connective em dashes in blurbs:
  * Compare blurb: `"Rooney against Charlton... — on shared..."` (spaced em dash verified).
  * Cut blurb: `"Rank all 6,000+ fixtures... — then fork..."` (spaced em dash verified).
  * Seasons blurb: `"From the first... — each with..."` (spaced em dash verified).
  * Analytics blurb: `"The Elo timeline... — the record..."` (spaced em dash verified).
  * On-this-day blurb: `"Every match... — a fresh..."` (spaced em dash verified).

#### 5. Codebase-wide Dash Standardizations
Swept the codebase to replace incorrect spaced en dashes (` – `) in date and run ranges with standard closed en dashes (`–`):
* **`app/page.tsx`**: Updated unbeaten run card date range to `${from}–${to}`.
* **`app/analytics/page.tsx`**: Updated unbeaten and winning run date ranges to `${from}–${to}`.
* **`app/player/[id]/page.tsx`**: Updated best scoring run date range.
* **`app/manager/[id]/page.tsx`**: Updated tenure caption date range.
* **`components/QuestionModules.tsx`**: Updated longest unbeaten run date range in the "runs" module finding.
* **`components/RunCallouts.tsx`**: Updated run card date range.
* **`components/StreakBoard.tsx`**: Updated streak range labels.

### 2026-06-25: Explore Page & Discovery Layer

#### 1. Explore Page & Structural Copy (`app/explore/page.tsx`)
* **Metadata & Description**: Standardized meta description with spaced em dash and curly apostrophe: `"Start with an answer — the curated questions..."`.
* **Page Header Description**: Changed `"tested against the canonical record — each opens..."` to `"tested directly against the canonical record — opening a dedicated finding..."`, and corrected `"Compare and grouping"` to `"Comparison and grouping"`.
* **Trust Strip Description**: Rephrased to `"official matches across {years} years — every figure is an open door..."` for more active, premium voice.
* **Tested Myths Header & Carousel**: Rebranded Section 1 from `"Questions, answered"` to `"Tested myths"`, updated aside count, and standardized CTA to `"Go to the full thread →"`.
* **Curated Debates Header & Carousel**: Rebranded Section 2 from `"Who was better?"` to `"Curated debates"`, updated aside to `"player, manager, and era"` (spelling out "and", Oxford comma), and standardized CTA to `"Compare the records →"`.
* **Curated Cuts Header & Carousel**: Rebranded Section 3 from `"Explore the record"` to `"Curated cuts"`, upgraded aside description to `"filter and group by any dimension"`, and standardized CTA to `"Go to the full cut →"`.
* **Recent Updates**: Rebranded Section 4 from `"Recently changed"` to `"Recent updates"` with active descriptions.

#### 2. Curated Debates (`lib/compare.ts`)
* **Flagship Hooks**: Rewrote Giggs vs Scholes, Cantona vs Van Persie, Busby vs Ferguson, 1990s vs 2010s, and 1950s vs 2000s hooks to be more active, evocative, and premium.
* **Assists Footnote**: Standardized assists date range caption to `Curated 1987–88 to 2014–15 lane` using closed en dashes.
* **Apostrophes**: Converted all straight apostrophes to curly ones (`club’s`).

#### 3. Curated Cuts (`lib/cut.ts`)
* **Cut Titles & Blurbs**: Upgraded Curated Cut titles and descriptions (e.g. `"All opponents, ranked by win rate"`, `"Managers, ranked by points per game"`, `"Seasons, ranked by points per game"`).

#### 4. Tested Myths & Question Headlines (`lib/questions.ts`, `lib/questionHeadlines.ts`, `lib/questionCardData.ts`)
* **Curiosity Carousel**: Spaced em dashes on the comebacks summary (`behind — and avoided defeat — replayed`) and converted all straight apostrophes to curly ones.
* **Question Headlines**: Extensively rewrote the question glosses to use active verbs, clinical precision, and proper curly apostrophes/quotes.
* **OG Card Data**: Aligned the card descriptions and figures to match the refined headlines.

### 2026-06-25: Compare Page

#### 1. Compare Page (`app/compare/page.tsx`)
* **Metadata & SEO**: Added meta description and alternates canonical link for proper SEO indexability.
* **Page Header**: Upgraded description to be more evocative and highlight the bounds of historical data.
* **Modes Blurb**: Converted straight apostrophe to curly in the Eras mode blurb (`stretches of the club’s history`).
* **Curated Debates Section**: Rebranded section head from `"Great debates"` to `"Curated debates"` for consistency with the Explore page, and rephrased intro text.
* **Custom Matchup Section**: Rebranded section head from `"Or build your own"` to `"Build a custom matchup"`, and converted straight apostrophe to curly in the unresolved error text (`Couldn’t`).
* **Explore as a Cut Section**: Upgraded description to use active verbs (`"Group either record... then change..."`).

#### 2. Scoreboard Table (`components/CompareTable.tsx`)
* **Verdict Description**: Upgraded the default tie verdict to a more active description (`"These records are too close to separate on these measures."`).

### 2026-06-25: Matches & Cut Pages

#### 1. Matches Page (`app/matches/page.tsx`)
* **Metadata & SEO**: Added meta description with a spaced em dash and Oxford comma: `"Browse and filter the complete Manchester United match record since 1886 — filter by opponent, manager, season, venue, and result."` for proper SEO indexability.

#### 2. Cut Page (`app/cut/page.tsx` & `components/cut/CutControls.tsx`)
* **Metadata & Description**: Standardized straight apostrophe to curly in default description: `"United’s record..."`.
* **Page Header**: Upgraded description to be more evocative and use active verbs: `"The whole record reordered as a standings ladder. Every group is an open door to its matches — change the dimension or lens to build your own custom cut."` (standardizing spaced em dash).
* **Standout Matches Link**: Modified from `"See the matches →"` to `"View the matches →"` for active phrasing.
* **Controls summary**: Standardized from `"Narrow the slice"` to `"Refine the slice"`.
* **Controls CTA**: Standardized from `"Apply"` to `"Apply filters"` for clarity.

### 2026-06-25: Application-wide Sweep & Typographical Standardizations

#### 1. Page-level Copy Updates
* **Analytics Page (`app/analytics/page.tsx`)**:
  - Changed `can't` to `can’t` in the all-time peaks coverage note.
  - Standardized the assist events date range from `2012-13` to `2012–13` using a closed en dash.
  - Spelled out the ampersand in the `"Data and coverage"` link to `/data`.
* **Data Page (`app/data/page.tsx`)**:
  - Changed metadata title and `h1` heading from `"Data & corrections"` to `"Data and corrections"`.
  - Standardized straight apostrophe to curly in `"decade’s"`.
* **Opponents Page (`app/opponents/page.tsx`)**:
  - Converted straight apostrophes to curly in `"we’ve"` in the page description and nemesis label.
* **Collection Page (`app/collection/page.tsx`)**:
  - Standardized straight apostrophe to curly in `"Cut’s"`.
* **Correction Builder (`app/corrections/CorrectionBuilder.tsx`)**:
  - Standardized straight apostrophe to curly in `"player’s"`.
* **Logo Lab (`app/logo-lab/page.tsx`)**:
  - Standardized straight apostrophe to curly in `"United’s"`.
* **Opponent Detail (`app/opponent/[id]/page.tsx`)**:
  - Standardized straight apostrophes to curly in `"today’s"` and `"opponent’s"` rating labels.
* **Homepage (`app/page.tsx`)**:
  - Standardized straight apostrophe to curly in `"Manchester United’s"`.

#### 2. Component-level Typographical Cleanups
* **Cup Run Component (`components/CupRun.tsx`)**:
  - Converted straight apostrophe to curly in `"United’s"`.
* **Odds Predictor Component (`components/OddsPredictor.tsx`)**:
  - Converted straight apostrophes to curly in `"today’s"` and opponent's rating indicator.
* **Own Goal Profile Component (`components/OwnGoalProfile.tsx`)**:
  - Converted straight apostrophes to curly in `"United’s"` and `"club’s"`.
* **Question Modules Component (`components/QuestionModules.tsx`)**:
  - Converted straight apostrophes to curly in `"United’s"` and `"club’s"`.
  - Standardized double quotes around `“Own Goal”` to curly double quotes.
* **Coverage Matrix Component (`components/charts/CoverageMatrix.tsx`)**:
  - Converted straight apostrophe to curly in `"decade’s"`.


